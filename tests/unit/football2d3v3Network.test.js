import test from "node:test";
import assert from "node:assert/strict";
import { RoomAuthority, createRoomCode, invitationUrl, peerIdFromRoom, roomFromLocation } from "../../prototype/football-2d-control-lab-v1/three-v-three/network.js";

test("création de room courte et lien d'invitation", () => {
  const code = createRoomCode(() => 0.1);
  assert.match(code, /^STP-[A-Z2-9]{4}$/);
  const url = invitationUrl({ href: "https://example.test/play-3v3-v1.html?old=1" }, code);
  assert.equal(roomFromLocation({ search: new URL(url).search }), code);
  assert.match(peerIdFromRoom(code), /^stp-3v3-/);
});

test("une room accepte un invité et refuse le troisième humain", () => {
  const room = new RoomAuthority();
  assert.deepEqual(room.join("guest-a"), { accepted: true, slot: "guest" });
  assert.deepEqual(room.join("guest-b"), { accepted: false, reason: "room-full" });
  assert.equal(room.acceptsInput("guest-a", "guest"), true);
  assert.equal(room.acceptsInput("guest-b", "guest"), false);
});

test("un but partagé n'est reconnu qu'une fois", () => {
  const room = new RoomAuthority();
  assert.equal(room.registerGoal("goal-8"), true);
  assert.equal(room.registerGoal("goal-8"), false);
});

test("la déconnexion libère la place et est détectée", () => {
  const room = new RoomAuthority(); room.join("guest-a");
  assert.equal(room.leave("guest-a"), true);
  assert.equal(room.disconnected, true);
  assert.equal(room.guestId, null);
  assert.equal(room.join("guest-b").accepted, true);
});