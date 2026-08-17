import * as base from "./formationGameplayV2.js?progression-base-v3";

export const VIEWPORT = base.VIEWPORT;
export const PITCH = base.PITCH;
export const TEAM = base.TEAM;
export const BALL_PHASE = base.BALL_PHASE;
export const RULES = base.RULES;
export const CONTROLLED_ID = base.CONTROLLED_ID;
export const getControlledPlayer = base.getControlledPlayer;
export const getPlayer = base.getPlayer;
export const getOwner = base.getOwner;
export const actionLabels = base.actionLabels;
export const controlMode = base.controlMode;
export const cameraGeometry = base.cameraGeometry;
export const cameraFromBall = base.cameraFromBall;
export const isPointVisible = base.isPointVisible;
export const formationSummary = base.formationSummary;

const PROGRESSION = Object.freeze({
  pressureDistance: 88,
  backwardPassThreshold: -24,
  lowProgressThreshold: 16,
  progressiveTargetMin: 34,
  strongProgressiveTargetMin: 58,
  minimumLane: 24,
  minimumSpace: 30,
  carryDecisionDelay: 0.62,
  rerouteScoreFloor: 38,
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

function progressFrom(passer, receiver) {
  return (receiver.x - passer.x) * teamDirection(passer.team);
}

function nearestOpponentDistance(state, player) {
  let nearest = Infinity;
  for (const opponent of state.players) {
    if (opponent.team === player.team) continue;
    nearest = Math.min(nearest, distance(player, opponent));
  }
  return nearest;
}

function passLaneClearance(state, passer, receiver) {
  const dx = receiver.x - passer.x;
  const dy = receiver.y - passer.y;
  const lengthSq = dx * dx + dy * dy;
  let nearest = Infinity;

  for (const opponent of state.players) {
    if (opponent.team === passer.team) continue;
    const t = lengthSq > 0.001
      ? clamp(((opponent.x - passer.x) * dx + (opponent.y - passer.y) * dy) / lengthSq, 0, 1)
      : 0;
    const px = passer.x + dx * t;
    const py = passer.y + dy * t;
    nearest = Math.min(nearest, Math.hypot(opponent.x - px, opponent.y - py));
  }

  return nearest;
}

function receiverSpace(state, receiver) {
  let nearest = Infinity;
  for (const opponent of state.players) {
    if (opponent.team === receiver.team) continue;
    nearest = Math.min(nearest, distance(receiver, opponent));
  }
  return nearest;
}

function attackingRoleBonus(player) {
  const label = player.positionLabel ?? player.role;
  if (["ST", "RW", "LW"].includes(label)) return 18;
  if (["AM", "CM", "RM", "LM"].includes(label)) return 10;
  return 0;
}

function progressiveCandidates(state, passer) {
  return state.players
    .filter((mate) => mate.team === passer.team && mate.id !== passer.id && mate.role !== "GK")
    .map((mate) => {
      const range = distance(passer, mate);
      const progress = progressFrom(passer, mate);
      const lane = passLaneClearance(state, passer, mate);
      const space = receiverSpace(state, mate);
      const callBonus = mate.callRemaining > 0 ? 24 : 0;
      const roleBonus = attackingRoleBonus(mate);
      const score = progress * 0.34
        + Math.min(lane, 130) * 0.34
        + Math.min(space, 170) * 0.18
        + callBonus
        + roleBonus
        - range * 0.025;
      return { mate, range, progress, lane, space, score };
    })
    .filter((candidate) => candidate.range <= RULES.aiPassRange)
    .filter((candidate) => candidate.progress >= PROGRESSION.progressiveTargetMin)
    .filter((candidate) => candidate.lane >= PROGRESSION.minimumLane)
    .filter((candidate) => candidate.space >= PROGRESSION.minimumSpace)
    .sort((a, b) => b.score - a.score);
}

function retargetPass(state, oldTarget, candidate) {
  const dx = candidate.mate.x - state.ball.x;
  const dy = candidate.mate.y - state.ball.y;
  const magnitude = Math.hypot(dx, dy);
  if (magnitude < 0.001) return false;

  const speed = Math.max(RULES.passSpeed, Math.hypot(state.ball.vx, state.ball.vy));
  if (oldTarget && oldTarget.id !== candidate.mate.id) oldTarget.receptionRemaining = 0;
  state.ball.targetId = candidate.mate.id;
  state.ball.vx = (dx / magnitude) * speed;
  state.ball.vy = (dy / magnitude) * speed;
  candidate.mate.receptionRemaining = Math.max(candidate.mate.receptionRemaining ?? 0, RULES.receptionWindow);
  state.lastEvent = "pass_progressive";
  return true;
}

function restoreCarry(state, passer) {
  for (const player of state.players) player.hasBall = false;
  passer.hasBall = true;
  state.ball.ownerId = passer.id;
  state.ball.targetId = null;
  state.ball.phase = BALL_PHASE.CONTROLLED;
  state.ball.lastTouchId = passer.id;
  state.ball.x = passer.x + teamDirection(passer.team) * RULES.dribbleControlDistance;
  state.ball.y = passer.y;
  state.ball.vx = passer.vx;
  state.ball.vy = passer.vy;
  state.possession = { team: passer.team, playerId: passer.id };
  passer.aiPassCooldown = Math.max(passer.aiPassCooldown ?? 0, PROGRESSION.carryDecisionDelay);
  passer.aiDecisionRemaining = Math.max(passer.aiDecisionRemaining ?? 0, PROGRESSION.carryDecisionDelay);
  state.lastEvent = "carry_forward";
}

function reviewAIPass(state) {
  if (state.ball.phase !== BALL_PHASE.PASS || !state.ball.lastTouchId || !state.ball.targetId) return;

  state.progressionAI ??= { reviewedEventId: -1 };
  if (state.progressionAI.reviewedEventId === state.eventId) return;

  const passer = getPlayer(state, state.ball.lastTouchId);
  const target = getPlayer(state, state.ball.targetId);
  if (!passer || !target || passer.controlled || passer.role === "GK") {
    state.progressionAI.reviewedEventId = state.eventId;
    return;
  }

  const originalProgress = progressFrom(passer, target);
  const pressure = nearestOpponentDistance(state, passer) <= PROGRESSION.pressureDistance;
  const candidates = progressiveCandidates(state, passer);
  const bestForward = candidates[0] ?? null;
  const strongForward = candidates.find((candidate) => candidate.progress >= PROGRESSION.strongProgressiveTargetMin) ?? bestForward;

  const clearlyBackward = originalProgress <= PROGRESSION.backwardPassThreshold;
  const lowProgress = originalProgress < PROGRESSION.lowProgressThreshold;
  const hasGoodForward = strongForward && strongForward.score >= PROGRESSION.rerouteScoreFloor;

  if (hasGoodForward && (clearlyBackward || lowProgress)) {
    retargetPass(state, target, strongForward);
    state.progressionAI.reviewedEventId = state.eventId;
    return;
  }

  // A true back pass remains possible as an escape under pressure. Without pressure,
  // no progressive lane means the carrier keeps advancing instead of recycling by default.
  if (clearlyBackward && !pressure) {
    restoreCarry(state, passer);
  }

  state.progressionAI.reviewedEventId = state.eventId;
}

export function createGameplayState() {
  const state = base.createGameplayState();
  state.progressionAI = { reviewedEventId: -1 };
  return state;
}

export function stepGameplay(state, input = {}, dt = RULES.fixedStep) {
  const next = base.stepGameplay(state, input, dt);
  reviewAIPass(next);
  return next;
}
