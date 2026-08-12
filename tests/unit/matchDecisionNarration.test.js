import test from'node:test';
import assert from'node:assert/strict';
import{decisionNarration}from'../../domain/match/matchDecisionNarration.js';

test('un défenseur travaillé revient dans le texte plus tard',()=>assert.match(decisionNarration({minute:78,opponent:'Rival',index:2,memory:{defenderStress:.5}}),/déjà fait reculer|se souvient/i));

test('une hésitation peut revenir plus tard',()=>assert.match(decisionNarration({minute:85,index:3,memory:{pressureMisses:1}}),/hésitation/i));

test('une décision U15 garde une ambiance de bord de terrain sans jargon ni nom de club',()=>{
  const text=decisionNarration({minute:12,index:0,age:15,level:'Championnat U15',competition:'Championnat U15',opponent:'US Test'});
  assert.match(text,/bord du terrain|coéquipier|vis-à-vis|défenseur/i);
  assert.doesNotMatch(text,/main courante|stade|tribune|US Test/i);
});

test('la fin de match menée ajoute la pression du score',()=>{const text=decisionNarration({minute:82,index:3,opponent:'Rival',memory:{defenderStress:.5},score:{home:0,away:1},home:true});assert.match(text,/temps commence à compter/i);});

test('le poste peut changer la scène proposée',()=>{const gardien=decisionNarration({minute:51,index:2,position:'Gardien'});const milieu=decisionNarration({minute:51,index:2,position:'Milieu relayeur'});assert.notEqual(gardien,milieu);assert.match(gardien,/passe en retrait|relance/i);assert.match(milieu,/deux lignes/i);});
