import { geometryKit } from "./geometryKit";
import { dressStreets } from "./streetDetails";
export function createDistrict() {
  const kit = geometryKit(true);
  const { box, part, block, cylinder, crown } = kit;
  // Two intersecting avenues split the cutaway into four walkable blocks.
  box(0, -0.53, 0, 15.2, 0.64, 11.8, "#657769");
  box(0, -0.17, 0, 15.24, 0.13, 11.84, "#c5baa2");
  box(0, -0.055, 0, 15.2, 0.13, 11.8, "#555f5d");
  for (const [x, w] of [
    [-3.98, 7.15],
    [4.55, 6.0],
  ]) {
    for (const [z, d] of [
      [-2.5, 6.7],
      [4.64, 2.38],
    ]) {
      box(x, 0.09, z, w, 0.17, d, "#d6cdb8");
      box(x, 0.19, z, w - 0.28, 0.06, d - 0.28, "#b8b39e");
    }
  }
  for (let x = -7; x < 7.2; x += 1.25)
    if (x < -0.8 || x > 2) box(x, 0.017, 2.13, 0.65, 0.015, 0.052, "#e0d7b6");
  for (let z = -5.4; z < 5.9; z += 1.2)
    if (z < 0.2 || z > 3.9) box(0.67, 0.017, z, 0.05, 0.015, 0.6, "#e5ddbd");
  for (let i = 0; i < 7; i++) {
    box(-1.13, 0.025, 1.05 + i * 0.37, 0.67, 0.02, 0.16, "#ebe4d4");
    box(2.18, 0.025, 1.05 + i * 0.37, 0.67, 0.02, 0.16, "#ebe4d4");
  }
  function building(x, z, w, d, h, c, floors) {
    const top = h + 0.22;
    box(x, 0.22 + h / 2, z, w, h, d, c);
    box(x, top + 0.065, z, w + 0.17, 0.13, d + 0.17, "#f1e7cc");
    box(x, top + 0.155, z, w - 0.2, 0.06, d - 0.2, "#9a9d8b");
    box(x - 0.15, top + 0.29, z - 0.12, w * 0.42, 0.23, d * 0.38, "#dbd6c3");
    for (let f = 0; f < floors; f++) {
      const y = 0.22 + ((f + 0.55) * h) / floors;
      for (let i = 0; i < Math.floor(w / 0.48); i++) {
        const wx = x - w / 2 + 0.34 + i * 0.49;
        box(
          wx,
          y,
          z + d / 2 + 0.018,
          0.25,
          (h / floors) * 0.47,
          0.045,
          "#536663",
        );
        box(
          wx,
          y - (h / floors) * 0.24,
          z + d / 2 + 0.05,
          0.32,
          0.055,
          0.095,
          "#e8dfc5",
        );
      }
      for (let i = 0; i < Math.floor(d / 0.52); i++)
        box(
          x + w / 2 + 0.018,
          y,
          z - d / 2 + 0.32 + i * 0.52,
          0.044,
          (h / floors) * 0.48,
          0.27,
          "#617271",
        );
    }
  }
  building(-5.9, -3.87, 2.02, 2.25, 2.52, "#d3be9a", 3);
  building(-3.15, -3.6, 2.58, 2.5, 3.75, "#c6cabe", 4);
  building(-5.85, -0.65, 2.08, 1.55, 1.55, "#dbbc99", 2);
  building(-2.92, -0.69, 2.45, 1.67, 1.23, "#c8a887", 1);
  // Striped storefront canopy.
  for (let i = 0; i < 12; i++)
    part(
      block,
      -4.11 + i * 0.215,
      1.12,
      0.28,
      0.218,
      0.075,
      0.55,
      i % 2 ? "#ece4c8" : "#729580",
      -0.13,
    );
  building(3.1, -4.25, 2.12, 2.12, 4.02, "#bdc7b9", 5);
  building(5.85, -4.17, 2.03, 2.15, 2.73, "#d4c4a0", 3);
  building(5.78, -1.5, 2.3, 1.82, 1.68, "#d5cdba", 2);
  function tree(x, z, s, seed) {
    part(cylinder, x, 0.64 * s + 0.2, z, 0.1 * s, 1.28 * s, 0.1 * s, "#786c50");
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4 + seed;
      part(
        crown,
        x + Math.cos(a) * 0.34 * s,
        1.53 * s + 0.2 + (i === 4 ? 0.45 * s : 0),
        z + Math.sin(a) * 0.28 * s,
        0.52 * s,
        0.72 * s,
        0.52 * s,
        ["#728956", "#8d9c63", "#85975c", "#5c805a", "#9ba86d"][i],
        0.2,
        a,
      );
    }
  }
  [
    [-7, -2, 1],
    [-4.7, 0.29, 0.76],
    [-1.05, -2.6, 0.92],
    [2.5, -0.22, 1.05],
    [4.1, -1.65, 0.74],
    [7.02, -2.8, 0.94],
    [-6.85, 4.71, 1.05],
    [-5.6, 4.37, 0.83],
    [-3.98, 5.12, 0.82],
    [1.88, 5.3, 0.7],
    [7.09, 5.55, 0.68],
  ].forEach(([x, z, s], i) => tree(x, z, s, i));
  for (const [x, z] of [
    [-6.8, 0.59],
    [-2.55, 4.7],
    [4, 0.6],
    [7.18, 1.0],
  ]) {
    box(x, 0.91, z, 0.055, 1.75, 0.055, "#455854");
    box(x, 1.78, z + 0.16, 0.09, 0.06, 0.37, "#50615c");
    box(x, 1.74, z + 0.34, 0.15, 0.07, 0.22, "#eee3c4");
  }
  for (const x of [-2.9, 6.42]) {
    box(x, 0.47, 4.08, 0.99, 0.09, 0.29, "#a58058");
    for (const dx of [-0.36, 0.36])
      box(x + dx, 0.32, 4.08, 0.07, 0.24, 0.22, "#47534a");
  }
  dressStreets(kit);
  return { detail: kit.finish(), matrices: kit.matrices, tints: kit.tints };
}
