import { CAMERA_DEFAULTS, PITCH, VIEWPORT, clamp, normalize } from "./constants.js";
import { getControlledPlayer } from "./state.js";

export function cameraGeometry(settings = CAMERA_DEFAULTS) {
  const zoom = clamp(Number(settings.zoom ?? CAMERA_DEFAULTS.zoom), 1.1, 1.8);
  const angle = clamp(Number(settings.angle ?? CAMERA_DEFAULTS.angle), 0, 60);
  const scan = clamp(Number(settings.scan ?? CAMERA_DEFAULTS.scan), 0, 100);
  const yScale = 0.95 - angle * 0.0028;
  const shear = -(0.018 + angle * 0.00145);
  return { zoom, angle, scan, yScale, shear };
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

function ballCameraTarget(state, settings) {
  const ball = state?.ball;
  if (!ball) return { x: PITCH.width / 2, y: PITCH.height / 2 };
  return clampCamera(ball.x, ball.y, settings);
}

export function createCameraState(state, settings = CAMERA_DEFAULTS) {
  const player = getControlledPlayer(state);
  const base = ballCameraTarget(state, settings);
  const head = normalize(
    player?.headFacingX ?? player?.facingX ?? 1,
    player?.headFacingY ?? player?.facingY ?? 0,
  );
  const gaze = head.magnitude > 0 ? head : { x: 1, y: 0 };
  return {
    baseX: base.x,
    baseY: base.y,
    x: base.x,
    y: base.y,
    scanX: 0,
    scanY: 0,
    scanActive: false,
    gazeX: gaze.x,
    gazeY: gaze.y,
  };
}

// Head scan is limited to 260° total: roughly 130° to either side of the
// player's torso. The actual head rotation now lives on the player state; this
// helper remains the deterministic angular limiter used by tests and input.
export function constrainScanToFacing(player, scanX = 0, scanY = 0) {
  const raw = normalize(scanX, scanY);
  if (raw.magnitude <= 0) return raw;

  const facing = normalize(player?.facingX ?? 1, player?.facingY ?? 0);
  const forward = facing.magnitude > 0 ? facing : { x: 1, y: 0, magnitude: 1 };
  const dot = clamp(raw.x * forward.x + raw.y * forward.y, -1, 1);
  const cross = forward.x * raw.y - forward.y * raw.x;
  let signedAngle = Math.atan2(cross, dot);
  const halfRange = (CAMERA_DEFAULTS.headScanDegrees / 2) * Math.PI / 180;
  signedAngle = clamp(signedAngle, -halfRange, halfRange);

  const cos = Math.cos(signedAngle);
  const sin = Math.sin(signedAngle);
  return {
    x: forward.x * cos - forward.y * sin,
    y: forward.x * sin + forward.y * cos,
    magnitude: raw.magnitude,
  };
}

export function isPointInVision(player, gaze, point, degrees = CAMERA_DEFAULTS.visionDegrees) {
  if (!player || !point) return false;
  const toPoint = normalize(point.x - player.x, point.y - player.y);
  if (toPoint.magnitude <= 0) return true;
  const normalizedGaze = normalize(
    gaze?.x ?? player.headFacingX ?? player.facingX ?? 1,
    gaze?.y ?? player.headFacingY ?? player.facingY ?? 0,
  );
  const direction = normalizedGaze.magnitude > 0 ? normalizedGaze : { x: 1, y: 0 };
  const threshold = Math.cos((clamp(degrees, 1, 359) / 2) * Math.PI / 180);
  return toPoint.x * direction.x + toPoint.y * direction.y >= threshold - 0.0001;
}

export function updateCamera(camera, state, scanInput = {}, settings = CAMERA_DEFAULTS) {
  const player = getControlledPlayer(state);
  if (!player) return camera;

  // The ball is the camera anchor. Head scanning changes information, not the
  // camera position, so the framing never drifts away from play.
  const base = ballCameraTarget(state, settings);
  camera.baseX = base.x;
  camera.baseY = base.y;
  camera.x = base.x;
  camera.y = base.y;
  camera.scanX = 0;
  camera.scanY = 0;

  const head = normalize(player.headFacingX, player.headFacingY);
  const fallback = normalize(player.facingX, player.facingY);
  const gaze = head.magnitude > 0 ? head : fallback.magnitude > 0 ? fallback : { x: 1, y: 0 };
  camera.gazeX = gaze.x;
  camera.gazeY = gaze.y;
  camera.scanActive = normalize(scanInput.scanX, scanInput.scanY).magnitude >= CAMERA_DEFAULTS.scanDeadzone;
  return camera;
}

export function applyCameraTransform(ctx, camera, settings = CAMERA_DEFAULTS) {
  const geometry = cameraGeometry(settings);
  ctx.translate(VIEWPORT.width / 2, VIEWPORT.height / 2);
  ctx.transform(geometry.zoom, 0, geometry.shear * geometry.zoom, geometry.yScale * geometry.zoom, 0, 0);
  ctx.translate(-camera.x, -camera.y);
}
