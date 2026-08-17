import { BALL_PHASE, FIELD, RULES, TEAM, approach, clamp, distance, movementFeelFromLevel, normalize } from "./constants.js";
import { actionLabels, assertPossessionInvariant, fieldBounds, getHumanPlayer, getOwner, getPlayer, resetAfterGoal } from "./matchState.js";
import { clearPossession, givePossession, teamDirection } from "./possession.js";
import { pressDefensiveBrake, requestCall, startPass, startProtection, startShot, startTackle } from "./actions.js";
import { collectAIInputs, executeAIAction } from "./ai.js";
import { selectRecoveryCandidate } from "./ballRecovery.js";
import { crossedGoalLine, moveGoalkeepers, resolveGoalkeeperSave } from "./goalkeepers.js";
import { footworkAccelerationScale, reactToBodyFeint, tickFootwork, updateSupportState } from "./footwork.js";

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
  player.deepBrakeRemaining = Math.max(0, (player.deepBrakeRemaining ?? 0) - dt);
  player.recentBallLossRemaining = Math.max(0, (player.recentBallLossRemaining ?? 0) - dt);
  player.aiDecisionRemaining = Math.max(0, (player.aiDecisionRemaining ?? 0) - dt);
  player.aiPassCooldown = Math.max(0, (player.aiPassCooldown ?? 0) - dt);
  player.aiCallCooldown = Math.max(0, (player.aiCallCooldown ?? 0) - dt);
  player.orientedTouchRemaining = Math.max(0, (player.orientedTouchRemaining ?? 0) - dt);
  player.dribbleTouchRemaining = Math.max(0, (player.dribbleTouchRemaining ?? 0) - dt);
  if (player.protectionRemaining <= 0) player.offBallShieldTargetId = null;
  tickFootwork(player, dt);
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
  const awaitingPass = state.ball.phase === BALL_PHASE.PASS && state.ball.targetId === player.id;
  const awaitingProtectedReception = awaitingPass && player.protectionRemaining > 0;
  const jockeying = (!!input.jockeyHeld || (player.defensiveBrakeRemaining ?? 0) > 0)
    && !player.hasBall && !awaitingProtectedReception;
  player.jockeying = jockeying;
  updateSupportState(player, move);
  const movementFeel = movementFeelFromLevel(state.gameSpeedLevel);
  let speedScale = jockeying
    ? ((player.deepBrakeRemaining ?? 0) > 0 ? RULES.deepJockeySpeedScale : RULES.jockeySpeedScale)
    : 1;
  if (player.humanSlot && !input.rapidHeld) speedScale = Math.min(speedScale, RULES.normalPaceScale);
  if (!player.humanSlot && input.catchUp) speedScale = Math.max(speedScale, RULES.aiCatchUpSpeedScale);
  if (player.protectionRemaining > 0) speedScale = Math.min(speedScale, RULES.protectionSpeedScale);
  const targetVx = move.x * movementFeel.maxSpeed * move.magnitude * speedScale;
  const targetVy = move.y * movementFeel.maxSpeed * move.magnitude * speedScale;
  const acceleration = (move.magnitude > 0 ? movementFeel.acceleration : movementFeel.deceleration)
    * footworkAccelerationScale(player, move);
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
  } else if (player.receptionRemaining <= 0 && !awaitingPass) {
    player.receptionIntentMagnitude = 0;
  }

  if (awaitingPass && right.magnitude > 0.08) {
    player.controlX = right.x;
    player.controlY = right.y;
    player.facingX = right.x;
    player.facingY = right.y;
  } else if (player.protectionRemaining > 0 && right.magnitude > 0.08) {
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
    reactToBodyFeint(state, player, right);
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

function carryBall(state, dt) {
  const owner = getOwner(state);
  if (!owner) return;
  const protectedControl = owner.protectionRemaining > 0;
  const orientedTouch = (owner.orientedTouchRemaining ?? 0) > 0;
  const fx = orientedTouch ? owner.orientedTouchX : protectedControl ? owner.controlX : owner.facingX;
  const fy = orientedTouch ? owner.orientedTouchY : protectedControl ? owner.controlY : owner.facingY;
  const orientedDuration = Math.max(0.01, owner.orientedTouchDuration ?? RULES.orientedTouchShortDuration);
  const touchRatio = orientedTouch ? clamp(owner.orientedTouchRemaining / orientedDuration, 0, 1) : 0;
  const orientedDistance = owner.orientedTouchDistance ?? RULES.orientedTouchShortDistance;
  const forward = orientedTouch
    ? RULES.dribbleControlDistance + (orientedDistance - RULES.dribbleControlDistance) * touchRatio
    : protectedControl ? RULES.protectionControlDistance : RULES.dribbleControlDistance;
  if (protectedControl || orientedTouch) {
    state.ball.x = owner.x + fx * forward;
    state.ball.y = owner.y + fy * forward;
    state.ball.vx = owner.vx;
    state.ball.vy = owner.vy;
    return;
  }
  const speed = Math.hypot(owner.vx, owner.vy);
  const desired = { x: owner.x + fx * forward, y: owner.y + fy * forward };
  if (speed < 10) {
    state.ball.x = approach(state.ball.x, desired.x, 290 * dt);
    state.ball.y = approach(state.ball.y, desired.y, 290 * dt);
    state.ball.vx = owner.vx;
    state.ball.vy = owner.vy;
    return;
  }
  const gap = distance(owner, state.ball);
  if (gap > RULES.controlRadius + 11) {
    state.lastTechnicalError = { team: owner.team, playerId: owner.id, at: state.elapsed, type: "heavy_touch" };
    clearPossession(state, BALL_PHASE.FREE);
    state.ball.lastTouchId = owner.id;
    state.lastEvent = "heavy_touch";
    state.eventId += 1;
    return;
  }
  if ((owner.dribbleTouchRemaining ?? 0) <= 0 || gap < 16) {
    const freeTouchSpeed = RULES.dribbleTouchBaseSpeed + speed * RULES.dribbleTouchSpeedRatio;
    const guidedRatio = 1 - RULES.dribbleFreedom;
    state.ball.vx = owner.vx + fx * freeTouchSpeed * RULES.dribbleFreedom + (desired.x - state.ball.x) * guidedRatio * 2.4;
    state.ball.vy = owner.vy + fy * freeTouchSpeed * RULES.dribbleFreedom + (desired.y - state.ball.y) * guidedRatio * 2.4;
    owner.dribbleTouchRemaining = RULES.dribbleTouchInterval + (100 - (owner.ballControl ?? 65)) * 0.0005;
  }
  const freeX = state.ball.x + state.ball.vx * dt;
  const freeY = state.ball.y + state.ball.vy * dt;
  const guidedX = approach(freeX, desired.x, RULES.dribbleGuideSpeed * dt);
  const guidedY = approach(freeY, desired.y, RULES.dribbleGuideSpeed * dt);
  state.ball.x = freeX * RULES.dribbleFreedom + guidedX * (1 - RULES.dribbleFreedom);
  state.ball.y = freeY * RULES.dribbleFreedom + guidedY * (1 - RULES.dribbleFreedom);
  const touchFriction = Math.pow(0.985, dt * 60);
  state.ball.vx *= touchFriction;
  state.ball.vy *= touchFriction;
}

function orientedReceptionProfile(magnitude) {
  if (magnitude < 0.42) return {
    distance: RULES.orientedTouchShortDistance,
    duration: RULES.orientedTouchShortDuration,
    bodySpeed: 24,
    bodyNudge: 2.5,
  };
  if (magnitude < 0.76) return {
    distance: RULES.orientedTouchMediumDistance,
    duration: RULES.orientedTouchMediumDuration,
    bodySpeed: 39,
    bodyNudge: 4.5,
  };
  return {
    distance: RULES.orientedTouchLongDistance,
    duration: RULES.orientedTouchLongDuration,
    bodySpeed: 58,
    bodyNudge: 6.5,
  };
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
    const magnitude = receiver.receptionIntentMagnitude;
    const profile = orientedReceptionProfile(magnitude);
    receiver.facingX = receiver.receptionIntentX;
    receiver.facingY = receiver.receptionIntentY;
    receiver.orientedTouchX = receiver.receptionIntentX;
    receiver.orientedTouchY = receiver.receptionIntentY;
    receiver.orientedTouchDistance = profile.distance;
    receiver.orientedTouchDuration = profile.duration;
    receiver.orientedTouchRemaining = profile.duration;
    receiver.vx = receiver.vx * 0.45 + receiver.orientedTouchX * profile.bodySpeed;
    receiver.vy = receiver.vy * 0.45 + receiver.orientedTouchY * profile.bodySpeed;
    receiver.x = clamp(receiver.x + receiver.orientedTouchX * profile.bodyNudge, fieldBounds.minX, fieldBounds.maxX);
    receiver.y = clamp(receiver.y + receiver.orientedTouchY * profile.bodyNudge, fieldBounds.minY, fieldBounds.maxY);
    state.ball.x = receiver.x + receiver.orientedTouchX * profile.distance;
    state.ball.y = receiver.y + receiver.orientedTouchY * profile.distance;
    state.lastEvent = "oriented_reception";
  }
  if (receiver.protectionRemaining > 0) {
    receiver.facingX = receiver.controlX;
    receiver.facingY = receiver.controlY;
    state.lastEvent = "protected_reception";
  }
}

