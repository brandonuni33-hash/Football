import test from'node:test';import assert from'node:assert/strict';import{assertSameMatch,bindMatchId}from'../../domain/match/matchIdentityGuard.js';
test('refuse de mélanger deux matchs',()=>assert.throws(()=>assertSameMatch('m1',{matchId:'m2'}),/Incohérence/));test('rattache un fait sans identité au match canonique',()=>assert.equal(bindMatchId('m1',{text:'x'}).matchId,'m1'));
