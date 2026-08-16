function bindStick(root, knob) {
  const state = { x: 0, y: 0, pointer: null };
  const sample = (event) => {
    const rect = root.getBoundingClientRect();
    let x = (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.34);
    let y = (event.clientY - rect.top - rect.height / 2) / (rect.height * 0.34);
    const magnitude = Math.hypot(x, y);
    if (magnitude > 1) { x /= magnitude; y /= magnitude; }
    if (Math.hypot(x, y) < 0.06) { x = 0; y = 0; }
    state.x = x; state.y = y;
    knob.style.transform = `translate(calc(-50% + ${x * 28}px),calc(-50% + ${y * 28}px))`;
  };
  const clear = (event) => {
    if (event.pointerId !== state.pointer) return;
    state.x = 0; state.y = 0; state.pointer = null;
    knob.style.transform = "translate(-50%,-50%)";
  };
  root.addEventListener("pointerdown", (event) => { event.preventDefault(); state.pointer = event.pointerId; root.setPointerCapture?.(event.pointerId); sample(event); });
  root.addEventListener("pointermove", (event) => { if (event.pointerId === state.pointer) sample(event); });
  root.addEventListener("pointerup", clear);
  root.addEventListener("pointercancel", clear);
  return state;
}

export function createInput(elements) {
  const move = bindStick(elements.moveRoot, elements.moveKnob);
  const control = bindStick(elements.controlRoot, elements.controlKnob);
  const queued = { primary: false, secondary: false, tertiary: false };
  const press = (key) => (event) => { event.preventDefault(); queued[key] = true; };
  elements.primary.addEventListener("pointerdown", press("primary"));
  elements.secondary.addEventListener("pointerdown", press("secondary"));
  elements.tertiary.addEventListener("pointerdown", press("tertiary"));
  const rapid = { held: false, pointer: null };
  const releaseRapid = (event) => {
    if (event.pointerId !== rapid.pointer) return;
    rapid.held = false;
    rapid.pointer = null;
    elements.rapid.classList.remove("active");
  };
  elements.rapid.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    rapid.pointer = event.pointerId;
    rapid.held = true;
    elements.rapid.classList.add("active");
    elements.rapid.setPointerCapture?.(event.pointerId);
  });
  elements.rapid.addEventListener("pointerup", releaseRapid);
  elements.rapid.addEventListener("pointercancel", releaseRapid);
  elements.rapid.addEventListener("lostpointercapture", releaseRapid);

  return {
    read() {
      const input = {
        moveX: move.x, moveY: move.y, controlX: control.x, controlY: control.y,
        primaryPressed: queued.primary, secondaryPressed: queued.secondary, tertiaryPressed: queued.tertiary,
        rapidHeld: rapid.held, jockeyHeld: false, x: control.x, y: control.y,
      };
      queued.primary = queued.secondary = queued.tertiary = false;
      return input;
    },
  };
}
