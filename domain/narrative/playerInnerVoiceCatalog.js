import PLAYER_INNER_VOICE_LIBRARY from './playerInnerVoiceLibrary.js';
import { PLAYER_INNER_VOICE_ADDITIONS } from './playerInnerVoiceLibraryAdditions.js';
import { PLAYER_INNER_VOICE_ADDITIONS_V2 } from './playerInnerVoiceLibraryAdditions2.js';
import PLAYER_INNER_VOICE_RAW from './playerInnerVoiceRawLibrary.js';

// Street to Pro — catalogue canonique de la voix intérieure.
// La voix intérieure ne décrit jamais l'action visible : elle exprime uniquement
// un vécu émotionnel fort (pression, peur, doute, confiance, humiliation, rage,
// soulagement, fierté, vertige, douleur, culpabilité ou résilience).
//
// Les anciennes bibliothèques restent comme sources historiques pour l'instant,
// mais seules les entrées explicitement retenues ci-dessous sont actives.
// 150 phrases est un plafond, jamais un objectif à remplir.

const SOURCE = [
  ...PLAYER_INNER_VOICE_LIBRARY,
  ...PLAYER_INNER_VOICE_ADDITIONS,
  ...PLAYER_INNER_VOICE_ADDITIONS_V2,
  ...PLAYER_INNER_VOICE_RAW
];

const ALLOWED_IDS = new Set([
  // Confiance / flow
  'confidence_006','confidence_007','confidence_010','confidence_011','confidence_012',

  // Doute / pression / reprise de soi
  'doubt_002','doubt_003','doubt_004','doubt_005','doubt_006','doubt_008','doubt_009','doubt_010','doubt_011','doubt_012','doubt_013','doubt_014','doubt_015',

  // Ambition / ego émotionnel
  'ego_002','ego_004','ego_005','ego_006','ego_010','ego_011','ego_013','ego_015','ego_018','ego_022','ego_025',
  'ego_position_001','ego_position_002','ego_position_005','ego_position_006','ego_position_009','ego_position_010',

  // Adversaire / tension personnelle
  'opponent_004','opponent_005','opponent_009','opponent_011','opponent_012','opponent_017','opponent_018',

  // Grande occasion — uniquement vécu intérieur
  'chance_001','chance_006','chance_012','chance_013','chance_014','chance_015',

  // But / soulagement / incrédulité
  'goal_002','goal_003','goal_004','goal_006','goal_008','goal_010','goal_011',

  // Premiers / moments uniques
  'unique_001','unique_002','unique_003','unique_004','unique_005','unique_006','unique_007','unique_008','unique_009','unique_010',

  // Raté / culpabilité / responsabilité
  'miss_pressure_001','miss_pressure_002','miss_pressure_004','miss_pressure_005','miss_pressure_006','miss_pressure_007','miss_pressure_008','miss_pressure_009','miss_pressure_010',

  // Épuisement / corps vécu
  'spent_001','spent_002','spent_004','spent_005','spent_006','spent_007','spent_008',

  // Défi / revanche
  'prove_001','prove_002','prove_003','prove_004','prove_005','prove_006','prove_007','prove_008','prove_009',

  // Douleur / inquiétude
  'pain_003','pain_004','pain_006','pain_007','pain_008',

  // Provocation / maîtrise émotionnelle
  'provocation_001','provocation_002','provocation_003','provocation_004','provocation_005','provocation_006','provocation_007','provocation_008',

  // Intimidation / malaise
  'stare_001','stare_002','stare_003','stare_004','stare_005','stare_006','stare_007','stare_008',

  // Réactions brutes — uniquement pics émotionnels
  'raw_frustration_001','raw_frustration_010','raw_frustration_012','raw_frustration_014',
  'raw_joy_004','raw_joy_015','raw_joy_016','raw_joy_017',
  'raw_pain_003','raw_pain_004','raw_pain_008','raw_pain_011','raw_pain_017','raw_pain_020',
  'raw_surprise_005','raw_surprise_009','raw_surprise_015','raw_surprise_019',
  'raw_selfcrit_002','raw_selfcrit_005','raw_selfcrit_010','raw_selfcrit_014','raw_selfcrit_017',
  'raw_drive_009','raw_drive_013','raw_drive_019',
  'raw_fear_001','raw_fear_002','raw_fear_003','raw_fear_004'
]);

export const PLAYER_INNER_VOICE_CATALOG = Object.freeze(
  SOURCE.filter(item => item?.id && ALLOWED_IDS.has(item.id))
);

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
