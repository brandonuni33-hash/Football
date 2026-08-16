import { BALL_PHASE, FIELD, RULES, TEAM, approach, clamp, distance, movementFeelFromLevel, normalize } from "./constants.js";
import { actionLabels, assertPossessionInvariant, fieldBounds, getHumanPlayer, getOwner, getPlayer, resetAfterGoal } from "./matchState.js";
import { clearPossession, givePossession, teamDirection } from "./possession.js";
import { pressDefensiveBrake, requestCall, startPass, startProtection, startShot, startTackle } from "./actions.js";
import { collectAIInputs, executeAIAction } from "./ai.js";
import { selectRecoveryCandidate } from "./ballRecovery.js";
import { crossedGoalLine, moveGoalkeepers, resolveGoalkeeperSave } from "./goalkeepers.js";

function tickTimers(player, dt) {
  const wasProtected = player.protectionRemaining > 0;
  player.protectionRemaining = Math.max(0, player.protectionRemaining - dt);
  if (wasProtected && player.protectionRemaining === 0) player.protectionCooldown = RULES.protectionCooldown;
  player.protectionCooldown = Math.max(0, player.protectionCooldown - dt);
  player.receptionRemaining = Math.max(0, player.receptionRemaining - dt);
  player.callRemaining = Math.max(0, player.callRemaining - dt);
  player.tackleRemaining = Math.max(0, player.tackleRemaining - dt);
  player.recoveryRemaining = Math.max(0, player.recoveryRemaining - dt);
  player.defensiveBrakeRemaining = Math.max(0, (player.defensiveBrakeRemaining ?? 0) - dt);
  player.aiDecisionRemaining = Math.max(0, (player.aiDecisionRemaining ?? 0) - dt);
  player.aiPassCooldown = Math.max(0, (player.aiPassCooldown ?? 0) - dt);
  player.orientedTouchRemaining = Math.max(0, (player.orientedTouchRemaining ?? 0) - dt);
  if (player.protectionRemaining <= 0) player.offBallShieldTargetId = null;
}

function movePlayer(state, player, input, dt) {
  tickTimers(player, dt);
  if (player.recoveryRemaining > 0) input = {};
  let move = normalize(input.moveX, input.moveY);
  const offBallShielding = player.protectionRemaining > 0 && !player.hasBall && !!player.offBallShieldTargetId;
  if (offBallShielding && state.possession.team !== player.team) {
    player.protectionRemaining = 0;
    player.offBallShieldTargetId = null;
  } else if (offBallShielding) {
    const marker = getPlayer(state, player.offBallShieldTargetId);
    if (marker) {
      const desired = { x: marker.x - teamDirection(player.team) * 29, y: marker.y };
      const attach = normalize(desired.x - player.x, desired.y - player.y);
      move = attach.magnitude > 0.08 ? { ...attach, magnitude: Math.min(attach.magnitude, 0.55) } : { x: 0, y: 0, magnitude: 0 };
      player.facingX = -teamDirection(player.team);
      player.facingY = 0;
    }
  }
  const awaitingProtectedReception = state.ball.phase === BALL_PHASE.PASS && state.ball.targetId === player.id && player.protectionRemaining > 0;
  const jockeying = (!!input.jockeyHeld || (player.defensiveBrakeRemaining ?? 0) > 0)
    && !player.hasBall && !awaitingProtectedReception;
  player.jockeying = jockeying;
  const movementFeel = movementFeelFromLevel(state.gameSpeedLevel);
  let speedScale = jockeying ? RULES.jockeySpeedScale : 1;
  if (player.protectionRemaining > 0) speedScale = Math.min(speedScale, RULES.protectionSpeedScale);
  const targetVx = move.x * movementFeel.maxSpeed * move.magnitude * speedScale;
  const targetVy = move.y * movementFeel.maxSpeed * move.magnitude * speedScale;
  const acceleration = move.magnitude > 0 ? movementFeel.acceleration : movementFeel.deceleration;
  player.vx = approach(player.vx, targetVx, acceleration * dt);
  player.vy = approach(player.vy, targetVy, acceleration * dt);
  player.x = clamp(player.x + player.vx * dt, fieldBounds.minX, fieldBounds.maxX);
  player.y = clamp(player.y + player.vy * dt, fieldBounds.minY, fieldBounds.maxY);

  const owner = getOwner(state);
  if (offBallShielding && state.possession.team === player.team) {
    player.facingX = -teamDirection(player.team);
    player.facingY = 0;
  } else if (jockeying && owner) {
    const face = normalize(owner.x - player.x, owner.y - player.y);
    player.facingX = face.x;
    player.facingY = face.y;
  } else if (move.magnitude > 0.08) {
    player.facingX = move.x;
    player.facingY = move.y;
  }

  const right = normalize(input.controlX, input.controlY);
  if (right.magnitude > 0.08) {
    player.receptionIntentX = right.x;
    player.receptionIntentY = right.y;
    player.receptionIntentMagnitude = right.magnitude;
  } else if (player.receptionRemaining <= 0) {
    player.receptionIntentMagnitude = 0;
  }
  if (player.protectionRemaining > 0 && right.magnitude > 0.08) {
    player.controlX = right.x;
    player.controlY = right.y;
    player.facingX = right.x;
    player.facingY = right.y;
  } else if (player.protectionRemaining > 0) {
    player.controlX = player.facingX;
    player.controlY = player.facingY;
  } else if (player.hasBall && move.magnitude <= 0.12 && right.magnitude > 0.55) {
    player.controlX = right.x;
    player.controlY = right.y;
    state.lastEvent = "body_feint";
  }
}

