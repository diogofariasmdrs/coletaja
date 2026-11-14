export function dressStreets({ box, part, block, round, cylinder, crown }) {
  function bin(x, z, body, lid) {
    part(round, x, 0.48, z, 0.34, 0.5, 0.32, body);
    part(block, x, 0.755, z, 0.38, 0.06, 0.36, lid, -0.07);
    box(x, 0.58, z + 0.165, 0.15, 0.085, 0.012, "#e5e4d3");
    box(x, 0.73, z - 0.19, 0.23, 0.035, 0.04, "#46524c");
    for (const dx of [-0.13, 0.13])
      part(
        cylinder,
        x + dx,
        0.27,
        z - 0.13,
        0.057,
        0.045,
        0.057,
        "#313b35",
        0,
        0,
        Math.PI / 2,
      );
  }
  function sack(x, z, s) {
    part(
      crown,
      x,
      0.22 + 0.16 * s,
      z,
      0.2 * s,
      0.21 * s,
      0.17 * s,
      "#4b514a",
      0.1,
      x,
    );
    part(
      crown,
      x - 0.025,
      0.22 + 0.38 * s,
      z,
      0.055 * s,
      0.065 * s,
      0.05 * s,
      "#393f38",
      0,
      0.4,
    );
    box(x - 0.025, 0.22 + 0.33 * s, z, 0.085, 0.025, 0.075, "#a69c80");
  }
  // Recessed collection bay, painted curb, wheelie bins and tied sacks.
  box(3.18, 0.226, 3.93, 2.22, 0.025, 0.76, "#a49e8c");
  for (let i = 0; i < 8; i++)
    box(2.22 + i * 0.26, 0.2, 3.46, 0.15, 0.09, 0.055, "#d7bc70");
  bin(2.46, 3.92, "#537560", "#9ebc76");
  bin(2.91, 3.94, "#546a66", "#cba961");
  sack(3.33, 3.89, 0.96);
  sack(3.63, 3.92, 0.72);
  sack(3.48, 4.1, 0.83);
  bin(-4.22, 0.4, "#51665c", "#7ca27a");
  sack(-4.66, 0.46, 0.78);
  bin(6.72, -0.4, "#56695d", "#a3b97c");
  for (const x of [-6.8, -2.7, 3.95, 6.66]) {
    box(x, 0.02, 3.37, 0.41, 0.025, 0.15, "#77796c");
    for (let i = 0; i < 6; i++)
      box(x - 0.16 + i * 0.062, 0.038, 3.37, 0.025, 0.009, 0.12, "#46504a");
  }
  // Paving joints, shop doors, shutters and display windows.
  for (let i = 0; i < 24; i++) {
    const x = -7.25 + i * 0.61;
    if (x > -0.55 && x < 1.58) continue;
    box(x, 0.224, 3.83, 0.012, 0.008, 0.68, "#979486");
    box(x, 0.224, 0.44, 0.012, 0.008, 0.59, "#9e9e90");
  }
  for (const [x, z] of [
    [-3.06, 0.17],
    [-5.85, 0.14],
    [5.74, -0.57],
  ]) {
    box(x, 0.59, z, 0.36, 0.72, 0.04, "#454e45");
    box(x + 0.125, 0.52, z + 0.024, 0.024, 0.14, 0.025, "#d9cfb4");
    for (const dx of [-0.63, 0.65]) {
      box(x + dx, 0.68, z, 0.59, 0.68, 0.05, "#687f75");
      box(x + dx, 0.34, z + 0.04, 0.64, 0.07, 0.11, "#cbc3a6");
    }
  }
  // Shelter at the square and slim steel bollards.
  for (const x of [-5.15, -3.83])
    box(x, 0.86, 3.97, 0.055, 1.28, 0.055, "#495a51");
  box(-4.49, 1.51, 4.12, 1.62, 0.1, 0.7, "#819581");
  box(-4.49, 0.91, 3.95, 1.27, 0.73, 0.04, "#abb6a3");
  box(-4.93, 0.99, 3.98, 0.22, 0.39, 0.018, "#ece4c9");
  box(-4.42, 0.58, 4.1, 0.89, 0.07, 0.25, "#ac8059");
  for (const x of [1.85, 4.46, 5.92])
    part(cylinder, x, 0.4, 3.58, 0.045, 0.36, 0.045, "#6b7668");
  for (const [x, z] of [
    [4.45, -2.67],
    [-4.76, -3.01],
  ]) {
    box(x, 0.45, z, 0.91, 0.46, 0.65, "#a7967b");
    part(crown, x, 0.72, z, 0.56, 0.32, 0.43, "#7f9061");
  }
  // Rooftop tanks and vents give the skyline a different silhouette on each block.
  for (const [x, y, z] of [
    [3.47, 4.62, -4.7],
    [-3.59, 4.36, -3.95],
    [5.42, 3.3, -4.7],
  ]) {
    part(cylinder, x, y, z, 0.29, 0.35, 0.29, "#80908b");
    part(cylinder, x, y + 0.18, z, 0.31, 0.065, 0.31, "#9aa49a");
  }
}
