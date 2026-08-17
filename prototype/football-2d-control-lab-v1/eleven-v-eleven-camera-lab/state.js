import { LAB_RULES, PITCH, clamp, normalize } from "./constants.js";

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
  return {
    id, number, role, team, x, y, originX: x, originY: y,
    vx: 0, vy: 0,
    facingX: team === TEAM.HOME ? 1 : -1,
    facingY: 0,
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

export function rotateFacingToward(player, targetX, targetY, dt = 1 / 60) {
  const target = normalize(targetX, targetY);
  if (target.magnitude <= 0) return player;

  const current = normalize(player.facingX, player.facingY);
  const currentAngle = current.magnitude > 0 ? Math.atan2(current.y, current.x) : Math.atan2(target.y, target.x);
  const targetAngle = Math.atan2(target.y, target.x);
  const maxTurn = LAB_RULES.bodyTurnDegreesPerSecond * Math.PI / 180 * Math.max(0, dt);
  const delta = shortestAngleDelta(currentAngle, targetAngle);
  const nextAngle = currentAngle + clamp(delta, -maxTurn, maxTurn);

  player.facingX = Math.cos(nextAngle);
  player.facingY = Math.sin(nextAngle);
  return player;
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
  if (magnitude > 0.08) {
    rotateFacingToward(player, move.x, move.y, dt);
  }

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
