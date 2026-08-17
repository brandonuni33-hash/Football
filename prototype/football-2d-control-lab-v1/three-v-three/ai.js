import { FIELD, RULES, clamp, distance, normalize } from "./constants.js";
import { getOwner } from "./matchState.js";
import { ATTACK_ROLE, DEFEND_ROLE, buildTeamPlan, evaluatePassingLane, tacticalRole } from "./teamBrain.js";
import { carrierMoveIntent, chooseCarrierIntent, evaluateTackle } from "./utilityAI.js";
import { startPass, startProtection, startShot, startTackle } from "./actions.js";
import { teamDirection } from "./possession.js";

export const DEFENSE_PHASE = Object.freeze({ RETREAT: "retreat", CONTAIN: "contain", PRESS: "press" });

function moveToward(player, target, scale = 0.72) {
  const direction = normalize(target.x - player.x, target.y - player.y);
  return { moveX: direction.x * scale, moveY: direction.y * scale };
}

function preserveTeamSpacing(state, player, intent) {
  let pushX = 0;
  let pushY = 0;
  for (const teammate of state.players.filter((entry) => entry.team === player.team && entry.id !== player.id)) {
    const gap = distance(player, teammate);
    if (gap >= 92 || gap < 0.001) continue;
    const away = normalize(player.x - teammate.x, player.y - teammate.y);
    const weight = (92 - gap) / 92;
    pushX += away.x * weight * 0.72;
    pushY += away.y * weight * 0.72;
  }
  return { ...intent, moveX: clamp((intent.moveX ?? 0) + pushX, -1, 1), moveY: clamp((intent.moveY ?? 0) + pushY, -1, 1) };
}

function fallbackShape(player) {
  const lane = player.id.endsWith("left") ? 155 : player.id.endsWith("right") ? 385 : FIELD.height / 2;
  const x = player.team === "home" ? 285 : FIELD.width - 285;
  return { x, y: lane };
}

export function looseBallRole(state, player) {
  if (state.ball.ownerId !== null) return "shape";
  const teammates = state.players.filter((entry) => entry.team === player.team && !entry.humanSlot);
  const ranked = teammates
    .map((entry) => ({ entry, d: distance(entry, state.ball) }))
    .sort((a, b) => a.d - b.d);
  return ranked[0]?.entry.id === player.id ? "recover" : "support";
}

function looseBallIntent(state, player) {
  if (looseBallRole(state, player) === "recover") return moveToward(player, state.ball, 0.82);
  const direction = teamDirection(player.team);
  const shape = fallbackShape(player);
  return moveToward(player, {
    x: state.ball.x - direction * 92,
    y: shape.y * 0.72 + state.ball.y * 0.28,
  }, 0.46);
}

export function attackingRole(state, player) {
  const role = tacticalRole(state, player);
  return [ATTACK_ROLE.SUPPORT, ATTACK_ROLE.DEPTH].includes(role) ? role : "shape";
}

export function defensiveRole(state, player) {
  const role = tacticalRole(state, player);
  if (role === DEFEND_ROLE.PRESSURE) return "press";
  if (role === DEFEND_ROLE.COVER && isRareTrap(state, player)) return "trap";
  return role === DEFEND_ROLE.COVER ? "cover" : role === DEFEND_ROLE.BALANCE ? "screen" : "shape";
}

function isRareTrap(state, player) {
  const owner = getOwner(state);
  if (!owner || owner.team === player.team) return false;
  const ownGoalX = player.team === "home" ? FIELD.inset : FIELD.width - FIELD.inset;
  return (owner.y < 92 || owner.y > FIELD.height - 92) && Math.abs(owner.x - ownGoalX) <= 260;
}

export function canUseDefensiveBrake(state, player, owner = getOwner(state)) {
  if (!owner || owner.team === player.team || player.hasBall) return false;
  const gap = distance(player, owner);
  const goalSideDepth = (player.x - owner.x) * teamDirection(owner.team);
  const lateralGap = Math.abs(player.y - owner.y);
  return gap <= 155 && goalSideDepth >= 6 && lateralGap <= Math.min(96, gap * 0.82 + 16);
}

function nearestOpponentGap(state, player) {
  return Math.min(...state.players.filter((entry) => entry.team !== player.team).map((entry) => distance(entry, player)));
}

