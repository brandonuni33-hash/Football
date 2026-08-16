import test from "node:test";
import assert from "node:assert/strict";
import { ACTION_LABELS, BALL_PHASE, FIELD, RULES, TEAM, distance, movementFeelFromLevel, passSpeedFromLevel } from "../../prototype/football-2d-control-lab-v1/three-v-three/constants.js";
import { actionLabels, assertPossessionInvariant, createMatchState, getPlayer } from "../../prototype/football-2d-control-lab-v1/three-v-three/matchState.js";
import { clearPossession, givePossession } from "../../prototype/football-2d-control-lab-v1/three-v-three/possession.js";
import { pressDefensiveBrake, requestCall, startPass, startProtection, startShot, startTackle } from "../../prototype/football-2d-control-lab-v1/three-v-three/actions.js";
import { consumeInputActions, mergeInputFrames } from "../../prototype/football-2d-control-lab-v1/three-v-three/inputBuffer.js";
import { recoveryWindow, selectRecoveryCandidate } from "../../prototype/football-2d-control-lab-v1/three-v-three/ballRecovery.js";
import { collectAIInputs, defensiveRole, executeAIAction, looseBallRole } from "../../prototype/football-2d-control-lab-v1/three-v-three/ai.js";
import { stepMatch } from "../../prototype/football-2d-control-lab-v1/three-v-three/simulation.js";
import { crossedGoalLine, resolveGoalkeeperSave } from "../../prototype/football-2d-control-lab-v1/three-v-three/goalkeepers.js";
import { DEFEND_ROLE, buildTeamPlan } from "../../prototype/football-2d-control-lab-v1/three-v-three/teamBrain.js";

function advance(state, inputs, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i += 1) state = stepMatch(state, inputs, 1 / 60);
  return state;
}

test("avec ballon les boutons sont TIR PASSE PROT", () => {
  const state = createMatchState(); givePossession(state, "home-human");
  assert.deepEqual(actionLabels(state, "home-human"), ACTION_LABELS.attack);
});

test("sans ballon les boutons sont APPEL FREIN PROT", () => {
  assert.deepEqual(actionLabels(createMatchState(), "home-human"), ACTION_LABELS.defend);
});

test("le premier appui FREIN engage la posture sans tenter de récupérer", () => {
  const state = createMatchState();
  const player = getPlayer(state, "home-human");
  assert.equal(pressDefensiveBrake(state, player.id), true);
  assert.equal(player.defensiveBrakeRemaining, RULES.defensiveBrakeDuration);
  assert.equal(player.jockeying, true);
  assert.equal(state.ball.ownerId, "home-left");
  assert.equal(state.lastEvent, "defensive_brake");
});

test("le deuxième appui FREIN déclenche l'intervention au bon moment", () => {
  const state = createMatchState();
  const defender = getPlayer(state, "home-human");
  const owner = getPlayer(state, "away-human");
  givePossession(state, owner.id);
  owner.x = defender.x + 30; owner.y = defender.y;
  defender.facingX = 1; defender.facingY = 0;
  pressDefensiveBrake(state, defender.id);
  assert.ok(defender.defensiveBrakeRemaining > 0);
  pressDefensiveBrake(state, defender.id);
  assert.equal(defender.defensiveBrakeRemaining, 0);
  assert.equal(state.ball.ownerId, null);
  assert.equal(state.lastEvent, "tackle_won");
});

test("APPEL crée une demande temporaire sans forcer la passe", () => {
  const state = createMatchState();
  assert.equal(requestCall(state, "home-human"), true);
  assert.equal(getPlayer(state, "home-human").callRemaining, RULES.callDuration);
  assert.equal(state.ball.phase, BALL_PHASE.CONTROLLED);
});

test("la passe libère et déplace réellement le ballon", () => {
  const state = createMatchState();
  assert.equal(startPass(state, "home-left", "home-human"), true);
  const x = state.ball.x; stepMatch(state, {}, 1 / 60);
  assert.equal(state.ball.phase, BALL_PHASE.PASS);
  assert.notEqual(state.ball.x, x);
  assert.equal(state.ball.ownerId, null);
});

