// domain/loan/loanSystem.js
// Décide si un prêt est pertinent, pourquoi, et quel projet de temps de jeu peut l'accompagner.

import { EventBus } from '../../core/eventBus.js';
import EVENTS from '../../core/events.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export class LoanSystem {
    constructor({ eventBus = EventBus } = {}) {
        this.eventBus = eventBus;
    }

    evaluate({ state, player = {}, parentClub = {}, destination = {}, context = {} }) {
        const age = Number(player.age ?? 18);
        const overall = Number(player.overall ?? player.level ?? 50);
        const potential = Number(player.potential ?? 70);
        const depth = clamp(Number(context.positionDepth ?? 50));
        const coachTrust = clamp(Number(context.coachTrust ?? 50));
        const playingTime = clamp(Number(context.promisedPlayingTime ?? 50));
        const destinationLevel = clamp(Number(destination.level ?? destination.reputation ?? 50));
        const development = clamp(Number(destination.development ?? 50));

        const need = clamp(
            (age < 21 ? 35 : 10) +
            Math.max(0, 65 - overall) * 0.45 +
            depth * 0.45 -
            coachTrust * 0.35
        );

        const benefit = clamp(
            playingTime * 0.35 +
            development * 0.35 +
            destinationLevel * 0.15 +
            potential * 0.15
        );

        const score = clamp(need * 0.55 + benefit * 0.45);
        const recommended = score >= 62 && playingTime >= 55;

        return {
            recommended,
            score: Math.round(score),
            need: Math.round(need),
            benefit: Math.round(benefit),
            reason: this.#reason(age, depth, coachTrust, playingTime, development),
            terms: {
                parentClubId: parentClub.id || null,
                destinationClubId: destination.id || null,
                expectedRole: playingTime >= 75 ? 'starter' : playingTime >= 55 ? 'rotation' : 'squad',
                developmentPlan: development >= 75 ? 'high' : development >= 50 ? 'standard' : 'limited'
            }
        };
    }

    createProposal({ state, player, parentClub, destination, evaluation, source = 'club' }) {
        if (!evaluation?.recommended) return null;
        const proposal = {
            id: `loan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            playerId: player?.id || null,
            parentClubId: parentClub?.id || null,
            destinationClubId: destination?.id || null,
            source,
            score: evaluation.score,
            expectedRole: evaluation.terms.expectedRole,
            developmentPlan: evaluation.terms.developmentPlan,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        state.loanProposals ||= [];
        state.loanProposals.push(proposal);
        this.eventBus.emit(EVENTS.LOAN_PROPOSAL_CREATED, { state, proposal, playerId: proposal.playerId, clubId: proposal.destinationClubId });
        return proposal;
    }

    #reason(age, depth, trust, playingTime, development) {
        if (age < 21 && depth >= 70) return 'development_blocked_by_squad_depth';
        if (playingTime >= 75 && development >= 70) return 'strong_development_path';
        if (trust < 35) return 'low_coach_trust';
        if (depth >= 70) return 'limited_path_to_minutes';
        return 'development_opportunity';
    }
}

export default LoanSystem;
