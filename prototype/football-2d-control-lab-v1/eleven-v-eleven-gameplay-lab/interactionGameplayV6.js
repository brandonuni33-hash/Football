import * as base from "./interactionGameplayV5.js?call-priority-v6";

export const VIEWPORT = base.VIEWPORT;
export const PITCH = base.PITCH;
export const TEAM = base.TEAM;
export const BALL_PHASE = base.BALL_PHASE;
export const RULES = base.RULES;
export const CONTROLLED_ID = base.CONTROLLED_ID;
export const INTERACTION_RULES = base.INTERACTION_RULES;
export const getControlledPlayer = base.getControlledPlayer;
export const getPlayer = base.getPlayer;
export const getOwner = base.getOwner;
export const actionLabels = base.actionLabels;
export const controlMode = base.controlMode;
export const cameraGeometry = base.cameraGeometry;
export const cameraFromBall = base.cameraFromBall;
export const isPointVisible = base.isPointVisible;
export const formationSummary = base.formationSummary;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(x, y) {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= 0.0001) return { x: 0, y: 0, magnitude: 0 };
  return { x: x / magnitude, y: y / magnitude, magnitude };
}

function callSpeed(passer, receiver) {
  return clamp(
    INTERACTION_RULES.callPassMinSpeed + distance(passer, receiver) * 0.20,
    INTERACTION_RULES.callPassMinSpeed,
    INTERACTION_RULES.callPassMaxSpeed,
  );
}

function releaseToControlled(state, passer, controlled, reason = "call_pass_priority") {
  if (!passer || !controlled || passer.team !== controlled.team) return false;
  const direction = normalize(controlled.x - passer.x, controlled.y - passer.y);
  if (!direction.magnitude) return false;

  for (const player of state.players) player.hasBall = false;
  const speed = callSpeed(passer, controlled);
  state.ball.ownerId = null;
  state.ball.phase = BALL_PHASE.PASS;
  state.ball.targetId = controlled.id;
  state.ball.lastTouchId = passer.id;
  state.ball.x = passer.x + direction.x * 26;
  state.ball.y = passer.y + direction.y * 26;
  state.ball.vx = direction.x * speed;
  state.ball.vy = direction.y * speed;
  state.ball.lobActive = false;
  state.ball.lobHeight = 0;
  state.ball.lobVz = 0;
  controlled.receptionRemaining = Math.max(controlled.receptionRemaining ?? 0, RULES.receptionWindow);
  controlled.callRemaining = Math.max(controlled.callRemaining ?? 0, RULES.callDuration);
  state.possession = { team: null, playerId: null };
  state.lastEvent = reason;
  state.eventId += 1;
  return true;
}

function prioritizeHumanCall(state, input) {
  if (!input.primaryPressed) return null;
  const controlled = getControlledPlayer(state);
  const owner = getOwner(state);
  if (!controlled || controlled.hasBall || !owner || owner.controlled || owner.team !== controlled.team) return null;
  return releaseToControlled(state, owner, controlled) ? owner.id : null;
}

function enforceHumanCallTarget(state, passerId) {
  if (!passerId) return;
  const controlled = getControlledPlayer(state);
  if (!controlled) return;

  const owner = getOwner(state);
  if (owner && owner.team === controlled.team && !owner.controlled) {
    releaseToControlled(state, owner, controlled);
    return;
  }

  if (state.ball.phase !== BALL_PHASE.PASS || state.ball.lastTouchId !== passerId) return;
  if (state.ball.targetId === controlled.id) return;

  const direction = normalize(controlled.x - state.ball.x, controlled.y - state.ball.y);
  if (!direction.magnitude) return;
  const passer = getPlayer(state, passerId);
  const speed = passer ? callSpeed(passer, controlled) : INTERACTION_RULES.callPassMinSpeed;
  const oldTarget = state.ball.targetId ? getPlayer(state, state.ball.targetId) : null;
  if (oldTarget && oldTarget.id !== controlled.id) oldTarget.receptionRemaining = 0;
  state.ball.targetId = controlled.id;
  state.ball.vx = direction.x * speed;
  state.ball.vy = direction.y * speed;
  controlled.receptionRemaining = Math.max(controlled.receptionRemaining ?? 0, RULES.receptionWindow);
  controlled.callRemaining = Math.max(controlled.callRemaining ?? 0, RULES.callDuration);
  state.lastEvent = "call_pass_priority";
}

function settleBackFourWhenNoOverlap(state, dt) {
  for (const team of [TEAM.HOME, TEAM.AWAY]) {
    const key = team === TEAM.HOME ? "home" : "away";
    const activeOverlap = state.contextualRuns?.[key]?.activeOverlapId ?? null;
    if (activeOverlap) continue;

    for (const player of state.players) {
      if (player.team !== team || player.controlled || player.hasBall) continue;
      const label = player.positionLabel ?? player.role;
      if (!["RB", "LB", "RCB", "LCB"].includes(label)) continue;
      if (player.tacticalRole !== "back-three" && player.tacticalRole !== "context-overlap") continue;
      const dy = player.originY - player.y;
      const step = Math.min(Math.abs(dy), 92 * dt);
      player.y += Math.sign(dy) * step;
      player.tacticalRole = "shape";
    }
  }
}

export function createGameplayState() {
  return base.createGameplayState();
}

export function stepGameplay(state, input = {}, dt = RULES.fixedStep) {
  const forcedPasserId = prioritizeHumanCall(state, input);
  const next = base.stepGameplay(state, input, dt);
  enforceHumanCallTarget(next, forcedPasserId);
  settleBackFourWhenNoOverlap(next, Math.min(0.05, Math.max(0, dt)));
  return next;
}
