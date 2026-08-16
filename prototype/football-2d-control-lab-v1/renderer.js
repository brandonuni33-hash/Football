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

  if (magnitude > 0.08) {
    ctx.save();
    ctx.strokeStyle = state.possession ? "rgba(227,179,65,.72)" : "rgba(235,240,245,.42)";
    ctx.lineWidth = 2;
    ctx.setLineDash(state.possession ? [] : [6, 6]);
    const length = state.possession ? 45 + magnitude * 35 : 80 + magnitude * 45;
    line(ctx, p.x, p.y, p.x + lookX * length, p.y + lookY * length);
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = "rgba(8,11,14,.72)";
  ctx.fillRect(18, FIELD.h - 52, 214, 30);
  ctx.fillStyle = "#f4f4f1";
  ctx.font = "700 13px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`Stick droit : ${(state.controlMode ?? "neutre").toUpperCase()}`, 28, FIELD.h - 37);
  ctx.restore();
}
