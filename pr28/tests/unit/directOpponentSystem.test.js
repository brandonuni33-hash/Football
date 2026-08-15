import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createDirectOpponent,
    updateDirectOpponent,
    directOpponentBeat,
    directOpponentChoiceSet
} from '../../domain/match/directOpponentSystem.js';

test('le même match crée le même adversaire direct', () => {
    const first = createDirectOpponent({ seed: 'u15-match-4', playerPosition: 'BU', strength: 61 });
    const second = createDirectOpponent({ seed: 'u15-match-4', playerPosition: 'BU', strength: 61 });
    assert.equal(first.id, second.id);
    assert.equal(first.role, second.role);
    assert.equal(first.style, second.style);
});

test('un adversaire direct se souvient des duels précédents', () => {
    let opponent = createDirectOpponent({ seed: 'duel-memory', playerPosition: 'AD', strength: 55 });
    opponent = updateDirectOpponent(opponent, { success: true, duel: true, choice: 'Attaquer la ligne dès le contrôle' });
    opponent = updateDirectOpponent(opponent, { success: true, duel: true, choice: 'Rentrer intérieur pour l’obliger à tourner' });
    const beat = directOpponentBeat(opponent, { minute: 61, index: 1, playerPosition: 'ailier' });
    assert.match(beat, /recule|duels perdus/i);
    assert.equal(opponent.playerDuelsWon, 2);
});

test('les choix de duel changent selon le poste', () => {
    const striker = directOpponentChoiceSet({ playerPosition: 'BU', minute: 34 });
    const defender = directOpponentChoiceSet({ playerPosition: 'DC', minute: 34 });
    assert.equal(striker.length, 4);
    assert.equal(defender.length, 4);
    assert.notDeepEqual(striker.map(choice => choice.text), defender.map(choice => choice.text));
    assert.match(striker.map(choice => choice.text).join(' '), /appel|contact|provoquer/i);
    assert.match(defender.map(choice => choice.text).join(' '), /sortir|temporiser|couper/i);
});

test('deux duels gagnés peuvent transformer le prochain moment en vraie situation de but', () => {
    let opponent = createDirectOpponent({ seed:'breakthrough', playerPosition:'BU', strength:58 });
    opponent = updateDirectOpponent(opponent, { success:true, duel:true, choice:'Demander le ballon dans les pieds et provoquer' });
    opponent = updateDirectOpponent(opponent, { success:true, duel:true, choice:'Prendre l’appel dans son dos' });
    const choices = directOpponentChoiceSet({ playerPosition:'BU', minute:68, opponent });
    const text = choices.map(choice => choice.text).join(' | ');
    assert.match(text, /Frapper avant le retour du dernier défenseur/i);
    assert.match(text, /coéquipier qui te réclame le ballon/i);
    assert.match(text, /Feinter la frappe/i);
});