test("une réception change la possession", () => {
  let state = createMatchState(); startPass(state, "home-left", "home-human");
  state.ball.x = getPlayer(state, "home-human").x; state.ball.y = getPlayer(state, "home-human").y; state.ball.vx = 100; state.ball.vy = 0;
  state = stepMatch(state, {}, 1 / 60);
  assert.equal(state.ball.ownerId, "home-human");
  assert.equal(state.possession.team, TEAM.HOME);
});

test("protection dure trois secondes et cooldown deux secondes", () => {
  let state = createMatchState(); givePossession(state, "home-human"); startProtection(state, "home-human");
  assert.equal(getPlayer(state, "home-human").protectionRemaining, 3);
  state = advance(state, {}, 3.05);
  assert.equal(getPlayer(state, "home-human").protectionRemaining, 0);
  assert.ok(getPlayer(state, "home-human").protectionCooldown > 1.8);
});

test("stick droit reste actif et vitesse plafonnée sous protection", () => {
  let state = createMatchState(); givePossession(state, "home-human"); startProtection(state, "home-human");
  state = advance(state, { host: { moveX: 1, controlX: 0, controlY: -1 } }, 0.25);
  const player = getPlayer(state, "home-human");
  assert.ok(player.facingY < -0.9);
  assert.ok(Math.hypot(player.vx, player.vy) <= RULES.maxSpeed * RULES.protectionSpeedScale + 0.1);
});

test("protection avant passe permet un contrôle orienté à la réception", () => {
  let state = createMatchState(); startPass(state, "home-left", "home-human");
  state = stepMatch(state, { host: { tertiaryPressed: true, controlX: 0, controlY: 1 } }, 1 / 60);
  assert.ok(getPlayer(state, "home-human").protectionRemaining > 0);
  state.ball.x = getPlayer(state, "home-human").x; state.ball.y = getPlayer(state, "home-human").y; state.ball.vx = 80;
  state = stepMatch(state, { host: { controlX: 0, controlY: 1 } }, 1 / 60);
  assert.equal(state.ball.ownerId, "home-human");
  assert.equal(state.lastEvent, "protected_reception");
  assert.ok(getPlayer(state, "home-human").facingY > 0.9);
});

test("FREIN recule sans retourner le joueur", () => {
  let state = createMatchState({ online: true });
  const player = getPlayer(state, "home-human"); player.x = 500; player.y = 270;
  givePossession(state, "away-human"); const owner = getPlayer(state, "away-human"); owner.x = 650; owner.y = 270;
  state = advance(state, { host: { moveX: -1, jockeyHeld: true } }, 0.2);
  assert.ok(player.x < 500);
  assert.ok(player.facingX > 0.9);
  assert.equal(player.jockeying, true);
});

test("TACLE est défensif et un mauvais timing impose une récupération", () => {
  const state = createMatchState(); givePossession(state, "home-human");
  assert.equal(startTackle(state, "home-human"), false);
  givePossession(state, "away-human");
  const defender = getPlayer(state, "home-human"); const owner = getPlayer(state, "away-human"); owner.x = defender.x + 180;
  assert.equal(startTackle(state, defender.id), true);
  assert.equal(state.lastEvent, "tackle_missed");
  assert.equal(defender.recoveryRemaining, RULES.missedTackleRecovery);
});

test("un tacle proche et dans l'angle libère le ballon", () => {
  const state = createMatchState(); givePossession(state, "away-human");
  const defender = getPlayer(state, "home-human"); const owner = getPlayer(state, "away-human");
  owner.x = defender.x + 30; owner.y = defender.y; defender.facingX = 1; defender.facingY = 0;
  assert.equal(startTackle(state, defender.id), true);
  assert.equal(state.ball.ownerId, null);
  assert.equal(state.ball.phase, BALL_PHASE.FREE);
});

