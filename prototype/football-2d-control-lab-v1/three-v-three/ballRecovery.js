import { BALL_PHASE, RULES, clamp, distance, dot, normalize } from "./constants.js";

export function recoveryWindow(player, ball) {
  const control = clamp(player.ballControl ?? 65, 0, 100);
  const balance = clamp(player.balance ?? 65, 0, 100);
  const ballSpeed = Math.hypot(ball.vx, ball.vy);
  const playerSpeed = Math.hypot(player.vx, player.vy);
  const toBall = normalize(ball.x - player.x, ball.y - player.y);
  const facing = normalize(player.facingX, player.facingY);
  const approach = toBall.magnitude > 0 ? dot(facing, toBall) : 1;
  const recentLoss = (player.recentBallLossRemaining ?? 0) > 0;
  const baseReach = RULES.controlRadius + (control - 50) * 0.09 + (player.receptionRemaining > 0 ? 8 : 0);
  const reach = recentLoss ? baseReach * RULES.recentBallLossReachScale : baseReach;
  const baseMaxBallSpeed = 285 + control * 1.65 + (player.receptionRemaining > 0 ? 55 : 0);
  const maxBallSpeed = recentLoss ? Math.max(120, baseMaxBallSpeed - RULES.recentBallLossMaxSpeedPenalty) : baseMaxBallSpeed;
  const angleRequired = ball.phase === BALL_PHASE.PASS && ball.targetId === player.id ? -0.35 : -0.05;
  const stable = player.recoveryRemaining <= 0 && player.tackleRemaining <= 0;
  const closeEnough = distance(player, ball) <= reach;
  const controllableSpeed = ballSpeed <= maxBallSpeed + playerSpeed * 0.25;
  const wellOriented = approach >= angleRequired || ballSpeed < 55;
  const score = (reach - distance(player, ball)) * 2.4
    + (maxBallSpeed - ballSpeed) * 0.08
    + approach * 10
    + balance * 0.04
    - (recentLoss ? RULES.recentBallLossScorePenalty : 0);
  return { eligible: stable && closeEnough && controllableSpeed && wellOriented, reach, maxBallSpeed, approach, score, recentLoss };
}

export function selectRecoveryCandidate(players, ball) {
  return players
    .map((player) => ({ player, evaluation: recoveryWindow(player, ball) }))
    .filter(({ evaluation }) => evaluation.eligible)
    .sort((a, b) => b.evaluation.score - a.evaluation.score)[0]?.player ?? null;
}