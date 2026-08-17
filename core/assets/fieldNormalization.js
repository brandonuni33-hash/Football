const DEFAULT_TARGET = Object.freeze({ length: 105, width: 68 });

function assert(condition, message) {
  if (!condition) throw new Error(`Field normalization: ${message}`);
}

function multiply4(a, b) {
  const out = new Array(16).fill(0);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      for (let k = 0; k < 4; k += 1) out[row * 4 + col] += a[row * 4 + k] * b[k * 4 + col];
    }
  }
  return out;
}

function translationMatrix([x = 0, y = 0, z = 0]) {
  return [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];
}

function scaleMatrix([x = 1, y = 1, z = 1]) {
  return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
}

function quaternionMatrix([x = 0, y = 0, z = 0, w = 1]) {
  const length = Math.hypot(x, y, z, w) || 1;
  x /= length; y /= length; z /= length; w /= length;
  const xx = x * x; const yy = y * y; const zz = z * z;
  const xy = x * y; const xz = x * z; const yz = y * z;
  const wx = w * x; const wy = w * y; const wz = w * z;
  return [
    1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0,
    2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0,
    2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0,
    0, 0, 0, 1,
  ];
}

function nodeLocalMatrix(node = {}) {
  if (Array.isArray(node.matrix) && node.matrix.length === 16) {
    // glTF matrices are column-major. Convert once to the row-major convention used here.
    return [
      node.matrix[0], node.matrix[4], node.matrix[8], node.matrix[12],
      node.matrix[1], node.matrix[5], node.matrix[9], node.matrix[13],
      node.matrix[2], node.matrix[6], node.matrix[10], node.matrix[14],
      node.matrix[3], node.matrix[7], node.matrix[11], node.matrix[15],
    ];
  }
  return multiply4(
    multiply4(translationMatrix(node.translation ?? [0, 0, 0]), quaternionMatrix(node.rotation ?? [0, 0, 0, 1])),
    scaleMatrix(node.scale ?? [1, 1, 1]),
  );
}

function transformPoint(m, [x, y, z]) {
  return [
    m[0] * x + m[1] * y + m[2] * z + m[3],
    m[4] * x + m[5] * y + m[6] * z + m[7],
    m[8] * x + m[9] * y + m[10] * z + m[11],
  ];
}

function makeParentMap(nodes = []) {
  const parent = new Map();
  nodes.forEach((node, parentIndex) => (node.children ?? []).forEach((childIndex) => parent.set(childIndex, parentIndex)));
  return parent;
}

function worldMatrixForNode(gltf, nodeIndex, parentMap = makeParentMap(gltf.nodes)) {
  let matrix = nodeLocalMatrix(gltf.nodes[nodeIndex]);
  let parentIndex = parentMap.get(nodeIndex);
  while (parentIndex !== undefined) {
    matrix = multiply4(nodeLocalMatrix(gltf.nodes[parentIndex]), matrix);
    parentIndex = parentMap.get(parentIndex);
  }
  return matrix;
}

function meshLocalBounds(gltf, meshIndex) {
  const mesh = gltf.meshes?.[meshIndex];
  assert(mesh, `mesh ${meshIndex} introuvable`);
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  for (const primitive of mesh.primitives ?? []) {
    const positionAccessorIndex = primitive.attributes?.POSITION;
    if (positionAccessorIndex === undefined) continue;
    const accessor = gltf.accessors?.[positionAccessorIndex];
    assert(accessor?.min?.length >= 3 && accessor?.max?.length >= 3, `POSITION accessor ${positionAccessorIndex} sans min/max`);
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], accessor.min[axis]);
      max[axis] = Math.max(max[axis], accessor.max[axis]);
    }
  }
  assert(Number.isFinite(min[0]), `mesh ${meshIndex} sans POSITION exploitable`);
  return { min, max };
}

function transformedBounds(bounds, matrix) {
  const corners = [];
  for (const x of [bounds.min[0], bounds.max[0]]) {
    for (const y of [bounds.min[1], bounds.max[1]]) {
      for (const z of [bounds.min[2], bounds.max[2]]) corners.push(transformPoint(matrix, [x, y, z]));
    }
  }
  return {
    min: [0, 1, 2].map((axis) => Math.min(...corners.map((point) => point[axis]))),
    max: [0, 1, 2].map((axis) => Math.max(...corners.map((point) => point[axis]))),
  };
}

export function findNodeIndexByName(parsed, name) {
  const nodes = parsed?.json?.nodes ?? [];
  return nodes.findIndex((node) => node.name === name);
}

export function getNodeWorldBounds(parsed, nodeIndex) {
  const gltf = parsed?.json;
  assert(gltf?.nodes?.[nodeIndex], `node ${nodeIndex} introuvable`);
  const meshIndex = gltf.nodes[nodeIndex].mesh;
  assert(meshIndex !== undefined, `node ${nodeIndex} sans mesh`);
  const local = meshLocalBounds(gltf, meshIndex);
  return transformedBounds(local, worldMatrixForNode(gltf, nodeIndex));
}

export function createFieldNormalization(parsed, options = {}) {
  const fieldNodeName = options.fieldNodeName ?? 'Soccer Field';
  const targetLength = options.targetLength ?? DEFAULT_TARGET.length;
  const targetWidth = options.targetWidth ?? DEFAULT_TARGET.width;
  assert(targetLength > 0 && targetWidth > 0, 'dimensions cibles invalides');

  const nodeIndex = findNodeIndexByName(parsed, fieldNodeName);
  assert(nodeIndex >= 0, `node « ${fieldNodeName} » introuvable`);
  const bounds = getNodeWorldBounds(parsed, nodeIndex);
  const x = bounds.max[0] - bounds.min[0];
  const z = bounds.max[2] - bounds.min[2];
  assert(x > 0 && z > 0, 'le terrain doit avoir une surface X/Z non nulle');

  const xIsLength = x >= z;
  const scaleX = (xIsLength ? targetLength : targetWidth) / x;
  const scaleZ = (xIsLength ? targetWidth : targetLength) / z;
  const verticalScale = Math.sqrt(scaleX * scaleZ);

  return Object.freeze({
    nodeIndex,
    fieldNodeName,
    source: Object.freeze({ x, z, length: Math.max(x, z), width: Math.min(x, z), bounds }),
    target: Object.freeze({ length: targetLength, width: targetWidth }),
    scale: Object.freeze([scaleX, verticalScale, scaleZ]),
    // Le renderer applique ce scale à un parent commun : terrain, buts et tribunes restent alignés.
    centeredAtOrigin: true,
  });
}
