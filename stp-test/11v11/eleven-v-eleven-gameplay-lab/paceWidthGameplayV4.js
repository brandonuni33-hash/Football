import * as base from "./progressionGameplayV3.js?pace-width-v4";

export const VIEWPORT = base.VIEWPORT;
export const TEAM = base.TEAM;
export const BALL_PHASE = base.BALL_PHASE;
export const CONTROLLED_ID = base.CONTROLLED_ID;
export const getControlledPlayer = base.getControlledPlayer;
export const getPlayer = base.getPlayer;
export const getOwner = base.getOwner;
export const actionLabels = base.actionLabels;
export const controlMode = base.controlMode;
export const cameraGeometry = base.cameraGeometry;
export const isPointVisible = base.isPointVisible;
export const formationSummary = base.formationSummary;

const BASE_PITCH = base.PITCH;
const TARGET_PITCH_HEIGHT = 1180;
const WIDTH_SCALE = TARGET_PITCH_HEIGHT / BASE_PITCH.height;
const INV_WIDTH_SCALE = 1 / WIDTH_SCALE;
const GAME_TIME_SCALE = 0.88;

export const PITCH = Object.freeze({
  ...BASE_PITCH,
  height: TARGET_PITCH_HEIGHT,
  goalTop: BASE_PITCH.goalTop * WIDTH_SCALE,
  goalBottom: BASE_PITCH.goalBottom * WIDTH_SCALE,
  penaltyTop: BASE_PITCH.penaltyTop * WIDTH_SCALE,
  penaltyBottom: BASE_PITCH.penaltyBottom * WIDTH_SCALE,
  sixYardTop: BASE_PITCH.sixYardTop * WIDTH_SCALE,
  sixYardBottom: BASE_PITCH.sixYardBottom * WIDTH_SCALE,
});

export const RULES = Object.freeze({
  ...base.RULES,
  effectiveGameSpeed: GAME_TIME_SCALE,
  effectiveRapidSpeed: base.RULES.rapidSpeed * GAME_TIME_SCALE,
  virtualPitchWidthScale: WIDTH_SCALE,
});

const AI_PACE = Object.freeze({
  shape: 0.60,
  normal: 0.70,
  press: 0.74,
  open: 0.84,
  burst: 0.94,
  forwardConeHalfWidth: 132,
  immediatePressure: 92,
  openSpace: 185,
  burstSpace: 285,
});

const CAMERA = Object.freeze({
  playerWeightMin: 0.28,
  playerWeightMax: 0.48,
  weightDistance: 620,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function teamDirection(team) {
  return team === TEAM.HOME ? 1 : -1;
}

function transformSpatialY(state, factor) {
  for (const player of state.players) {
    player.y *= factor;
    player.originY *= factor;
    player.vy *= factor;
  }
  state.ball.y *= factor;
  state.ball.vy *= factor;
}

function expandToWidePitch(state) {
  if (state.widePitchSpace) return state;
  transformSpatialY(state, WIDTH_SCALE);
  state.widePitchSpace = true;
  return state;
}

function compressToBasePitch(state) {
  if (!state.widePitchSpace) return state;
  transformSpatialY(state, INV_WIDTH_SCALE);
  state.widePitchSpace = false;
  return state;
}

function forwardSpace(state, player) {
  const dir = teamDirection(player.team);
  let nearest = Infinity;

  for (const opponent of state.players) {
    if (opponent.team === player.team) continue;
    const forward = (opponent.x - player.x) * dir;
    if (forward <= 0) continue;
    const lateral = Math.abs(opponent.y - player.y);
    const cone = AI_PACE.forwardConeHalfWidth + Math.min(90, forward * 0.22);
    if (lateral > cone) continue;
    nearest = Math.min(nearest, forward);
  }

  return nearest;
}

function aiPaceScale(state, player) {
  const space = forwardSpace(state, player);
  const role = player.tacticalRole ?? "shape";
  const activeRun = role === "timed-run" || role === "overlap" || role === "loose-ball";
  const pressing = role === "light-press";

  if (pressing) return AI_PACE.press;
  if (space <= AI_PACE.immediatePressure) return AI_PACE.shape;

  if ((player.hasBall || activeRun) && space >= AI_PACE.burstSpace) return AI_PACE.burst;
  if ((player.hasBall || activeRun) && space >= AI_PACE.openSpace) return AI_PACE.open;
  if (space >= AI_PACE.openSpace) return AI_PACE.normal;
  return AI_PACE.shape;
}

function applyAIPace(state) {
  const maxRapid = base.RULES.rapidSpeed * GAME_TIME_SCALE;

  for (const player of state.players) {
    if (player.controlled) continue;
    const scale = aiPaceScale(state, player);
    const maxSpeed = maxRapid * scale;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > maxSpeed && speed > 0.001) {
      const ratio = maxSpeed / speed;
      player.vx *= ratio;
      player.vy *= ratio;
    }
    player.aiPaceMode = scale >= AI_PACE.burst
      ? "rapid"
      : scale >= AI_PACE.open
        ? "open-run"
        : scale >= AI_PACE.normal
          ? "normal"
          : "shape";
    const space = forwardSpace(state, player);
    player.aiForwardSpace = Number.isFinite(space) ? space : 999;
  }
}

export function createGameplayState() {
  const state = base.createGameplayState();
  state.paceWidthV4 = {
    gameTimeScale: GAME_TIME_SCALE,
    pitchWidthScale: WIDTH_SCALE,
  };
  return expandToWidePitch(state);
}

export function stepGameplay(state, input = {}, dt = RULES.fixedStep) {
  compressToBasePitch(state);
  const next = base.stepGameplay(state, input, dt * GAME_TIME_SCALE);
  expandToWidePitch(next);
  applyAIPace(next);
  return next;
}

function cameraBounds(settings = {}) {
  const geometry = cameraGeometry(settings);
  const halfWidth = VIEWPORT.width / (2 * geometry.zoom);
  const halfHeight = VIEWPORT.height / (2 * geometry.zoom * geometry.yScale);
  return {
    minX: halfWidth - 20,
    maxX: PITCH.width - halfWidth + 20,
    minY: halfHeight - 20,
    maxY: PITCH.height - halfHeight + 20,
  };
}

export function cameraFromBall(state, settings = {}) {
  const bounds = cameraBounds(settings);
  const player = getControlledPlayer(state);
  if (!player) {
    return {
      x: clamp(state.ball.x, bounds.minX, bounds.maxX),
      y: clamp(state.ball.y, bounds.minY, bounds.maxY),
      playerWeight: 0,
    };
  }

  const gap = distance(player, state.ball);
  const playerWeight = clamp(
    CAMERA.playerWeightMin + (gap / CAMERA.weightDistance) * 0.20,
    CAMERA.playerWeightMin,
    CAMERA.playerWeightMax,
  );
  const ballWeight = 1 - playerWeight;
  return {
    x: clamp(state.ball.x * ballWeight + player.x * playerWeight, bounds.minX, bounds.maxX),
    y: clamp(state.ball.y * ballWeight + player.y * playerWeight, bounds.minY, bounds.maxY),
    playerWeight,
  };
}
