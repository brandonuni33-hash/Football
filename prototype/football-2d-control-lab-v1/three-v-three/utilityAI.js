import { FIELD, RULES, TEAM, clamp, distance, dot, normalize } from "./constants.js";
import { SUPPORT_STATE } from "./footwork.js";
import { distanceToGoal, evaluatePassingLane } from "./teamBrain.js";
import { teamDirection } from "./possession.js";

function nearestOpponent(state, player) {
  return state.players
    .filter((entry) => entry.team !== player.team)
    .map((entry) => ({ entry, gap: distance(entry, player) }))
    .sort((a, b) => a.gap - b.gap)[0] ?? null;
}

function shotScore(state, carrier) {
  const range = distanceToGoal(carrier);
  const goal = { x: carrier.team === TEAM.HOME ? FIELD.width - FIELD.inset : FIELD.inset, y: FIELD.height / 2 };
  const shotDirection = normalize(goal.x - carrier.x, goal.y - carrier.y);
  const pressure = nearestOpponent(state, carrier)?.gap ?? 200;
  const centrality = 1 - Math.min(1, Math.abs(carrier.y - FIELD.height / 2) / 210);
  return 88 - range * 0.24 + centrality * 22 + clamp(pressure - 45, 0, 90) * 0.14 + dot(shotDirection, normalize(carrier.facingX, carrier.facingY)) * 8;
}

function passOptions(state, carrier) {
  return state.players
    .filter((entry) => entry.team === carrier.team && entry.id !== carrier.id)
    .map((receiver) => {
      const lane = evaluatePassingLane(state, carrier, receiver);
      const callBoost = receiver.callRemaining > 0 ? 42 : 0;
      const orientation = dot(normalize(receiver.facingX, receiver.facingY), normalize(receiver.x - carrier.x, receiver.y - carrier.y));
      const score = lane.score + callBoost + orientation * 5;
      return { type: "pass", targetId: receiver.id, score, lane, reason: callBoost ? "called-option" : "open-option" };
    });
}

function carryScores(state, carrier) {
  const pressure = nearestOpponent(state, carrier)?.gap ?? 240;
  const progressRoom = clamp(pressure, 0, 180);
  const advance = 35 + progressRoom * 0.22 - (carrier.supportState === SUPPORT_STATE.RECOVERING ? 40 : 0);
  const dribble = 30 + clamp(90 - pressure, 0, 90) * 0.14 + (carrier.balance ?? 65) * 0.08;
  const hold = 28 + clamp(72 - pressure, 0, 72) * 0.28;
  const temporize = 31 + clamp(105 - pressure, 0, 105) * 0.18;
  const protect = 24 + clamp(76 - pressure, 0, 76) * 0.58 + (carrier.balance ?? 65) * 0.08;
  return [
    { type: "advance", score: advance, reason: "space-ahead" },
    { type: "dribble", score: dribble, reason: "engage-duel" },
    { type: "hold", score: hold, reason: "retain-ball" },
    { type: "temporize", score: temporize, reason: "wait-support" },
    { type: "protect", score: protect, reason: "secure-under-pressure" },
  ];
}

export function evaluateCarrierOptions(state, carrier) {
  const options = [
    ...passOptions(state, carrier),
    ...carryScores(state, carrier),
    { type: "shoot", score: shotScore(state, carrier), reason: "goal-window" },
  ];
  return options.sort((a, b) => b.score - a.score);
}

export function chooseCarrierIntent(state, carrier) {
  const ranked = evaluateCarrierOptions(state, carrier);
  const best = ranked[0];
  carrier.aiUtility = ranked.map(({ type, targetId = null, score, reason }) => ({ type, targetId, score: Math.round(score * 10) / 10, reason }));
  carrier.aiChoice = { type: best.type, targetId: best.targetId ?? null, reason: best.reason };
  return best;
}

export function evaluateTackle(state, defender, carrier, aggression = 0.5) {
  const gap = distance(defender, carrier);
  const facing = normalize(defender.facingX, defender.facingY);
  const toward = normalize(carrier.x - defender.x, carrier.y - defender.y);
  const angle = dot(facing, toward);
  const relativeSpeed = Math.hypot(carrier.vx - defender.vx, carrier.vy - defender.vy);
  const balanced = defender.supportState === SUPPORT_STATE.BALANCED ? 18 : defender.supportState?.startsWith("LEANING") ? 5 : -35;
  const missedRisk = clamp(gap - 24, 0, 35) * 1.5 + relativeSpeed * 0.05 + (1 - angle) * 28;
  const score = 82 - gap * 1.45 + angle * 24 + balanced + aggression * 20 - missedRisk;
  return { score, gap, angle, relativeSpeed, shouldTackle: score >= 36 && gap <= RULES.tackleRange && angle >= 0.08 };
}

export function carrierMoveIntent(state, carrier, choice) {
  const direction = teamDirection(carrier.team);
  if (choice.type === "hold" || choice.type === "temporize" || choice.type === "protect") {
    const wave = Math.sin(state.elapsed * 1.35 + carrier.y * 0.03);
    return { moveX: direction * 0.12, moveY: wave * 0.22, jockeyHeld: choice.type === "temporize" };
  }
  const scale = choice.type === "dribble" ? 0.52 : 0.68;
  return { moveX: direction * scale, moveY: Math.sin(state.elapsed * 0.8 + carrier.x * 0.01) * 0.16 };
}