function maybeFlagImprecisePass(state) {
  if (state.ball.phase !== BALL_PHASE.PASS || state.ball.imprecisionFlagged || !state.ball.targetId) return;
  const target = getPlayer(state, state.ball.targetId);
  if (!target) return;
  const toTargetX = target.x - state.ball.x;
  const toTargetY = target.y - state.ball.y;
  const range = Math.hypot(toTargetX, toTargetY);
  if (range > RULES.imprecisePassCheckRange) return;
  const velocity = normalize(state.ball.vx, state.ball.vy);
  if (velocity.magnitude <= 0.05) return;
  const crossTrack = Math.abs(velocity.x * toTargetY - velocity.y * toTargetX);
  if (crossTrack < RULES.imprecisePassCrossTrack) return;
  state.ball.imprecisionFlagged = true;
  state.lastTechnicalError = { team: target.team, playerId: target.id, at: state.elapsed, type: "imprecise_pass" };
}

function stepBall(state, dt) {
  if (state.ball.ownerId) { carryBall(state, dt); return state; }
  const previousBall = { x: state.ball.x, y: state.ball.y };
  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;
  const friction = Math.pow(state.ball.phase === BALL_PHASE.SHOT ? 0.995 : 0.989, dt * 60);
  state.ball.vx *= friction;
  state.ball.vy *= friction;

  maybeFlagImprecisePass(state);
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
  state.aiTeamCallCooldown ??= { home: 0, away: 0 };
  state.aiTeamCallCooldown.home = Math.max(0, (state.aiTeamCallCooldown.home ?? 0) - time);
  state.aiTeamCallCooldown.away = Math.max(0, (state.aiTeamCallCooldown.away ?? 0) - time);
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
