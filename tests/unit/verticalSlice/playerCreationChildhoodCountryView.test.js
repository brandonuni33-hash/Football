import test from 'node:test';
import assert from 'node:assert/strict';
import { createChildhoodCountryStepState } from '../../../ui/verticalSlice/playerCreationChildhoodCountryStep.js';
import { playerCreationChildhoodCountryTemplate } from '../../../ui/verticalSlice/playerCreationChildhoodCountryView.js';

test('l’écran pays d’enfance garde le fond matière et affiche 06 / 06', () => {
    const html = playerCreationChildhoodCountryTemplate(createChildhoodCountryStepState());
    assert.match(html, /06 \/ 06/);
    assert.match(html, /Où as-tu grandi/);
    assert.match(html, /fait partie de ton identité/);
    assert.match(html, /dépendront du continent/);
    assert.match(html, /stp-creation-material/);
    assert.match(html, /data-country="France"/);
    assert.match(html, /class="stp-childhood-country selected" data-country="France"/);
    assert.match(html, /Terminer la création/);
});

test('les pays hors vertical slice restent visibles mais verrouillés', () => {
    const html = playerCreationChildhoodCountryTemplate(createChildhoodCountryStepState());
    assert.match(html, /data-country="Angleterre" disabled/);
    assert.match(html, /data-country="Brésil" disabled/);
    assert.match(html, /Prévu pour la version complète/);
});
