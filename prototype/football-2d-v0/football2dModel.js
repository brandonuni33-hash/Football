export const FIELD = Object.freeze({
  w: 960,
  h: 540,
  inset: 34,
  goalX: 930,
  goalTop: 198,
  goalBottom: 342,
});

export const PHYSICS = Object.freeze({
  playerSpeed: 248,
  controlRadius: 48,
  minShotSpeed: 430,
  maxShotSpeed: 820,
  friction: 0.986,
  recoverySpeed: 260,
});

export const DEFAULT_FEEL_TUNING = Object.freeze({
  playerSpeed: 1,
  ballControl: 1,
  shotPower: 1,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (from, to, amount) => from + (to - from) * amount;

export function normalizeFeelTuning(input = {}) {
  return {
    playerSpeed: clamp(Number(input.playerSpeed) || 1, 0.8, 1.2),
    ballControl: clamp(Number(input.ballControl) || 1, 0.7, 1.3),
    shotPower: clamp(Number(input.shotPower) || 1, 0.8, 1.2),
  };
}

export function getBallControlFeel(tuning = DEFAULT_FEEL_TUNING) {
  const feel = normalizeFeelTuning(tuning);
  const quality = (feel.ballControl - 0.7) / 0.6;

  return {
    touchDistance: lerp(46, 24, quality),
    followRate: lerp(6, 24, quality),
    carryVelocityFactor: lerp(0.28, 0.52, quality),
    retentionRadius: lerp(66, 55, quality),
  };
}

export function normalizeVector(x = 0, y = 0) {
  const length = Math.hypot(x, y);
  return length
    ? { x: x / length, y: y / length, length }
    : { x: 0, y: 0, length: 0 };
}

export function shotSpeedFromPower(power = 0, tuning = DEFAULT_FEEL_TUNING) {
  const normalizedPower = clamp(Number(power) || 0, 0, 1);
  const feel = normalizeFeelTuning(tuning);
  return (
    PHYSICS.minShotSpeed +
    (PHYSICS.maxShotSpeed - PHYSICS.minShotSpeed) * normalizedPower
  ) * feel.shotPower;
}

export function createFootball2DState() {
  return {
    status: "playing",
    goals: 0,
    lastEvent: null,
    possession: true,
    player: {
      x: 260,
      y: FIELD.h / 2,
      facingX: 1,
      facingY: 0,
      vx: 0,
      vy: 0,
    },
    ball: {
      x: 296,
      y: FIELD.h / 2,
      vx: 0,
      vy: 0,
    },
  };
}

function inGoal(y) {
  return y >= FIELD.goalTop && y <= FIELD.goalBottom;
}

function boundBall(ball) {
  const bounded = { ...ball };

  if (bounded.y < FIELD.inset + 7) {
    bounded.y = FIELD.inset + 7;
    bounded.vy = Math.abs(bounded.vy) * 0.55;
  }
  if (bounded.y > FIELD.h - FIELD.inset - 7) {
    bounded.y = FIELD.h - FIELD.inset - 7;
    bounded.vy = -Math.abs(bounded.vy) * 0.55;
  }
  if (bounded.x < FIELD.inset + 7) {
    bounded.x = FIELD.inset + 7;
    bounded.vx = Math.abs(bounded.vx) * 0.55;
  }
  if (bounded.x > FIELD.goalX && !inGoal(bounded.y)) {
    bounded.x = FIELD.goalX;
    bounded.vx = -Math.abs(bounded.vx) * 0.5;
  }

  return bounded;
}

export function stepFootball2D(
  state,
  input = {},
  dt = 1 / 60,
  tuning = DEFAULT_FEEL_TUNING,
) {
  const feel = normalizeFeelTuning(tuning);
  const control = getBallControlFeel(feel);
  const time = clamp(Number(dt) || 0, 0, 0.05);
  const move = normalizeVector(input.moveX ?? 0, input.moveY ?? 0);
  const player = { ...state.player };
  const previousBall = { ...state.ball };
  let ball = { ...state.ball };
  let possession = false;
  let lastEvent = null;

  player.vx = move.x * PHYSICS.playerSpeed * feel.playerSpeed;
  player.vy = move.y * PHYSICS.playerSpeed * feel.playerSpeed;
  player.x = clamp(
    player.x + player.vx * time,
    FIELD.inset + 18,
    FIELD.w - FIELD.inset - 18,
  );
  player.y = clamp(
    player.y + player.vy * time,
    FIELD.inset + 18,
    FIELD.h - FIELD.inset - 18,
  );

  if (move.length > 0.05) {
    player.facingX = move.x;
    player.facingY = move.y;
  }

  const distance = Math.hypot(ball.x - player.x, ball.y - player.y);
  const ballSpeed = Math.hypot(ball.vx, ball.vy);
  const controlling =
    state.possession ||
    (distance <= PHYSICS.controlRadius && ballSpeed <= PHYSICS.recoverySpeed);

  if (input.shootReleased && controlling) {
    const speed = shotSpeedFromPower(input.shootPower, feel);
    ball.vx = player.facingX * speed;
    ball.vy = player.facingY * speed;
    ball.x += player.facingX * 8;
    ball.y += player.facingY * 8;
    lastEvent = "shot";
  } else if (controlling) {
    const targetX = player.x + player.facingX * control.touchDistance;
    const targetY = player.y + player.facingY * control.touchDistance;
    const follow = 1 - Math.exp(-control.followRate * time);

    ball.x += (targetX - ball.x) * follow;
    ball.y += (targetY - ball.y) * follow;
    ball.vx = player.vx * control.carryVelocityFactor;
    ball.vy = player.vy * control.carryVelocityFactor;

    possession =
      Math.hypot(ball.x - player.x, ball.y - player.y) <= control.retentionRadius;
  } else {
    ball.x += ball.vx * time;
    ball.y += ball.vy * time;

    const friction = Math.pow(PHYSICS.friction, time * 60);
    ball.vx *= friction;
    ball.vy *= friction;

    if (Math.hypot(ball.vx, ball.vy) < 5) {
      ball.vx = 0;
      ball.vy = 0;
    }

    const recoveryDistance = Math.hypot(ball.x - player.x, ball.y - player.y);
    if (
      recoveryDistance <= PHYSICS.controlRadius &&
      Math.hypot(ball.vx, ball.vy) <= PHYSICS.recoverySpeed
    ) {
      possession = true;
    }
  }

  ball = boundBall(ball);

  if (previousBall.x < FIELD.goalX && ball.x >= FIELD.goalX && inGoal(ball.y)) {
    return {
      ...state,
      status: "goal",
      goals: state.goals + 1,
      lastEvent: "goal",
      player,
      ball,
      possession: false,
    };
  }

  return {
    ...state,
    status: "playing",
    lastEvent,
    player,
    ball,
    possession,
  };
}

export function resetFootball2DAfterGoal(state) {
  const fresh = createFootball2DState();
  return { ...fresh, goals: state.goals };
}
