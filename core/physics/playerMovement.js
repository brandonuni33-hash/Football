export const DEFAULT_PLAYER_MOVEMENT = Object.freeze({
  height: 1.68,
  jogSpeed: 4.8,
  sprintSpeed: 7.2,
  acceleration: 11.5,
  deceleration: 14,
  turnRateSlow: Math.PI * 3.2,
  turnRateFast: Math.PI * 2.1,
  strideLengthMin: 0.9,
  strideLengthMax: 1.45,
  bobMax: 0.025,
  stopSpeed: 0.04,
  fieldHalfLength: 52.15,
  fieldHalfWidth: 33.65,
  maxSubstep: 1 / 120,
});

function assert(condition, message) {
  if (!condition) throw new Error(`Player movement: ${message}`);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function moveTowards(current, target, maxDelta) {
  const delta = target - current;
  if (Math.abs(delta) <= maxDelta) return target;
  return current + Math.sign(delta) * maxDelta;
}

function wrapAngle(angle) {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function angleTowards(current, target, maxDelta) {
  const delta = wrapAngle(target - current);
  if (Math.abs(delta) <= maxDelta) return target;
  return wrapAngle(current + Math.sign(delta) * maxDelta);
}

function normalizedInput(input = {}) {
  const x = Number.isFinite(input.x) ? input.x : 0;
  const z = Number.isFinite(input.z) ? input.z : 0;
  const length = Math.hypot(x, z);
  if (length <= 1e-9) return { x: 0, z: 0, amount: 0 };
  const amount = Math.min(1, length);
  return { x: x / length, z: z / length, amount };
}

export function createPlayerMovement(options = {}) {
  const config = Object.freeze({ ...DEFAULT_PLAYER_MOVEMENT, ...options });
  assert(config.height > 0, 'height doit être > 0');
  assert(config.jogSpeed > 0 && config.sprintSpeed >= config.jogSpeed, 'vitesses invalides');
  assert(config.acceleration > 0 && config.deceleration > 0, 'accélérations invalides');
  assert(config.maxSubstep > 0, 'maxSubstep doit être > 0');

  const initialPosition = options.position ?? [0, 0, 0];
  let state = {
    position: [...initialPosition],
    velocity: [0, 0, 0],
    facing: options.facing ?? 0,
    stridePhase: 0,
    travelled: 0,
    plantedFoot: 'left',
    bob: 0,
  };

  function snapshot() {
    const speed = Math.hypot(state.velocity[0], state.velocity[2]);
    return Object.freeze({
      position: Object.freeze([...state.position]),
      velocity: Object.freeze([...state.velocity]),
      facing: state.facing,
      speed,
      speedRatio: clamp(speed / config.sprintSpeed, 0, 1),
      stridePhase: state.stridePhase,
      plantedFoot: state.plantedFoot,
      bob: state.bob,
      travelled: state.travelled,
    });
  }

  function reset(next = {}) {
    state = {
      position: [...(next.position ?? initialPosition)],
      velocity: [...(next.velocity ?? [0, 0, 0])],
      facing: next.facing ?? 0,
      stridePhase: next.stridePhase ?? 0,
      travelled: 0,
      plantedFoot: 'left',
      bob: 0,
    };
    return snapshot();
  }

  function stepOnce(dt, input = {}) {
    const stick = normalizedInput(input);
    const currentSpeed = Math.hypot(state.velocity[0], state.velocity[2]);
    const cap = input.sprint ? config.sprintSpeed : config.jogSpeed;
    const desiredSpeed = cap * stick.amount;
    const desiredVx = stick.x * desiredSpeed;
    const desiredVz = stick.z * desiredSpeed;
    const accelerating = desiredSpeed > currentSpeed + 1e-6;
    const rate = accelerating ? config.acceleration : config.deceleration;

    state.velocity[0] = moveTowards(state.velocity[0], desiredVx, rate * dt);
    state.velocity[2] = moveTowards(state.velocity[2], desiredVz, rate * dt);

    if (stick.amount === 0 && Math.hypot(state.velocity[0], state.velocity[2]) < config.stopSpeed) {
      state.velocity[0] = 0;
      state.velocity[2] = 0;
    }

    const speed = Math.hypot(state.velocity[0], state.velocity[2]);
    if (stick.amount > 0.01 || speed > config.stopSpeed) {
      const targetFacing = Math.atan2(state.velocity[0], state.velocity[2]);
      const speedRatio = clamp(speed / config.sprintSpeed, 0, 1);
      const turnRate = config.turnRateSlow + (config.turnRateFast - config.turnRateSlow) * speedRatio;
      state.facing = angleTowards(state.facing, targetFacing, turnRate * dt);
    }

    const beforeX = state.position[0];
    const beforeZ = state.position[2];
    state.position[0] = clamp(state.position[0] + state.velocity[0] * dt, -config.fieldHalfLength, config.fieldHalfLength);
    state.position[2] = clamp(state.position[2] + state.velocity[2] * dt, -config.fieldHalfWidth, config.fieldHalfWidth);

    const dx = state.position[0] - beforeX;
    const dz = state.position[2] - beforeZ;
    const distance = Math.hypot(dx, dz);
    state.travelled += distance;

    if (distance > 0) {
      const speedRatio = clamp(speed / config.sprintSpeed, 0, 1);
      const strideLength = config.strideLengthMin + (config.strideLengthMax - config.strideLengthMin) * speedRatio;
      // Important anti-glissement : la phase des pas dépend de la distance réellement parcourue, jamais du temps.
      state.stridePhase = (state.stridePhase + distance / strideLength) % 1;
      state.plantedFoot = state.stridePhase < 0.5 ? 'left' : 'right';
      state.bob = Math.abs(Math.sin(state.stridePhase * Math.PI * 2)) * config.bobMax * speedRatio;
    } else {
      state.bob = moveTowards(state.bob, 0, config.bobMax * 8 * dt);
    }
  }

  function step(dt, input = {}) {
    assert(Number.isFinite(dt) && dt >= 0, 'dt invalide');
    let remaining = Math.min(dt, 0.25);
    while (remaining > 1e-9) {
      const h = Math.min(config.maxSubstep, remaining);
      stepOnce(h, input);
      remaining -= h;
    }
    return snapshot();
  }

  return Object.freeze({ config, snapshot, reset, step });
}
