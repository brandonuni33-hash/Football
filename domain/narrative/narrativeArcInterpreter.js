// Un arc décrit la phase de récit suggérée par les faits et les fils actifs.

import { stableNarrativeId } from './narrativeFactNormalizer.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export class NarrativeArcInterpreter {
    interpret({ facts = [], evaluations = [], threadTransitions = [] } = {}) {
        if (!facts.length) return [];
        const goals = facts.reduce((sum, fact) => sum + n(fact.metrics?.goals), 0);
        const contributions = goals + facts.reduce((sum, fact) => sum + n(fact.metrics?.assists), 0);
        const hasLandmark = evaluations.some(item => ['major', 'exceptional'].includes(item.importance));
        const difficult = evaluations.filter(item => item.impactLevel === 'difficult').length;
        const phase = hasLandmark && contributions > 0
            ? 'landmark'
            : goals >= 3 ? 'breakthrough'
                : threadTransitions.some(item => item.phase === 'rising') ? 'ascent'
                    : difficult ? 'setback' : 'continuity';
        const factIds = facts.map(fact => fact.id);
        return [{
            id: stableNarrativeId('arc', { phase, factIds }),
            type: 'performance',
            phase,
            factIds,
            threadIds: threadTransitions.map(item => item.threadId)
        }];
    }
}

export default NarrativeArcInterpreter;
