import { getNodeWorldBounds } from './fieldNormalization.js';

export const STP_BALL_DIAMETER_M = 0.22;

function assert(condition, message) {
  if (!condition) throw new Error(`Ball normalization: ${message}`);
}

function mergeBounds(a, b) {
  if (!a) return { min: [...b.min], max: [...b.max] };
  return {
    min: [0, 1, 2].map((axis) => Math.min(a.min[axis], b.min[axis])),
    max: [0, 1, 2].map((axis) => Math.max(a.max[axis], b.max[axis])),
  };
}

export function getSceneMeshBounds(parsed) {
  const nodes = parsed?.json?.nodes ?? [];
  let bounds = null;
  nodes.forEach((node, nodeIndex) => {
    if (node.mesh === undefined) return;
    bounds = mergeBounds(bounds, getNodeWorldBounds(parsed, nodeIndex));
  });
  assert(bounds, 'aucun mesh exploitable');
  return bounds;
}

export function createBallNormalization(parsed, options = {}) {
  const diameter = options.diameter ?? STP_BALL_DIAMETER_M;
  assert(diameter > 0, 'diamètre cible invalide');

  const bounds = getSceneMeshBounds(parsed);
  const extents = [0, 1, 2].map((axis) => bounds.max[axis] - bounds.min[axis]);
  const sourceDiameter = Math.max(...extents);
  assert(sourceDiameter > 0, 'volume du ballon invalide');

  const uniformScale = diameter / sourceDiameter;
  const center = [0, 1, 2].map((axis) => (bounds.min[axis] + bounds.max[axis]) / 2);

  return Object.freeze({
    diameter,
    radius: diameter / 2,
    source: Object.freeze({
      bounds: Object.freeze({ min: Object.freeze([...bounds.min]), max: Object.freeze([...bounds.max]) }),
      extents: Object.freeze(extents),
      diameter: sourceDiameter,
      center: Object.freeze(center),
    }),
    scale: uniformScale,
    // Le renderer recentre d'abord le modèle, puis place son centre à y = radius.
    groundCenterY: diameter / 2,
  });
}
