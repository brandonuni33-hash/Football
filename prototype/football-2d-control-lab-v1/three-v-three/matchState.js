import { ACTION_LABELS, BALL_PHASE, FIELD, RULES, TEAM } from "./constants.js";

function player(id, team, role, x, y, humanSlot = null) {
  const facingX = team === TEAM.HOME ? 1 : -1;
  return {
    id, team, role, humanSlot, x, y, vx: 0, vy: 0, facingX, facingY: 0,
    hasBall: false, protectionRemaining: 0, protectionCooldown: 0,
    receptionRemaining: 0, callRemaining: 0, tackleRemaining: 0, recoveryRemaining: 0,
    defensiveBrakeRemaining: 0, deepBrakeRemaining: 0, recentBallLossRemaining: 0,
    supportState: "BALANCED", supportLockRemaining: 0, feintCooldown: 0,
    dribbleTouchRemaining: 0,
    jockeying: false, controlX: facingX, controlY: 0,
    receptionIntentX: facingX, receptionIntentY: 0, receptionIntentMagnitude: 0,
    orientedTouchX: facingX, orientedTouchY: 0, orientedTouchRemaining: 0,
    orientedTouchDistance: RULES.dribbleControlDistance,
    orientedTouchDuration: RULES.orientedTouchShortDuration,
    offBallShieldTargetId: null,
    ballControl: humanSlot ? 74 : 66,
    balance: humanSlot ? 72 : 65,
    aiDecisionRemaining: 0,
    aiPassCooldown: 0,
    aiCallCooldown: 0,
    aiCallReason: null,
    aiInput: {},
  };
}

function goalkeeper(id, team, x) {
  return { id, team, role: "goalkeeper", x, y: FIELD.height / 2, vx: 0, vy: 0, facingX: team === TEAM.HOME ? 1 : -1, facingY: 0 };
}

export function createMatchState({ online = false, aiLevel = 50, passSpeedLevel = 40, gameSpeedLevel = 50 } = {}) {
  const players = [
    player("home-human", TEAM.HOME, "human", 250, 270, "host"),
    player("home-left", TEAM.HOME, "support", 155, 155),
    player("home-right", TEAM.HOME, "support", 155, 385),
    player("away-human", TEAM.AWAY, online ? "human" : "anchor", 750, 270, online ? "guest" : null),
    player("away-left", TEAM.AWAY, "cover", 845, 155),
    player("away-right", TEAM.AWAY, "cover", 845, 385),
  ];
  const owner = players.find((entry) => entry.id === "home-left");
  owner.hasBall = true;
  return {
    version: 1,
    tick: 0,
    elapsed: 0,
    status: "playing",
    score: { home: 0, away: 0 },
    players,
    goalkeepers: [
      goalkeeper("home-goalkeeper", TEAM.HOME, FIELD.inset + 25),
      goalkeeper("away-goalkeeper", TEAM.AWAY, FIELD.width - FIELD.inset - 25),
    ],
    possession: { team: TEAM.HOME, playerId: owner.id, duel: null },
    possessionChangedAt: 0,
    ball: { x: owner.x + 23, y: owner.y, vx: 0, vy: 0, phase: BALL_PHASE.CONTROLLED, ownerId: owner.id, targetId: null, lastTouchId: owner.id },
    lastEvent: "kickoff",
    eventId: 0,
    aiLevel: Math.min(100, Math.max(0, Number(aiLevel) || 0)),
    passSpeedLevel: Math.min(100, Math.max(0, Number(passSpeedLevel) || 0)),
    gameSpeedLevel: Math.min(100, Math.max(0, Number(gameSpeedLevel) || 0)),
  };
}

export function controlledPlayerId(slot = "host") { return slot === "guest" ? "away-human" : "home-human"; }

export function getPlayer(state, id) { return state.players.find((entry) => entry.id === id) ?? null; }
export function getGoalkeeper(state, team) { return state.goalkeepers?.find((entry) => entry.team === team) ?? null; }
export function getOwner(state) { return state.ball.ownerId ? getPlayer(state, state.ball.ownerId) : null; }
export function getHumanPlayer(state, slot) { return getPlayer(state, controlledPlayerId(slot)); }
export function hasPossession(state, playerId) { return state.ball.ownerId === playerId; }
export function actionLabels(state, playerId) { return hasPossession(state, playerId) ? ACTION_LABELS.attack : ACTION_LABELS.defend; }

export function assertPossessionInvariant(state) {
  const owners = state.players.filter((entry) => entry.hasBall);
  if (state.ball.ownerId === null) return owners.length === 0 && state.possession.playerId === null;
  return owners.length === 1 && owners[0].id === state.ball.ownerId && state.possession.playerId === state.ball.ownerId;
}

export function resetAfterGoal(state, scoringTeam) {
  const fresh = createMatchState({ online: getPlayer(state, "away-human")?.humanSlot === "guest", aiLevel: state.aiLevel, passSpeedLevel: state.passSpeedLevel, gameSpeedLevel: state.gameSpeedLevel });
  const conceding = scoringTeam === TEAM.HOME ? TEAM.AWAY : TEAM.HOME;
  const ownerId = conceding === TEAM.HOME ? "home-left" : "away-left";
  for (const entry of fresh.players) entry.hasBall = entry.id === ownerId;
  const owner = getPlayer(fresh, ownerId);
  return {
    ...fresh,
    tick: state.tick,
    elapsed: state.elapsed,
    score: { ...state.score },
    ball: { ...fresh.ball, x: owner.x + owner.facingX * 23, y: owner.y, ownerId, lastTouchId: ownerId },
    possession: { team: conceding, playerId: ownerId, duel: null },
    possessionChangedAt: state.elapsed,
    lastEvent: "restart",
    eventId: state.eventId + 1,
  };
}

export const fieldBounds = Object.freeze({ minX: FIELD.inset + RULES.playerRadius, maxX: FIELD.width - FIELD.inset - RULES.playerRadius, minY: FIELD.inset + RULES.playerRadius, maxY: FIELD.height - FIELD.inset - RULES.playerRadius });
