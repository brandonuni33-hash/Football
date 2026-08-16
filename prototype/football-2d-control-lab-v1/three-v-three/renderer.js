import { BALL_PHASE, FIELD, TEAM } from "./constants.js";
import { controlledPlayerId } from "./matchState.js";

function pitch(ctx) {
  ctx.fillStyle = "#123d2d"; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  for (let x = 0; x < FIELD.width; x += 120) { ctx.fillStyle = x % 240 ? "#164735" : "#194d39"; ctx.fillRect(x, 0, 120, FIELD.height); }
  ctx.strokeStyle = "rgba(239,245,238,.55)"; ctx.lineWidth = 2;
  ctx.strokeRect(FIELD.inset, FIELD.inset, FIELD.width - FIELD.inset * 2, FIELD.height - FIELD.inset * 2);
  ctx.beginPath(); ctx.moveTo(FIELD.width / 2, FIELD.inset); ctx.lineTo(FIELD.width / 2, FIELD.height - FIELD.inset); ctx.stroke();
  ctx.beginPath(); ctx.arc(FIELD.width / 2, FIELD.height / 2, 67, 0, Math.PI * 2); ctx.stroke();
  for (const side of [FIELD.inset, FIELD.width - FIELD.inset]) {
    ctx.strokeRect(side === FIELD.inset ? side : side - 112, 155, 112, 230);
  }
  ctx.strokeStyle = "#e8eee7"; ctx.lineWidth = 4;
  ctx.strokeRect(FIELD.inset - FIELD.goalDepth, FIELD.goalTop, FIELD.goalDepth, FIELD.goalBottom - FIELD.goalTop);
  ctx.strokeRect(FIELD.width - FIELD.inset, FIELD.goalTop, FIELD.goalDepth, FIELD.goalBottom - FIELD.goalTop);
}

function drawPlayer(ctx, player, localId) {
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.callRemaining > 0) { ctx.strokeStyle = "#f1bd48"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke(); }
  if (player.protectionRemaining > 0) { ctx.fillStyle = "rgba(241,189,72,.18)"; ctx.beginPath(); ctx.arc(0, 0, 31, 0, Math.PI * 2); ctx.fill(); }
  if (player.jockeying) { ctx.strokeStyle = "#80d8e8"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = player.team === TEAM.HOME ? "#f3f1e9" : "#f0a43c";
  ctx.strokeStyle = player.id === localId ? "#76d8eb" : "rgba(8,12,14,.85)";
  ctx.lineWidth = player.id === localId ? 5 : 3;
  ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  const lean = player.supportState === "LEANING_LEFT" ? -4 : player.supportState === "LEANING_RIGHT" ? 4 : 0;
  ctx.fillStyle = player.supportState === "RECOVERING" ? "#e56f68" : "rgba(8,12,14,.9)";
  ctx.beginPath(); ctx.ellipse(-7 + lean, 19, 5, 2.5, 0, 0, Math.PI * 2); ctx.ellipse(7 + lean, 19, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#111820"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(player.facingX * 24, player.facingY * 24); ctx.stroke();
  ctx.fillStyle = "#10161c"; ctx.font = "900 10px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const number = player.id.includes("human") ? "10" : player.id.endsWith("left") ? "6" : "8";
  ctx.fillText(number, 0, 0);
  ctx.restore();
}

function drawGoalkeeper(ctx, keeper) {
  ctx.save();
  ctx.translate(keeper.x, keeper.y);
  ctx.fillStyle = keeper.team === TEAM.HOME ? "#6cd1b0" : "#d76a73";
  ctx.strokeStyle = "#071016";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-8, -7); ctx.lineTo(8, 7); ctx.moveTo(8, -7); ctx.lineTo(-8, 7); ctx.stroke();
  ctx.restore();
}

export function render(ctx, state, slot = "host") {
  pitch(ctx);
  const localId = controlledPlayerId(slot);
  for (const keeper of state.goalkeepers ?? []) drawGoalkeeper(ctx, keeper);
  for (const player of state.players) drawPlayer(ctx, player, localId);
  ctx.save();
  ctx.translate(state.ball.x, state.ball.y);
  ctx.fillStyle = "#fff"; ctx.strokeStyle = state.ball.phase === BALL_PHASE.FREE ? "#f1bd48" : "#111"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = "rgba(5,9,12,.78)"; ctx.fillRect(FIELD.width / 2 - 76, 12, 152, 42);
  ctx.fillStyle = "#fff"; ctx.font = "900 23px system-ui"; ctx.textAlign = "center"; ctx.fillText(`${state.score.home}  —  ${state.score.away}`, FIELD.width / 2, 41);
  ctx.font = "800 12px system-ui"; ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,.88)"; ctx.fillText((state.lastEvent ?? "").toUpperCase().replaceAll("_", " "), 48, 64);
}
