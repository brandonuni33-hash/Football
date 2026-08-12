// Construit un instantané de lecture minimal. Le domaine narratif ne reçoit pas le State mutable.

import { normalizeNarrativeState } from '../../state/narrativeState.js';
import { freezeNarrativeValue, stableNarrativeId } from './narrativeFactNormalizer.js';

const finiteOrNull = value => Number.isFinite(Number(value)) ? Number(value) : null;
const clamp = (value, min = 0, max = 100) => value === null ? null : Math.min(max, Math.max(min, value));

function playerSnapshot(player = {}) {
    const stats = player.stats || {};
    return {
        id: player.id || null,
        firstName: player.firstname || player.firstName || null,
        lastName: player.lastname || player.lastName || null,
        age: finiteOrNull(player.age),
        clubId: player.clubId || null,
        club: player.club || null,
        position: player.position || player.positionId || null,
        mindset: {
            morale: clamp(finiteOrNull(player.morale ?? stats.morale)),
            fitness: clamp(finiteOrNull(player.fitness)),
            mental: clamp(finiteOrNull(player.mental ?? stats.mental)),
            discipline: clamp(finiteOrNull(player.discipline ?? stats.discipline))
        }
    };
}

function coachSnapshot(state = {}) {
    const social = state.social || {};
    const coachData = social.coachData || {};
    const name = coachData.name || social.formativeCoach || null;
    const relation = clamp(finiteOrNull(coachData.relation ?? state.player?.stats?.relationCoach));
    return {
        name,
        relation,
        opinion: coachData.opinion || null,
        vision: social.coachVision || null,
        hasLeftClub: Boolean(coachData.hasLeftClub),
        isFormative: Boolean(name && social.formativeCoach && name === social.formativeCoach)
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
            relationships: { coach: coachSnapshot(state) },
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