function aiCallOpportunity(state, player, owner, plan) {
  if (!owner || owner.team !== player.team || player.id === owner.id || player.humanSlot) return null;
  if ((player.aiCallCooldown ?? 0) > 0 || player.callRemaining > 0 || player.recoveryRemaining > 0) return null;
  const lane = evaluatePassingLane(state, owner, player);
  if (lane.blocked || lane.receiverSpace < RULES.aiCallMinReceiverSpace || lane.score < RULES.aiCallMinLaneScore || lane.range > 430) return null;

  const role = plan.assignments.get(player.id);
  const ownerPressure = nearestOpponentGap(state, owner);
  const transition = (state.elapsed - (state.possessionChangedAt ?? -10)) <= 0.85;
  const fixation = ownerPressure <= 82;
  const switchLane = Math.abs(player.y - owner.y) >= 105 && lane.nearestClearance >= 45;
  const corridorOpen = lane.progress >= 42 && lane.receiverSpace >= 62 && lane.nearestClearance >= 46;
  if (!transition && !fixation && !switchLane && !corridorOpen) return null;

  const contextBonus = (transition ? 12 : 0) + (fixation ? 14 : 0) + (switchLane ? 11 : 0) + (corridorOpen ? 15 : 0);
  const roleBonus = role === ATTACK_ROLE.DEPTH ? 8 : role === ATTACK_ROLE.SUPPORT ? 3 : 0;
  const score = lane.score + contextBonus + roleBonus;
  const reason = fixation ? "fixation" : transition ? "transition" : switchLane ? "decalage" : "couloir";
  return score >= 54 ? { player, score, reason } : null;
}

function updateAICalls(state, team, plan) {
  const owner = getOwner(state);
  if (!owner || owner.team !== team) return;
  state.aiTeamCallCooldown ??= { home: 0, away: 0 };
  if ((state.aiTeamCallCooldown[team] ?? 0) > 0) return;
  const aiOffBall = state.players.filter((entry) => entry.team === team && !entry.humanSlot && entry.id !== owner.id);
  if (aiOffBall.some((entry) => entry.callRemaining > 0)) return;
  const best = aiOffBall
    .map((player) => aiCallOpportunity(state, player, owner, plan))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)[0];
  if (!best) return;
  best.player.callRemaining = RULES.aiCallDuration;
  best.player.aiCallCooldown = RULES.aiCallCooldown;
  best.player.aiCallReason = best.reason;
  state.aiTeamCallCooldown[team] = RULES.aiTeamCallCooldown;
}

function carrierIntent(state, player) {
  const choice = chooseCarrierIntent(state, player);
  if (choice.type === "pass") return { passPressed: true, targetId: choice.targetId };
  if (choice.type === "shoot") return { moveX: teamDirection(player.team) * 0.25, moveY: 0, shootPressed: true };
  return { ...carrierMoveIntent(state, player, choice), protectPressed: choice.type === "protect" };
}

function attackIntent(state, player, plan) {
  const owner = getOwner(state);
  if (!owner) return looseBallIntent(state, player);
  if (player.hasBall) return carrierIntent(state, player);
  const target = plan.targets.get(player.id) ?? fallbackShape(player);
  const role = plan.assignments.get(player.id);
  return moveToward(player, target, role === ATTACK_ROLE.DEPTH ? 0.68 : 0.57);
}

function goalSideDepth(player, owner) {
  return (player.x - owner.x) * teamDirection(owner.team);
}

function ownerInOwnHalf(owner) {
  const direction = teamDirection(owner.team);
  return direction > 0 ? owner.x < FIELD.width / 2 : owner.x > FIELD.width / 2;
}

function isTechnicalPressTrigger(trigger) {
  return trigger === "heavy_touch" || trigger === "imprecise_pass";
}

function defenseShape(state, team, owner) {
  const defenders = state.players.filter((entry) => entry.team === team);
  const depths = defenders.map((player) => goalSideDepth(player, owner));
  const goalSideCount = depths.filter((depth) => depth >= 12).length;
  const deeplyBeaten = depths.filter((depth) => depth < -46).length;
  const xValues = defenders.map((entry) => entry.x);
  const compactDepth = Math.max(...xValues) - Math.min(...xValues);
  return { defenders, depths, goalSideCount, deeplyBeaten, compactDepth };
}

