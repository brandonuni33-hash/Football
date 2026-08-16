import { DEFAULT_FEEL_TUNING, FIELD } from "../football-2d-v0/football2dModel.js";
import { DEFAULT_ATHLETIC_PROFILE } from "../football-2d-v0/playerAthleticProfile.js";
import { createScenarioState, stepScenario } from "../football-2d-v0/scenarioModel.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

function normalize(x = 0, y = 0) {
  const length = Math.hypot(x, y);
  if (length < 0.001) return { x: 0, y: 0, magnitude: 0 };
  return { x: x / length, y: y / length, magnitude: clamp(length, 0, 1) };
}

function controlLabel(magnitude) {
  if (magnitude < 0.08) return "neutre";
  if (magnitude < 0.45) return "court";
  if (magnitude < 0.8) return "oriente";
  return "long";
}

export function getBallIntent(controlX = 0, controlY = 0) {
  const direction = normalize(controlX, controlY);
  const magnitude = direction.magnitude;
  return Object.freeze({
    x: direction.x,
    y: direction.y,
    magnitude,
    label: controlLabel(magnitude),
    targetDistance: magnitude < 0.08 ? 0 : lerp(18, 46, magnitude),
    followRate: lerp(25, 14, magnitude),
  });
}

export function createControlLabState() {
  return {
    ...createScenarioState(),
    controlMode: "neutre",
    lookX: 1,
    lookY: 0,
    rightStickMagnitude: 0,
    lastControlAction: null,
  };
}

function applyRightStick(next, input, dt) {
  const intent = getBallIntent(input.controlX, input.controlY);
  const rightActive = intent.magnitude >= 0.08;
  const burstActive = (next.burstTime ?? 0) > 0;
  const canTouchBall = next.possession && !input.protecting && !burstActive && !input.shootReleased;

  let state = {
    ...next,
    rightStickMagnitude: intent.magnitude,
  };

  if (rightActive) {
    state.lookX = intent.x;
    state.lookY = intent.y;
  }

  if (!canTouchBall) {
    return {
      ...state,
      controlMode: !next.possession && rightActive ? "vision" : input.protecting ? "protection" : burstActive ? "poussee" : next.dribbleMode ?? "neutre",
    };
  }

  if (!rightActive) {
    return { ...state, controlMode: next.dribbleMode ?? "neutre" };
  }

  const player = state.player;
  const targetX = clamp(player.x + intent.x * intent.targetDistance, FIELD.inset + 8, FIELD.w - FIELD.inset - 8);
  const targetY = clamp(player.y + intent.y * intent.targetDistance, FIELD.inset + 8, FIELD.h - FIELD.inset - 8);
  const follow = 1 - Math.exp(-intent.followRate * Math.min(Math.max(dt, 0), 0.05));
  const ball = { ...state.ball };

  ball.x += (targetX - ball.x) * follow;
  ball.y += (targetY - ball.y) * follow;
  ball.vx = player.vx * lerp(0.35, 0.58, intent.magnitude);
  ball.vy = player.vy * lerp(0.35, 0.58, intent.magnitude);

  return {
    ...state,
    ball,
    possession: true,
    controlMode: intent.label,
  };
}

export function stepControlLab(
  state,
  input = {},
  dt = 1 / 60,
  tuning = DEFAULT_FEEL_TUNING,
  athletic = DEFAULT_ATHLETIC_PROFILE,
) {
  const scenarioInput = {
    moveX: input.moveX ?? 0,
    moveY: input.moveY ?? 0,
    protecting: !!input.protecting,
    burstTriggered: !!input.burstTriggered,
    burstX: input.burstX ?? 0,
    burstY: input.burstY ?? 0,
    shootReleased: !!input.shootReleased,
    shootPower: input.shootPower ?? 0,
  };

  const scenario = stepScenario(state, scenarioInput, dt, tuning, athletic);
  let next = applyRightStick(scenario, input, dt);

  if (input.passPressed) next = { ...next, lastControlAction: "passe" };
  else if (input.shootReleased) next = { ...next, lastControlAction: "tir" };
  else if (input.protecting) next = { ...next, lastControlAction: "protection" };
  else if (next.lastControlAction && input.clearAction) next = { ...next, lastControlAction: null };

  return next;
}
