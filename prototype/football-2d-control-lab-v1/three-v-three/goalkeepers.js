import { BALL_PHASE, FIELD, RULES, TEAM, approach, clamp } from "./constants.js";

function defendingLine(team) {
  return team === TEAM.HOME ? FIELD.inset : FIELD.width - FIELD.inset;
}

function defendingDirection(team) {
  return team === TEAM.HOME ? 1 : -1;
}

function ballThreatensGoal(ball, team) {
  const towardGoal = team === TEAM.HOME ? ball.vx < -1 : ball.vx > 1;
  const inDefensiveHalf = team === TEAM.HOME ? ball.x < FIELD.width * 0.52 : ball.x > FIELD.width * 0.48;
  return towardGoal && inDefensiveHalf;
}

export function moveGoalkeepers(state, dt) {
  for (const keeper of state.goalkeepers ?? []) {
    const alert = state.ball.ownerId === null && ballThreatensGoal(state.ball, keeper.team);
    const targetY = alert ? clamp(state.ball.y, FIELD.goalTop + 15, FIELD.goalBottom - 15) : FIELD.height / 2;
    const targetVy = Math.sign(targetY - keeper.y) * RULES.goalkeeperSpeed;
    keeper.vy = Math.abs(targetY - keeper.y) < 2 ? 0 : approach(keeper.vy, targetVy, RULES.goalkeeperSpeed * 4.5 * dt);
    keeper.y = clamp(keeper.y + keeper.vy * dt, FIELD.goalTop + 15, FIELD.goalBottom - 15);
    keeper.x = defendingLine(keeper.team) + defendingDirection(keeper.team) * 25;
    keeper.facingX = defendingDirection(keeper.team);
    keeper.facingY = 0;
  }
}

function segmentDistanceToPoint(x1, y1, x2, y2, point) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared > 0
    ? clamp(((point.x - x1) * dx + (point.y - y1) * dy) / lengthSquared, 0, 1)
    : 0;
  return Math.hypot(x1 + dx * t - point.x, y1 + dy * t - point.y);
}

export function resolveGoalkeeperSave(state, previousBall) {
  if (state.ball.ownerId !== null || ![BALL_PHASE.SHOT, BALL_PHASE.PASS, BALL_PHASE.FREE].includes(state.ball.phase)) return null;
  const keeper = (state.goalkeepers ?? []).find((entry) => {
    if (!ballThreatensGoal(state.ball, entry.team)) return false;
    const line = defendingLine(entry.team);
    const alreadyAcross = entry.team === TEAM.HOME ? previousBall.x <= line : previousBall.x >= line;
    return !alreadyAcross
      && segmentDistanceToPoint(previousBall.x, previousBall.y, state.ball.x, state.ball.y, entry) <= RULES.goalkeeperSaveRadius;
  });
  if (!keeper) return null;
  const direction = defendingDirection(keeper.team);
  state.ball.x = keeper.x + direction * (RULES.goalkeeperRadius + 9);
  state.ball.y = keeper.y;
  state.ball.vx = direction * Math.max(125, Math.abs(state.ball.vx) * 0.42);
  state.ball.vy = clamp((state.ball.y - previousBall.y) * 2.5 + keeper.vy * 0.35, -125, 125);
  state.ball.phase = BALL_PHASE.FREE;
  state.ball.ownerId = null;
  state.ball.targetId = null;
  state.ball.lastTouchId = keeper.id;
  state.possession = { team: null, playerId: null, duel: null };
  state.lastEvent = "goalkeeper_save";
  state.eventId += 1;
  return keeper;
}

export function crossedGoalLine(previousBall, ball) {
  for (const [team, line] of [[TEAM.HOME, FIELD.inset], [TEAM.AWAY, FIELD.width - FIELD.inset]]) {
    const crossed = team === TEAM.HOME
      ? previousBall.x > line && ball.x <= line
      : previousBall.x < line && ball.x >= line;
    if (!crossed) continue;
    const ratio = (line - previousBall.x) / (ball.x - previousBall.x);
    const crossingY = previousBall.y + (ball.y - previousBall.y) * ratio;
    if (crossingY >= FIELD.goalTop && crossingY <= FIELD.goalBottom) return team;
  }
  return null;
}
