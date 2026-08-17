import * as base from "./interactionGameplayV7.js?strict-role-v8";

export const VIEWPORT = base.VIEWPORT;
export const PITCH = base.PITCH;
export const TEAM = base.TEAM;
export const BALL_PHASE = base.BALL_PHASE;
export const RULES = base.RULES;
export const INTERACTION_RULES = base.INTERACTION_RULES;
export const CONTROLLED_ID = base.CONTROLLED_ID;
export const TUNING_DEFAULTS = base.TUNING_DEFAULTS;
export const ROLE_RULES = base.ROLE_RULES;
export const getControlledPlayer = base.getControlledPlayer;
export const getPlayer = base.getPlayer;
export const getOwner = base.getOwner;
export const controlMode = base.controlMode;
export const cameraGeometry = base.cameraGeometry;
export const cameraFromBall = base.cameraFromBall;
export const isPointVisible = base.isPointVisible;
export const formationSummary = base.formationSummary;
export const setGameplayTuning = base.setGameplayTuning;
export const getGameplayTuning = base.getGameplayTuning;
export const isIncomingAerial = base.isIncomingAerial;
export const actionLabels = base.actionLabels;

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(x, y) {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= 0.0001) return { x: 0, y: 0, magnitude: 0 };
  return { x: x / magnitude, y: y / magnitude, magnitude };
}

function label(player) {
  return player?.positionLabel ?? player?.role ?? "";
}

function isCB(player) {
  return ["RCB", "LCB"].includes(label(player));
}

function isFullback(player) {
  return ["RB", "LB"].includes(label(player));
}

function isMidfielder(player) {
  return ["DM", "CM", "AM", "RM", "LM"].includes(label(player));
}

function isWinger(player) {
  return ["RW", "LW", "RM", "LM"].includes(label(player));
}

function teamKey(team) {
  return team === TEAM.HOME ? "home" : "away";
}

function teamDirection(team) {
  return team === TEAM.HOME ? 1 : -1;
}

function attackProgress(team, x) {
  return team === TEAM.HOME ? x / PITCH.width : (PITCH.width - x) / PITCH.width;
}

function fullbackSide(player) {
  if (label(player) === "RB") return "top";
  if (label(player) === "LB") return "bottom";
  return player.originY < PITCH.height / 2 ? "top" : "bottom";
}

function sameSideWinger(state, fullback) {
  const side = fullbackSide(fullback);
  return state.players.find((player) => (
    player.team === fullback.team
    && isWinger(player)
    && (player.originY < PITCH.height / 2 ? "top" : "bottom") === side
  )) ?? null;
}

function lanePressure(state, fullback) {
  const dir = teamDirection(fullback.team);
  let nearest = Infinity;
  for (const opponent of state.players) {
    if (opponent.team === fullback.team) continue;
    const forward = (opponent.x - fullback.x) * dir;
    if (forward < -35 || forward > 260) continue;
    if (Math.abs(opponent.y - fullback.y) > PITCH.height * 0.12) continue;
    nearest = Math.min(nearest, distance(opponent, fullback));
  }
  return nearest;
}

function strictOverlapReason(state, fullback) {
  const owner = getOwner(state);
  if (!owner || owner.team !== fullback.team || fullback.hasBall) return false;
  if (attackProgress(fullback.team, state.ball.x) < ROLE_RULES.fullbackOverlapProgress) return false;

  const side = fullbackSide(fullback);
  const ballSide = state.ball.y < PITCH.height * ROLE_RULES.fullbackWideZone
    ? "top"
    : state.ball.y > PITCH.height * (1 - ROLE_RULES.fullbackWideZone)
      ? "bottom"
      : "center";
  if (ballSide !== side) return false;

  const winger = sameSideWinger(state, fullback);
  const insetY = PITCH.insetY ?? PITCH.inset;
  const wingerTouchDistance = winger
    ? side === "top"
      ? winger.y - insetY
      : PITCH.height - insetY - winger.y
    : 0;
  const wingerInside = winger ? wingerTouchDistance > PITCH.height * 0.15 : false;
  const midfielderNearSide = isMidfielder(owner)
    && Math.abs(owner.y - fullback.originY) < PITCH.height * 0.23;
  const wingerCarriesInside = winger
    && owner.id === winger.id
    && wingerTouchDistance > PITCH.height * 0.10;
  if (!wingerInside && !midfielderNearSide && !wingerCarriesInside) return false;
  if (lanePressure(state, fullback) < ROLE_RULES.fullbackLanePressure) return false;

  const dir = teamDirection(fullback.team);
  const restDefense = state.players.filter((player) => (
    player.team === fullback.team
    && (isCB(player) || (isFullback(player) && player.id !== fullback.id))
    && (state.ball.x - player.x) * dir >= ROLE_RULES.fullbackSupportBehindBall
  )).length;
  return restDefense >= 2;
}