test("un seul joueur peut posséder le ballon et le ballon libre est explicite", () => {
  const state = createMatchState(); givePossession(state, "home-human"); givePossession(state, "away-human");
  assert.equal(state.players.filter((player) => player.hasBall).length, 1);
  assert.equal(assertPossessionInvariant(state), true);
  clearPossession(state);
  assert.equal(state.ball.ownerId, null);
  assert.equal(state.possession.team, null);
  assert.equal(assertPossessionInvariant(state), true);
});

test("le 3v3 contient exactement six joueurs dont un seul humain en solo", () => {
  const state = createMatchState();
  assert.equal(state.players.length, 6);
  assert.equal(state.players.filter((player) => player.humanSlot).length, 1);
  assert.equal(state.players.filter((player) => player.team === TEAM.HOME).length, 3);
  assert.equal(state.players.filter((player) => player.team === TEAM.AWAY).length, 3);
  assert.equal(state.goalkeepers.length, 2);
  assert.equal(state.goalkeepers.filter((keeper) => keeper.team === TEAM.HOME).length, 1);
  assert.equal(state.goalkeepers.filter((keeper) => keeper.team === TEAM.AWAY).length, 1);
});

test("FREIN est légèrement plus rapide tout en restant une posture contenue", () => {
  assert.equal(RULES.jockeySpeedScale, 0.52);
  assert.ok(RULES.jockeySpeedScale > 0.48);
  assert.ok(RULES.jockeySpeedScale < 0.6);
});

test("le franchissement de la ligne entre les poteaux vaut but même sur un tir rapide", () => {
  assert.equal(crossedGoalLine({ x: 80, y: 250 }, { x: 10, y: 250 }), TEAM.HOME);
  assert.equal(crossedGoalLine({ x: 920, y: 300 }, { x: 990, y: 300 }), TEAM.AWAY);
  assert.equal(crossedGoalLine({ x: 80, y: 180 }, { x: 10, y: 180 }), null);
});

test("un gardien placé sur la trajectoire peut arrêter le tir avant la ligne", () => {
  const state = createMatchState();
  clearPossession(state, BALL_PHASE.SHOT);
  state.ball.x = 48; state.ball.y = 270; state.ball.vx = -340; state.ball.vy = 0;
  const save = resolveGoalkeeperSave(state, { x: 70, y: 270 });
  assert.equal(save?.id, "home-goalkeeper");
  assert.equal(state.ball.phase, BALL_PHASE.FREE);
  assert.ok(state.ball.vx > 0);
  assert.equal(state.lastEvent, "goalkeeper_save");
});

test("un ballon qui atteint la ligne après avoir dépassé le gardien augmente le score", () => {
  let state = createMatchState();
  clearPossession(state, BALL_PHASE.SHOT);
  state.ball.x = FIELD.width - FIELD.inset - 4;
  state.ball.y = FIELD.goalTop + 12;
  state.ball.vx = 430;
  state.ball.vy = 0;
  state = stepMatch(state, {}, 1 / 60);
  assert.equal(state.score.home, 1);
  assert.equal(state.score.away, 0);
  assert.equal(state.lastEvent, "restart");
  assert.equal(state.goalkeepers.length, 2);
});

test("TIR utilise l'orientation du joueur quand le stick droit est au repos", () => {
  const state = createMatchState();
  const player = getPlayer(state, "home-human");
  player.facingX = 1; player.facingY = 0;
  givePossession(state, player.id);
  assert.equal(startShot(state, player.id, { x: 0, y: 0 }, 0.75), true);
  assert.equal(state.ball.phase, BALL_PHASE.SHOT);
  assert.ok(state.ball.vx > 300);
  assert.equal(state.ball.vy, 0);
});

test("un appui bref reste mémorisé jusqu'au prochain pas physique", () => {
  let buffered = mergeInputFrames({}, { primaryPressed: true, moveX: 0 });
  buffered = mergeInputFrames(buffered, { primaryPressed: false, moveX: 1 });
  assert.equal(buffered.primaryPressed, true);
  assert.equal(buffered.moveX, 1);
  buffered = consumeInputActions(buffered);
  assert.equal(buffered.primaryPressed, false);
});

