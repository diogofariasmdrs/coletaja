import * as T from "three";
export function createLivery() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 146;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#dfebbf";
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(22 + i * 22, 90);
    ctx.lineTo(63 + i * 22, 43);
    ctx.lineTo(82 + i * 22, 43);
    ctx.lineTo(42 + i * 22, 90);
    ctx.fill();
  }
  ctx.font = "bold 63px Arial";
  ctx.fillText("ColetaJá", 125, 91);
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  const mesh = new T.Mesh(
    new T.PlaneGeometry(1.6, 0.455),
    new T.MeshStandardMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      roughness: 0.84,
    }),
  );
  mesh.position.set(-0.52, 1.18, 0.586);
  return mesh;
}
