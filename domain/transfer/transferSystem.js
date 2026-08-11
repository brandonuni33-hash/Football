// domain/transfer/transferSystem.js
// Orchestrateur canonique du mercato joueur.
// Le marché progresse dans le temps : découverte -> intérêt -> contact -> offre.

import { EventBus } from '../../core/eventBus.js';
import { EVENTS } from '../../core/events.js';
import { TRANSFER_INTEREST_STAGES } from './interestPipeline.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const average = (values = []) => {
    const valid = values.map(Number).filter(Number.isFinite);
    return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
};

export class TransferSystem {
    constructor({
        transferMarket,
        playerLogic,
        stateManager,
        worldSystem,
        scoutingSystem = null,
        interestPipeline = null,
        marketCompetitionSystem = null,
        clubNeedSystem = null,
        opportunityEngine = null
    } = {}) {
        Object.assign(this, {
            transferMarket,
            playerLogic,
            stateManager,
            worldSystem,
            scoutingSystem,
            interestPipeline,
            marketCompetitionSystem,
            clubNeedSystem,
            opportunityEngine
        });
    }

    ensureState(state) {
        if (!state) return null;
        state.transferInterests = Array.isArray(state.transferInterests) ? state.transferInterests : [];
        state.clubTransferNeeds ||= {};
        state.transferMarket ||= { activity: [], lastCycle: null };
        state.transferMarket.activity = Array.isArray(state.transferMarket.activity) ? state.transferMarket.activity : [];
        this.scoutingSystem?.ensureState?.(state);
        return state.transferMarket;
    }

