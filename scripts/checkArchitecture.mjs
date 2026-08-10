#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'simulation-results']);
const LOGIC_EXTENSIONS = new Set(['.js', '.mjs']);
const DATA_PATTERNS = [/catalog/i, /constants?/i, /fixtures?/i, /data/i, /mock/i];
const ALLOWED_COMPAT_FACADES = new Set(['player.js', 'state.js']);
const WARN_LOGIC_LINES = 400;
const HARD_LOGIC_LINES = 900;
const LEGACY_ROOT_MODULES = new Set([
    'player.js', 'state.js', 'careerSystem.js', 'competitionSystem.js', 'worldSystem.js',
    'coachSystem.js', 'media.js', 'events.js', 'economy.js', 'entrainement.js', 'transferMarket.js',
    'potentialSystem.js', 'consequenceSystem.js', 'cupSystem.js', 'matchChoices.js'
]);

function walk(dir) {
    const output = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) output.push(...walk(full));
        else output.push(full);
    }
    return output;
}

function relative(file) {
    return path.relative(ROOT, file).replaceAll(path.sep, '/');
}

const files = walk(ROOT);
const jsFiles = files.filter(file => LOGIC_EXTENSIONS.has(path.extname(file)));
const errors = [];
const warnings = [];

const groups = new Map();
for (const file of jsFiles) {
    const base = path.basename(file).toLowerCase();
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push(relative(file));
}

for (const [base, paths] of groups) {
    const hasRoot = paths.some(file => !file.includes('/'));
    const hasLayered = paths.some(file => file.includes('/domain/') || file.includes('/application/') || file.includes('/state/') || file.includes('/ui/'));
    if (hasRoot && hasLayered && paths.length > 1 && !ALLOWED_COMPAT_FACADES.has(base)) {
        errors.push(`Duplicate implementation basename across root/layer: ${base}: ${paths.join(', ')}`);
    }
}

for (const file of jsFiles) {
    const rel = relative(file);
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
    if (DATA_PATTERNS.some(pattern => pattern.test(path.basename(file)))) continue;
    if (lines > HARD_LOGIC_LINES) errors.push(`Logic file is too large (${lines} lines): ${rel}`);
    else if (lines > WARN_LOGIC_LINES) warnings.push(`Large logic file (${lines} lines): ${rel}`);
}

for (const file of jsFiles) {
    const rel = relative(file);
    const source = fs.readFileSync(file, 'utf8');
    if (rel === 'main.js' && /from ['"]\.\/.*System/.test(source)) {
        errors.push(`main.js must not import domain systems directly: ${rel}`);
    }
    if (rel.startsWith('domain/') && [...LEGACY_ROOT_MODULES].some(name => source.includes(`from '../../${name}'`) || source.includes(`from '../${name}'`))) {
        warnings.push(`Domain module still imports a legacy root module: ${rel}`);
    }
}

for (const message of warnings) console.warn(`ARCH WARNING: ${message}`);
for (const message of errors) console.error(`ARCH ERROR: ${message}`);

console.log(`Architecture scan: ${files.length} files, ${jsFiles.length} JS modules.`);
console.log(`Warnings: ${warnings.length} | Errors: ${errors.length}`);
process.exitCode = errors.length ? 1 : 0;
