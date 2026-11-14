import * as T from "three";
import { MathUtils } from "three";
import { createWorld } from "./world.js";

import { DURATION, REVEAL_AT, ROAD_Z, sampleJourney } from "./journey.js";
import { transition } from "../mapTransition.js";
import { bindOrbit } from "./orbit.js";

export function startFilm(
  host,
  { onFail, onFrame, onReveal, onFinish, onPick },
) {
  const mobile = matchMedia("(max-width:700px), (pointer:coarse)").matches;
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: !mobile });
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1 : 1.25));
  const canvas = renderer.domElement;
  host.append(canvas);
  const camera = new T.PerspectiveCamera(34, 1, 0.08, 100);
  const { scene, vehicle, roll, route } = createWorld(mobile);
  const eye = new T.Vector3(),
    look = new T.Vector3();
  const orbit = { yaw: 0, pitch: 0 },
    input = { yaw: 0, pitch: 0, dragged: false };
  const sample = { total: 0, count: 0, slowWindows: 0 };
  let width,
    height,
    frameId = 0,
    visible = true,
    disposed = false,
    paused = false,
    skipped = false;
  let elapsed = 0,
    first = false,
    finished = false,
    revealed = false,
    lastActiveFrame = 0,
    wheelDistance = NaN,
    shadowX = -Infinity;
  let unbind = () => {};
  function invalidate() {
    if (!frameId && !disposed && visible && !document.hidden)
      frameId = requestAnimationFrame(render);
  }
  function setDpr(value) {
    renderer.setPixelRatio(value);
  }
  function render(time) {
    frameId = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = lastActiveFrame
      ? Math.max(0, (time - lastActiveFrame) / 1000)
      : 0;
    if (!paused) elapsed = Math.min(DURATION, elapsed + Math.min(0.25, delta));
    const now = performance.now();
    const continuous = now - lastActiveFrame < 250;
    lastActiveFrame = now;
    const orbitMoving =
      Math.abs(orbit.yaw - input.yaw) + Math.abs(orbit.pitch - input.pitch) >
      0.001;
    if (((!finished && !paused) || (orbitMoving && continuous)) && delta > 0) {
      const window = sample;
      window.total += Math.min(delta, 0.5);
      window.count++;
      if (window.count === 15) {
        const floor = mobile ? 0.65 : 0.7;
        const mean = window.total / window.count;
        if (mean > 0.045 && renderer.getPixelRatio() > floor + 0.01) {
          setDpr(Math.max(floor, renderer.getPixelRatio() * 0.8));
          window.slowWindows = 0;
        } else {
          window.slowWindows =
            mobile && !finished && mean > 0.12 ? window.slowWindows + 1 : 0;
          if (window.slowWindows >= 2) {
            onFail();
            return;
          }
        }
        window.total = 0;
        window.count = 0;
      }
    }
    const t = skipped ? DURATION : elapsed,
      aspect = width / height;
    const x = sampleJourney(t, aspect, eye, look);
    const end = t === DURATION;
    renderer.shadowMap.autoUpdate = false;
    if (Math.abs(x - shadowX) > 0.24 || (end && !finished)) {
      renderer.shadowMap.needsUpdate = true;
      shadowX = x;
    }
    vehicle?.position.set(x, 0, ROAD_Z);
    if (Number.isNaN(wheelDistance) || Math.abs(x - wheelDistance) > 0.0002) {
      wheelDistance = x;
      roll(x + 5.85);
    }
    const o = orbit,
      goal = input;
    o.yaw = MathUtils.damp(o.yaw, end ? goal.yaw : 0, 9, Math.min(delta, 0.05));
    o.pitch = MathUtils.damp(
      o.pitch,
      end ? goal.pitch : 0,
      9,
      Math.min(delta, 0.05),
    );
    const radius = Math.hypot(eye.x - look.x, eye.z - look.z),
      angle = Math.atan2(eye.x - look.x, eye.z - look.z) + o.yaw;
    eye.set(
      look.x + Math.sin(angle) * radius,
      eye.y + radius * o.pitch,
      look.z + Math.cos(angle) * radius,
    );
    const lift = MathUtils.smootherstep(transition.progress, 0, 0.92);
    eye.set(
      eye.x,
      eye.y + 11 * lift,
      MathUtils.lerp(eye.z, look.z + 1.8, lift * 0.72),
    );
    camera.position.copy(eye);
    camera.lookAt(look);
    if (camera.isPerspectiveCamera) {
      const settle = MathUtils.smootherstep(t, 6.3, DURATION),
        mobile = width <= 700;
      camera.setViewOffset(
        width,
        height,
        mobile ? 0 : -width * 0.22 * settle,
        mobile ? height * 0.21 * settle : -height * 0.025 * settle,
        width,
        height,
      );
    }
    if (route) route.material.opacity = end ? 0.43 : 0.28;
    if (t >= REVEAL_AT && !revealed) {
      revealed = true;
      onReveal();
    }
    if (!first) {
      first = true;
      onFrame();
    }
    if (end && !finished) {
      finished = true;
      onFinish();
    }
    if (
      (!end && !paused) ||
      Math.abs(o.yaw - goal.yaw) + Math.abs(o.pitch - goal.pitch) > 0.001
    )
      invalidate();

    renderer.render(scene, camera);
  }
  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    invalidate();
  }
  const resizer = new ResizeObserver(resize);
  resizer.observe(host);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    lastActiveFrame = 0;
    invalidate();
  });
  observer.observe(host);
  const hero = host.closest(".hero");
  hero.addEventListener("maptransition", invalidate);
  document.addEventListener("visibilitychange", invalidate);
  canvas.addEventListener("webglcontextlost", onFail);
  let press;
  canvas.addEventListener("pointerdown", (e) => {
    press = [e.clientX, e.clientY];
  });
  canvas.addEventListener("click", (e) => {
    if (
      !finished ||
      input.dragged ||
      !press ||
      Math.hypot(e.clientX - press[0], e.clientY - press[1]) >= 6
    )
      return;
    const rect = canvas.getBoundingClientRect(),
      ray = new T.Raycaster();
    ray.setFromCamera(
      new T.Vector2(
        (2 * (e.clientX - rect.left)) / rect.width - 1,
        1 - (2 * (e.clientY - rect.top)) / rect.height,
      ),
      camera,
    );
    if (ray.intersectObject(vehicle, true).length) onPick();
  });
  resize();
  return {
    pause(value) {
      paused = value;
      lastActiveFrame = 0;
      invalidate();
    },
    skip() {
      skipped = true;
      paused = false;
      invalidate();
    },
    explore(value) {
      unbind();
      unbind = bindOrbit(canvas, value, finished, invalidate, input);
    },
    replay() {
      unbind();
      input.yaw = input.pitch = 0;
      elapsed = 0;
      finished = revealed = skipped = paused = false;
      lastActiveFrame = 0;
      invalidate();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      unbind();
      resizer.disconnect();
      observer.disconnect();
      hero.removeEventListener("maptransition", invalidate);
      document.removeEventListener("visibilitychange", invalidate);
      canvas.removeEventListener("webglcontextlost", onFail);
      scene.traverse((obj) => {
        obj.geometry?.dispose();
        obj.material?.map?.dispose();
        obj.material?.dispose();
        if (obj.isInstancedMesh) obj.dispose();
        obj.shadow?.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
