import test from "node:test";
import assert from "node:assert/strict";
import { ACTION_LABELS, BALL_PHASE, RULES, TEAM, distance, passSpeedFromLevel } from "../../prototype/football-2d-control-lab-v1/three-v-three/constants.js";
import { actionLabels, assertPossessionInvariant, createMatchState, getPlayer } from "../../prototype/football-2d-control-lab-v1/three-v-three/matchState.js";
import { clearPossession, givePossession } from "../../prototype/football-2d-control-lab-v1/three-v-three/possession.js";
import { requestCall, startPass, startProtection, startShot, startTackle } from "../../prototype/football-2d-control-lab-v1/three-v-three/actions.js";
import { consumeInputActions, mergeInputFrames } from "../../prototype/football-2d-control-lab-v1/three-v-three/inputBuffer.js";
import { recoveryWindow, selectRecoveryCandidate } from "../../prototype/football-2d-control-lab-v1/three-v-three/ballRecovery.js";
import { collectAIInputs, defensiveRole, executeAIAction, looseBallRole } from "../../prototype/football-2d-control-lab-v1/three-v-three/ai.js";
import { stepMatch } from "../../prototype/football-2d-control-lab-v1/three-v-three/simulation.js";

function advance(state, inputs, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i += 1) state = stepMatch(state, inputs, 1 / 60);
  return state;
}

test("avec ballon les boutons sont TIR PASSE PROT", () => {
  const state = createMatchState(); givePossession(state, "home-human");
  assert.deepEqual(actionLabels(state, "home-human"), ACTION_LABELS.attack);
});

test("sans ballon les boutons sont TACLE APPEL FREIN", () => {
  assert.deepEqual(actionLabels(createMatchState(), "home-human"), ACTION_LABELS.defend);
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
  let state = createMatchState();
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
  assert.equal(RULES.maxSpeed, 142);
  assert.equal(passSpeedFromLevel(0), 170);
  assert.equal(passSpeedFromLevel(100), 360);
  assert.ok(RULES.acceleration <= 650);
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