import PLAYER_INNER_VOICE_LIBRARY from './playerInnerVoiceLibrary.js';
import { PLAYER_INNER_VOICE_ADDITIONS } from './playerInnerVoiceLibraryAdditions.js';
import { PLAYER_INNER_VOICE_ADDITIONS_V2 } from './playerInnerVoiceLibraryAdditions2.js';
import PLAYER_INNER_VOICE_RAW from './playerInnerVoiceRawLibrary.js';

// Catalogue unifié de la petite voix intérieure.
// Toute nouvelle famille doit être branchée ici pour être disponible au sélecteur/runtime.
export const PLAYER_INNER_VOICE_CATALOG = Object.freeze([
  ...PLAYER_INNER_VOICE_LIBRARY,
  ...PLAYER_INNER_VOICE_ADDITIONS,
  ...PLAYER_INNER_VOICE_ADDITIONS_V2,
  ...PLAYER_INNER_VOICE_RAW
]);

export function getInnerVoiceCatalogEntries({ family = null, tags = [], maxIntensity = 3, includeUnique = true, depth = null } = {}) {
  const required = Array.isArray(tags) ? tags : [tags].filter(Boolean);
  return PLAYER_INNER_VOICE_CATALOG.filter(item => {
    if (family && item.family !== family) return false;
    if (depth && item.depth !== depth) return false;
    if (Number(item.intensity || 1) > maxIntensity) return false;
    if (!includeUnique && item.unique) return false;
    return required.every(tag => item.tags?.includes(tag));
  });
}

export function countInnerVoiceCatalogEntries() {
  return PLAYER_INNER_VOICE_CATALOG.length;
}

export default PLAYER_INNER_VOICE_CATALOG;