test("le niveau IA 0 à 100 modifie son délai de décision", () => {
  const slow = createMatchState({ aiLevel: 0 });
  const sharp = createMatchState({ aiLevel: 100 });
  collectAIInputs(slow);
  collectAIInputs(sharp);
  assert.equal(slow.aiLevel, 0);
  assert.equal(sharp.aiLevel, 100);
  assert.ok(getPlayer(slow, "home-left").aiDecisionRemaining > getPlayer(sharp, "home-left").aiDecisionRemaining);
});

test("sous protection le ballon suit le corps en reculant vers ses buts", () => {
  let state = createMatchState();
  const player = getPlayer(state, "home-human");
  givePossession(state, player.id);
  startProtection(state, player.id);
  state = stepMatch(state, { host: { moveX: -1, controlX: 0, controlY: 0 } }, 0.1);
  assert.ok(player.facingX < -0.9);
  assert.ok(state.ball.x < player.x, "le ballon doit rester devant le corps et non dans son dos");
});

test("la récupération dépend de la distance vitesse orientation et état", () => {
  const state = createMatchState();
  clearPossession(state);
  const player = getPlayer(state, "home-human");
  state.ball.x = player.x + 20; state.ball.y = player.y; state.ball.vx = 120; state.ball.vy = 0;
  assert.equal(recoveryWindow(player, state.ball).eligible, true);
  state.ball.vx = 700;
  assert.equal(recoveryWindow(player, state.ball).eligible, false, "un ballon trop rapide ne doit pas être aspiré");
  state.ball.vx = 120; player.facingX = -1;
  assert.equal(recoveryWindow(player, state.ball).eligible, false, "un joueur dos au ballon ne le récupère pas magnétiquement");
  player.facingX = 1; player.recoveryRemaining = 0.5;
  assert.equal(recoveryWindow(player, state.ball).eligible, false, "un joueur déséquilibré ne récupère pas immédiatement");
});

test("si deux joueurs sont proches la meilleure fenêtre remporte le ballon", () => {
  const state = createMatchState(); clearPossession(state);
  const home = getPlayer(state, "home-human"); const away = getPlayer(state, "away-human");
  state.ball.x = 480; state.ball.y = 270; state.ball.vx = 40; state.ball.vy = 0;
  home.x = 460; home.y = 270; home.facingX = 1; home.ballControl = 80;
  away.x = 506; away.y = 270; away.facingX = -1; away.ballControl = 60;
  assert.equal(selectRecoveryCandidate([home, away], state.ball).id, home.id);
});

test("le rythme de jeu garde joueurs et passes sous les nouvelles limites", () => {
  assert.equal(RULES.maxSpeed, 143);
  assert.equal(passSpeedFromLevel(0), 170);
  assert.equal(passSpeedFromLevel(100), 360);
  assert.ok(RULES.acceleration <= 650);
});

test("le curseur vitesse du jeu couvre une plage 0 à 100 réellement différente", () => {
  assert.ok(movementFeelFromLevel(100).maxSpeed > movementFeelFromLevel(0).maxSpeed * 1.7);
  assert.ok(movementFeelFromLevel(100).acceleration > movementFeelFromLevel(0).acceleration);
  const slow = createMatchState({ gameSpeedLevel: 0 });
  const fast = createMatchState({ gameSpeedLevel: 100 });
  advance(slow, { host: { moveX: 1 } }, 0.5);
  advance(fast, { host: { moveX: 1 } }, 0.5);
  assert.ok(getPlayer(fast, "home-human").x > getPlayer(slow, "home-human").x + 12);
});

