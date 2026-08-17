const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

const COMPONENTS = {
  5120: { ArrayType: Int8Array, bytes: 1 },
  5121: { ArrayType: Uint8Array, bytes: 1 },
  5122: { ArrayType: Int16Array, bytes: 2 },
  5123: { ArrayType: Uint16Array, bytes: 2 },
  5125: { ArrayType: Uint32Array, bytes: 4 },
  5126: { ArrayType: Float32Array, bytes: 4 },
};

const TYPE_COMPONENT_COUNT = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

function assert(condition, message) {
  if (!condition) throw new Error(`GLB loader: ${message}`);
}

function decodeJsonChunk(bytes) {
  const text = new TextDecoder('utf-8').decode(bytes).replace(/[\u0000\u0020]+$/g, '');
  return JSON.parse(text);
}

function getAccessorLayout(gltf, accessorIndex) {
  const accessor = gltf.accessors?.[accessorIndex];
  assert(accessor, `accessor ${accessorIndex} introuvable`);
  assert(accessor.bufferView !== undefined, `accessor ${accessorIndex} sans bufferView non supporté`);

  const view = gltf.bufferViews?.[accessor.bufferView];
  assert(view, `bufferView ${accessor.bufferView} introuvable`);
  assert((view.buffer ?? 0) === 0, 'seul le buffer GLB embarqué (buffer 0) est supporté pour le moment');

  const component = COMPONENTS[accessor.componentType];
  assert(component, `componentType ${accessor.componentType} non supporté`);

  const componentCount = TYPE_COMPONENT_COUNT[accessor.type];
  assert(componentCount, `type d'accessor ${accessor.type} non supporté`);

  const packedStride = component.bytes * componentCount;
  const stride = view.byteStride ?? packedStride;
  assert(stride >= packedStride, `byteStride ${stride} plus petit que ${packedStride}`);

  return { accessor, view, component, componentCount, packedStride, stride };
}

export function readGlbAccessor(parsed, accessorIndex) {
  const { json: gltf, binaryChunk } = parsed;
  assert(binaryChunk, 'aucun chunk binaire disponible');

  const { accessor, view, component, componentCount, packedStride, stride } = getAccessorLayout(gltf, accessorIndex);
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const elementCount = accessor.count * componentCount;

  if (stride === packedStride) {
    assert(start + accessor.count * packedStride <= binaryChunk.byteLength, `accessor ${accessorIndex} dépasse le chunk binaire`);
    return new component.ArrayType(binaryChunk.buffer, binaryChunk.byteOffset + start, elementCount);
  }

  const result = new component.ArrayType(elementCount);
  const data = new DataView(binaryChunk.buffer, binaryChunk.byteOffset, binaryChunk.byteLength);
  const littleEndian = true;
  const readers = {
    5120: (offset) => data.getInt8(offset),
    5121: (offset) => data.getUint8(offset),
    5122: (offset) => data.getInt16(offset, littleEndian),
    5123: (offset) => data.getUint16(offset, littleEndian),
    5125: (offset) => data.getUint32(offset, littleEndian),
    5126: (offset) => data.getFloat32(offset, littleEndian),
  };
  const read = readers[accessor.componentType];

  for (let i = 0; i < accessor.count; i += 1) {
    const itemOffset = start + i * stride;
    assert(itemOffset + packedStride <= binaryChunk.byteLength, `accessor ${accessorIndex} dépasse le chunk binaire`);
    for (let c = 0; c < componentCount; c += 1) {
      result[i * componentCount + c] = read(itemOffset + c * component.bytes);
    }
  }

  return result;
}

function normalizeMaterial(material = {}) {
  const pbr = material.pbrMetallicRoughness ?? {};
  return Object.freeze({
    name: material.name ?? null,
    baseColorFactor: pbr.baseColorFactor ?? [1, 1, 1, 1],
    metallicFactor: pbr.metallicFactor ?? 1,
    roughnessFactor: pbr.roughnessFactor ?? 1,
    doubleSided: material.doubleSided === true,
    alphaMode: material.alphaMode ?? 'OPAQUE',
  });
}

function extractPrimitive(parsed, primitive) {
  assert((primitive.mode ?? 4) === 4, `primitive mode ${primitive.mode} non supporté (TRIANGLES uniquement)`);
  const attributes = {};
  for (const [semantic, accessorIndex] of Object.entries(primitive.attributes ?? {})) {
    attributes[semantic] = readGlbAccessor(parsed, accessorIndex);
  }

  return Object.freeze({
    attributes: Object.freeze(attributes),
    indices: primitive.indices === undefined ? null : readGlbAccessor(parsed, primitive.indices),
    materialIndex: primitive.material ?? null,
  });
}

function extractMeshes(parsed) {
  return Object.freeze((parsed.json.meshes ?? []).map((mesh, meshIndex) => Object.freeze({
    index: meshIndex,
    name: mesh.name ?? `mesh_${meshIndex}`,
    primitives: Object.freeze((mesh.primitives ?? []).map((primitive) => extractPrimitive(parsed, primitive))),
  })));
}

export function parseGlb(input) {
  const arrayBuffer = input instanceof ArrayBuffer
    ? input
    : input?.buffer instanceof ArrayBuffer
      ? input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
      : null;
  assert(arrayBuffer, 'entrée attendue: ArrayBuffer ou TypedArray');
  assert(arrayBuffer.byteLength >= 12, 'fichier trop court');

  const header = new DataView(arrayBuffer, 0, 12);
  assert(header.getUint32(0, true) === GLB_MAGIC, 'signature GLB invalide');
  assert(header.getUint32(4, true) === GLB_VERSION, `version ${header.getUint32(4, true)} non supportée`);
  const declaredLength = header.getUint32(8, true);
  assert(declaredLength === arrayBuffer.byteLength, `taille déclarée ${declaredLength} différente de ${arrayBuffer.byteLength}`);

  let offset = 12;
  let json = null;
  let binaryChunk = null;

  while (offset < arrayBuffer.byteLength) {
    assert(offset + 8 <= arrayBuffer.byteLength, 'en-tête de chunk tronqué');
    const chunkHeader = new DataView(arrayBuffer, offset, 8);
    const chunkLength = chunkHeader.getUint32(0, true);
    const chunkType = chunkHeader.getUint32(4, true);
    offset += 8;
    assert(offset + chunkLength <= arrayBuffer.byteLength, 'chunk tronqué');

    const bytes = new Uint8Array(arrayBuffer, offset, chunkLength);
    if (chunkType === CHUNK_JSON) {
      assert(json === null, 'plusieurs chunks JSON non supportés');
      json = decodeJsonChunk(bytes);
    } else if (chunkType === CHUNK_BIN && binaryChunk === null) {
      binaryChunk = bytes;
    }
    offset += chunkLength;
  }

  assert(json, 'chunk JSON manquant');
  assert(json.asset?.version?.startsWith('2.'), 'glTF 2.x attendu');

  const parsed = { json, binaryChunk };
  return Object.freeze({
    ...parsed,
    materials: Object.freeze((json.materials ?? []).map(normalizeMaterial)),
    meshes: extractMeshes(parsed),
  });
}

export async function loadGlb(url, fetchImpl = globalThis.fetch) {
  assert(typeof fetchImpl === 'function', 'fetch indisponible');
  const response = await fetchImpl(url);
  assert(response?.ok, `échec du chargement ${url} (${response?.status ?? 'réponse invalide'})`);
  return parseGlb(await response.arrayBuffer());
}
