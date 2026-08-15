import test from 'node:test';
import assert from 'node:assert/strict';
import { bindEngineToRegistry } from '../../application/engineFacade.js';

test('la façade moteur conserve le résultat canonique retourné par le commit', () => {
    const state = {
        player: { id: 'p1' },
        activeMatchSession: { id: 'facade-session' }
    };
    const canonical = {
        matchId: 'facade-session',
        minutesPlayed: 120,
        progression: { applied: true, matchId: 'facade-session' }
    };
    const registry = {
        interactiveMatchSystem: {
            advanceInteractiveMatch() {
                return { finished: true, result: { matchId: canonical.matchId, minutesPlayed: 90 } };
            },
            commitInteractiveResult() { return structuredClone(canonical); }
        },
        blockSystem: { stateManager: { save() { return true; } } }
    };
    const engine = { state };
    bindEngineToRegistry(engine, registry);
    const output = engine.advanceInteractiveMatch();
    assert.equal(output.result.minutesPlayed, 120);
    assert.deepEqual(output.result.progression, canonical.progression);
    assert.deepEqual(state.interactiveBlockResults, [canonical]);
});