function ensureDefenseState(state, team) {
  state.aiDefense ??= {};
  state.aiDefense[team] ??= { phase: DEFENSE_PHASE.CONTAIN, pressUntil: 0, cooldownUntil: 0, lastTrigger: null, lastTechnicalErrorAt: -10 };
  return state.aiDefense[team];
}

function startPress(state, team, trigger, duration, highPress = false) {
  const phase = ensureDefenseState(state, team);
  const durationCap = highPress ? RULES.aiHighPressMaxDuration : RULES.aiPressMaxDuration;
  const safeDuration = Math.min(durationCap, duration);
  phase.phase = DEFENSE_PHASE.PRESS;
  phase.pressUntil = state.elapsed + safeDuration;
  phase.cooldownUntil = phase.pressUntil + (highPress ? RULES.aiHighPressCooldown : RULES.aiPressCooldown);
  phase.lastTrigger = trigger;
  return DEFENSE_PHASE.PRESS;
}

export function defensiveTeamPhase(state, team, owner = getOwner(state)) {
  const phase = ensureDefenseState(state, team);
  if (!owner || owner.team === team) {
    phase.phase = DEFENSE_PHASE.CONTAIN;
    phase.pressUntil = 0;
    return phase.phase;
  }

  const shape = defenseShape(state, team, owner);
  const highPressZone = ownerInOwnHalf(owner);
  const shapeBroken = shape.goalSideCount < 2 || shape.deeplyBeaten >= 2;
  if (shapeBroken) {
    phase.phase = DEFENSE_PHASE.RETREAT;
    if (phase.pressUntil > state.elapsed) {
      phase.pressUntil = 0;
      phase.cooldownUntil = Math.max(phase.cooldownUntil, state.elapsed + 2.2);
    }
    return phase.phase;
  }

  if (phase.pressUntil > state.elapsed) {
    if (highPressZone && !isTechnicalPressTrigger(phase.lastTrigger)) {
      phase.phase = DEFENSE_PHASE.CONTAIN;
      phase.pressUntil = 0;
      phase.cooldownUntil = Math.max(phase.cooldownUntil, state.elapsed + RULES.aiHighPressCooldown);
      return phase.phase;
    }
    if (highPressZone) phase.pressUntil = Math.min(phase.pressUntil, state.elapsed + RULES.aiHighPressMaxDuration);
    phase.phase = DEFENSE_PHASE.PRESS;
    return phase.phase;
  }

  phase.phase = DEFENSE_PHASE.CONTAIN;
  if (phase.cooldownUntil > state.elapsed) return phase.phase;

  const technical = state.lastTechnicalError;
  if (technical && technical.team === owner.team
    && state.elapsed - technical.at <= RULES.aiPressTriggerWindow
    && technical.at > (phase.lastTechnicalErrorAt ?? -10)) {
    phase.lastTechnicalErrorAt = technical.at;
    if (highPressZone) {
      const nearest = Math.min(...shape.defenders.map((player) => distance(player, owner)));
      const highOpportunity = nearest <= RULES.aiHighPressDefenderRange
        && shape.compactDepth <= RULES.aiHighPressCompactDepth
        && shape.goalSideCount >= 2;
      if (highOpportunity) return startPress(state, team, technical.type, RULES.aiHighPressMaxDuration, true);
      return phase.phase;
    }
    return startPress(state, team, technical.type, RULES.aiPressTechnicalDuration);
  }

  // Dans la moitié du porteur, le pressing haut reste exceptionnel :
  // pas de contre-pressing automatique ni de piège de ligne sans erreur technique.
  if (highPressZone) return phase.phase;

  const loss = state.lastPossessionLoss;
  if (loss?.team === team && state.elapsed - loss.at <= 0.65 && shape.compactDepth <= 220) {
    return startPress(state, team, "counterpress", RULES.aiPressCounterDuration);
  }

  const nearest = Math.min(...shape.defenders.map((player) => distance(player, owner)));
  const sideTrap = (owner.y <= 92 || owner.y >= FIELD.height - 92)
    && nearest >= 48 && nearest <= 125 && shape.compactDepth <= 210;
  if (sideTrap) return startPress(state, team, "sideline_trap", RULES.aiPressTrapDuration);

  return phase.phase;
}

