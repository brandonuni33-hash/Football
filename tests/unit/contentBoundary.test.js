import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const CONTENT_FILES = [
  'domain/content/streetToProContentCatalog.js',
  'domain/content/contentEligibility.js',
  'domain/content/index.js',
];

test('CONTENT does not import ENGINE world model or NARRATIVE implementation', async () => {
  for (const path of CONTENT_FILES) {
    const source = await readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /domain\/world|\.\.\/world|domain\/narrative|\.\.\/narrative/);
  }
});
