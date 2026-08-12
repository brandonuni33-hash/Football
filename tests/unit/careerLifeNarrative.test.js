import test from 'node:test';
import assert from 'node:assert/strict';
import { eventDescription, eventResponse } from '../../domain/career/careerEventNarrativeLibrary.js';
import { CareerLifecycleSystem } from '../../domain/career/careerLifecycleSystem.js';
import TransferView from '../../ui/views/transferView.js';

test('les événements santé utilisent une description incarnée', () => {
  const text = eventDescription({ id:'blessure_legere', description:'fallback' });
  assert.match(text, /douleur|cuisse|accélération/i);
  assert.doesNotEqual(text, 'fallback');
});

test('un choix agent renvoie une vraie réaction narrative', () => {
  const text = eventResponse({ id:'avis_famille' });
  assert.match(text, /proches|contrat|table/i);
});

test('la retraite raconte la fin de carrière avec les faits disponibles', () => {
  const state={player:{id:'p1',age:35,club:'Club Test',overall:74,potential:76,stats:{matchesPlayed:212,goals:38}},family:{children:[]}};
  const system=new CareerLifecycleSystem({stateManager:{save(){}},playerLogic:{}});
  const result=system.retire(state);
  assert.equal(result.retired,true);
  assert.match(result.narrative,/212 matchs/i);
  assert.match(result.narrative,/Club Test/i);
});

test('le mercato sans offre explique le processus plutôt qu’un vide générique', () => {
  const view=new TransferView();
  const html=view.render({pendingTransferOffer:null,transferInterests:[],transferMarket:{activity:[]},player:{age:19}});
  assert.match(html,/Un transfert ne commence pas avec une offre/i);
  assert.doesNotMatch(html,/Une offre apparaîtra ici uniquement/i);
});

test('une offre devient une décision de carrière', () => {
  const view=new TransferView();
  const html=view.render({pendingTransferOffer:{club:'FC Test',salary:1200,rolePropose:'Rotation'},player:{age:20},transferInterests:[],transferMarket:{activity:[]}});
  assert.match(html,/décision de carrière/i);
  assert.match(html,/FC Test/);
  assert.match(html,/Rôle annoncé/i);
});
