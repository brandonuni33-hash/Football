// Adapte les rapports métier déjà résolus en faits bruts. Aucun résultat n'est recalculé ici.

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function occurrenceOf(state, result, index) {
    const fixture = result?.fixture || {};
    if (fixture.playedAt || fixture.date) return String(fixture.playedAt || fixture.date);
    const season = state?.calendar?.currentSeasonYear ?? state?.season ?? 'unknown';
    const month = state?.calendar?.currentMonth ?? 'unknown';
    return `season:${season}:month:${month}:match:${result?.matchIndex ?? index}`;
}

function matchIdentity(state, result, index) {
    const fixture = result?.fixture || {};
    const playerId = state?.player?.id || 'active-player';
    const playedCount = state?.player?.stats?.matchesPlayed ?? 'unknown';
    return [
        'match.completed', playerId, fixture.id || result?.id || occurrenceOf(state, result, index),
        result?.matchIndex ?? index, result?.opponent || 'opponent', n(result?.teamGoals),
        n(result?.opponentGoals), n(result?.goals), n(result?.assists), playedCount
    ].join('|');
}

function fixtureSnapshot(result = {}) {
    const fixture = result.fixture || {};
    return {
        id: fixture.id || result.id || null,
        opponentClubId: fixture.opponentClubId || fixture.clubId || null,
        isDerby: Boolean(fixture.isDerby),
        rival: Boolean(fixture.rival),
        rivalry: Boolean(fixture.rivalry),
        importance: fixture.importance || null,
        phase: fixture.phase || null,
        round: fixture.round || fixture.europeanRound || null,
        competitionName: fixture.competitionName || null
    };
}

export class NarrativeFactCollector {
    collectMatchFacts({ state, report } = {}) {
        const rawResults = report?.summary?.matchResults || report?.results || [];
        const results = Array.isArray(rawResults) ? rawResults.filter(Boolean) : [];
        return results.map((result, index) => {
            const fixture = fixtureSnapshot(result);
            const playerId = state?.player?.id || null;
            const opponentClubId = fixture.opponentClubId;
            const matchIndex = Number.isFinite(Number(result.matchIndex)) ? Number(result.matchIndex) : index;
            return {
                type: 'match.completed',
                source: 'match',
                occurredAt: occurrenceOf(state, result, index),
                subjectId: playerId,
                actorIds: [playerId, state?.player?.clubId, opponentClubId].filter(Boolean),
                metrics: {
                    matchIndex,
                    teamGoals: n(result.teamGoals),
                    opponentGoals: n(result.opponentGoals),
                    rating: result.playerPlayed === false ? null : n(result.rating),
                    goals: n(result.goals),
                    assists: n(result.assists),
                    playerPlayed: result.playerPlayed !== false,
                    started: result.started !== false,
                    minutesPlayed: n(result.minutesPlayed),
                    interactive: Boolean(result.interactive)
                },
                outcome: {
                    result: result.result || null,
                    score: `${n(result.teamGoals)}-${n(result.opponentGoals)}`
                },
                certainty: 'confirmed',
                visibility: 'public',
                tags: [
                    result.competitionType || result.type || 'match',
                    result.interactive ? 'interactive' : 'simulated',
                    result.playerPlayed === false ? 'unused' : 'appearance'
                ],
                dedupeKey: matchIdentity(state, result, index),
                payload: {
                    opponent: result.opponent || 'Adversaire',
                    competitionName: result.competitionName || fixture.competitionName || 'Match',
                    competitionId: result.competitionId || null,
                    competitionType: result.competitionType || result.type || null,
                    importance: result.importance || fixture.importance || null,
                    phase: result.phase || fixture.phase || null,
                    round: result.round || fixture.round || null,
                    appearance: result.appearance || (result.started === false ? 'substitute' : 'starter'),
                    fixture
                }
            };
        });
    }
}

export default NarrativeFactCollector;
