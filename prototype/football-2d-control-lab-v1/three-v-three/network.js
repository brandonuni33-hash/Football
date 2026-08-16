const ROOM_PREFIX = "stp-3v3-";

export function createRoomCode(random = Math.random) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "STP-";
  for (let i = 0; i < 4; i += 1) code += alphabet[Math.floor(random() * alphabet.length) % alphabet.length];
  return code;
}

export function peerIdFromRoom(code) { return ROOM_PREFIX + code.replace(/^STP-/i, "").toLowerCase(); }
export function roomFromLocation(locationLike = globalThis.location) {
  const room = new URLSearchParams(locationLike?.search ?? "").get("room");
  return room?.toUpperCase() ?? null;
}
export function invitationUrl(locationLike, roomCode) {
  const url = new URL(locationLike.href);
  url.search = "";
  url.searchParams.set("room", roomCode);
  return url.toString();
}

export class RoomAuthority {
  constructor() { this.guestId = null; this.goalEvents = new Set(); this.disconnected = false; }
  join(peerId) {
    if (this.guestId && this.guestId !== peerId) return { accepted: false, reason: "room-full" };
    this.guestId = peerId;
    this.disconnected = false;
    return { accepted: true, slot: "guest" };
  }
  leave(peerId) {
    if (this.guestId === peerId) { this.guestId = null; this.disconnected = true; return true; }
    return false;
  }
  acceptsInput(peerId, slot) { return slot === "guest" && peerId === this.guestId; }
  registerGoal(eventId) {
    if (this.goalEvents.has(eventId)) return false;
    this.goalEvents.add(eventId);
    return true;
  }
}

function loadPeerJS() {
  if (globalThis.Peer) return Promise.resolve(globalThis.Peer);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js";
    script.onload = () => resolve(globalThis.Peer);
    script.onerror = () => reject(new Error("peerjs-load-failed"));
    document.head.append(script);
  });
}

export async function createHostTransport(roomCode, handlers = {}) {
  const Peer = await loadPeerJS();
  const peer = new Peer(peerIdFromRoom(roomCode));
  const authority = new RoomAuthority();
  let connection = null;
  peer.on("connection", (candidate) => {
    const joined = authority.join(candidate.peer);
    candidate.on("open", () => {
      if (!joined.accepted) { candidate.send({ type: "reject", reason: joined.reason }); candidate.close(); return; }
      connection = candidate;
      candidate.send({ type: "welcome", slot: "guest" });
      handlers.onReady?.();
    });
    candidate.on("data", (message) => {
      if (authority.acceptsInput(candidate.peer, message?.slot)) handlers.onInput?.(message.input ?? {});
    });
    candidate.on("close", () => { authority.leave(candidate.peer); connection = null; handlers.onDisconnect?.(); });
  });
  peer.on("error", handlers.onError);
  return {
    role: "host", authority,
    sendSnapshot(snapshot) { if (connection?.open) connection.send({ type: "snapshot", snapshot }); },
    close() { connection?.close(); peer.destroy(); },
  };
}

export async function createGuestTransport(roomCode, handlers = {}) {
  const Peer = await loadPeerJS();
  const peer = new Peer();
  let connection = null;
  peer.on("open", () => {
    connection = peer.connect(peerIdFromRoom(roomCode), { reliable: false, serialization: "json" });
    connection.on("data", (message) => {
      if (message?.type === "snapshot") handlers.onSnapshot?.(message.snapshot);
      if (message?.type === "welcome") handlers.onReady?.();
      if (message?.type === "reject") handlers.onError?.(new Error(message.reason));
    });
    connection.on("close", handlers.onDisconnect);
  });
  peer.on("error", handlers.onError);
  return {
    role: "guest",
    sendInput(input) { if (connection?.open) connection.send({ slot: "guest", input }); },
    close() { connection?.close(); peer.destroy(); },
  };
}

export function reconcileLocalPlayer(snapshot, predictedState, playerId, blend = 0.22) {
  if (!predictedState) return snapshot;
  const predicted = predictedState.players.find((entry) => entry.id === playerId);
  const authoritative = snapshot.players.find((entry) => entry.id === playerId);
  if (predicted && authoritative) {
    authoritative.x += (predicted.x - authoritative.x) * blend;
    authoritative.y += (predicted.y - authoritative.y) * blend;
  }
  return snapshot;
}