import { FIELD } from "../football-2d-v0/football2dModel.js";
import { renderFootball2D } from "../football-2d-v0/renderer.js";

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function renderControlLab(ctx, state, profile, shotPower = 0) {
  renderFootball2D(ctx, state, profile, shotPower);

  const p = state.player;
  const magnitude = state.rightStickMagnitude ?? 0;
  const lookX = state.lookX ?? p.facingX;
  const lookY = state.lookY ?? p.facingY;
  const mode = state.controlMode ?? "vision";
  const rightStickVisible = magnitude > 0.08 && mode !== "verrouille" && mode !== "protection";

  if (rightStickVisible) {
    ctx.save();
    ctx.strokeStyle = mode === "vision" ? "rgba(235,240,245,.48)" : "rgba(227,179,65,.76)";
    ctx.lineWidth = 2;
    ctx.setLineDash(mode === "vision" ? [6, 6] : []);
    const length = mode === "vision" ? 105 : mode === "reception" ? 70 : 54;
    line(ctx, p.x, p.y, p.x + lookX * length, p.y + lookY * length);
    ctx.restore();
  }

  if ((state.feintTime ?? 0) > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(227,179,65,.55)";
    ctx.lineWidth = 4;
    line(ctx, p.x, p.y, p.x + state.feintX * 34, p.y + state.feintY * 34);
    ctx.restore();
  }

  const protectionText = state.protectionActive
    ? `PROT ${state.protectionRemaining.toFixed(1)}s`
    : state.protectionCooldown > 0
      ? `PROT CD ${state.protectionCooldown.toFixed(1)}s`
      : state.protectionAvailable ? "PROT PRÊTE" : "PROT BLOQUÉE";
  const receptionText = (state.receptionWindow ?? 0) > 0 ? ` · RÉCEP ${state.receptionWindow.toFixed(1)}s` : "";

  ctx.save();
  ctx.fillStyle = "rgba(8,11,14,.76)";
  ctx.fillRect(18, FIELD.h - 58, 350, 36);
  ctx.fillStyle = "#f4f4f1";
  ctx.font = "700 12px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`DROIT : ${mode.toUpperCase()} · ${protectionText}${receptionText}`, 28, FIELD.h - 40);
  ctx.restore();
}
