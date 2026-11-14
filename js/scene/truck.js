import { geometryKit } from "./geometryKit";
import { Shape, ExtrudeGeometry, CylinderGeometry } from "three";
export function createTruck() {
  const { box, part, block, round, finish } = geometryKit();
  // A rear-loading compactor, driver's cab, hydraulic arms and tandem axle.
  const z = 0,
    x = 0;
  const truck = (dx, y, dz, w, h, d, c) => box(x + dx, y, z + dz, w, h, d, c);
  truck(-0.075, 0.44, 0, 3.15, 0.22, 0.82, "#34413c");
  const profile = new Shape();
  profile.moveTo(-1.46, 0.67);
  profile.lineTo(-1.58, 1.06);
  profile.quadraticCurveTo(-1.52, 1.42, -1.22, 1.58);
  profile.quadraticCurveTo(-0.93, 1.71, 0.2, 1.68);
  profile.quadraticCurveTo(0.48, 1.66, 0.5, 1.41);
  profile.lineTo(0.5, 0.76);
  profile.lineTo(0.26, 0.62);
  profile.closePath();
  const shell = new ExtrudeGeometry(profile, {
    depth: 1.02,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.043,
    bevelThickness: 0.04,
    curveSegments: 9,
  });
  part(shell, 0, 0, -0.51, 1, 1, 1, "#377755");
  shell.dispose();
  for (const side of [-1, 1]) {
    truck(-0.45, 0.85, side * 0.554, 1.9, 0.09, 0.016, "#c6d884");
    for (const dx of [-1.32, 0.31])
      part(
        block,
        dx,
        1.12,
        side * 0.562,
        0.055,
        0.78,
        0.030,
        "#599267",
        0,
        0,
        0,
      );
    for (let i = 0; i < 6; i++)
      truck(
        -1.25 + i * 0.27,
        0.78,
        side * 0.565,
        0.105,
        0.034,
        0.014,
        i % 2 ? "#d59e62" : "#f0e7c2",
      );
  }
  // Sloped inner hopper wall between the cheeks, open at the loading sill.
  part(block, -1.64, 0.94, 0, 0.08, 0.76, 1.026, "#477057", 0, 0, -0.4);
  part(round, x + 1.11, 1.01, z, 0.96, 1.06, 1.02, "#f3eddb");
  truck(1.59, 1.19, 0, 0.025, 0.37, 0.83, "#405857");
  for (const side of [-1, 1]) {
    truck(1.12, 1.2, 0.52 * side, 0.65, 0.36, 0.027, "#49645f");
    truck(0.965, 1.2, side * 0.537, 0.025, 0.36, 0.013, "#273f3d");
    truck(0.78, 0.97, side * 0.518, 0.013, 0.41, 0.009, "#aaa997");
    truck(1.45, 0.97, side * 0.518, 0.013, 0.41, 0.009, "#aaa997");
    truck(1.12, 0.77, side * 0.518, 0.66, 0.014, 0.009, "#aaa997");
    truck(1.38, 1.23, side * 0.56, 0.055, 0.031, 0.18, "#495651");
    truck(0.94, 0.94, 0.526 * side, 0.11, 0.042, 0.036, "#43594c");
    truck(1.49, 1.2, 0.62 * side, 0.13, 0.19, 0.11, "#3d4a41");
    truck(1.6, 0.77, 0.35 * side, 0.025, 0.13, 0.19, "#fff3cb");
    truck(1.614, 0.77, side * 0.46, 0.02, 0.12, 0.048, "#d7a154");
    part(
      block,
      1.61,
      1.055,
      side * 0.2,
      0.018,
      0.018,
      0.31,
      "#253633",
      side * 0.09,
    );
  }
  truck(1.58, 0.53, 0, 0.16, 0.19, 1.06, "#68756b");
  truck(1.667, 0.55, 0, 0.018, 0.072, 0.23, "#d7d8c8");
  truck(1.1, 1.57, 0, 0.44, 0.085, 0.2, "#c59049");
  // Rear hopper, lifting carriage, footboards and reflective chevrons.
  truck(-1.63, 0.56, 0, 0.62, 0.11, 1.16, "#404c46");
  truck(-1.91, 0.67, 0, 0.09, 0.25, 1.1, "#778775");
  truck(-1.955, 0.76, 0, 0.035, 0.07, 0.84, "#343b36");
  for (const side of [-1, 1]) {
    truck(-1.7, 0.95, side * 0.55, 0.38, 0.58, 0.09, "#497957");
    part(
      block,
      -1.7,
      0.96,
      side * 0.615,
      0.075,
      0.55,
      0.05,
      "#d3d3b9",
      0,
      0,
      -0.33,
    );
    truck(-1.74, 0.51, side * 0.6, 0.32, 0.07, 0.17, "#383f39");
    truck(-1.902, 0.87, side * 0.55, 0.027, 0.16, 0.07, "#d7894c");
    for (let i = 0; i < 3; i++)
      part(
        block,
        -1.8 + i * 0.1,
        0.76,
        side * 0.6,
        0.055,
        0.11,
        0.008,
        "#ead88b",
        0,
        0,
        -0.5,
      );
    truck(0.58, 0.53, side * 0.48, 0.5, 0.14, 0.25, "#78877d");
    truck(1.06, 0.68, side * 0.53, 0.83, 0.065, 0.03, "#367750");
  }
  for (let i = 0; i < 4; i++)
    truck(1.616, 0.88 + i * 0.045, 0, 0.025, 0.018, 0.54, "#48534e");
  truck(0.58, 1.36, -0.41, 0.09, 0.55, 0.095, "#6c7167");
  return finish();
}
export const wheelAxles = [-1.19, -0.56, 1.13];
export function createWheel() {
  const { part, cylinder, finish } = geometryKit();
  const disc = (z, r, depth, color, x = 0, y = 0) =>
    part(cylinder, x, y, z, r, depth, r, color, Math.PI / 2);
  disc(0, 0.345, 0.2, "#303a36");
  disc(0.113, 0.163, 0.04, "#a2aba1");
  disc(0.135, 0.073, 0.026, "#48534a");
  const nut = new CylinderGeometry(1, 1, 1, 6);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    part(
      nut,
      0.11 * Math.cos(a),
      0.11 * Math.sin(a),
      0.138,
      0.018,
      0.018,
      0.018,
      "#c4c9b9",
      Math.PI / 2,
    );
  }
  nut.dispose();
  return finish();
}
