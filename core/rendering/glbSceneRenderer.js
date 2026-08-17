function assert(condition, message) {
  if (!condition) throw new Error(`GLB renderer: ${message}`);
}

function mat4Identity() {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
}

function mat4Multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      out[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function mat4FromNode(node = {}) {
  if (Array.isArray(node.matrix) && node.matrix.length === 16) return new Float32Array(node.matrix);
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  let [x, y, z, w] = node.rotation ?? [0, 0, 0, 1];
  const qLen = Math.hypot(x, y, z, w) || 1;
  x /= qLen; y /= qLen; z /= qLen; w /= qLen;
  const xx=x*x, yy=y*y, zz=z*z, xy=x*y, xz=x*z, yz=y*z, wx=w*x, wy=w*y, wz=w*z;
  return new Float32Array([
    (1-2*(yy+zz))*sx, (2*(xy+wz))*sx, (2*(xz-wy))*sx, 0,
    (2*(xy-wz))*sy, (1-2*(xx+zz))*sy, (2*(yz+wx))*sy, 0,
    (2*(xz+wy))*sz, (2*(yz-wx))*sz, (1-2*(xx+yy))*sz, 0,
    tx, ty, tz, 1,
  ]);
}

function mat4ScaleTranslate(scale, translation) {
  const [sx, sy, sz] = scale;
  const [tx, ty, tz] = translation;
  return new Float32Array([
    sx,0,0,0, 0,sy,0,0, 0,0,sz,0,
    tx,ty,tz,1,
  ]);
}

function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0]/len, v[1]/len, v[2]/len];
}
function subtract(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}

function mat4LookAt(eye, target, up=[0,1,0]) {
  const z = normalize(subtract(eye,target));
  const x = normalize(cross(up,z));
  const y = cross(z,x);
  return new Float32Array([
    x[0],y[0],z[0],0,
    x[1],y[1],z[1],0,
    x[2],y[2],z[2],0,
    -dot(x,eye),-dot(y,eye),-dot(z,eye),1,
  ]);
}

function mat4Perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f/aspect,0,0,0,
    0,f,0,0,
    0,0,(far+near)*nf,-1,
    0,0,2*far*near*nf,0,
  ]);
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, `#version 300 es
    layout(location=0) in vec3 a_position;
    uniform mat4 u_mvp;
    void main(){gl_Position=u_mvp*vec4(a_position,1.0);}
  `);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
    precision mediump float;
    uniform vec4 u_color;
    out vec4 outColor;
    void main(){outColor=u_color;}
  `);
  const program = gl.createProgram();
  gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.deleteShader(vertex); gl.deleteShader(fragment);
  return program;
}

function indexType(gl, indices) {
  if (indices instanceof Uint8Array) return gl.UNSIGNED_BYTE;
  if (indices instanceof Uint16Array) return gl.UNSIGNED_SHORT;
  if (indices instanceof Uint32Array) return gl.UNSIGNED_INT;
  throw new Error(`Type d'indices non supporté: ${indices?.constructor?.name}`);
}

function createGpuPrimitive(gl, primitive) {
  const positions = primitive.attributes.POSITION;
  assert(positions instanceof Float32Array, 'POSITION Float32Array requis');
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const positionBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  let elementBuffer = null, count = positions.length / 3, type = null;
  if (primitive.indices) {
    elementBuffer = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, primitive.indices, gl.STATIC_DRAW);
    count = primitive.indices.length; type = indexType(gl, primitive.indices);
  }
  gl.bindVertexArray(null);
  return {vao, positionBuffer, elementBuffer, count, type, materialIndex: primitive.materialIndex};
}

function sceneRoots(gltf) {
  const roots = gltf.scenes?.[gltf.scene ?? 0]?.nodes;
  if (roots?.length) return roots;
  const children = new Set((gltf.nodes ?? []).flatMap((node) => node.children ?? []));
  return (gltf.nodes ?? []).map((_, index) => index).filter((index) => !children.has(index));
}

export const STP_CAMERA_REFERENCE = Object.freeze({
  mode: 'intermediate',
  tiltDeg: 16,
  zoom: 1.07,
  sidelineDistance: 95,
});

export function createStpCamera(reference = STP_CAMERA_REFERENCE) {
  const tiltRad = (reference.tiltDeg * Math.PI) / 180;
  const horizontal = reference.sidelineDistance;
  return Object.freeze({
    eye: [0, Math.tan(tiltRad) * horizontal, horizontal],
    target: [0, 0, 0],
    fovDeg: 42 / reference.zoom,
    near: 0.1,
    far: 500,
    ...reference,
  });
}

export function createFieldSceneRenderer(canvas, parsed, normalization, options = {}) {
  const gl = canvas.getContext('webgl2', {alpha:false, antialias:true});
  assert(gl, 'WebGL2 indisponible');
  const program = createProgram(gl);
  const uMvp = gl.getUniformLocation(program, 'u_mvp');
  const uColor = gl.getUniformLocation(program, 'u_color');
  const gpuMeshes = parsed.meshes.map((mesh) => mesh.primitives.map((primitive) => createGpuPrimitive(gl, primitive)));
  const camera = createStpCamera(options.camera ?? STP_CAMERA_REFERENCE);
  const bounds = normalization.source.bounds;
  const center = [(bounds.min[0]+bounds.max[0])/2, bounds.min[1], (bounds.min[2]+bounds.max[2])/2];
  const [sx, sy, sz] = normalization.scale;
  const normalizer = mat4ScaleTranslate([sx,sy,sz], [-center[0]*sx,-center[1]*sy,-center[2]*sz]);

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    gl.viewport(0, 0, width, height);
  }

  function drawNode(nodeIndex, parentWorld, viewProjection) {
    const node = parsed.json.nodes[nodeIndex] ?? {};
    const world = mat4Multiply(parentWorld, mat4FromNode(node));
    if (node.mesh !== undefined) {
      const mvp = mat4Multiply(viewProjection, mat4Multiply(normalizer, world));
      for (const primitive of gpuMeshes[node.mesh] ?? []) {
        const material = primitive.materialIndex === null ? null : parsed.materials[primitive.materialIndex];
        gl.uniformMatrix4fv(uMvp, false, mvp);
        gl.uniform4fv(uColor, material?.baseColorFactor ?? [0.7,0.7,0.7,1]);
        gl.bindVertexArray(primitive.vao);
        if (primitive.type === null) gl.drawArrays(gl.TRIANGLES, 0, primitive.count);
        else gl.drawElements(gl.TRIANGLES, primitive.count, primitive.type, 0);
      }
    }
    for (const child of node.children ?? []) drawNode(child, world, viewProjection);
  }

  function render() {
    resize();
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0.025,0.035,0.03,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const projection = mat4Perspective((camera.fovDeg*Math.PI)/180, canvas.width/canvas.height, camera.near, camera.far);
    const view = mat4LookAt(camera.eye, camera.target);
    const viewProjection = mat4Multiply(projection, view);
    for (const root of sceneRoots(parsed.json)) drawNode(root, mat4Identity(), viewProjection);
    gl.bindVertexArray(null);
  }

  function destroy() {
    for (const mesh of gpuMeshes) for (const primitive of mesh) {
      gl.deleteVertexArray(primitive.vao); gl.deleteBuffer(primitive.positionBuffer);
      if (primitive.elementBuffer) gl.deleteBuffer(primitive.elementBuffer);
    }
    gl.deleteProgram(program);
  }

  return Object.freeze({gl, camera, render, resize, destroy});
}
