export const STP_STAT_DEFINITIONS = Object.freeze([
  { key: 'technique', label: 'Technique', group: 'Technique' },
  { key: 'controleBalle', label: 'Contrôle de balle', group: 'Technique' },
  { key: 'passeCourte', label: 'Passe courte', group: 'Technique' },
  { key: 'passeLongue', label: 'Passe longue', group: 'Technique' },
  { key: 'centre', label: 'Centre', group: 'Technique' },
  { key: 'finition', label: 'Finition', group: 'Technique' },
  { key: 'tirLoin', label: 'Tir de loin', group: 'Technique' },
  { key: 'puissanceFrappe', label: 'Puissance de frappe', group: 'Technique' },
  { key: 'jeuTete', label: 'Jeu de tête', group: 'Technique' },
  { key: 'vitesse', label: 'Vitesse', group: 'Physique' },
  { key: 'acceleration', label: 'Accélération', group: 'Physique' },
  { key: 'agilite', label: 'Agilité', group: 'Physique' },
  { key: 'equilibre', label: 'Équilibre', group: 'Physique' },
  { key: 'force', label: 'Force', group: 'Physique' },
  { key: 'endurance', label: 'Endurance', group: 'Physique' },
  { key: 'detente', label: 'Détente', group: 'Physique' },
  { key: 'tacle', label: 'Tacle', group: 'Défense' },
  { key: 'interception', label: 'Interception', group: 'Défense' },
  { key: 'agressivite', label: 'Agressivité', group: 'Défense' },
  { key: 'vision', label: 'Vision', group: 'Mental' },
  { key: 'reactivite', label: 'Réactivité', group: 'Mental' },
  { key: 'sangFroid', label: 'Sang-froid', group: 'Mental' },
  { key: 'placement', label: 'Placement', group: 'Mental' },
]);

export const STP_ACTIVE_MOVEMENT_STATS = Object.freeze(new Set([
  'vitesse',
  'acceleration',
  'agilite',
  'equilibre',
  'endurance',
]));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(min, max, t) {
  return min + (max - min) * t;
}

export function createDefaultPlayerStats(value = 50) {
  const v = clamp(Number(value) || 0, 0, 100);
  return Object.freeze(Object.fromEntries(STP_STAT_DEFINITIONS.map(({ key }) => [key, v])));
}

export function normalizePlayerStats(input = {}) {
  const normalized = {};
  for (const { key } of STP_STAT_DEFINITIONS) {
    const raw = Number(input[key]);
    normalized[key] = clamp(Number.isFinite(raw) ? raw : 50, 0, 100);
  }
  return Object.freeze(normalized);
}

export function deriveMovementTuning(input = {}) {
  const stats = normalizePlayerStats(input);
  const speed = stats.vitesse / 100;
  const accel = stats.acceleration / 100;
  const agility = stats.agilite / 100;
  const balance = stats.equilibre / 100;
  const stamina = stats.endurance / 100;

  return Object.freeze({
    jogSpeed: lerp(4.0, 5.6, speed),
    sprintSpeed: lerp(6.0, 8.4, speed),
    acceleration: lerp(7.5, 15.5, accel),
    deceleration: lerp(11.0, 17.0, balance),
    turnRateSlow: Math.PI * lerp(2.4, 4.0, agility),
    turnRateFast: Math.PI * lerp(1.5, 2.7, agility),
    sharpTurnSpeedRetention: lerp(0.72, 0.96, balance),
    staminaDrainPerSecond: lerp(5.2, 2.2, stamina),
    staminaRecoveryPerSecond: lerp(3.5, 7.5, stamina),
    fatiguedSprintFloor: lerp(0.76, 0.90, stamina),
  });
}

export function sharpTurnSpeedFactor(tuning, angleRadians) {
  const angle = clamp(Math.abs(Number(angleRadians) || 0), 0, Math.PI);
  const severity = clamp((angle - Math.PI / 4) / (Math.PI * 3 / 4), 0, 1);
  return 1 - (1 - tuning.sharpTurnSpeedRetention) * severity;
}
