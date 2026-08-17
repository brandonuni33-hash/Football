import { createStpCamera, STP_CAMERA_REFERENCE } from './glbSceneRenderer.js';

function normalize(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}
function subtract(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

function lookAt(eye, target, up = [0, 1, 0]) {
  const z = normalize(subtract(eye, target));
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
}

function perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function transform4(m, [x, y, z, w = 1]) {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12] * w,
    m[1] * x + m[5] * y + m[9] * z + m[13] * w,
    m[2] * x + m[6] * y + m[10] * z + m[14] * w,
    m[3] * x + m[7] * y + m[11] * z + m[15] * w,
  ];
}

export function projectStpWorldPoint(point, viewport, reference = STP_CAMERA_REFERENCE) {
  const camera = createStpCamera(reference);
  const width = Math.max(1, viewport.width);
  const height = Math.max(1, viewport.height);
  const projection = perspective(camera.fovDeg * Math.PI / 180, width / height, camera.near, camera.far);
  const view = lookAt(camera.eye, camera.target);
  const clip = transform4(multiply(projection, view), [...point, 1]);
  if (clip[3] <= 1e-6) return Object.freeze({ visible: false, x: 0, y: 0, depth: 1 });
  const ndcX = clip[0] / clip[3];
  const ndcY = clip[1] / clip[3];
  const ndcZ = clip[2] / clip[3];
  return Object.freeze({
    visible: ndcX >= -1.2 && ndcX <= 1.2 && ndcY >= -1.2 && ndcY <= 1.2 && ndcZ >= -1 && ndcZ <= 1,
    x: (ndcX * 0.5 + 0.5) * width,
    y: (1 - (ndcY * 0.5 + 0.5)) * height,
    depth: ndcZ,
  });
}

export function projectPlayerBillboard(position, heightMeters, viewport, reference = STP_CAMERA_REFERENCE) {
  const feet = projectStpWorldPoint(position, viewport, reference);
  const head = projectStpWorldPoint([position[0], position[1] + heightMeters, position[2]], viewport, reference);
  return Object.freeze({
    visible: feet.visible || head.visible,
    feet,
    head,
    pixelHeight: Math.max(1, Math.abs(feet.y - head.y)),
  });
}
