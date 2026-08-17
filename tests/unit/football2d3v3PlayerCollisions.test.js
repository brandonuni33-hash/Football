import test from "node:test";
import assert from "node:assert/strict";
import { RULES, distance } from "../../prototype/football-2d-control-lab-v1/three-v-three/constants.js";
import { createMatchState, getPlayer } from "../../prototype/football-2d-control-lab-v1/three-v-three/matchState.js";
import { resolvePlayerCollisions } from "../../prototype/football-2d-control-lab-v1/three-v-three/playerCollisions.js";
import { stepMatch } from "../../prototype/football-2d-control-lab-v1/three-v-three/simulation.js";

function moveOthersAway(state) {
  const positions = {
    "home-left": [90, 90],
    "home-right": [90, 450],
    "away-left": [910, 90],
    "away-right": [910, 450],
  };
  for (const [id, [x, y]] of Object.entries(positions)) {
    const player = getPlayer(state, id);
    player.x = x;
    player.y = y;
    player.vx = 0;
    player.vy = 0;
  }
}

test("deux joueurs qui se chevauchent sont séparés physiquement", () => {
  const state = createMatchState({ online: true });
  const a = getPlayer(state, "home-human");
  const b = getPlayer(state, "away-human");
  moveOthersAway(state);
  a.x = 480; a.y = 270;
  b.x = 500; b.y = 270;

  const contacts = resolvePlayerCollisions(state);
  assert.ok(contacts > 0);
  assert.ok(distance(a, b) >= RULES.playerCollisionRadius * 2 - 0.01);
  assert.equal(a.bodyContactId, b.id);
  assert.equal(b.bodyContactId, a.id);
});

test("un contact bloque la vitesse vers le corps mais conserve le glissement latéral", () => {
  const state = createMatchState({ online: true });
  const a = getPlayer(state, "home-human");
  const b = getPlayer(state, "away-human");
  moveOthersAway(state);
  a.x = 480; a.y = 270; a.vx = 100; a.vy = 52;
  b.x = 506; b.y = 270; b.vx = 0; b.vy = 0;

  resolvePlayerCollisions(state);
  assert.ok(a.vx < 10, "la vitesse qui traverse le défenseur doit être presque annulée");
  assert.ok(a.vy > 48, "la composante latérale doit rester disponible pour contourner");
});

test("deux joueurs qui courent face à face ne changent jamais de côté en se traversant", () => {
  let state = createMatchState({ online: true, gameSpeedLevel: 100 });
  const home = getPlayer(state, "home-human");
  const away = getPlayer(state, "away-human");
  moveOthersAway(state);
  home.x = 430; home.y = 270;
  away.x = 570; away.y = 270;
  home.facingX = 1; home.facingY = 0;
  away.facingX = -1; away.facingY = 0;

  for (let i = 0; i < 90; i += 1) {
    state = stepMatch(state, {
      host: { moveX: 1, moveY: 0, rapidHeld: true },
      guest: { moveX: -1, moveY: 0, rapidHeld: true },
    }, 1 / 60);
    assert.ok(home.x < away.x, "les joueurs ne doivent jamais se traverser");
  }
  assert.ok(distance(home, away) >= RULES.playerCollisionRadius * 2 - 0.6);
});

test("une collision du porteur ne désolidarise pas artificiellement le ballon", () => {
  const state = createMatchState({ online: true });
  const owner = getPlayer(state, "home-left");
  const defender = getPlayer(state, "away-human");
  moveOthersAway(state);
  owner.x = 480; owner.y = 270;
  owner.facingX = 1; owner.facingY = 0;
  defender.x = 501; defender.y = 270;
  state.ball.x = owner.x + 23;
  state.ball.y = owner.y;
  const offsetBefore = state.ball.x - owner.x;

  resolvePlayerCollisions(state);
  assert.ok(Math.abs((state.ball.x - owner.x) - offsetBefore) < 0.001);
  assert.equal(state.ball.ownerId, owner.id);
});
