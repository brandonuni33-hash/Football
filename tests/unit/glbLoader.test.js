import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGlb, readGlbAccessor } from '../../core/assets/glbLoader.js';

function pad4(bytes, padByte = 0) {
  const length = Math.ceil(bytes.length / 4) * 4;
  const padded = new Uint8Array(length);
  padded.fill(padByte);
  padded.set(bytes);
  return padded;
}

function makeTriangleGlb() {
  const positions = new Float32Array([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
  ]);
  const indices = new Uint16Array([0, 1, 2]);
  const binary = new Uint8Array(44);
  binary.set(new Uint8Array(positions.buffer), 0);
  binary.set(new Uint8Array(indices.buffer), 36);

  const json = {
    asset: { version: '2.0' },
    buffers: [{ byteLength: binary.byteLength }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 6 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] },
      { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
    ],
    materials: [{ name: 'grass', pbrMetallicRoughness: { baseColorFactor: [0.2, 0.6, 0.25, 1], roughnessFactor: 0.9 } }],
    meshes: [{ name: 'pitch', primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
  };

  const jsonBytes = pad4(new TextEncoder().encode(JSON.stringify(json)), 0x20);
  const binaryBytes = pad4(binary);
  const length = 12 + 8 + jsonBytes.length + 8 + binaryBytes.length;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  let offset = 0;
  view.setUint32(offset, 0x46546c67, true); offset += 4;
  view.setUint32(offset, 2, true); offset += 4;
  view.setUint32(offset, length, true); offset += 4;
  view.setUint32(offset, jsonBytes.length, true); offset += 4;
  view.setUint32(offset, 0x4e4f534a, true); offset += 4;
  new Uint8Array(buffer, offset, jsonBytes.length).set(jsonBytes); offset += jsonBytes.length;
  view.setUint32(offset, binaryBytes.length, true); offset += 4;
  view.setUint32(offset, 0x004e4942, true); offset += 4;
  new Uint8Array(buffer, offset, binaryBytes.length).set(binaryBytes);
  return buffer;
}

test('parseGlb lit un mesh triangulé et son matériau', () => {
  const parsed = parseGlb(makeTriangleGlb());
  assert.equal(parsed.meshes.length, 1);
  assert.equal(parsed.meshes[0].name, 'pitch');
  assert.deepEqual([...parsed.meshes[0].primitives[0].attributes.POSITION], [0, 0, 0, 1, 0, 0, 0, 1, 0]);
  assert.deepEqual([...parsed.meshes[0].primitives[0].indices], [0, 1, 2]);
  assert.equal(parsed.materials[0].name, 'grass');
  assert.deepEqual(parsed.materials[0].baseColorFactor, [0.2, 0.6, 0.25, 1]);
});

test('readGlbAccessor retourne les données typées', () => {
  const parsed = parseGlb(makeTriangleGlb());
  const positions = readGlbAccessor(parsed, 0);
  assert.ok(positions instanceof Float32Array);
  assert.equal(positions.length, 9);
});

test('parseGlb refuse une signature invalide', () => {
  const invalid = makeTriangleGlb();
  new DataView(invalid).setUint32(0, 0, true);
  assert.throws(() => parseGlb(invalid), /signature GLB invalide/);
});
