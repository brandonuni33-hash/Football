import { CAMERA_DEFAULTS, normalize } from "./constants.js";

function boundaryVector(forward, side, magnitude) {
  const halfRange = (CAMERA_DEFAULTS.headScanDegrees / 2) * Math.PI / 180;
  const angle = halfRange * side;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: (forward.x * cos - forward.y * sin) * magnitude,
    y: (forward.x * sin + forward.y * cos) * magnitude,
    lockSide: side,
  };
}

// Physical SCAN-stick gate. Once the thumb reaches the blind sector behind the
// player, the knob stays against the same shoulder stop. It cannot travel
// through the forbidden rear arc to the opposite shoulder. Recenter the stick
// or bring it back through the front hemisphere to change side.
export function constrainScanStickVector(scanX = 0, scanY = 0, facing = { x: 1, y: 0 }, lockedSide = 0) {
  const raw = normalize(scanX, scanY);
  if (raw.magnitude < 0.05) return { x: 0, y: 0, lockSide: 0 };

  const normalizedFacing = normalize(facing?.x ?? 1, facing?.y ?? 0);
  const forward = normalizedFacing.magnitude > 0
    ? normalizedFacing
    : { x: 1, y: 0, magnitude: 1 };
  const dot = Math.max(-1, Math.min(1, raw.x * forward.x + raw.y * forward.y));
  const cross = forward.x * raw.y - forward.y * raw.x;
  const signedAngle = Math.atan2(cross, dot);
  const halfRange = (CAMERA_DEFAULTS.headScanDegrees / 2) * Math.PI / 180;
  const side = Math.sign(signedAngle) || lockedSide || 1;

  if (lockedSide) {
    const returnedInsideSameSide = side === lockedSide && Math.abs(signedAngle) <= halfRange;
    const returnedThroughFront = dot > 0;
    if (returnedInsideSameSide || returnedThroughFront) {
      return { x: raw.x * raw.magnitude, y: raw.y * raw.magnitude, lockSide: 0 };
    }
    return boundaryVector(forward, lockedSide, raw.magnitude);
  }

  if (Math.abs(signedAngle) <= halfRange) {
    return { x: raw.x * raw.magnitude, y: raw.y * raw.magnitude, lockSide: 0 };
  }
  return boundaryVector(forward, side, raw.magnitude);
}

function bindStick(root, knob, transform = null) {
  const state = { x: 0, y: 0, pointer: null, lockSide: 0 };
  const sample = (event) => {
    const rect = root.getBoundingClientRect();
    let x = (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.34);
    let y = (event.clientY - rect.top - rect.height / 2) / (rect.height * 0.34);
    const magnitude = Math.hypot(x, y);
    if (magnitude > 1) { x /= magnitude; y /= magnitude; }
    if (Math.hypot(x, y) < 0.05) { x = 0; y = 0; }

    if (transform) {
      const constrained = transform(x, y, state.lockSide);
      x = constrained.x;
      y = constrained.y;
      state.lockSide = constrained.lockSide ?? 0;
    }

    state.x = x;
    state.y = y;
    knob.style.transform = `translate(calc(-50% + ${x * 28}px),calc(-50% + ${y * 28}px))`;
  };
  const clear = (event) => {
    if (event.pointerId !== state.pointer) return;
    state.x = 0;
    state.y = 0;
    state.pointer = null;
    state.lockSide = 0;
    knob.style.transform = "translate(-50%,-50%)";
  };
  root.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    state.pointer = event.pointerId;
    root.setPointerCapture?.(event.pointerId);
    sample(event);
  });
  root.addEventListener("pointermove", (event) => {
    if (event.pointerId === state.pointer) sample(event);
  });
  root.addEventListener("pointerup", clear);
  root.addEventListener("pointercancel", clear);
  root.addEventListener("lostpointercapture", clear);
  return state;
}

export function createLabInput(elements, { getScanFacing = null } = {}) {
  const move = bindStick(elements.moveRoot, elements.moveKnob);
  const scan = bindStick(elements.scanRoot, elements.scanKnob, (x, y, lockedSide) => {
    const facing = getScanFacing?.() ?? { x: 1, y: 0 };
    return constrainScanStickVector(x, y, facing, lockedSide);
  });
  return {
    read() {
      return { moveX: move.x, moveY: move.y, scanX: scan.x, scanY: scan.y };
    },
  };
}
