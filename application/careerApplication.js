// application/careerApplication.js
// Orchestration applicative de création et de restauration d'une carrière.

import { createNarrativeState } from '../state/narrativeState.js';

const LEGACY_ATTRIBUTES = ['vitesse', 'tir', 'passe', 'dribble', 'defense', 'physique', 'mental'];

function isCanonicalPlayer(player) {
    const keys = ['vitesse','acceleration','endurance','puissance','finition','tir','passe','controle','dribble','vision','placement','defense'];
    return Boolean(
        player?.potentialProfile &&
        player?.attributes &&
        keys.every(key => player.attributes[key] !== undefined)
    );
}

function copyLegacyAttributes(target, source) {
    if (!source) return;
    for (const key of LEGACY_ATTRIBUTES) {
        if (source[key] !== undefined) target.attributes[key] = source[key];
    }

    // Complète les nouveaux attributs à partir des anciens sans écraser ceux
    // qui existent déjà. Cela permet aux anciennes sauvegardes de rejoindre
    // le modèle canonique sans recréer un joueur aléatoire.
    const a = target.attributes;
    const avg = values => values.reduce((s, v) => s + Number(v || 0), 0) / Math.max(1, values.length);
    a.acceleration ??= a.vitesse ?? 50;
    a.endurance ??= avg([a.physique, a.vitesse, a.mental]);
    a.puissance ??= a.physique ?? 50;
    a.finition ??= a.tir ?? 50;
    a.controle ??= avg([a.dribble, a.passe, a.mental]);
    a.vision ??= avg([a.passe, a.mental]);
    a.placement ??= avg([a.defense, a.mental]);
}

export class CareerApplication {
    constructor({
        stateManager,
        playerLogic,
        economyManager,
        socialSystem,
        mediaSystem,
        consequenceSystem,
        potentialSystem,
        careerSystem,
        competitionSystem,
        worldSystem,
        cupSystem,
        schemaVersion
    } = {}) {
        Object.assign(this, {
            stateManager, playerLogic, economyManager, socialSystem, mediaSystem,
            consequenceSystem, potentialSystem, careerSystem, competitionSystem,
            worldSystem, cupSystem, schemaVersion
        });
    }

    create(selectedData = {}) {
        const player = this.playerLogic.createPlayerProfile({
            ...selectedData,
            firstname: selectedData.firstname,
            lastname: selectedData.lastname,
            firstName: selectedData.firstname,
            lastName: selectedData.lastname,
            country: selectedData.primaryNationality || selectedData.country || selectedData.nationality,
            nationality: selectedData.primaryNationality || selectedData.nationality || selectedData.country,
            position: selectedData.position,
            origin: selectedData.origin,
            heartClub: selectedData.heartClub,
            faceId: selectedData.faceId,
            height: selectedData.height,
            weight: selectedData.weight,
            preferredFoot: selectedData.preferredFoot,
            primaryNationality: selectedData.primaryNationality,
            secondaryNationality: selectedData.secondaryNationality,
            raisedInCountry: selectedData.raisedInCountry,
            raisedInContinent: selectedData.raisedInContinent,
            age: 14
        });

        const youthClub = selectedData.youthClub || null;
        const youthClubName = youthClub?.name || 'Centre de Formation';
        const coachName = selectedData.coachName || 'l’entraîneur';
        const coachVision = selectedData.coachVision || 'Formateur Patient';
        const contract = this.economyManager.calculateContractOffer(youthClub, player);

        player.club = youthClubName;
        player.clubCountry = youthClub?.country || player.clubCountry || player.country || 'France';
        player.clubLevel = Number(youthClub?.tier) || player.clubLevel || 1;
        player.youthClubName = youthClubName;
        player.youthClubData = youthClub ? { ...youthClub } : null;
        player.isYouthPlayer = Number(player.age) < 18;
        if (Object.prototype.hasOwnProperty.call(selectedData, 'origin')) player.origin = selectedData.origin ?? null;
        if (Object.prototype.hasOwnProperty.call(selectedData, 'youthClub')) player.youthClub = selectedData.youthClub ?? null;
        if (Object.prototype.hasOwnProperty.call(selectedData, 'heartClub')) player.heartClub = selectedData.heartClub ?? null;

        if (!player.isYouthPlayer) this.worldSystem.normalizeCareerClub(player);
        this.careerSystem.initialize(player, youthClub || (player.clubId ? this.worldSystem.getClub(player.clubId) : null));

        player.contract = { ...player.contract, ...contract };
        player.salary = Number(youthClub?.salary ?? youthClub?.weeklySalary ?? contract.weeklySalary ?? 150);
        player.coachName = coachName;
        player.coachVision = coachVision;

        const social = this.socialSystem.initSocialData(coachName);
        social.coachVision = coachVision;
        social.youthClubName = youthClubName;
        social.coachData = { name: coachName, relation: 50, opinion: 'Neutre', hasLeftClub: false };

        const state = {
            schemaVersion: this.schemaVersion,
            player,
            trainingFocus: 'TECHNIQUE',
            social,
            media: this.mediaSystem.initMediaData(),
            career: { balance: contract.signingBonus || 0, seasonHistory: [], totalCareerIncome: contract.signingBonus || 0 },
            careerMemory: [],
            narrativeState: createNarrativeState(),
            contract: { weeklySalary: player.salary, signingBonus: contract.signingBonus || 0, durationYears: contract.durationYears || 2 },
            calendar: {
                currentMonth: 8,
                currentSeasonYear: new Date().getFullYear(),
                currentPeriod: 'Pré-saison & reprise',
                totalMonths: 12,
                seasonSchedule: null,
                seasonMatchCursor: 0
            },
            seasonPhase: 'pre_season',
            pendingEvent: null,
            pendingCoachEvent: null,
            pendingMediaDilemma: null,
            pendingTransferOffer: null,
            pendingPositionProposal: null,
            world: { version: 1, leagues: {}, lastSeasonFinalized: null },
            cups: {},
            cupHistory: [],
            careerStructure: player.careerProfile || null
        };

        this.socialSystem.ensureRelationships(state);
        this.consequenceSystem.initialize(state.player);
        this.potentialSystem.ensure(state.player);
        this.careerSystem.refreshStage(state.player);
        this.worldSystem.ensureWorld(state);
        this.cupSystem.ensure(state);
        state.careerStructure = state.player.careerProfile || null;
        this.stateManager.save(state);
        return state;
    }