test("le stick gauche reste en allure normale et RAPIDE libère la course", () => {
  const normal = createMatchState({ online: true, gameSpeedLevel: 50 });
  const rapid = createMatchState({ online: true, gameSpeedLevel: 50 });
  const normalPlayer = getPlayer(normal, "home-human");
  const rapidPlayer = getPlayer(rapid, "home-human");
  advance(normal, { host: { moveX: 1 } }, 0.6);
  advance(rapid, { host: { moveX: 1, rapidHeld: true } }, 0.6);
  assert.equal(RULES.normalPaceScale, 0.76);
  assert.ok(rapidPlayer.x > normalPlayer.x + 12);
});

test("FREIN libère le joueur rapidement s'il ne déclenche pas le tacle", () => {
  let state = createMatchState({ online: true });
  const defender = getPlayer(state, "home-human");
  const owner = getPlayer(state, "away-human");
  givePossession(state, owner.id);
  pressDefensiveBrake(state, defender.id);
  assert.equal(defender.defensiveBrakeRemaining, 1.2);
  state = advance(state, {}, 1.25);
  assert.equal(defender.defensiveBrakeRemaining, 0);
  assert.equal(defender.jockeying, false);
});

test("deux pressions successives sur le vrai bouton FREIN lancent le tacle", () => {
  let state = createMatchState({ online: true });
  const defender = getPlayer(state, "home-human");
  const owner = getPlayer(state, "away-human");
  givePossession(state, owner.id);
  owner.x = defender.x + 30; owner.y = defender.y;
  defender.facingX = 1; defender.facingY = 0;
  state = stepMatch(state, { host: { secondaryPressed: true } }, 1 / 60);
  assert.ok(defender.defensiveBrakeRemaining > 0);
  assert.equal(state.ball.ownerId, owner.id);
  state = stepMatch(state, { host: { secondaryPressed: true } }, 1 / 60);
  assert.equal(state.ball.ownerId, null);
  assert.equal(state.lastEvent, "tackle_won");
});

test("le terrain de la vertical slice est légèrement élargi", () => {
  assert.equal(FIELD.width, 1000);
});

test("le curseur 0 à 100 modifie réellement la vitesse des passes", () => {
  const slow = createMatchState({ passSpeedLevel: 0 });
  const fast = createMatchState({ passSpeedLevel: 100 });
  startPass(slow, "home-left", "home-human");
  startPass(fast, "home-left", "home-human");
  assert.equal(slow.passSpeedLevel, 0);
  assert.equal(fast.passSpeedLevel, 100);
  assert.ok(Math.hypot(fast.ball.vx, fast.ball.vy) > Math.hypot(slow.ball.vx, slow.ball.vy) * 2);
});

test("la passe humaine est fortement assistée sans supprimer l'intention", () => {
  const state = createMatchState({ passSpeedLevel: 50 });
  const passer = getPlayer(state, "home-human");
  const target = getPlayer(state, "home-left");
  const other = getPlayer(state, "home-right");
  passer.x = 400; passer.y = 270; passer.facingX = 0; passer.facingY = -1;
  target.x = 500; target.y = 270;
  other.x = 70; other.y = 470;
  givePossession(state, passer.id);
  startPass(state, passer.id, null, { x: 0, y: -1 });
  assert.equal(state.ball.targetId, target.id);
  assert.ok(state.ball.vx > 0, "l'assistance doit rapprocher la passe du partenaire");
  assert.ok(state.ball.vy < 0, "l'intention du stick doit encore influencer la trajectoire");
  assert.ok(Math.abs(state.ball.vy) < state.ball.vx * 0.35, "l'assistance doit rester majoritaire");
});

test("le milieu adverse participe au pressing au lieu de rester immobile", () => {
  let state = createMatchState({ aiLevel: 50 });
  const middle = getPlayer(state, "away-human");
  const before = { x: middle.x, y: middle.y };
  state = advance(state, {}, 0.5);
  assert.ok(Math.hypot(middle.x - before.x, middle.y - before.y) > 4);
});

