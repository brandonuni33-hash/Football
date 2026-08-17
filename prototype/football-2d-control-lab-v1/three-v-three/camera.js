import { BALL_PHASE, FIELD, clamp, normalize } from "./constants.js";
import { controlledPlayerId, getPlayer } from "./matchState.js";
import { teamDirection } from "./possession.js";

export const CAMERA_RULES = Object.freeze({
  zoom: 1.42,
  yScale: 0.91,
  shear: -0.055,
  followAhead: 26,
  followDeadX: 58,
  followDeadY: 42,
  followResponse: 5.2,
  scanResponse: 8.5,
  scanReturnResponse: 6.4,
  scanDeadzone: 0.14,
  scanMaxX: 170,
  scanMaxY: 112,
});

function smooth(current, target, response, dt) {
  const alpha = 1 - Math.exp(-response * Math.max(0, dt));
  return current + (target - current) * alpha;
}

function cameraBounds() {
  const halfWidth = FIELD.width / (2 * CAMERA_RULES.zoom);
  const halfHeight = FIELD.height / (2 * CAMERA_RULES.zoom * CAMERA_RULES.yScale);
  return {
    minX: halfWidth - 18,
    maxX: FIELD.width - halfWidth + 18,
    minY: halfHeight - 14,
    maxY: FIELD.height - halfHeight + 14,
  };
}

function clampBase(x, y) {
  const bounds = cameraBounds();
  return {
    x: clamp(x, bounds.minX, bounds.maxX),
    y: clamp(y, bounds.minY, bounds.maxY),
  };
}

export function canScanCamera(state, slot = "host") {
  const player = getPlayer(state, controlledPlayerId(slot));
  if (!player) return false;
  const awaitingPass = state.ball.phase === BALL_PHASE.PASS && state.ball.targetId === player.id;
  return !player.hasBall && !awaitingPass && (player.protectionRemaining ?? 0) <= 0;
}

export function createCameraState(state = null, slot = "host") {
  const player = state ? getPlayer(state, controlledPlayerId(slot)) : null;
  const initial = player
    ? clampBase(player.x + teamDirection(player.team) * CAMERA_RULES.followAhead, player.y)
    : { x: FIELD.width / 2, y: FIELD.height / 2 };
  return {
    baseX: initial.x,
    baseY: initial.y,
    x: initial.x,
    y: initial.y,
    scanX: 0,
    scanY: 0,
    scanActive: false,
  };
}

function updateBase(camera, player, dt) {
  const aheadX = player.x + teamDirection(player.team) * CAMERA_RULES.followAhead;
  let targetX = camera.baseX;
  let targetY = camera.baseY;

  if (aheadX > camera.baseX + CAMERA_RULES.followDeadX) targetX = aheadX - CAMERA_RULES.followDeadX;
  else if (aheadX < camera.baseX - CAMERA_RULES.followDeadX) targetX = aheadX + CAMERA_RULES.followDeadX;

  if (player.y > camera.baseY + CAMERA_RULES.followDeadY) targetY = player.y - CAMERA_RULES.followDeadY;
  else if (player.y < camera.baseY - CAMERA_RULES.followDeadY) targetY = player.y + CAMERA_RULES.followDeadY;

  const bounded = clampBase(targetX, targetY);
  camera.baseX = smooth(camera.baseX, bounded.x, CAMERA_RULES.followResponse, dt);
  camera.baseY = smooth(camera.baseY, bounded.y, CAMERA_RULES.followResponse, dt);
}

export function updateCamera(camera, state, slot = "host", input = {}, dt = 1 / 60) {
  const player = getPlayer(state, controlledPlayerId(slot));
  if (!player) return camera;
  updateBase(camera, player, dt);

  const raw = canScanCamera(state, slot) ? normalize(input.controlX, input.controlY) : { x: 0, y: 0, magnitude: 0 };
  const active = raw.magnitude >= CAMERA_RULES.scanDeadzone;
  const targetScanX = active ? raw.x * CAMERA_RULES.scanMaxX * raw.magnitude : 0;
  const targetScanY = active ? raw.y * CAMERA_RULES.scanMaxY * raw.magnitude : 0;
  const response = active ? CAMERA_RULES.scanResponse : CAMERA_RULES.scanReturnResponse;

  camera.scanX = smooth(camera.scanX, targetScanX, response, dt);
  camera.scanY = smooth(camera.scanY, targetScanY, response, dt);
  camera.scanActive = active;

  const bounded = clampBase(camera.baseX + camera.scanX, camera.baseY + camera.scanY);
  camera.x = bounded.x;
  camera.y = bounded.y;
  return camera;
}

export function applyCameraTransform(ctx, camera) {
  const z = CAMERA_RULES.zoom;
  ctx.translate(FIELD.width / 2, FIELD.height / 2);
  ctx.transform(z, 0, CAMERA_RULES.shear * z, CAMERA_RULES.yScale * z, 0, 0);
  ctx.translate(-camera.x, -camera.y);
}
