const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function directionTo(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  return length ? { x: dx / length, y: dy / length } : { x: 0, y: 0 };
}

export function createOpponentState(field) {
  return {
    defender: { x: 650, y: field.h / 2 },
    keeper: { x: field.goalX - 28, y: field.h / 2 },
  };
}

export function stepOpponentAI({ defender, keeper, player, ball, possession }, field, dt) {
  const nextDefender = { ...defender };
  const nextKeeper = { ...keeper };
  let nextBall = { ...ball };
  let nextPossession = possession;
  let event = null;

  const threat = nextBall.x > 430 || player.x > 430;
  const target = threat ? nextBall : { x: 650, y: field.h / 2 };
  const direction = directionTo(nextDefender, target);
  nextDefender.x += direction.x * 178 * dt;
  nextDefender.y += direction.y * 178 * dt;
  nextDefender.x = clamp(nextDefender.x, 500, field.goalX - 90);
  nextDefender.y = clamp(nextDefender.y, field.inset + 20, field.h - field.inset - 20);

  const distance = Math.hypot(nextBall.x - nextDefender.x, nextBall.y - nextDefender.y);
  const speed = Math.hypot(nextBall.vx, nextBall.vy);
  if (distance < 27 && speed < 300) {
    nextBall.vx = -Math.max(220, Math.abs(nextBall.vx) * 0.65);
    nextBall.vy += (nextBall.y >= nextDefender.y ? 1 : -1) * 135;
    nextPossession = false;
    event = "tackle";
  }

  return { defender: nextDefender, keeper: nextKeeper, ball: nextBall, possession: nextPossession, event };
}
