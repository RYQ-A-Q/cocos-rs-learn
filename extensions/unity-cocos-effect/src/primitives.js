'use strict';

// A small glTF mesh for Unity's built-in cube (fileID 10202).
function cubeGlb() {
  const faces = [
    { n: [0, 0, 1], v: [[-0.5,-0.5,0.5],[0.5,-0.5,0.5],[0.5,0.5,0.5],[-0.5,0.5,0.5]] },
    { n: [0, 0,-1], v: [[0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5,0.5,-0.5],[0.5,0.5,-0.5]] },
    { n: [1, 0, 0], v: [[0.5,-0.5,0.5],[0.5,-0.5,-0.5],[0.5,0.5,-0.5],[0.5,0.5,0.5]] },
    { n: [-1,0, 0], v: [[-0.5,-0.5,-0.5],[-0.5,-0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,-0.5]] },
    { n: [0, 1, 0], v: [[-0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,-0.5],[-0.5,0.5,-0.5]] },
    { n: [0,-1, 0], v: [[-0.5,-0.5,-0.5],[0.5,-0.5,-0.5],[0.5,-0.5,0.5],[-0.5,-0.5,0.5]] },
  ];
  const positions = [], normals = [], uvs = [], indices = [];
  const uv = [[0,0],[1,0],[1,1],[0,1]];
  for (let face = 0; face < faces.length; face++) {
    for (let vertex = 0; vertex < 4; vertex++) {
      positions.push(...faces[face].v[vertex]);
      normals.push(...faces[face].n);
      uvs.push(...uv[vertex]);
    }
    const start = face * 4;
    indices.push(start,start+1,start+2,start,start+2,start+3);
  }
  const chunks = [
    Buffer.from(new Float32Array(positions).buffer),
    Buffer.from(new Float32Array(normals).buffer),
    Buffer.from(new Float32Array(uvs).buffer),
    Buffer.from(new Uint16Array(indices).buffer),
  ];
  const offsets = [];
  let length = 0;
  for (const chunk of chunks) { offsets.push(length); length += chunk.length; }
  const bin = Buffer.concat(chunks);
  const gltf = {
    asset: { version: '2.0', generator: 'unity-cocos-effect' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: 'UnityCube' }],
    meshes: [{ name: 'UnityCube', primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3 }] }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: chunks.map((chunk, i) => ({ buffer: 0, byteOffset: offsets[i], byteLength: chunk.length, target: i === 3 ? 34963 : 34962 })),
    accessors: [
      { bufferView: 0, componentType: 5126, count: 24, type: 'VEC3', min: [-0.5,-0.5,-0.5], max: [0.5,0.5,0.5] },
      { bufferView: 1, componentType: 5126, count: 24, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: 24, type: 'VEC2' },
      { bufferView: 3, componentType: 5123, count: 36, type: 'SCALAR' },
    ],
  };
  let json = Buffer.from(JSON.stringify(gltf));
  json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii'); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(json.length, 0); jsonHeader.write('JSON', 4, 'ascii');
  const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(bin.length, 0); binHeader.write('BIN\0', 4, 'ascii');
  return Buffer.concat([header, jsonHeader, json, binHeader, bin]);
}

module.exports = { cubeGlb };