    migrate(state) {
        if (!state?.player) return state;
        const player = state.player;

        if (!isCanonicalPlayer(player)) {
            const legacy = { ...player };
            const migrated = this.playerLogic.createPlayerProfile({
                firstname: legacy.firstname || legacy.firstName,
                lastname: legacy.lastname || legacy.lastName,
                nationality: legacy.nationality || legacy.country,
                country: legacy.country || legacy.nationality,
                position: legacy.position || 'BU',
                origin: legacy.origin || 'CENTRE_FORMATION',
                heartClub: legacy.heartClub
            });

            copyLegacyAttributes(migrated, legacy.attributes || {});
            migrated.id = legacy.id ?? migrated.id;
            migrated.overall = legacy.overall ?? migrated.overall;
            migrated.potential = legacy.potential ?? migrated.potential;
            migrated.potentialProfile = legacy.potentialProfile || migrated.potentialProfile;
            migrated.age = Math.max(14, Number(legacy.age) || migrated.age);
            migrated.club = legacy.club ?? null;
            migrated.clubCountry = legacy.clubCountry ?? migrated.clubCountry;
            migrated.salary = legacy.salary ?? 0;
            migrated.fame = legacy.fame ?? 10;
            migrated.morale = legacy.morale ?? 80;
            migrated.fitness = legacy.fitness ?? 90;
            migrated.isInjured = Boolean(legacy.isInjured);
            migrated.injuryDuration = Number(legacy.injuryDuration) || 0;
            migrated.stats = { ...migrated.stats, ...(legacy.stats || {}) };
            migrated.hidden = { ...migrated.hidden, ...(legacy.hidden || {}) };
            this.playerLogic.ensure(migrated);
            state.player = migrated;
        } else {
            this.playerLogic.ensure(player);
        }

        if (!state.player.careerProfile) {
            this.careerSystem.initialize(state.player, {
                name: state.player.club || 'Centre de Formation',
                prestige: 40,
                country: state.player.clubCountry || state.player.country || 'France'
            });
        } else {
            this.careerSystem.refreshStage(state.player);
            this.worldSystem.ensureWorld(state);
        }

        state.careerStructure = state.player.careerProfile;
        state.trainingFocus ||= 'TECHNIQUE';
        state.career ||= { balance: 0, seasonHistory: [], totalCareerIncome: 0 };
        state.calendar ||= {
            currentMonth: 8,
            currentSeasonYear: 2026,
            currentPeriod: 'Pré-saison & reprise',
            seasonSchedule: null,
            seasonMatchCursor: 0
        };
        this.competitionSystem.ensureSeasonSchedule(state);
        this.cupSystem.ensure(state);
        state.social ||= this.socialSystem.initSocialData(state.player.coachName || 'l’entraîneur');
        state.media ||= this.mediaSystem.initMediaData();
        this.socialSystem.ensureRelationships(state);
        state.social.coachData ||= {
            name: state.player.coachName || 'l’entraîneur',
            relation: state.player.stats?.relationCoach ?? 50,
            opinion: 'Neutre',
            hasLeftClub: false
        };

        this.stateManager.save(state);
        return state;
    }
}

export default CareerApplication;
