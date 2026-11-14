import * as T from "three";
import { createTruck, createWheel, wheelAxles } from "./truck.js";
import { createLivery } from "./livery.js";

export function createVehicle() {
  const material = (roughness) =>
    new T.MeshStandardMaterial({ vertexColors: true, roughness });
  const body = new T.Mesh(createTruck(), material(0.69));
  body.castShadow = body.receiveShadow = true;
  const wheels = new T.InstancedMesh(
    createWheel(),
    material(0.84),
    wheelAxles.length * 2,
  );
  wheels.frustumCulled = false;
  const pose = new T.Object3D();
  function roll(distance) {
    let i = 0;
    for (const axle of wheelAxles)
      for (const side of [-1, 1]) {
        pose.position.set(axle, 0.36, side * 0.5);
        pose.rotation.set(
          0,
          side === 1 ? 0 : Math.PI,
          (-side * distance) / 0.345,
        );
        pose.updateMatrix();
        wheels.setMatrixAt(i++, pose.matrix);
      }
    wheels.instanceMatrix.needsUpdate = true;
  }
  roll(0);
  const vehicle = new T.Group();
  vehicle.add(body, wheels, createLivery());
  return { vehicle, roll };
}