test("le pressing normal produit un seul duel principal", () => {
  const state = createMatchState({ aiLevel: 70 });
  const defenders = state.players.filter((player) => player.team === TEAM.AWAY);
  assert.equal(defenders.filter((player) => defensiveRole(state, player) === "press").length, 1);
  assert.equal(defenders.filter((player) => defensiveRole(state, player) === "trap").length, 0);
});

test("à distance intermédiaire le défenseur temporise au lieu de foncer", () => {
  const state = createMatchState({ aiLevel: 80 });
  const owner = getPlayer(state, "home-human");
  const defender = getPlayer(state, "away-human");
  givePossession(state, owner.id);
  owner.x = 500; owner.y = 270;
  defender.x = 600; defender.y = 270;
  const intent = collectAIInputs(state)[defender.id];
  assert.equal(defensiveRole(state, defender), "press");
  assert.equal(intent.jockeyHeld, true);
  assert.equal(intent.tacklePressed, undefined);
  assert.ok(Math.hypot(intent.moveX, intent.moveY) <= 0.41);
});

test("l'IA n'utilise jamais FREIN dans le dos du porteur", () => {
  const state = createMatchState({ aiLevel: 80 });
  const owner = getPlayer(state, "home-human");
  const defender = getPlayer(state, "away-human");
  givePossession(state, owner.id);
  owner.x = 500; owner.y = 270;
  defender.x = 450; defender.y = 270;
  const intent = collectAIInputs(state)[defender.id];
  assert.equal(defensiveRole(state, defender), "press");
  assert.notEqual(intent.jockeyHeld, true);
  assert.ok(intent.moveX > 0, "le défenseur doit dépasser le porteur pour retrouver une position frontale");
});

test("couverture et replacement n'activent pas FREIN près du ballon", () => {
  const state = createMatchState({ aiLevel: 80 });
  const owner = getPlayer(state, "home-human");
  givePossession(state, owner.id);
  owner.x = 500; owner.y = 270;
  const plan = buildTeamPlan(state, TEAM.AWAY);
  const coverId = [...plan.assignments].find(([, role]) => role === DEFEND_ROLE.COVER)[0];
  const cover = getPlayer(state, coverId);
  const intent = collectAIInputs(state)[cover.id];
  assert.notEqual(intent.jockeyHeld, true);
});

test("le 2 contre 1 ne s'active que dans une zone de piège rare", () => {
  const state = createMatchState({ aiLevel: 70 });
  const owner = getPlayer(state, "home-left");
  owner.x = 720; owner.y = 60;
  const defenders = state.players.filter((player) => player.team === TEAM.AWAY);
  assert.equal(defenders.filter((player) => ["press", "trap"].includes(defensiveRole(state, player))).length, 2);
});

test("une IA proche exécute réellement son tacle et peut gagner le ballon", () => {
  const state = createMatchState({ aiLevel: 80 });
  const owner = getPlayer(state, "home-human");
  const defender = getPlayer(state, "away-human");
  givePossession(state, owner.id);
  owner.x = 500; owner.y = 270;
  defender.x = 532; defender.y = 270; defender.facingX = -1; defender.facingY = 0;
  const intent = collectAIInputs(state)[defender.id];
  assert.equal(intent.tacklePressed, true);
  executeAIAction(state, defender, intent);
  assert.equal(state.ball.ownerId, null);
  assert.equal(state.lastEvent, "tackle_won");
});

test("sur ballon libre une seule IA par équipe attaque directement le ballon", () => {
  const state = createMatchState({ aiLevel: 60 });
  clearPossession(state);
  state.ball.x = 480; state.ball.y = 270;
  for (const team of [TEAM.HOME, TEAM.AWAY]) {
    const aiPlayers = state.players.filter((player) => player.team === team && !player.humanSlot);
    assert.equal(aiPlayers.filter((player) => looseBallRole(state, player) === "recover").length, 1);
  }
});

