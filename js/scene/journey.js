import { MathUtils } from "three";
export const DURATION = 8.4;
export const REVEAL_AT = 6.65;
export const END_X = 3.62;
export const ROAD_Z = 2.78;
export function sampleJourney(time, aspect, eye, look) {
  const track = MathUtils.smootherstep(time, 0.55, 4.1);
  const close = MathUtils.smootherstep(time, 3.6, 6.2);
  const settle = MathUtils.smootherstep(time, 6.3, DURATION);
  const truckX = MathUtils.lerp(
    -5.85,
    END_X,
    MathUtils.smootherstep(time, 0.45, 6.15),
  );
  look.set(
    MathUtils.lerp(-0.35, truckX, track),
    MathUtils.lerp(0.45, 0.92, track),
    MathUtils.lerp(-0.2, ROAD_Z, track),
  );
  const radius = MathUtils.lerp(20, 9.7, track) - 4.55 * close + 0.65 * settle;
  const height = MathUtils.lerp(15.8, 6.3, track) - 4.12 * close + 0.5 * settle;
  const fit = Math.max(1, 1.35 / aspect);
  const azimuth =
    MathUtils.lerp(-0.5, 0.68, track) - 0.26 * close - 0.08 * settle;
  eye.set(
    look.x + Math.sin(azimuth) * radius * fit,
    look.y + height * fit,
    look.z + Math.cos(azimuth) * radius * fit,
  );
  return truckX;
}
