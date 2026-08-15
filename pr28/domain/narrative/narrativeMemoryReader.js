// Lit les souvenirs réels sans en inventer. Les callbacks conservent leur preuve d'origine.

function memoryIdentity(memory, index) {
    return String(memory?.id || memory?.choiceId || `career-memory-${index}`);
}

function coachMemoryForFact(memories, fact) {
    if (fact?.type !== 'coach.interaction.created') return null;
    for (let index = memories.length - 1; index >= 0; index--) {
        const item = memories[index];
        if (item?.type !== 'coach-choice') continue;
        return { memory: item, index };
    }
    return null;
}

function memoryForFact(memories, fact) {
    const coachMemory = coachMemoryForFact(memories, fact);
    if (coachMemory) return coachMemory;

    const opponent = String(fact?.payload?.opponent || '').trim().toLowerCase();
    const opponentClubId = fact?.payload?.fixture?.opponentClubId || null;
    for (let index = memories.length - 1; index >= 0; index--) {
        const item = memories[index];
        if (opponentClubId && item?.clubId === opponentClubId) return { memory: item, index };
        if (!opponent || opponent.length < 3) continue;
        const searchable = `${item?.title || ''} ${item?.text || ''} ${item?.source || ''}`.toLowerCase();
        if (searchable.includes(opponent)) return { memory: item, index };
    }
    return null;
}

function coachCallbackText(memory) {
    const coachName = memory?.coachName || 'le coach';
    const choice = String(memory?.choiceText || '').trim();
    const intent = Number(memory?.relationIntent || 0);
    const opinion = String(memory?.opinion || '').toLowerCase();
    if (intent <= -8 || opinion.includes('fâch') || opinion.includes('déçu')) {
        return `Ce n’est pas votre premier moment de tension. ${coachName} n’a pas oublié la manière dont tu avais répondu la dernière fois${choice ? ` — « ${choice} »` : ''}.`;
    }
    if (intent >= 8 || opinion.includes('fier')) {
        return `Il y a déjà eu un moment où tu as choisi de faire confiance à ${coachName}${choice ? ` — « ${choice} »` : ''}. Ce souvenir donne un autre poids à cette discussion.`;
    }
    return `Ce nouvel échange ne part pas de zéro. ${coachName} garde en mémoire votre précédente discussion${choice ? ` et la réponse que tu avais choisie : « ${choice} »` : ''}.`;
}

function callbackText(memory) {
    if (memory?.type === 'coach-choice') return coachCallbackText(memory);
    const age = memory?.age ? ` à ${memory.age} ans` : '';
    return `Ce rendez-vous réveille aussi une trace plus ancienne de ta carrière${age}. Le contexte a changé, mais le passé n’a pas complètement disparu.`;
}

function recentFormText(state, fact) {
    if (fact?.outcome?.result !== 'win') return null;
    const history = Array.isArray(state?.career?.seasonHistory) ? state.career.seasonHistory : [];
    const last = history.at(-1);
    const label = last?.summary || last?.label || last?.title;
    return label ? `Cette victoire arrive dans une carrière qui s’est déjà construite par étapes : ${label}.` : null;
}

export class NarrativeMemoryReader {
    read({ state, facts = [] } = {}) {
        const memories = Array.isArray(state?.careerMemory) ? state.careerMemory.slice(-80) : [];
        const callbacksByFactId = {};
        const continuityByFactId = {};

        for (const fact of facts) {
            const match = memoryForFact(memories, fact);
            if (match) {
                callbacksByFactId[fact.id] = {
                    memoryId: memoryIdentity(match.memory, match.index),
                    memoryType: match.memory?.type || null,
                    text: callbackText(match.memory)
                };
            } else {
                const continuity = recentFormText(state, fact);
                if (continuity) continuityByFactId[fact.id] = continuity;
            }
        }

        return {
            callbacksByFactId: Object.freeze(callbacksByFactId),
            continuityByFactId: Object.freeze(continuityByFactId),
            memoryIds: Object.freeze(memories.map(memoryIdentity))
        };
    }
}

export default NarrativeMemoryReader;
