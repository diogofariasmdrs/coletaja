import * as T from "three";
import { createDistrict } from "./model.js";
import { createVehicle } from "./vehicle.js";

export function createWorld(mobile) {
  const scene = new T.Scene();
  scene.fog = new T.Fog("#708574", 19, 52);
  const sun = new T.DirectionalLight("#ffe4bc", 2.65);
  sun.position.set(-8, 12, 6);
  sun.castShadow = !mobile;
  Object.assign(sun.shadow.camera, {
    left: -12,
    right: 12,
    top: 11,
    bottom: -11,
  });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = 0.012;
  sun.shadow.bias = -0.00014;
  scene.add(sun, new T.HemisphereLight("#fff6e8", "#b0baa4", 1.65));
  const district = createDistrict();
  const standard = (roughness, vertexColors = true) =>
    new T.MeshStandardMaterial({ roughness, vertexColors });
  const boxes = new T.InstancedMesh(
    new T.BoxGeometry(),
    standard(0.95, false),
    district.matrices.length,
  );
  district.matrices.forEach((matrix, i) => {
    boxes.setMatrixAt(i, matrix);
    boxes.setColorAt(i, district.tints[i]);
  });
  const details = new T.Mesh(district.detail, standard(0.95));
  const { vehicle, roll } = createVehicle();
  for (const mesh of [boxes, details])
    mesh.castShadow = mesh.receiveShadow = true;
  const route = new T.Mesh(
    new T.PlaneGeometry(8.6, 0.045),
    new T.MeshBasicMaterial({
      color: "#acd194",
      transparent: true,
      depthWrite: false,
    }),
  );
  route.position.set(-0.68, 0.036, 3.23);
  route.rotation.x = -Math.PI / 2;
  scene.add(boxes, details, vehicle, route);
  return { scene, vehicle, roll, route };
}
