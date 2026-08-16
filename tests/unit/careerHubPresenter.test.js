import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCareerHubModel, resolveCurrentSituation } from '../../ui/career/careerHubPresenter.js';

function state(overrides = {}) {
    return {
        player:{firstname:'Samir',lastname:'Test',age:14,position:'AD',club:'Test FC',squadStatus:'Rotation U15',fitness:88,potential:94,overall:61},
        calendar:{currentMonth:8,currentPeriod:'Reprise',seasonSchedule:{matches:[{id:'next',month:8,opponent:'Rival U15',competitionName:'Championnat U15',played:false}],category:'U15'}},
        notifications:{signals:[]},...overrides
    };
}

test('le hub expose uniquement les informations essentielles validées',()=>{
 const input=state({career:{balance:999999}}),model=buildCareerHubModel(input,[]);
 assert.equal(model.player.name,'Samir Test');
 assert.equal(Object.hasOwn(model,'nextChallenge'),false);
 assert.equal(Object.hasOwn(model.player,'potential'),false);
 assert.equal(Object.hasOwn(model.player,'overall'),false);
 assert.equal(Object.hasOwn(model,'balance'),false);
});

test('une décision de transfert remonte dans la situation actuelle sans créer une seconde carte',()=>{
 const input=state({pendingTransferOffer:{club:'Nouveau FC'}}),situation=resolveCurrentSituation(input),model=buildCareerHubModel(input,[]);
 assert.equal(situation.title,'Une décision t’attend avec Nouveau FC');
 assert.equal(model.situation.title,situation.title);
 assert.equal(Object.hasOwn(model,'nextChallenge'),false);
});

test('une notification importante non lue peut définir la situation actuelle',()=>{
 const input=state({notifications:{signals:[{id:'coach-1',category:'coach',title:'Tu te rapproches du onze',body:'Le coach te donne plus de responsabilités.',read:false}]}}),situation=resolveCurrentSituation(input);
 assert.equal(situation.title,'Tu te rapproches du onze');
 assert.equal(situation.detail,'Le coach te donne plus de responsabilités.');
});

test('la projection ne mute pas le state fourni',()=>{
 const input=state(),before=JSON.stringify(input);buildCareerHubModel(input,[{id:'j1',title:'Moment'}]);assert.equal(JSON.stringify(input),before);
});
