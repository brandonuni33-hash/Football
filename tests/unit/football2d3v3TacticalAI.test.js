import test from "node:test";
import assert from "node:assert/strict";
import { RULES, TEAM, distance } from "../../prototype/football-2d-control-lab-v1/three-v-three/constants.js";
import { assertPossessionInvariant, createMatchState, getPlayer } from "../../prototype/football-2d-control-lab-v1/three-v-three/matchState.js";
import { givePossession } from "../../prototype/football-2d-control-lab-v1/three-v-three/possession.js";
import { stepMatch } from "../../prototype/football-2d-control-lab-v1/three-v-three/simulation.js";
import { ATTACK_ROLE, DEFEND_ROLE, buildTeamPlan, evaluatePassingLane } from "../../prototype/football-2d-control-lab-v1/three-v-three/teamBrain.js";
import { chooseCarrierIntent, evaluateCarrierOptions, evaluateTackle } from "../../prototype/football-2d-control-lab-v1/three-v-three/utilityAI.js";
import { SUPPORT_STATE, footworkAccelerationScale, reactToBodyFeint } from "../../prototype/football-2d-control-lab-v1/three-v-three/footwork.js";

function advance(state, seconds) {
  for (let index = 0; index < Math.ceil(seconds * 60); index += 1) state = stepMatch(state, {}, 1 / 60);
  return state;
}

test("le cerveau d'équipe crée un soutien et une profondeur distincts", () => {
  const state = createMatchState({ online: true });
  const owner = getPlayer(state, "home-human");
  owner.x = 470; owner.y = 270;
  givePossession(state, owner.id);
  const plan = buildTeamPlan(state, TEAM.HOME);
  assert.deepEqual([...plan.assignments.values()].sort(), [ATTACK_ROLE.DEPTH, ATTACK_ROLE.SUPPORT].sort());
  const targets = [...plan.targets.values()];
  assert.ok(distance(targets[0], targets[1]) > 150);
  assert.ok(targets.some((target) => target.x < owner.x));
  assert.ok(targets.some((target) => target.x > owner.x));
});

test("les rôles offensifs s'échangent quand les positions relatives changent", () => {
  const state = createMatchState({ online: true });
  const owner = getPlayer(state, "home-human");
  const left = getPlayer(state, "home-left");
  const right = getPlayer(state, "home-right");
  owner.x = 500; owner.y = 270; left.x = 450; left.y = 245; right.x = 250; right.y = 390;
  givePossession(state, owner.id);
  const before = buildTeamPlan(state, TEAM.HOME).assignments.get(left.id);
  left.x = 170; left.y = 120; right.x = 480; right.y = 290;
  const after = buildTeamPlan(state, TEAM.HOME).assignments.get(left.id);
  assert.equal(before, ATTACK_ROLE.SUPPORT);
  assert.equal(after, ATTACK_ROLE.DEPTH);
});

test("les trois défenseurs partagent pression couverture et équilibre", () => {
  const state = createMatchState();
  givePossession(state, "home-human");
  const plan = buildTeamPlan(state, TEAM.AWAY);
  assert.deepEqual([...plan.assignments.values()].sort(), [DEFEND_ROLE.BALANCE, DEFEND_ROLE.COVER, DEFEND_ROLE.PRESSURE].sort());
});

test("APPEL augmente l'utilité d'une passe mais ne traverse pas un défenseur", () => {
  const state = createMatchState({ online: true });
  const carrier = getPlayer(state, "home-left");
  const caller = getPlayer(state, "home-human");
  const blocker = getPlayer(state, "away-human");
  carrier.x = 200; carrier.y = 270; caller.x = 400; caller.y = 270; caller.callRemaining = 1;
  givePossession(state, carrier.id);
  blocker.x = 300; blocker.y = 270;
  assert.equal(evaluatePassingLane(state, carrier, caller).blocked, true);
  assert.notEqual(chooseCarrierIntent(state, carrier).targetId, caller.id);
  blocker.y = 100;
  assert.equal(evaluatePassingLane(state, carrier, caller).blocked, false);
  assert.equal(chooseCarrierIntent(state, carrier).targetId, caller.id);
});

test("la décision du porteur reste explicable par ses scores d'utilité", () => {
  const state = createMatchState({ aiLevel: 70 });
  const carrier = getPlayer(state, "home-left");
  const ranked = evaluateCarrierOptions(state, carrier);
  const chosen = chooseCarrierIntent(state, carrier);
  assert.equal(chosen.type, ranked[0].type);
  assert.ok(carrier.aiUtility.length >= 6);
  assert.ok(carrier.aiUtility.every((entry) => Number.isFinite(entry.score) && entry.reason));
});