function enforceStrictFullbacks(state) {
  const mid = PITCH.width / 2;
  for (const team of [TEAM.HOME, TEAM.AWAY]) {
    const key = teamKey(team);
    const fullbacks = state.players.filter((player) => player.team === team && isFullback(player));
    const accepted = fullbacks.find((player) => strictOverlapReason(state, player))?.id ?? null;

    if (state.formationTactical?.[key]) {
      state.formationTactical[key].overlapId = accepted;
    }
    if (state.contextualRuns?.[key]) {
      if (state.contextualRuns[key].activeOverlapId !== accepted) {
        state.contextualRuns[key].activeOverlapId = null;
        state.contextualRuns[key].overlapUntil = 0;
      }
    }

    for (const fullback of fullbacks) {
      if (fullback.id === accepted || fullback.hasBall) continue;
      const safe = team === TEAM.HOME
        ? mid - ROLE_RULES.fullbackSafeMargin
        : mid + ROLE_RULES.fullbackSafeMargin;
      if ((team === TEAM.HOME && fullback.x > safe) || (team === TEAM.AWAY && fullback.x < safe)) {
        fullback.x = team === TEAM.HOME ? Math.min(fullback.x, safe) : Math.max(fullback.x, safe);
        fullback.vx *= 0.45;
        fullback.tacticalRole = "fullback-hold";
      }
    }
  }
}

function deterministic01(state, salt) {
  const raw = Math.sin((state.tick + 3) * 17.231 + salt * 31.77) * 48371.27;
  return raw - Math.floor(raw);
}

function autoAerialControl(state, preAerial, preResolution) {
  if (!preAerial?.active || !preAerial.targetId) return;
  const player = getPlayer(state, preAerial.targetId);
  if (!player?.controlled) return;
  if (state.gameplayV7?.aerialLastResolution !== preResolution) return;
  if (state.gameplayV7?.aerialIntent) return;

  const height = Math.max(preAerial.height ?? 0, state.ball.lobHeight ?? 0);
  const gap = distance(player, state.ball);
  if (gap > ROLE_RULES.aerialContactRadius || height > 42) return;

  const chest = height > ROLE_RULES.aerialChestHeight;
  const lossChance = chest ? ROLE_RULES.autoChestLossChance : ROLE_RULES.autoFootLossChance;
  const lost = deterministic01(state, chest ? 101 : 83) < lossChance;

  for (const candidate of state.players) candidate.hasBall = false;
  if (lost) {
    const dir = normalize(
      player.facingX + (deterministic01(state, 53) - 0.5) * 0.8,
      player.facingY + (deterministic01(state, 67) - 0.5) * 0.8,
    );
    state.ball.ownerId = null;
    state.ball.phase = BALL_PHASE.FREE;
    state.ball.targetId = null;
    state.ball.lastTouchId = player.id;
    state.ball.lobActive = false;
    state.ball.lobHeight = 0;
    state.ball.lobVz = 0;
    state.ball.vx = dir.x * 110;
    state.ball.vy = dir.y * 110;
    state.possession = { team: null, playerId: null };
    state.lastEvent = "auto_aerial_miscontrol";
    state.eventId += 1;
    state.gameplayV7.aerialLastResolution = "auto_aerial_miscontrol";
    return;
  }

  player.hasBall = true;
  state.ball.ownerId = player.id;
  state.ball.phase = BALL_PHASE.CONTROLLED;
  state.ball.targetId = null;
  state.ball.lastTouchId = player.id;
  state.ball.lobActive = false;
  state.ball.lobHeight = 0;
  state.ball.lobVz = 0;
  state.ball.x = player.x + player.facingX * (chest ? 18 : 15);
  state.ball.y = player.y + player.facingY * (chest ? 18 : 15);
  state.ball.vx = player.vx * 0.2;
  state.ball.vy = player.vy * 0.2;
  state.possession = { team: player.team, playerId: player.id };
  state.lastEvent = chest ? "chest_control" : "foot_control";
  state.eventId += 1;
  state.gameplayV7.aerialLastResolution = state.lastEvent;
}

export function createGameplayState() {
  return base.createGameplayState();
}

export function stepGameplay(state, input = {}, dt = RULES.fixedStep) {
  const preAerial = state.ball.lobActive
    ? {
      active: true,
      targetId: state.ball.targetId ?? state.ball.lobTargetId ?? null,
      height: state.ball.lobHeight ?? 0,
    }
    : null;
  const preResolution = state.gameplayV7?.aerialLastResolution ?? null;
  const next = base.stepGameplay(state, input, dt);
  autoAerialControl(next, preAerial, preResolution);
  enforceStrictFullbacks(next);
  return next;
}