test("le joueur IA désigné se rapproche réellement du ballon libre", () => {
  let state = createMatchState({ aiLevel: 80 });
  clearPossession(state);
  state.ball.x = 480; state.ball.y = 270; state.ball.vx = 0; state.ball.vy = 0;
  const chaser = state.players.find((player) => player.team === TEAM.AWAY && looseBallRole(state, player) === "recover");
  const before = distance(chaser, state.ball);
  state = advance(state, {}, 0.5);
  assert.ok(distance(chaser, state.ball) < before - 4);
});

test("les partenaires IA anticipent sans tous s'entasser sur le ballon libre", () => {
  const state = createMatchState({ aiLevel: 60 });
  clearPossession(state);
  state.ball.x = 480; state.ball.y = 270;
  const inputs = collectAIInputs(state);
  const away = state.players.filter((player) => player.team === TEAM.AWAY);
  const direct = away.filter((player) => looseBallRole(state, player) === "recover");
  const support = away.filter((player) => looseBallRole(state, player) === "support");
  assert.equal(direct.length, 1);
  assert.equal(support.length, 2);
  assert.notDeepEqual(inputs[support[0].id], inputs[direct[0].id]);
});

test("le tir reste libéré et ne revient pas immédiatement au tireur", () => {
  let state = createMatchState();
  const player = getPlayer(state, "home-human");
  givePossession(state, player.id);
  startShot(state, player.id, { x: 1, y: 0 }, 0.8);
  const startX = state.ball.x;
  state = advance(state, {}, 0.18);
  assert.equal(state.ball.ownerId, null);
  assert.equal(state.ball.phase, BALL_PHASE.SHOT);
  assert.ok(state.ball.x > startX + 45);
});

test("APPEL est le premier bouton sans ballon", () => {
  let state = createMatchState();
  state = stepMatch(state, { host: { primaryPressed: true } }, 1 / 60);
  assert.ok(getPlayer(state, "home-human").callRemaining > 0);
  assert.equal(state.ball.targetId, "home-human", "l'IA peut répondre immédiatement à l'appel");
});

test("une IA porteuse cherche spontanément une passe vers le joueur humain", () => {
  const state = createMatchState({ aiLevel: 80 });
  const passer = getPlayer(state, "home-left");
  const intent = collectAIInputs(state)[passer.id];
  assert.equal(intent.passPressed, true);
  assert.equal(intent.targetId, "home-human");
  executeAIAction(state, passer, intent);
  assert.equal(state.ball.phase, BALL_PHASE.PASS);
  assert.equal(state.ball.targetId, "home-human");
});

test("toute réception peut être orientée avec le stick droit", () => {
  let state = createMatchState();
  startPass(state, "home-left", "home-human");
  const receiver = getPlayer(state, "home-human");
  state = stepMatch(state, { host: { controlX: 0, controlY: -1 } }, 1 / 60);
  state.ball.x = receiver.x; state.ball.y = receiver.y; state.ball.vx = 70; state.ball.vy = 0;
  state = stepMatch(state, { host: { controlX: 0, controlY: -1 } }, 1 / 60);
  assert.equal(state.ball.ownerId, receiver.id);
  assert.ok(receiver.orientedTouchRemaining > 0);
  assert.ok(receiver.facingY < -0.9);
  assert.ok(state.ball.y < receiver.y - 35);
  assert.equal(state.lastEvent, "oriented_reception");
});

test("PROT hors ballon accroche un défenseur seulement si notre équipe possède", () => {
  let state = createMatchState();
  const player = getPlayer(state, "home-human");
  const marker = getPlayer(state, "away-human");
  marker.x = player.x + 45; marker.y = player.y;
  assert.equal(startProtection(state, player.id), true);
  assert.equal(player.offBallShieldTargetId, marker.id);
  state = stepMatch(state, { host: {} }, 0.1);
  assert.equal(player.facingX, -1);

  state = createMatchState();
  givePossession(state, "away-human");
  const defender = getPlayer(state, "home-human");
  getPlayer(state, "away-human").x = defender.x + 40;
  assert.equal(startProtection(state, defender.id), false);
  assert.equal(defender.protectionRemaining, 0);
});