    progressMarket(state, summary = {}) {
        const player = state?.player;
        if (!player || player.isInjured) return { offer: state?.pendingTransferOffer || null, activity: [], ranking: [] };
        this.ensureState(state);

        // Une proposition officielle bloque toute nouvelle proposition jusqu'à la décision du joueur.
        if (state.pendingTransferOffer) {
            return { offer: state.pendingTransferOffer, activity: [], ranking: [], blockedByPendingOffer: true };
        }

        const clubs = (this.worldSystem?.CLUB_DATABASE || [])
            .filter(club => club?.id)
            .filter(club => club.id !== player.clubId && club.name !== player.club);
        if (!clubs.length || !this.clubNeedSystem || !this.marketCompetitionSystem || !this.interestPipeline) {
            return { offer: null, activity: [], ranking: [] };
        }

        this.clubNeedSystem.ensureSeason(state, clubs);
        const ranking = this.marketCompetitionSystem.rank(state, clubs, player, { limit: 8 });
        const metrics = this.#marketMetrics(state, summary);
        const activity = [];
        const newlyCreated = new Set();

        if (Number(player.age) < 18) {
            this.#progressYouthDiscovery(state, ranking, metrics, activity, newlyCreated);
        } else {
            this.#progressSeniorDiscovery(state, ranking, metrics, activity, newlyCreated);
        }

        const active = this.interestPipeline.active(state, player.id);
        for (const interest of active) {
            if (newlyCreated.has(interest.id) || interest.stage === TRANSFER_INTEREST_STAGES.OFFER) continue;
            const club = this.worldSystem?.getClub?.(interest.clubId);
            const need = this.clubNeedSystem.get(state, interest.clubId);
            if (!club || !need) continue;

            const before = interest.stage;
            const allowOffer = this.#allowOffer(player, club, interest);
            this.interestPipeline.advance({
                state,
                interest,
                context: {
                    performance: metrics.performance,
                    clubNeed: need.urgency,
                    relationship: 50,
                    reputation: metrics.reputation,
                    allowOffer
                }
            });
            if (interest.stage !== before) {
                this.#recordActivity(state, activity, {
                    type: 'interest_stage_changed',
                    clubId: interest.clubId,
                    interestId: interest.id,
                    from: before,
                    to: interest.stage
                });
            }
        }

        const offerInterest = this.interestPipeline.active(state, player.id)
            .filter(interest => interest.stage === TRANSFER_INTEREST_STAGES.OFFER)
            .sort((a, b) => Number(b.seriousness) - Number(a.seriousness))[0] || null;
        const offer = offerInterest ? this.#createOfficialOffer(state, offerInterest, activity) : null;

        state.transferMarket.lastCycle = {
            season: state.calendar?.currentSeasonYear ?? null,
            month: state.calendar?.currentMonth ?? null,
            phase: Number(player.age) < 18 ? 'youth' : 'senior',
            performance: metrics.performance,
            reputation: metrics.reputation,
            processedAt: Date.now()
        };

        return { offer, activity, ranking, activeInterests: this.interestPipeline.active(state, player.id) };
    }

    // Compatibilité applicative : l'ancien appel génère désormais un cycle de marché.
    generateOffer(state, summary = {}) {
        return this.progressMarket(state, summary).offer;
    }

    accept(state) {
        const offer = state?.pendingTransferOffer;
        if (!offer || !state.player) return null;

        const player = state.player;
        const oldClub = player.club;
        const oldClubId = player.clubId || null;
        const newClub = this.worldSystem?.getClub?.(offer.clubId || offer.club);

        player.club = newClub?.name || offer.club;
        player.clubId = newClub?.id || offer.clubId || player.clubId || null;
        player.clubCountry = newClub?.country || offer.pays || player.clubCountry;
        player.clubLevel = newClub?.tier || player.clubLevel || 1;
        player.leagueId = newClub?.leagueId || player.leagueId;
        player.clubPrestige = newClub?.prestige || offer.reputationClub || player.clubPrestige;
        player.centerStars = newClub?.centerStars || player.centerStars;
        player.salary = Number(offer.salaireHebdo ?? offer.salary) || player.salary || 0;
        player.isYouthPlayer = Number(player.age) < 18;

        if (state.social?.coachData) {
            state.social.coachData.hasLeftClub = true;
            state.social.coachData.previousClub = oldClub;
        }

        if (player.careerProfile) {
            player.careerProfile.recruitmentHistory ||= [];
            player.careerProfile.recruitmentHistory.push({
                age: player.age,
                accepted: true,
                oldClub,
                newClub: player.club,
                interestId: offer.interestId || null,
                type: offer.type || null
            });
        }

        const interests = this.interestPipeline?.active?.(state, player.id) || [];
        for (const interest of interests) {
            this.interestPipeline.close(interest, interest.id === offer.interestId ? 'accepted' : 'player_moved');
        }

        state.pendingTransferOffer = null;
        this.playerLogic.ensure(player);
        this.stateManager.save(state);

        const result = { accepted: true, oldClub, oldClubId, newClub: player.club, newClubId: player.clubId, salary: player.salary, offerType: offer.type || null };
        EventBus.emit(EVENTS.TRANSFER_OFFER_ACCEPTED, { ...result, playerId: player.id, state });
        EventBus.emit(EVENTS.TRANSFER_COMPLETED, { ...result, playerId: player.id, state });
        return result;
    }

    reject(state) {
        const offer = state?.pendingTransferOffer;
        if (!offer) return false;
        const interest = (state.transferInterests || []).find(item => item.id === offer.interestId);
        if (interest) this.interestPipeline?.close?.(interest, 'rejected');
        state.pendingTransferOffer = null;
        this.stateManager.save(state);
        EventBus.emit(EVENTS.TRANSFER_OFFER_REJECTED, { playerId: state.player?.id, club: offer.club, clubId: offer.clubId || null, state });
        return true;
    }

    #progressYouthDiscovery(state, ranking, metrics, activity, newlyCreated) {
        const player = state.player;
        const scouting = this.scoutingSystem?.ensureState?.(state);
        if (!scouting) return;

        const watching = scouting.observations.find(item => item.status === 'watching');
        if (watching) {
            const completed = this.scoutingSystem.completeObservation(state, watching.id, { performance: metrics.performance });
            const club = this.worldSystem?.getClub?.(completed?.clubId);
            const ranked = ranking.find(item => item.clubId === completed?.clubId);
            const need = this.clubNeedSystem.get(state, completed?.clubId);
            if (club && need) {
                const interest = this.interestPipeline.createInterest({
                    state,
                    player,
                    club,
                    source: 'scouting',
                    evidence: {
                        compatibility: ranked?.fit ?? this.clubNeedSystem.scorePlayer(need, player),
                        clubNeed: need.urgency,
                        reputation: metrics.reputation,
                        form: metrics.performance,
                        network: metrics.network
                    }
                });
                if (interest && !interest.history.length) newlyCreated.add(interest.id);
                this.#recordActivity(state, activity, { type: 'scouting_completed', clubId: club.id, interestId: interest?.id || null });
            }
            return;
        }

        const activeClubIds = new Set(this.interestPipeline.active(state, player.id).map(item => item.clubId));
        const observedClubIds = new Set(scouting.observations.map(item => item.clubId));
        const candidateEntry = ranking.find(item => !activeClubIds.has(item.clubId) && !observedClubIds.has(item.clubId));
        if (!candidateEntry) return;
        const club = this.worldSystem?.getClub?.(candidateEntry.clubId);
        if (!club) return;

        // Cas exceptionnel : un très grand club peut agir immédiatement après une performance hors norme.
        if (Number(player.age) >= 16 && metrics.performance >= 92 && this.scoutingSystem.isTopClub(club) && Math.random() < 0.005) {
            const need = this.clubNeedSystem.get(state, club.id);
            const direct = this.interestPipeline.createInterest({
                state,
                player,
                club,
                source: 'opportunistic',
                directOffer: true,
                evidence: {
                    compatibility: candidateEntry.fit,
                    clubNeed: need?.urgency ?? 50,
                    reputation: metrics.reputation,
                    form: metrics.performance,
                    network: metrics.network
                }
            });
            if (direct) this.#recordActivity(state, activity, { type: 'rare_direct_interest', clubId: club.id, interestId: direct.id });
            return;
        }

        const discoveryChance = Math.min(0.30, Math.max(0.025, (candidateEntry.likelihood / 100) * 0.28 + (metrics.performance / 100) * 0.06));
        if (Math.random() >= discoveryChance) return;
        const observation = this.scoutingSystem.observe(state, {
            club,
            scout: { quality: Math.round(45 + candidateEntry.marketHeat * 0.45) },
            context: metrics.performance >= 75 ? 'performance' : 'match'
        });
        if (observation) this.#recordActivity(state, activity, { type: 'scouting_started', clubId: club.id, observationId: observation.id });
    }

    #progressSeniorDiscovery(state, ranking, metrics, activity, newlyCreated) {
        const player = state.player;
        const activeClubIds = new Set(this.interestPipeline.active(state, player.id).map(item => item.clubId));
        const candidates = ranking.filter(entry => !activeClubIds.has(entry.clubId)).slice(0, 2);

        for (const entry of candidates) {
            const club = this.worldSystem?.getClub?.(entry.clubId);
            const need = this.clubNeedSystem.get(state, entry.clubId);
            if (!club || !need) continue;
            const probability = this.opportunityEngine?.evaluate?.({
                player,
                club: { ...club, needScore: entry.marketHeat / 100, needUrgency: entry.urgency / 100 },
                context: {
                    profileFit: entry.fit / 100,
                    recentForm: metrics.performance / 100,
                    reputation: metrics.reputation / 100,
                    visibility: metrics.visibility / 100,
                    networkExposure: metrics.network / 100,
                    performanceSignal: metrics.performance / 100,
                    needUrgency: entry.urgency / 100
                }
            }) ?? Math.min(0.12, entry.likelihood / 1000);
            if (Math.random() >= probability) continue;

            const interest = this.interestPipeline.createInterest({
                state,
                player,
                club,
                source: 'opportunistic',
                evidence: {
                    compatibility: entry.fit,
                    clubNeed: need.urgency,
                    reputation: metrics.reputation,
                    form: metrics.performance,
                    network: metrics.network
                }
            });
            if (!interest) continue;
            newlyCreated.add(interest.id);
            this.#recordActivity(state, activity, { type: 'interest_created', clubId: club.id, interestId: interest.id, seriousness: interest.seriousness });
        }
    }

    #allowOffer(player, club, interest) {
        const age = Number(player?.age || 0);
        if (age >= 18) return true;
        if (age < 16) return false;
        if (!this.scoutingSystem?.isTopClub?.(club)) return true;
        // Après plusieurs cycles de suivi, un club d'élite peut passer à l'approche.
        // Avant cela, une accélération reste exceptionnelle.
        return (interest.history?.length || 0) >= 4 || this.scoutingSystem.canOfferYouthContract(player, club);
    }

    #createOfficialOffer(state, interest, activity = []) {
        if (state.pendingTransferOffer || !interest) return state.pendingTransferOffer || null;
        const player = state.player;
        const club = this.worldSystem?.getClub?.(interest.clubId);
        if (!club) return null;
        const offer = this.transferMarket?.generateTransferOffer?.(player, club);
        if (!offer) return null;

        offer.interestId = interest.id;
        offer.source = interest.source;
        offer.seriousness = Math.round(Number(interest.seriousness) || 0);
        offer.clubId = club.id;
        if (Number(player.age) < 18) {
            offer.type = 'recrutement_formation';
            offer.message = `${club.name} souhaite t'intégrer à sa structure de formation après plusieurs semaines de suivi.`;
        }

        state.pendingTransferOffer = offer;
        this.#recordActivity(state, activity, { type: 'official_offer', clubId: club.id, interestId: interest.id });
        EventBus.emit(EVENTS.TRANSFER_OFFER_CREATED, { state, playerId: player.id, club: offer.club, clubId: club.id, offer, interestId: interest.id });
        return offer;
    }

    #marketMetrics(state, summary) {
        const results = Array.isArray(summary?.matchResults) ? summary.matchResults : [];
        const rating = average(results.map(result => result?.rating)) || Number(summary?.rating) || Number(state.player?.stats?.averageRating) || 6.2;
        const performance = clamp((rating - 4) * 20);
        const reputation = clamp(state.player?.reputation ?? state.player?.fame ?? 20);
        const networkSize = Array.isArray(state.relationshipNetwork) ? state.relationshipNetwork.length : 0;
        const network = clamp(15 + networkSize * 5);
        const visibility = clamp(20 + reputation * 0.45 + performance * 0.35);
        return { rating, performance, reputation, network, visibility };
    }

    #recordActivity(state, cycleActivity, item) {
        const record = {
            ...item,
            season: state.calendar?.currentSeasonYear ?? null,
            month: state.calendar?.currentMonth ?? null,
            at: Date.now()
        };
        state.transferMarket.activity.push(record);
        state.transferMarket.activity = state.transferMarket.activity.slice(-60);
        if (Array.isArray(cycleActivity)) cycleActivity.push(record);
        return record;
    }
}

export default TransferSystem;
