// Façade canonique d'interprétation narrative.
// Les domaines produisent les faits ; ce moteur les interprète et ne modifie que narrativeState.

import NarrativeFactCollector from './narrativeFactCollector.js';
import NarrativeFactNormalizer from './narrativeFactNormalizer.js';
import NarrativeContextBuilder from './narrativeContextBuilder.js';
import NarrativeMemoryReader from './narrativeMemoryReader.js';
import NarrativeSignificance from './narrativeSignificance.js';
import NarrativeThreadTracker from './narrativeThreadTracker.js';
import NarrativeArcInterpreter from './narrativeArcInterpreter.js';
import NarrativeScenePlanner from './narrativeScenePlanner.js';
import NarrativeBeatComposer from './narrativeBeatComposer.js';
import NarrativeWorldBeatComposer from './narrativeWorldBeatComposer.js';
import NarrativeContinuity from './narrativeContinuity.js';
import NarrativeStateReducer from './narrativeStateReducer.js';

function emptyOutput(diagnostics = {}) {
    return {
        primaryScene: null,
        passiveBeats: [],
        journalEntries: [],
        notificationCommands: [],
        memoryCommands: [],
        threadTransitions: [],
        callbackCommands: [],
        diagnostics: {
            seed: null,
            acceptedFactIds: [],
            rejectedFacts: [],
            duplicateFactIds: [],
            normalizationErrors: [],
            generatedSceneCount: 0,
            ...diagnostics
        }
    };
}

export class NarrativeEngine {
    constructor({
        factCollector = new NarrativeFactCollector(),
        factNormalizer = new NarrativeFactNormalizer(),
        contextBuilder = new NarrativeContextBuilder(),
        memoryReader = new NarrativeMemoryReader(),
        significance = new NarrativeSignificance(),
        threadTracker = new NarrativeThreadTracker(),
        arcInterpreter = new NarrativeArcInterpreter(),
        scenePlanner = new NarrativeScenePlanner(),
        beatComposer = new NarrativeBeatComposer(),
        worldBeatComposer = new NarrativeWorldBeatComposer(),
        continuity = new NarrativeContinuity(),
        stateReducer = new NarrativeStateReducer()
    } = {}) {
        Object.assign(this, {
            factCollector, factNormalizer, contextBuilder, memoryReader, significance,
            threadTracker, arcInterpreter, scenePlanner, beatComposer, worldBeatComposer, continuity, stateReducer
        });
    }

    processBlock({ state, report, resolved = {} } = {}) {
        return this.process({ state, rawFacts: this.factCollector.collectBlockFacts({ state, report, resolved }) });
    }

    processMatchEnd({ state, report } = {}) {
        return this.process({ state, rawFacts: this.factCollector.collectMatchFacts({ state, report }) });
    }

    process({ state, rawFacts = [] } = {}) {
        const normalizationErrors = [];
        const normalizedFacts = [];
        for (const [index, rawFact] of (Array.isArray(rawFacts) ? rawFacts : []).entries()) {
            try {
                normalizedFacts.push(this.factNormalizer.normalize(rawFact));
            } catch (error) {
                normalizationErrors.push({ index, message: error?.message || String(error) });
            }
        }
        if (!normalizedFacts.length || !state?.player) return emptyOutput({ normalizationErrors });

        const inspection = this.continuity.inspectFacts(normalizedFacts);
        const processed = new Set(state?.narrativeState?.processedFactIds || []);
        const duplicateFactIds = inspection.accepted.filter(fact => processed.has(fact.id)).map(fact => fact.id);
        const freshFacts = inspection.accepted.filter(fact => !processed.has(fact.id));
        if (!freshFacts.length) return emptyOutput({
            rejectedFacts: inspection.rejected,
            duplicateFactIds,
            normalizationErrors
        });

        const context = this.contextBuilder.build({ state, facts: freshFacts });
        const memory = this.memoryReader.read({ state, facts: freshFacts });
        const evaluations = this.significance.evaluateAll(freshFacts);
        const threadTransitions = this.threadTracker.track({ facts: freshFacts, evaluations, context });
        const arcs = this.arcInterpreter.interpret({ facts: freshFacts, evaluations, threadTransitions, context });
        const plan = this.scenePlanner.plan({ facts: freshFacts, evaluations, arcs, context });
        const matchComposition = this.beatComposer.compose({ plan, context, memory });
        const worldComposition = this.worldBeatComposer.compose({ facts: freshFacts, evaluations, context, memory });
        const composition = {
            ...matchComposition,
            primaryScene: matchComposition.primaryScene || worldComposition.primaryScene,
            passiveBeats: worldComposition.passiveBeats,
            journalEntries: worldComposition.journalEntries
        };
        const output = this.continuity.guardOutput({
            ...emptyOutput(),
            ...composition,
            threadTransitions,
            diagnostics: {
                seed: context.seed,
                acceptedFactIds: freshFacts.map(fact => fact.id),
                rejectedFacts: inspection.rejected,
                duplicateFactIds,
                normalizationErrors,
                generatedSceneCount: composition.primaryScene ? 1 : 0
            }
        }, memory);
        this.stateReducer.apply(state, { facts: freshFacts, output });
        return output;
    }

    // API historique conservée : les appelants existants reçoivent toujours la scène principale.
    composeMatchEnd({ state, report } = {}) {
        return this.processMatchEnd({ state, report }).primaryScene;
    }

    composeBlock({ state, report, resolved = {} } = {}) {
        return this.processBlock({ state, report, resolved }).primaryScene;
    }
}

export default NarrativeEngine;
