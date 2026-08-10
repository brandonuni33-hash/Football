import { POSITIONS, ORIGINS } from './constants.js';
window.__STP_POSITIONS = Array.isArray(POSITIONS) ? POSITIONS : Object.values(POSITIONS || {});
window.__STP_ORIGINS = ORIGINS || {};
