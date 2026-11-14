import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
// All fixed pieces share a vertex-coloured mesh and one shadow pass.
export function geometryKit(instanceBoxes = false) {
  const pieces = [];
  const block = new T.BoxGeometry();
  const round = new RoundedBoxGeometry(1, 1, 1, 1, 0.075);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 12);
  const crown = new T.IcosahedronGeometry(1, 1);
  const matrices = [];
  const tints = [];
  const pose = new T.Object3D();
  function part(g, x, y, z, w, h, d, colour, rx = 0, ry = 0, rz = 0) {
    pose.position.set(x, y, z);
    pose.scale.set(w, h, d);
    pose.rotation.set(rx, ry, rz);
    pose.updateMatrix();
    if (instanceBoxes && g === block) {
      matrices.push(pose.matrix.clone());
      tints.push(new T.Color(colour));
      return;
    }
    const transformed = g.index ? g.toNonIndexed() : g.clone();
    transformed.applyMatrix4(pose.matrix);
    transformed.deleteAttribute("uv");
    const tint = new T.Color(colour);
    const colours = new Uint8Array(transformed.attributes.position.count * 3);
    const rgb = tint.toArray().map((channel) => Math.round(channel * 255));
    for (let i = 0; i < colours.length; i += 3) colours.set(rgb, i);
    transformed.setAttribute("color", new T.BufferAttribute(colours, 3, true));
    pieces.push(transformed);
  }
  const box = (x, y, z, w, h, d, c) => part(block, x, y, z, w, h, d, c);
  function finish() {
    const geometry = mergeGeometries(pieces);
    for (const g of [...pieces, block, round, cylinder, crown]) g.dispose();
    return geometry;
  }
  return { matrices, tints, box, part, block, round, cylinder, crown, finish };
}
