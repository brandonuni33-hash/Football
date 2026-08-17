import { CAMERA_DEFAULTS, PITCH, VIEWPORT, clamp, normalize } from "./constants.js";
import { getControlledPlayer } from "./state.js";

function smooth(current, target, response, dt) {
  const alpha = 1 - Math.exp(-response * Math.max(0, dt));
  return current + (target - current) * alpha;
}

export function cameraGeometry(settings = CAMERA_DEFAULTS) {
  const zoom = clamp(Number(settings.zoom ?? CAMERA_DEFAULTS.zoom), 1.1, 1.8);
  const angle = clamp(Number(settings.angle ?? CAMERA_DEFAULTS.angle), 0, 60);
  const scan = clamp(Number(settings.scan ?? CAMERA_DEFAULTS.scan), 0, 100);
  const yScale = 0.95 - angle * 0.0028;
  const shear = -(0.018 + angle * 0.00145);
  const scanMaxX = 260 + scan * 5.4;
  const scanMaxY = 145 + scan * 3.1;
  return { zoom, angle, scan, yScale, shear, scanMaxX, scanMaxY };
}

export function cameraBounds(settings = CAMERA_DEFAULTS) {
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

function clampCamera(x, y, settings) {
  const bounds = cameraBounds(settings);
  return {
    x: clamp(x, bounds.minX, bounds.maxX),
    y: clamp(y, bounds.minY, bounds.maxY),
  };
}

export function createCameraState(state, settings = CAMERA_DEFAULTS) {
  const player = getControlledPlayer(state);
  const base = player
    ? clampCamera(player.x + CAMERA_DEFAULTS.followAhead, player.y, settings)
    : { x: PITCH.width / 2, y: PITCH.height / 2 };
  return {
    baseX: base.x,
    baseY: base.y,
    x: base.x,
    y: base.y,
    scanX: 0,
    scanY: 0,
    scanActive: false,
  };
}

function updateBase(camera, player, settings, dt) {
  const aheadX = player.x + player.facingX * CAMERA_DEFAULTS.followAhead;
  const aheadY = player.y + player.facingY * 12;
  let targetX = camera.baseX;
  let targetY = camera.baseY;

  if (aheadX > camera.baseX + CAMERA_DEFAULTS.followDeadX) targetX = aheadX - CAMERA_DEFAULTS.followDeadX;
  else if (aheadX < camera.baseX - CAMERA_DEFAULTS.followDeadX) targetX = aheadX + CAMERA_DEFAULTS.followDeadX;
  if (aheadY > camera.baseY + CAMERA_DEFAULTS.followDeadY) targetY = aheadY - CAMERA_DEFAULTS.followDeadY;
  else if (aheadY < camera.baseY - CAMERA_DEFAULTS.followDeadY) targetY = aheadY + CAMERA_DEFAULTS.followDeadY;

  const bounded = clampCamera(targetX, targetY, settings);
  camera.baseX = smooth(camera.baseX, bounded.x, CAMERA_DEFAULTS.followResponse, dt);
  camera.baseY = smooth(camera.baseY, bounded.y, CAMERA_DEFAULTS.followResponse, dt);
}

// A footballer can scan roughly 90° to either side of the direction he is
// currently facing. Inputs behind that 180° front hemisphere are projected
// onto the nearest shoulder; a pure 180° backward request produces no scan.
export function constrainScanToFacing(player, scanX = 0, scanY = 0) {
  const raw = normalize(scanX, scanY);
  if (raw.magnitude <= 0) return raw;

  const facing = normalize(player?.facingX ?? 1, player?.facingY ?? 0);
  const forward = facing.magnitude > 0 ? facing : { x: 1, y: 0, magnitude: 1 };
  const forwardDot = raw.x * forward.x + raw.y * forward.y;
  if (forwardDot >= 0) return raw;

  const lateral = { x: -forward.y, y: forward.x };
  const lateralDot = raw.x * lateral.x + raw.y * lateral.y;
  if (Math.abs(lateralDot) < 0.0001) return { x: 0, y: 0, magnitude: 0 };

  const side = Math.sign(lateralDot);
  return {
    x: lateral.x * side,
    y: lateral.y * side,
    magnitude: raw.magnitude * Math.abs(lateralDot),
  };
}

export function updateCamera(camera, state, scanInput = {}, settings = CAMERA_DEFAULTS, dt = 1 / 60) {
  const player = getControlledPlayer(state);
  if (!player) return camera;
  const geometry = cameraGeometry(settings);
  updateBase(camera, player, settings, dt);

  const raw = constrainScanToFacing(player, scanInput.scanX, scanInput.scanY);
  const active = raw.magnitude >= CAMERA_DEFAULTS.scanDeadzone;
  const targetX = active ? raw.x * geometry.scanMaxX * raw.magnitude : 0;
  const targetY = active ? raw.y * geometry.scanMaxY * raw.magnitude : 0;
  const response = active ? CAMERA_DEFAULTS.scanResponse : CAMERA_DEFAULTS.scanReturnResponse;
  camera.scanX = smooth(camera.scanX, targetX, response, dt);
  camera.scanY = smooth(camera.scanY, targetY, response, dt);
  camera.scanActive = active;

  const bounded = clampCamera(camera.baseX + camera.scanX, camera.baseY + camera.scanY, settings);
  camera.x = bounded.x;
  camera.y = bounded.y;
  return camera;
}

export function applyCameraTransform(ctx, camera, settings = CAMERA_DEFAULTS) {
  const geometry = cameraGeometry(settings);
  ctx.translate(VIEWPORT.width / 2, VIEWPORT.height / 2);
  ctx.transform(geometry.zoom, 0, geometry.shear * geometry.zoom, geometry.yScale * geometry.zoom, 0, 0);
  ctx.translate(-camera.x, -camera.y);
}
