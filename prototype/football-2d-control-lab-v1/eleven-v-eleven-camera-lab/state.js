import { CAMERA_DEFAULTS, LAB_RULES, PITCH, clamp, normalize } from "./constants.js";

export const TEAM = Object.freeze({ HOME: "home", AWAY: "away" });
export const CONTROLLED_ID = "home-8";

const HOME_FORMATION = [
  ["home-1", 1, "GK", 126, 544],
  ["home-2", 2, "RB", 350, 170],
  ["home-4", 4, "RCB", 350, 420],
  ["home-5", 5, "LCB", 350, 668],
  ["home-3", 3, "LB", 350, 918],
  ["home-6", 6, "DM", 610, 300],
  ["home-8", 8, "CM", 650, 544],
  ["home-10", 10, "AM", 610, 788],
  ["home-7", 7, "RW", 920, 245],
  ["home-9", 9, "ST", 965, 544],
  ["home-11", 11, "LW", 920, 843],
];

function mirror(entry) {
  const [id, number, role, x, y] = entry;
  return [id.replace("home", "away"), number, role, PITCH.width - x, PITCH.height - y];
}

function playerFrom(entry, team) {
  const [id, number, role, x, y] = entry;
  const facingX = team === TEAM.HOME ? 1 : -1;
  return {
    id, number, role, team, x, y, originX: x, originY: y,
    vx: 0, vy: 0,
    // facing = torso/body orientation; headFacing = gaze/head orientation.
    facingX,
    facingY: 0,
    headFacingX: facingX,
    headFacingY: 0,
    controlled: id === CONTROLLED_ID,
  };
}

export function createLabState() {
  const home = HOME_FORMATION.map((entry) => playerFrom(entry, TEAM.HOME));
  const away = HOME_FORMATION.map(mirror).map((entry) => playerFrom(entry, TEAM.AWAY));
  const players = [...home, ...away];
  const controlled = players.find((player) => player.id === CONTROLLED_ID);
  return {
    elapsed: 0,
    players,
    controlledId: CONTROLLED_ID,
    ball: {
      x: controlled.x + LAB_RULES.ballOffset,
      y: controlled.y,
    },
  };
}

export function getControlledPlayer(state) {
  return state.players.find((player) => player.id === state.controlledId) ?? null;
}

function shortestAngleDelta(from, to) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function rotateVectorToward(currentX, currentY, targetX, targetY, degreesPerSecond, dt) {
  const target = normalize(targetX, targetY);
  if (target.magnitude <= 0) return normalize(currentX, currentY);
  const current = normalize(currentX, currentY);
  const currentAngle = current.magnitude > 0 ? Math.atan2(current.y, current.x) : Math.atan2(target.y, target.x);
  const targetAngle = Math.atan2(target.y, target.x);
  const maxTurn = degreesPerSecond * Math.PI / 180 * Math.max(0, dt);
  const delta = shortestAngleDelta(currentAngle, targetAngle);
  const nextAngle = currentAngle + clamp(delta, -maxTurn, maxTurn);
  return { x: Math.cos(nextAngle), y: Math.sin(nextAngle), magnitude: 1 };
}

export function rotateFacingToward(player, targetX, targetY, dt = 1 / 60) {
  const next = rotateVectorToward(
    player.facingX,
    player.facingY,
    targetX,
    targetY,
    LAB_RULES.bodyTurnDegreesPerSecond,
    dt,
  );
  if (next.magnitude > 0) {
    player.facingX = next.x;
    player.facingY = next.y;
  }
  return player;
}

function clampHeadToBody(player) {
  const body = normalize(player.facingX, player.facingY);
  const head = normalize(player.headFacingX, player.headFacingY);
  if (body.magnitude <= 0 || head.magnitude <= 0) return player;

  const bodyAngle = Math.atan2(body.y, body.x);
  const headAngle = Math.atan2(head.y, head.x);
  const halfRange = (CAMERA_DEFAULTS.headScanDegrees / 2) * Math.PI / 180;
  const relative = clamp(shortestAngleDelta(bodyAngle, headAngle), -halfRange, halfRange);
  const limited = bodyAngle + relative;
  player.headFacingX = Math.cos(limited);
  player.headFacingY = Math.sin(limited);
  return player;
}

export function rotateHeadToward(player, targetX, targetY, dt = 1 / 60, returning = false) {
  const speed = returning ? LAB_RULES.headReturnDegreesPerSecond : LAB_RULES.headTurnDegreesPerSecond;
  const next = rotateVectorToward(
    player.headFacingX,
    player.headFacingY,
    targetX,
    targetY,
    speed,
    dt,
  );
  if (next.magnitude > 0) {
    player.headFacingX = next.x;
    player.headFacingY = next.y;
  }
  return clampHeadToBody(player);
}

export function stepLabState(state, input = {}, dt = 1 / 60) {
  const player = getControlledPlayer(state);
  if (!player) return state;
  state.elapsed += Math.max(0, dt);

  const move = normalize(input.moveX, input.moveY);
  const magnitude = move.magnitude < LAB_RULES.movementDeadzone ? 0 : move.magnitude;
  player.vx = move.x * LAB_RULES.controlledSpeed * magnitude;
  player.vy = move.y * LAB_RULES.controlledSpeed * magnitude;
  player.x = clamp(player.x + player.vx * dt, PITCH.inset + 24, PITCH.width - PITCH.inset - 24);
  player.y = clamp(player.y + player.vy * dt, PITCH.inset + 24, PITCH.height - PITCH.inset - 24);

  if (magnitude > 0.08) rotateFacingToward(player, move.x, move.y, dt);

  const scan = normalize(input.scanX, input.scanY);
  const scanning = scan.magnitude >= CAMERA_DEFAULTS.scanDeadzone;
  if (scanning) rotateHeadToward(player, scan.x, scan.y, dt, false);
  else rotateHeadToward(player, player.facingX, player.facingY, dt, true);

  // The other 21 players remain formation markers with only a tiny idle drift.
  // This lab is intentionally about scale/camera, not 11v11 gameplay AI.
  for (const other of state.players) {
    if (other.id === player.id) continue;
    const phase = state.elapsed * 0.35 + other.number * 0.63 + (other.team === TEAM.AWAY ? 1.7 : 0);
    other.x = other.originX + Math.sin(phase) * 4;
    other.y = other.originY + Math.cos(phase * 0.83) * 3;
  }

  state.ball.x = player.x + player.facingX * LAB_RULES.ballOffset;
  state.ball.y = player.y + player.facingY * LAB_RULES.ballOffset;
  return state;
}