function recoverySprintIntent(state, player, owner, depth = goalSideDepth(player, owner)) {
  const recoveryX = clamp(
    owner.x + teamDirection(owner.team) * RULES.aiRetreatDistance,
    FIELD.inset + 48,
    FIELD.width - FIELD.inset - 48,
  );
  const target = {
    x: recoveryX,
    y: clamp(owner.y * 0.62 + fallbackShape(player).y * 0.38, 72, FIELD.height - 72),
  };
  const scale = depth < -55 ? 1 : 0.9;
  return { ...moveToward(player, target, scale), catchUp: true };
}

function retreatIntent(state, player, owner, plan) {
  const depth = goalSideDepth(player, owner);
  if (depth < RULES.aiCatchUpDepthTrigger) return recoverySprintIntent(state, player, owner, depth);
  const role = plan.assignments.get(player.id);
  const depthMultiplier = role === DEFEND_ROLE.BALANCE ? 1.55 : role === DEFEND_ROLE.COVER ? 1.28 : 1;
  const target = {
    x: clamp(owner.x + teamDirection(owner.team) * RULES.aiRetreatDistance * depthMultiplier, FIELD.inset + 48, FIELD.width - FIELD.inset - 48),
    y: clamp(owner.y * 0.48 + fallbackShape(player).y * 0.52, 72, FIELD.height - 72),
  };
  return moveToward(player, target, role === DEFEND_ROLE.PRESSURE ? 0.72 : 0.62);
}

function containPressureIntent(state, player, owner) {
  const depth = goalSideDepth(player, owner);
  if (depth < RULES.aiCatchUpDepthTrigger) return recoverySprintIntent(state, player, owner, depth);
  const target = {
    x: clamp(owner.x + teamDirection(owner.team) * RULES.aiContainDistance, FIELD.inset + 48, FIELD.width - FIELD.inset - 48),
    y: owner.y,
  };
  const gap = distance(player, owner);
  let intent;
  if (gap > RULES.aiContainDistance + 38) intent = moveToward(player, target, 0.58);
  else if (gap > 48 && canUseDefensiveBrake(state, player, owner)) intent = { ...moveToward(player, target, 0.34), jockeyHeld: true };
  else if (canUseDefensiveBrake(state, player, owner)) intent = { ...moveToward(player, target, 0.18), jockeyHeld: true };
  else intent = moveToward(player, target, 0.30);

  if (gap <= RULES.tackleRange && canUseDefensiveBrake(state, player, owner)) {
    const tackle = evaluateTackle(state, player, owner, 0.28);
    player.aiTackleEvaluation = { score: Math.round(tackle.score * 10) / 10, gap: Math.round(tackle.gap), shouldTackle: tackle.shouldTackle };
    if (tackle.shouldTackle && player.recoveryRemaining <= 0) intent.tacklePressed = true;
  }
  return intent;
}

function pressPressureIntent(state, player, owner, target) {
  const depth = goalSideDepth(player, owner);
  if (depth < RULES.aiCatchUpDepthTrigger) return recoverySprintIntent(state, player, owner, depth);
  const gap = distance(player, owner);
  const canContain = canUseDefensiveBrake(state, player, owner);
  let intent;
  if (gap > 155) intent = moveToward(player, target, 0.94);
  else if (gap > 82) intent = moveToward(player, target, 0.72);
  else if (!canContain) intent = moveToward(player, target, 0.62);
  else if (gap > 42) intent = { ...moveToward(player, target, 0.52), jockeyHeld: true };
  else intent = { ...moveToward(player, target, 0.20), jockeyHeld: true };
  const aggression = 0.42 + (player.id.length % 5) * 0.07;
  const tackle = evaluateTackle(state, player, owner, aggression);
  player.aiTackleEvaluation = { score: Math.round(tackle.score * 10) / 10, gap: Math.round(tackle.gap), shouldTackle: tackle.shouldTackle };
  if (tackle.shouldTackle && player.recoveryRemaining <= 0) intent.tacklePressed = true;
  return intent;
}

