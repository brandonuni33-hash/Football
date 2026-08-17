export const DEFAULT_BALL_PHYSICS = Object.freeze({
  radius: 0.11,
  gravity: 9.81,
  restitution: 0.52,
  bounceStopSpeed: 0.75,
  rollingDeceleration: 0.62,
  airDrag: 0.02,
  stopSpeed: 0.04,
  maxSubstep: 1 / 120,
});

function assert(condition, message) {
  if (!condition) throw new Error(`Ball physics: ${message}`);
}

function horizontalLength(x, z) {
  return Math.hypot(x, z);
}

function normalizeHorizontal([x = 0, , z = 0]) {
  const length = Math.hypot(x, z);
  return length > 1e-9 ? [x / length, 0, z / length] : [1, 0, 0];
}

export function createBallPhysics(options = {}) {
  const config = Object.freeze({ ...DEFAULT_BALL_PHYSICS, ...options });
  assert(config.radius > 0, 'radius doit être > 0');
  assert(config.gravity >= 0, 'gravity doit être >= 0');
  assert(config.restitution >= 0 && config.restitution <= 1, 'restitution doit être entre 0 et 1');
  assert(config.maxSubstep > 0, 'maxSubstep doit être > 0');

  const initialPosition = options.position ?? [0, config.radius, 0];
  let state = {
    position: [...initialPosition],
    velocity: [...(options.velocity ?? [0, 0, 0])],
    rotation: [...(options.rotation ?? [0, 0, 0])],
    grounded: initialPosition[1] <= config.radius + 1e-6,
  };

  function snapshot() {
    const horizontalSpeed = horizontalLength(state.velocity[0], state.velocity[2]);
    return Object.freeze({
      position: Object.freeze([...state.position]),
      velocity: Object.freeze([...state.velocity]),
      rotation: Object.freeze([...state.rotation]),
      grounded: state.grounded,
      speed: Math.hypot(...state.velocity),
      horizontalSpeed,
    });
  }

  function reset(next = {}) {
    const position = next.position ?? initialPosition;
    state = {
      position: [...position],
      velocity: [...(next.velocity ?? [0, 0, 0])],
      rotation: [...(next.rotation ?? [0, 0, 0])],
      grounded: position[1] <= config.radius + 1e-6,
    };
    if (state.position[1] < config.radius) state.position[1] = config.radius;
    return snapshot();
  }

  function kick({ direction = [1, 0, 0], speed = 18, lift = 0 } = {}) {
    assert(speed >= 0, 'speed doit être >= 0');
    const [dx, , dz] = normalizeHorizontal(direction);
    state.velocity[0] = dx * speed;
    state.velocity[1] = Math.max(0, lift);
    state.velocity[2] = dz * speed;
    state.grounded = lift <= 0 && state.position[1] <= config.radius + 1e-6;
    return snapshot();
  }

  function stepOnce(dt) {
    const previous = [...state.position];

    if (!state.grounded || state.velocity[1] > 0) {
      state.velocity[1] -= config.gravity * dt;
      const drag = Math.exp(-config.airDrag * dt);
      state.velocity[0] *= drag;
      state.velocity[2] *= drag;
    }

    state.position[0] += state.velocity[0] * dt;
    state.position[1] += state.velocity[1] * dt;
    state.position[2] += state.velocity[2] * dt;

    if (state.position[1] <= config.radius) {
      state.position[1] = config.radius;
      if (state.velocity[1] < -config.bounceStopSpeed) {
        state.velocity[1] = -state.velocity[1] * config.restitution;
        state.grounded = false;
      } else {
        state.velocity[1] = 0;
        state.grounded = true;
      }
    } else {
      state.grounded = false;
    }

    if (state.grounded) {
      const speed = horizontalLength(state.velocity[0], state.velocity[2]);
      if (speed > 0) {
        const nextSpeed = Math.max(0, speed - config.rollingDeceleration * dt);
        const factor = nextSpeed / speed;
        state.velocity[0] *= factor;
        state.velocity[2] *= factor;
      }

      if (horizontalLength(state.velocity[0], state.velocity[2]) < config.stopSpeed) {
        state.velocity[0] = 0;
        state.velocity[2] = 0;
      }

      const dx = state.position[0] - previous[0];
      const dz = state.position[2] - previous[2];
      state.rotation[0] += dz / config.radius;
      state.rotation[2] -= dx / config.radius;
    }
  }

  function step(dt) {
    assert(Number.isFinite(dt) && dt >= 0, 'dt invalide');
    let remaining = Math.min(dt, 0.25);
    while (remaining > 1e-9) {
      const h = Math.min(config.maxSubstep, remaining);
      stepOnce(h);
      remaining -= h;
    }
    return snapshot();
  }

  return Object.freeze({ config, snapshot, reset, kick, step });
}
