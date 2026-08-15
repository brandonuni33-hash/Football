// Refuse les contradictions et les informations cachées avant toute présentation.

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const wholeNonNegative = value => Number.isInteger(Number(value)) && Number(value) >= 0;

function expectedResult(teamGoals, opponentGoals) {
    if (teamGoals > opponentGoals) return 'win';
    if (teamGoals < opponentGoals) return 'loss';
    return 'draw';
}

function matchErrors(fact) {
    if (fact.type !== 'match.completed') return [];
    const metrics = fact.metrics || {};
    const teamGoals = n(metrics.teamGoals), opponentGoals = n(metrics.opponentGoals);
    const goals = n(metrics.goals), assists = n(metrics.assists);
    const errors = [];
    for (const [field, value] of Object.entries({ teamGoals, opponentGoals, goals, assists })) {
        if (!wholeNonNegative(value)) errors.push(`${field}:invalid`);
    }
    if (goals > teamGoals) errors.push('player-goals-exceed-team-score');
    if (goals + assists > teamGoals) errors.push('player-contributions-exceed-team-score');
    if (metrics.playerPlayed === false && (goals || assists)) errors.push('unused-player-has-contribution');
    if (fact.outcome?.result && fact.outcome.result !== expectedResult(teamGoals, opponentGoals)) errors.push('result-score-mismatch');
    const score = `${teamGoals}-${opponentGoals}`;
    if (fact.outcome?.score && fact.outcome.score !== score) errors.push('score-text-mismatch');
    return errors;
}

export class NarrativeContinuity {
    inspectFacts(facts = []) {
        const accepted = [];
        const rejected = [];
        for (const fact of facts) {
            const reasons = matchErrors(fact);
            if (fact.visibility === 'hidden') reasons.push('hidden-fact-cannot-be-presented');
            if (reasons.length) rejected.push({ factId: fact.id, reasons });
            else accepted.push(fact);
        }
        return { accepted, rejected };
    }

    guardOutput(output = {}, { memoryIds = [] } = {}) {
        const validMemoryIds = new Set(memoryIds);
        const callbackCommands = (output.callbackCommands || [])
            .filter(command => command?.memoryId && validMemoryIds.has(command.memoryId));
        return {
            ...output,
            primaryScene: output.primaryScene || null,
            passiveBeats: Array.isArray(output.passiveBeats) ? output.passiveBeats : [],
            journalEntries: Array.isArray(output.journalEntries) ? output.journalEntries : [],
            notificationCommands: Array.isArray(output.notificationCommands) ? output.notificationCommands : [],
            memoryCommands: Array.isArray(output.memoryCommands) ? output.memoryCommands : [],
            threadTransitions: Array.isArray(output.threadTransitions) ? output.threadTransitions : [],
            callbackCommands
        };
    }
}

export default NarrativeContinuity;
