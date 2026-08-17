import test from 'node:test';
import assert from 'node:assert/strict';
import { flagForCountry, continentForCountry } from '../../domain/world/countryCatalog.js';

test('le catalogue pays fournit les drapeaux et le continent canonique', () => {
    assert.equal(flagForCountry('France'), '🇫🇷');
    assert.equal(flagForCountry('Algérie'), '🇩🇿');
    assert.equal(continentForCountry('France'), 'Europe');
    assert.equal(continentForCountry('Algérie'), 'Afrique');
    assert.equal(continentForCountry('Brésil'), 'Amérique du Sud');
    assert.equal(continentForCountry('Japon'), 'Asie');
});