function defendIntent(state, player, plan, teamPhase) {
  const owner = getOwner(state);
  if (!owner) return looseBallIntent(state, player);
  const role = plan.assignments.get(player.id);
  const target = plan.targets.get(player.id) ?? fallbackShape(player);

  if (teamPhase === DEFENSE_PHASE.RETREAT) return retreatIntent(state, player, owner, plan);

  if (teamPhase === DEFENSE_PHASE.CONTAIN) {
    if (role === DEFEND_ROLE.PRESSURE) return containPressureIntent(state, player, owner);
    const depth = goalSideDepth(player, owner);
    if (depth < RULES.aiCatchUpDepthTrigger) return recoverySprintIntent(state, player, owner, depth);
    return moveToward(player, target, role === DEFEND_ROLE.COVER ? 0.46 : 0.40);
  }

  if (role === DEFEND_ROLE.PRESSURE) return pressPressureIntent(state, player, owner, target);
  if (role === DEFEND_ROLE.COVER && isRareTrap(state, player)) {
    const insideY = owner.y < FIELD.height / 2 ? owner.y + 34 : owner.y - 34;
    const trapIntent = moveToward(player, { x: owner.x + teamDirection(owner.team) * 25, y: insideY }, 0.58);
    return canUseDefensiveBrake(state, player, owner) ? { ...trapIntent, jockeyHeld: true } : trapIntent;
  }
  return moveToward(player, target, role === DEFEND_ROLE.COVER ? 0.56 : 0.48);
}

export function collectAIInputs(state) {
  const result = {};
  const level = clamp(state.aiLevel ?? 50, 0, 100);
  const reactionInterval = 0.48 - level * 0.0038;
  const error = (100 - level) / 100;
  const teams = [...new Set(state.players.map((entry) => entry.team))];
  const plans = new Map(teams.map((team) => [team, buildTeamPlan(state, team)]));
  for (const [team, plan] of plans) updateAICalls(state, team, plan);
  const defensePhases = new Map(teams.map((team) => [team, plans.get(team).phase === "defend" ? defensiveTeamPhase(state, team) : DEFENSE_PHASE.CONTAIN]));
  state.teamPlans = Object.fromEntries([...plans].map(([team, plan]) => [team, {
    phase: plan.phase,
    defensivePhase: defensePhases.get(team),
    ownerId: plan.ownerId ?? null,
    assignments: Object.fromEntries(plan.assignments),
    targets: Object.fromEntries(plan.targets),
    matchups: Object.fromEntries(plan.matchups ?? []),
    lanes: Object.fromEntries(plan.lanes ?? []),
  }]));
  for (const player of state.players) {
    if (player.humanSlot) continue;
    if ((player.aiDecisionRemaining ?? 0) <= 0) {
      const plan = plans.get(player.team);
      const ideal = state.ball.ownerId === null
        ? looseBallIntent(state, player)
        : plan.phase === "attack" ? attackIntent(state, player, plan) : defendIntent(state, player, plan, defensePhases.get(player.team));
      const spaced = preserveTeamSpacing(state, player, ideal);
      const phase = state.tick * 0.071 + player.id.length * 1.37;
      player.aiInput = {
        ...spaced,
        moveX: clamp((spaced.moveX ?? 0) + Math.sin(phase) * error * 0.16, -1, 1),
        moveY: clamp((spaced.moveY ?? 0) + Math.cos(phase * 1.17) * error * 0.16, -1, 1),
      };
      player.aiDecisionRemaining = reactionInterval;
    }
    result[player.id] = player.aiInput ?? {};
  }
  return result;
}

export function executeAIAction(state, player, input) {
  if (input.passPressed) startPass(state, player.id, input.targetId, input);
  if (input.protectPressed) startProtection(state, player.id);
  if (input.shootPressed) {
    const keeper = state.goalkeepers?.find((entry) => entry.team !== player.team);
    const targetY = (keeper?.y ?? FIELD.height / 2) <= FIELD.height / 2 ? FIELD.goalBottom - 18 : FIELD.goalTop + 18;
    const goalX = player.team === "home" ? FIELD.width - FIELD.inset : FIELD.inset;
    startShot(state, player.id, { x: goalX - player.x, y: targetY - player.y }, 0.72);
  }
  if (input.tacklePressed) startTackle(state, player.id);
}
