import test from 'node:test';
import assert from 'node:assert/strict';
import { UIGateway } from '../../application/uiGateway.js';

function gatewayWith(state){let calls=0,interactiveCalls=0;const application={registry:{blockSystem:{execute(received){calls+=1;assert.equal(received,state);return{report:{summary:{matchResults:[]}}};},stateManager:{save(){return true;}}},interactiveMatchSystem:{startInteractiveMatch(){interactiveCalls+=1;throw new Error('ne doit pas être appelé');}}}};const engine={state};return{gateway:new UIGateway({application,engine}),counts:()=>({calls,interactiveCalls})};}

test('Continuer lance uniquement la simulation canonique, jamais le gameplay contrôlable',()=>{
 const state={player:{id:'p1'},activeMatchSession:{id:'legacy'},interactiveBlockResults:[{matchId:'already-committed'}]};
 const {gateway,counts}=gatewayWith(state);const result=gateway.playNextBlock();
 assert.ok(result);assert.equal(state.activeMatchSession,undefined);assert.equal(state.interactiveBlockResults.length,1);
 assert.deepEqual(counts(),{calls:1,interactiveCalls:0});assert.equal(gateway.shouldTriggerMatchDilemma(),false);assert.equal(gateway.getMatchDilemma(),null);
});
