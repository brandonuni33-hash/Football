import test from'node:test';import assert from'node:assert/strict';import{matchPressureDecision}from'../../domain/match/matchPressurePolicy.js';
test('pas de chrono dans un match ordinaire',()=>assert.equal(matchPressureDecision({type:'standard',importance:'normal',minute:89,index:0,total:1}),null));
test('une finale tardive peut imposer 4 à 8 secondes',()=>{const p=matchPressureDecision({type:'final',minute:88,index:3,total:4,mental:70});assert.ok(p.seconds>=4&&p.seconds<=8);});
