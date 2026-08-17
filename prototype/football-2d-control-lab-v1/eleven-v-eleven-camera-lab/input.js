function bindStick(root, knob) {
  const state = { x: 0, y: 0, pointer: null };
  const sample = (event) => {
    const rect = root.getBoundingClientRect();
    let x = (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.34);
    let y = (event.clientY - rect.top - rect.height / 2) / (rect.height * 0.34);
    const magnitude = Math.hypot(x, y);
    if (magnitude > 1) { x /= magnitude; y /= magnitude; }
    if (Math.hypot(x, y) < 0.05) { x = 0; y = 0; }
    state.x = x;
    state.y = y;
    knob.style.transform = `translate(calc(-50% + ${x * 28}px),calc(-50% + ${y * 28}px))`;
  };
  const clear = (event) => {
    if (event.pointerId !== state.pointer) return;
    state.x = 0;
    state.y = 0;
    state.pointer = null;
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

export function createLabInput(elements) {
  const move = bindStick(elements.moveRoot, elements.moveKnob);
  const scan = bindStick(elements.scanRoot, elements.scanKnob);
  return {
    read() {
      return { moveX: move.x, moveY: move.y, scanX: scan.x, scanY: scan.y };
    },
  };
}
