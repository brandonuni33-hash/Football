// Un arc décrit la phase de récit suggérée par un ensemble cohérent de faits.

import { stableNarrativeId } from './narrativeFactNormalizer.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function arc(type, phase, facts, threadIds = []) {
    const factIds = facts.map(fact => fact.id);
    return { id: stableNarrativeId('arc', { type, phase, factIds }), type, phase, factIds, threadIds };
}

export class NarrativeArcInterpreter {
    interpret({ facts = [], evaluations = [], threadTransitions = [] } = {}) {
        const arcs = [];
        const matchFacts = facts.filter(fact => fact.type === 'match.completed');
        if (matchFacts.length) {
            const matchIds = new Set(matchFacts.map(fact => fact.id));
            const matchEvaluations = evaluations.filter(item => matchIds.has(item.factId));
            const goals = matchFacts.reduce((sum, fact) => sum + n(fact.metrics?.goals), 0);
            const contributions = goals + matchFacts.reduce((sum, fact) => sum + n(fact.metrics?.assists), 0);
            const hasLandmark = matchEvaluations.some(item => ['major', 'exceptional'].includes(item.importance));
            const difficult = matchEvaluations.some(item => item.impactLevel === 'difficult');
            const phase = hasLandmark && contributions > 0 ? 'landmark'
                : goals >= 3 ? 'breakthrough'
                    : threadTransitions.some(item => item.threadId === 'player-form' && item.phase === 'rising') ? 'ascent'
                        : difficult ? 'setback' : 'continuity';
            arcs.push(arc('performance', phase, matchFacts, ['player-form']));
        }

        const groups = [
            ['opportunity', facts.filter(fact => fact.type.startsWith('transfer.'))],
            ['identity', facts.filter(fact => fact.type.startsWith('career.role') || fact.type.startsWith('career.position'))],
            ['relationship', facts.filter(fact => fact.type.startsWith('coach.'))],
            ['public-image', facts.filter(fact => fact.type.startsWith('media.'))],
            ['legacy', facts.filter(fact => fact.type.startsWith('family.'))],
            ['consequence', facts.filter(fact => fact.type.startsWith('decision.consequence'))]
        ];
        for (const [type, groupFacts] of groups) {
            if (!groupFacts.length) continue;
            const phase = groupFacts.some(fact => fact.type.endsWith('offer.created')) ? 'decision'
                : groupFacts.some(fact => fact.type === 'family.child-born') ? 'new-generation'
                    : groupFacts.some(fact => fact.type.endsWith('dilemma.created')) ? 'pressure' : 'development';
            const threadIds = threadTransitions
                .filter(item => item.evidenceFactIds?.some(id => groupFacts.some(fact => fact.id === id)))
                .map(item => item.threadId);
            arcs.push(arc(type, phase, groupFacts, threadIds));
        }
        return arcs;
    }
}

export default NarrativeArcInterpreter;
