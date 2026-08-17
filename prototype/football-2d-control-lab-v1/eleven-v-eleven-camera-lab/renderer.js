import { CAMERA_DEFAULTS, PITCH, VIEWPORT } from "./constants.js";
import { TEAM, getControlledPlayer } from "./state.js";
import { applyCameraTransform, cameraGeometry } from "./camera.js";

function drawPitch(ctx) {
  ctx.fillStyle = "#123d2d";
  ctx.fillRect(0, 0, PITCH.width, PITCH.height);
  for (let x = 0; x < PITCH.width; x += 120) {
    ctx.fillStyle = Math.floor(x / 120) % 2 ? "#164735" : "#194d39";
    ctx.fillRect(x, 0, 120, PITCH.height);
  }

  ctx.strokeStyle = "rgba(242,247,241,.66)";
  ctx.lineWidth = 3;
  ctx.strokeRect(PITCH.inset, PITCH.inset, PITCH.width - PITCH.inset * 2, PITCH.height - PITCH.inset * 2);
  ctx.beginPath();
  ctx.moveTo(PITCH.width / 2, PITCH.inset);
  ctx.lineTo(PITCH.width / 2, PITCH.height - PITCH.inset);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(PITCH.width / 2, PITCH.height / 2, PITCH.centerCircleRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(PITCH.width / 2, PITCH.height / 2, 5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(242,247,241,.82)";
  ctx.fill();

  const leftX = PITCH.inset;
  const rightX = PITCH.width - PITCH.inset;
  ctx.strokeRect(leftX, PITCH.penaltyTop, PITCH.penaltyDepth, PITCH.penaltyBottom - PITCH.penaltyTop);
  ctx.strokeRect(rightX - PITCH.penaltyDepth, PITCH.penaltyTop, PITCH.penaltyDepth, PITCH.penaltyBottom - PITCH.penaltyTop);
  ctx.strokeRect(leftX, PITCH.sixYardTop, PITCH.sixYardDepth, PITCH.sixYardBottom - PITCH.sixYardTop);
  ctx.strokeRect(rightX - PITCH.sixYardDepth, PITCH.sixYardTop, PITCH.sixYardDepth, PITCH.sixYardBottom - PITCH.sixYardTop);

  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(248,250,248,.88)";
  ctx.strokeRect(leftX - PITCH.goalDepth, PITCH.goalTop, PITCH.goalDepth, PITCH.goalBottom - PITCH.goalTop);
  ctx.strokeRect(rightX, PITCH.goalTop, PITCH.goalDepth, PITCH.goalBottom - PITCH.goalTop);

  ctx.fillStyle = "rgba(255,255,255,.85)";
  for (const x of [leftX + 176, rightX - 176]) {
    ctx.beginPath();
    ctx.arc(x, PITCH.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, player) {
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.controlled) {
    ctx.strokeStyle = "#7edbef";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = player.team === TEAM.HOME ? "#f2f0e8" : "#f1a443";
  ctx.strokeStyle = "rgba(6,10,12,.92)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Dark long line = torso/body orientation.
  ctx.strokeStyle = "#111820";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(player.facingX * 27, player.facingY * 27);
  ctx.stroke();

  // Cyan short line = head orientation. It is intentionally separate from the
  // body so SCAN can turn the head before the torso follows locomotion.
  if (player.controlled) {
    const headX = player.headFacingX ?? player.facingX;
    const headY = player.headFacingY ?? player.facingY;
    ctx.strokeStyle = "rgba(126,219,239,.98)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(headX * 7, headY * 7);
    ctx.lineTo(headX * 20, headY * 20);
    ctx.stroke();
    ctx.fillStyle = "rgba(126,219,239,.98)";
    ctx.beginPath();
    ctx.arc(headX * 20, headY * 20, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#10161c";
  ctx.font = "900 11px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(player.number), 0, 0);
  ctx.restore();
}

function drawBall(ctx, ball) {
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function clipToHumanVision(ctx, player, camera) {
  const gazeX = player.headFacingX ?? camera.gazeX ?? player.facingX;
  const gazeY = player.headFacingY ?? camera.gazeY ?? player.facingY;
  const gazeAngle = Math.atan2(gazeY, gazeX);
  const halfVision = (CAMERA_DEFAULTS.visionDegrees / 2) * Math.PI / 180;
  const radius = Math.hypot(PITCH.width, PITCH.height) * 2.2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.arc(player.x, player.y, radius, gazeAngle - halfVision, gazeAngle + halfVision);
  ctx.closePath();
  ctx.clip();
}

function drawOverlay(ctx, camera, settings) {
  const geometry = cameraGeometry(settings);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "rgba(5,9,12,.76)";
  ctx.fillRect(18, VIEWPORT.height - 48, 540, 30);
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.font = "800 12px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(
    `BALL CAM · Z ${geometry.zoom.toFixed(2)} · 3/4 ${Math.round(geometry.angle)} · VISION 180° · TÊTE 260°${camera.scanActive ? " · SCAN" : ""}`,
    30,
    VIEWPORT.height - 28,
  );
  ctx.restore();
}

export function renderLab(ctx, state, camera, settings) {
  const controlled = getControlledPlayer(state);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, VIEWPORT.width, VIEWPORT.height);
  ctx.restore();

  ctx.save();
  applyCameraTransform(ctx, camera, settings);

  ctx.save();
  ctx.globalAlpha = CAMERA_DEFAULTS.blindPitchAlpha;
  drawPitch(ctx);
  ctx.restore();

  if (controlled) {
    ctx.save();
    clipToHumanVision(ctx, controlled, camera);
    drawPitch(ctx);
    for (const player of state.players) {
      if (!player.controlled) drawPlayer(ctx, player);
    }
    ctx.restore();

    drawPlayer(ctx, controlled);
    drawBall(ctx, state.ball);
  } else {
    drawPitch(ctx);
    for (const player of state.players) drawPlayer(ctx, player);
    drawBall(ctx, state.ball);
  }

  ctx.restore();
  drawOverlay(ctx, camera, settings);
}