test("une feinte provoque un transfert d'appui sans stun artificiel", () => {
  const state = createMatchState({ online: true });
  const attacker = getPlayer(state, "home-human");
  const defender = getPlayer(state, "away-human");
  attacker.x = 500; attacker.y = 270; defender.x = 550; defender.y = 270;
  defender.facingX = -1; defender.facingY = 0;
  const reacted = reactToBodyFeint(state, attacker, { x: 0, y: 1 });
  assert.equal(reacted?.id, defender.id);
  assert.ok([SUPPORT_STATE.LEANING_LEFT, SUPPORT_STATE.LEANING_RIGHT].includes(defender.supportState));
  assert.equal(defender.recoveryRemaining, 0);
  assert.ok(defender.supportLockRemaining > 0);
});

test("un défenseur qui lit la feinte peut rester parfaitement équilibré", () => {
  const state = createMatchState({ online: true, aiLevel: 80 });
  const attacker = getPlayer(state, "home-human");
  const defender = getPlayer(state, "away-human");
  state.tick = 2;
  attacker.x = 500; attacker.y = 270; defender.x = 550; defender.y = 270;
  defender.facingX = -1; defender.facingY = 0;
  assert.equal(reactToBodyFeint(state, attacker, { x: 0, y: 1 }), null);
  assert.equal(defender.supportState, SUPPORT_STATE.BALANCED);
  assert.equal(defender.recoveryRemaining, 0);
});

test("repartir contre son appui ralentit l'accélération sans bloquer le joueur", () => {
  const player = getPlayer(createMatchState(), "away-human");
  player.facingX = -1; player.facingY = 0; player.supportState = SUPPORT_STATE.LEANING_LEFT;
  const withLean = footworkAccelerationScale(player, { x: 0, y: -1, magnitude: 1 });
  player.supportState = SUPPORT_STATE.BALANCED;
  const balanced = footworkAccelerationScale(player, { x: 0, y: -1, magnitude: 1 });
  assert.ok(withLean > 0 && withLean < balanced);
});

test("la décision de tacle tient compte de l'équilibre et du risque", () => {
  const state = createMatchState({ online: true });
  const carrier = getPlayer(state, "home-human");
  const defender = getPlayer(state, "away-human");
  carrier.x = 500; carrier.y = 270; defender.x = 535; defender.y = 270;
  defender.facingX = -1; defender.facingY = 0; defender.supportState = SUPPORT_STATE.BALANCED;
  const balanced = evaluateTackle(state, defender, carrier, 0.7);
  defender.supportState = SUPPORT_STATE.RECOVERING;
  const recovering = evaluateTackle(state, defender, carrier, 0.7);
  assert.ok(balanced.score > recovering.score + 30);
  assert.equal(recovering.shouldTackle, false);
});

test("en conduite le ballon suit un compromis 50/50 libre et guidé", () => {
  let state = createMatchState({ online: true });
  const player = getPlayer(state, "home-human");
  givePossession(state, player.id);
  const gaps = [];
  for (let index = 0; index < 18; index += 1) {
    state = stepMatch(state, { host: { moveX: 1 } }, 1 / 60);
    gaps.push(Math.round((state.ball.x - player.x) * 100) / 100);
  }
  assert.equal(state.ball.ownerId, player.id);
  assert.equal(RULES.dribbleFreedom, 0.5);
  assert.equal(RULES.dribbleControlDistance, 20);
  assert.ok(new Set(gaps).size > 5);
  assert.ok(Math.max(...gaps) - Math.min(...gaps) > 1);
  assert.ok(Math.max(...gaps) < 31, "les touches doivent rester dans une enveloppe contrôlable");
});

test("le guidage 50/50 conserve le ballon sur un changement d'appui", () => {
  let state = createMatchState({ online: true });
  const player = getPlayer(state, "home-human");
  givePossession(state, player.id);
  for (let index = 0; index < 30; index += 1) state = stepMatch(state, { host: { moveX: 1 } }, 1 / 60);
  const ballBeforeTurn = { x: state.ball.x, y: state.ball.y };
  for (let index = 0; index < 18; index += 1) state = stepMatch(state, { host: { moveX: -1 } }, 1 / 60);
  assert.equal(state.ball.ownerId, player.id);
  assert.ok(distance(player, state.ball) < RULES.controlRadius + 6);
  assert.notDeepEqual({ x: state.ball.x, y: state.ball.y }, ballBeforeTurn);
});

test("la simulation IA reste déterministe et cohérente sur une séquence longue", () => {
  const first = advance(createMatchState({ aiLevel: 63, passSpeedLevel: 41, gameSpeedLevel: 48 }), 12);
  const second = advance(createMatchState({ aiLevel: 63, passSpeedLevel: 41, gameSpeedLevel: 48 }), 12);
  assert.deepEqual(second, first);
  assert.equal(assertPossessionInvariant(first), true);
  assert.equal(first.players.length, 6);
  assert.equal(first.goalkeepers.length, 2);
});
