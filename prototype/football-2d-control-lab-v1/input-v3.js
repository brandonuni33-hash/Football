function bindAnalogStick(root, knob, onSample) {
  const state = { x: 0, y: 0, pointer: null };
  const moveEvent = "onpointerrawupdate" in window ? "pointerrawupdate" : "pointermove";

  function sample(event) {
    const samples = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : null;
    const e = samples?.length ? samples[samples.length - 1] : event;
    const rect = root.getBoundingClientRect();
    let x = (e.clientX - rect.left - rect.width / 2) / (rect.width * 0.35);
    let y = (e.clientY - rect.top - rect.height / 2) / (rect.height * 0.35);
    let length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
      length = 1;
    }
    if (length < 0.04) {
      x = 0;
      y = 0;
      length = 0;
    }
    state.x = x;
    state.y = y;
    knob.style.transform = `translate(calc(-50% + ${x * 28}px),calc(-50% + ${y * 28}px))`;
    onSample?.(x, y, length);
  }

  function clear(event) {
    if (event.pointerId !== state.pointer) return;
    state.x = 0;
    state.y = 0;
    state.pointer = null;
    knob.style.transform = "translate(-50%,-50%)";
    onSample?.(0, 0, 0);
  }

  root.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    state.pointer = event.pointerId;
    root.setPointerCapture?.(event.pointerId);
    sample(event);
  });
  root.addEventListener(moveEvent, (event) => {
    if (event.pointerId === state.pointer) sample(event);
  });
  root.addEventListener("pointerup", clear);
  root.addEventListener("pointercancel", clear);

  return state;
}

export function createControlLabInput({
  moveJoystick,
  moveStick,
  controlJoystick,
  controlStick,
  shoot,
  pass,
  protect,
  powerFill,
}) {
  const keys = new Set();
  let shootStart = null;
  let queuedShot = null;
  let queuedPass = false;
  let queuedProtect = false;
  let lastMovePush = null;
  let movePushArmed = true;
  let queuedBurst = null;

  function registerMovePush(x, y, magnitude) {
    if (magnitude <= 0.35) {
      movePushArmed = true;
      return;
    }
    if (magnitude < 0.82 || !movePushArmed) return;
    movePushArmed = false;
    const now = performance.now();
    const length = Math.hypot(x, y) || 1;
    const dx = x / length;
    const dy = y / length;
    if (lastMovePush && now - lastMovePush.time <= 360 && dx * lastMovePush.x + dy * lastMovePush.y >= 0.92) {
      queuedBurst = { x: dx, y: dy };
      lastMovePush = null;
    } else {
      lastMovePush = { time: now, x: dx, y: dy };
    }
  }

  const move = bindAnalogStick(moveJoystick, moveStick, registerMovePush);
  const control = bindAnalogStick(controlJoystick, controlStick);

  const shotPower = () => shootStart === null ? 0 : Math.min(1, (performance.now() - shootStart) / 900);
  function releaseShot() {
    if (shootStart === null) return;
    queuedShot = shotPower();
    shootStart = null;
    powerFill.style.height = "0%";
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    keys.add(key);
    if (key === " " && shootStart === null) {
      event.preventDefault();
      shootStart = performance.now();
    }
    if (key === "e") queuedPass = true;
    if (key === "shift" && !event.repeat) queuedProtect = true;
  });
  window.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    keys.delete(key);
    if (key === " ") {
      event.preventDefault();
      releaseShot();
    }
  });

  shoot.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (shootStart === null) shootStart = performance.now();
  });
  shoot.addEventListener("pointerup", (event) => {
    event.preventDefault();
    releaseShot();
  });
  shoot.addEventListener("pointercancel", releaseShot);

  pass.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    queuedPass = true;
  });

  protect.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    queuedProtect = true;
  });

  return {
    read() {
      let moveX = move.x;
      let moveY = move.y;
      let controlX = control.x;
      let controlY = control.y;

      if (Math.hypot(moveX, moveY) < 0.04) {
        if (keys.has("arrowleft") || keys.has("a") || keys.has("q")) moveX -= 1;
        if (keys.has("arrowright") || keys.has("d")) moveX += 1;
        if (keys.has("arrowup") || keys.has("w") || keys.has("z")) moveY -= 1;
        if (keys.has("arrowdown") || keys.has("s")) moveY += 1;
      }

      if (Math.hypot(controlX, controlY) < 0.04) {
        if (keys.has("j")) controlX -= 1;
        if (keys.has("l")) controlX += 1;
        if (keys.has("i")) controlY -= 1;
        if (keys.has("k")) controlY += 1;
      }

      const shot = queuedShot;
      const passPressed = queuedPass;
      const protectPressed = queuedProtect;
      const burst = queuedBurst;
      queuedShot = null;
      queuedPass = false;
      queuedProtect = false;
      queuedBurst = null;

      const charge = shotPower();
      powerFill.style.height = `${Math.round(charge * 100)}%`;

      return {
        moveX,
        moveY,
        controlX,
        controlY,
        protectPressed,
        passPressed,
        burstTriggered: !!burst,
        burstX: burst?.x ?? 0,
        burstY: burst?.y ?? 0,
        shootReleased: shot !== null,
        shootPower: shot ?? 0,
        charge,
      };
    },
  };
}
