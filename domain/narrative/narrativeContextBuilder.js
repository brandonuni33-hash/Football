// Construit un instantané de lecture minimal. Le domaine narratif ne reçoit pas le State mutable.

import { normalizeNarrativeState } from '../../state/narrativeState.js';
import { freezeNarrativeValue, stableNarrativeId } from './narrativeFactNormalizer.js';

function playerSnapshot(player = {}) {
    return {
        id: player.id || null,
        firstName: player.firstname || player.firstName || null,
        lastName: player.lastname || player.lastName || null,
        age: Number.isFinite(Number(player.age)) ? Number(player.age) : null,
        clubId: player.clubId || null,
        club: player.club || null,
        position: player.position || player.positionId || null
    };
}

export class NarrativeContextBuilder {
    build({ state, facts = [] } = {}) {
        const seasonHistory = Array.isArray(state?.career?.seasonHistory)
            ? state.career.seasonHistory.slice(-10).map(item => ({ ...item }))
            : [];
        const factIds = facts.map(fact => fact.id).sort();
        return freezeNarrativeValue({
            seed: stableNarrativeId('seed', factIds),
            blockKey: stableNarrativeId('block', facts.map(fact => fact.dedupeKey).sort()),
            player: playerSnapshot(state?.player),
            calendar: {
                season: state?.calendar?.currentSeasonYear ?? state?.season ?? null,
                month: state?.calendar?.currentMonth ?? null,
                period: state?.calendar?.currentPeriod || null
            },
            career: { seasonHistory },
            narrativeState: normalizeNarrativeState(state?.narrativeState),
            factIds
        });
    }
}

export default NarrativeContextBuilder;