function applyHumanActions(state, slot, input) {
  const player = getHumanPlayer(state, slot);
  if (!player) return;
  if (input.secondaryPressed) {
    if (player.hasBall) startPass(state, player.id, null, input);
    else pressDefensiveBrake(state, player.id);
  }
  if (input.tertiaryPressed) startProtection(state, player.id);
  if (input.primaryPressed) {
    if (player.hasBall) startShot(state, player.id, input, input.power ?? 0.72);
    else requestCall(state, player.id);
  }
}

function carryBall(state) {
  const owner = getOwner(state);
  if (!owner) return;
  const protectedControl = owner.protectionRemaining > 0;
  const orientedTouch = (owner.orientedTouchRemaining ?? 0) > 0;
  const fx = orientedTouch ? owner.orientedTouchX : protectedControl ? owner.controlX : owner.facingX;
  const fy = orientedTouch ? owner.orientedTouchY : protectedControl ? owner.controlY : owner.facingY;
  const touchRatio = orientedTouch ? owner.orientedTouchRemaining / 0.28 : 0;
  const forward = orientedTouch ? 24 + touchRatio * 24 : protectedControl ? RULES.protectionControlDistance : 24;
  state.ball.x = owner.x + fx * forward;
  state.ball.y = owner.y + fy * forward;
  state.ball.vx = owner.vx;
  state.ball.vy = owner.vy;
}

function interceptOrReceive(state) {
  if (state.ball.ownerId) return;
  const candidates = state.ball.phase === BALL_PHASE.PASS || state.ball.phase === BALL_PHASE.SHOT
    ? state.players.filter((player) => player.id !== state.ball.lastTouchId)
    : state.players;
  const receiver = selectRecoveryCandidate(candidates, state.ball);
  if (!receiver) return;
  const intended = state.ball.targetId === receiver.id;
  givePossession(state, receiver.id, intended ? "reception" : "interception");
  if (intended && (receiver.receptionIntentMagnitude ?? 0) > 0.08) {
    receiver.facingX = receiver.receptionIntentX;
    receiver.facingY = receiver.receptionIntentY;
    receiver.orientedTouchX = receiver.receptionIntentX;
    receiver.orientedTouchY = receiver.receptionIntentY;
    receiver.orientedTouchRemaining = 0.28;
    state.ball.x = receiver.x + receiver.orientedTouchX * 48;
    state.ball.y = receiver.y + receiver.orientedTouchY * 48;
    state.lastEvent = "oriented_reception";
  }
  if (receiver.protectionRemaining > 0) {
    receiver.facingX = receiver.controlX;
    receiver.facingY = receiver.controlY;
    state.lastEvent = "protected_reception";
  }
}

function stepBall(state, dt) {
  if (state.ball.ownerId) { carryBall(state); return state; }
  const previousBall = { x: state.ball.x, y: state.ball.y };
  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;
  const friction = Math.pow(state.ball.phase === BALL_PHASE.SHOT ? 0.995 : 0.989, dt * 60);
  state.ball.vx *= friction;
  state.ball.vy *= friction;

  if (resolveGoalkeeperSave(state, previousBall)) return state;
  const crossedLineFor = crossedGoalLine(previousBall, state.ball);
  if (crossedLineFor) {
    const scoringTeam = crossedLineFor === TEAM.AWAY ? TEAM.HOME : TEAM.AWAY;
    state.score[scoringTeam] += 1;
    state.lastEvent = "goal";
    state.eventId += 1;
    return resetAfterGoal(state, scoringTeam);
  }
  if (state.ball.y < FIELD.inset + 6 || state.ball.y > FIELD.height - FIELD.inset - 6) {
    state.ball.y = clamp(state.ball.y, FIELD.inset + 6, FIELD.height - FIELD.inset - 6);
    state.ball.vy *= -0.45;
  }
  if (state.ball.x < FIELD.inset + 6 || state.ball.x > FIELD.width - FIELD.inset - 6) {
    state.ball.x = clamp(state.ball.x, FIELD.inset + 6, FIELD.width - FIELD.inset - 6);
    state.ball.vx *= -0.45;
  }
  if (Math.hypot(state.ball.vx, state.ball.vy) < 8) {
    state.ball.vx = 0; state.ball.vy = 0; state.ball.phase = BALL_PHASE.FREE; state.ball.targetId = null;
  }
  interceptOrReceive(state);
  return state;
}

function resolveLooseChallenges(state) {
  if (state.ball.ownerId) return;
  const candidates = state.ball.phase === BALL_PHASE.PASS || state.ball.phase === BALL_PHASE.SHOT
    ? state.players.filter((player) => player.id !== state.ball.lastTouchId)
    : state.players;
  const winner = selectRecoveryCandidate(candidates, state.ball);
  if (winner) givePossession(state, winner.id, "loose_ball_won");
}

export function stepMatch(state, inputs = {}, dt = RULES.fixedStep) {
  const time = clamp(dt, 0, 0.05);
  state.tick += 1;
  state.elapsed += time;
  applyHumanActions(state, "host", inputs.host ?? {});
  applyHumanActions(state, "guest", inputs.guest ?? {});
  const aiInputs = collectAIInputs(state);
  const allInputs = { ...aiInputs, "home-human": inputs.host ?? {}, "away-human": inputs.guest ?? aiInputs["away-human"] ?? {} };
  for (const player of state.players) {
    const input = allInputs[player.id] ?? {};
    movePlayer(state, player, input, time);
    if (!player.humanSlot) executeAIAction(state, player, input);
  }
  moveGoalkeepers(state, time);
  const next = stepBall(state, time);
  resolveLooseChallenges(next);
  if (!assertPossessionInvariant(next)) throw new Error("invalid-possession-invariant");
  return next;
}

export { actionLabels, clearPossession, givePossession };
