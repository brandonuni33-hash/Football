import test from 'node:test';
import assert from 'node:assert/strict';
import { appendSpecialFourthChoice, selectSpecialFourthChoice } from '../../domain/match/specialFourthChoiceSystem.js';

const base=[
  {text:'Jouer simple',style:'safe'},
  {text:'Prendre le duel',style:'technical'},
  {text:'Tenter le geste risqué',style:'risky'}
];

test('un joueur sans origine spéciale ni acquis garde trois choix',()=>{
  const choices=appendSpecialFourthChoice(base,{player:{origin:'CENTRE_FORMATION'}},{id:'x',seed:'x',description:'Tu reçois le ballon dans l’axe.'});
  assert.equal(choices.length,3);
});

test('le futsal peut ouvrir un quatrième choix sans afficher le mot futsal',()=>{
  const choices=appendSpecialFourthChoice(base,{player:{origin:'FUTSAL'}},{id:'f',seed:'f',description:'Dans un petit espace, un défenseur te colle dos au but.'});
  assert.equal(choices.length,4);
  assert.equal(choices[3].specialFourthChoice,true);
  assert.equal(choices[3].unlockSource,'origin');
  assert.doesNotMatch(`${choices[3].text} ${choices[3].gesture}`,/futsal|réflexe/i);
});

test('street ouvre une action naturelle de duel et jamais un trait visible',()=>{
  const c=selectSpecialFourthChoice({player:{origin:'STREET'}},{id:'s',seed:'s',description:'Ton défenseur direct vient te chercher en un contre un.'});
  assert.ok(c);
  assert.equal(c.unlockSource,'origin');
  assert.doesNotMatch(c.text,/street|origine|trait/i);
});

test('athlète ouvre une solution physique cohérente',()=>{
  const c=selectSpecialFourthChoice({player:{origin:'ATHLETE'}},{id:'a',seed:'a',description:'Un espace énorme apparaît dans la profondeur et tu pars en course.'});
  assert.ok(c);
  assert.match(`${c.text} ${c.gesture}`,/accél|puissance|explos|course/i);
});

test('un focus de finition peut créer un quatrième choix travaillé à l’entraînement',()=>{
  const choices=appendSpecialFourthChoice(base,{player:{origin:'CENTRE_FORMATION'},trainingFocus:'FINITION'},{id:'t',seed:'t',description:'Seul dans la surface, le gardien ferme l’angle et tu dois frapper.'});
  assert.equal(choices.length,4);
  assert.equal(choices[3].unlockSource,'training');
  assert.match(`${choices[3].text} ${choices[3].gesture}`,/entraînement|répét|finition/i);
});

test('un geste appris persistant peut débloquer le choix même si le focus actuel a changé',()=>{
  const choices=appendSpecialFourthChoice(base,{player:{origin:'CENTRE_FORMATION',learnedGestures:['CONTROLE_ORIENTE']},trainingFocus:'PHYSIQUE'},{id:'learned',seed:'learned',description:'Tu reçois sous pression avec un adversaire dans le dos.'});
  assert.equal(choices.length,4);
  assert.equal(choices[3].unlockSource,'training');
  assert.match(`${choices[3].text} ${choices[3].gesture}`,/contrôle/i);
});

test('un penalty reste strictement à trois choix dédiés',()=>{
  const penalty=[{text:'Frapper fort plein axe'},{text:'Placer dans un coin'},{text:'Piquer doucement au milieu'}];
  const choices=appendSpecialFourthChoice(penalty,{player:{origin:'FUTSAL'},trainingFocus:'FINITION'},{id:'OCC-014',seed:'penalty',description:'Le ballon est posé sur le point de penalty.'});
  assert.equal(choices.length,3);
  assert.equal(choices.some(choice=>choice.specialFourthChoice),false);
});

test('le système ne transforme jamais cinq choix existants en six',()=>{
  const five=[...base,{text:'Quatre'},{text:'Cinq'}];
  const choices=appendSpecialFourthChoice(five,{player:{origin:'FUTSAL'}},{id:'five',seed:'five',description:'Petit espace.'});
  assert.equal(choices.length,5);
});

test('la sélection est déterministe pour un même contexte',()=>{
  const state={player:{origin:'FUTSAL'},trainingFocus:'TECHNIQUE'};
  const ctx={id:'det',seed:'same',description:'Sous pression dans un petit espace, tu dois contrôler.'};
  assert.deepEqual(selectSpecialFourthChoice(state,ctx),selectSpecialFourthChoice(state,ctx));
});
