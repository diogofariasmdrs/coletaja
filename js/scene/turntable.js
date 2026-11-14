import * as T from "three";
import { createVehicle } from "./vehicle.js";

export function mountTurntable(host) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: innerWidth > 700,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute(
    "aria-label",
    "Compactador CJ-01 em 3D. Setas giram, mais e menos aproximam e afastam. Espaço pausa o giro.",
  );
  host.append(canvas);
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(30, 1, 0.1, 40);
  const { vehicle } = createVehicle();
  scene.add(vehicle);
  scene.add(new T.HemisphereLight(0xfff9eb, 0xb4c4b8, 2));
  const light = new T.DirectionalLight(0xffefd4, 2.8);
  light.position.set(3, 7, 4);
  scene.add(light);
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 128;
  shadowCanvas.height = 64;
  const ctx = shadowCanvas.getContext("2d");
  ctx.scale(2, 1);
  const gradient = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
  gradient.addColorStop(0, "rgba(39,61,48,.45)");
  gradient.addColorStop(1, "rgba(39,61,48,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const shadow = new T.Mesh(
    new T.PlaneGeometry(4.9, 2.3),
    new T.MeshBasicMaterial({
      map: new T.CanvasTexture(shadowCanvas),
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  vehicle.add(shadow);
  let visible = false,
    paused = false,
    frame = 0,
    last = 0,
    angle = -0.42,
    zoom = 1,
    resumeAt = 0,
    dirty = true;
  let targetAngle = null;
  const pointers = new Map();
  let pinch = 0;
  function draw(time) {
    frame = 0;
    if (!visible || document.hidden) return;
    if (targetAngle !== null) {
      const delta = Math.atan2(
        Math.sin(targetAngle - angle),
        Math.cos(targetAngle - angle),
      );
      if (reduced.matches || Math.abs(delta) < 0.002) {
        angle = targetAngle;
        targetAngle = null;
      } else
        angle += delta * (1 - Math.exp(-Math.min(time - last, 50) * 0.015));
      dirty = true;
    }
    const auto = !paused && !reduced.matches && !pointers.size;
    if (auto && time >= resumeAt && last) {
      angle += Math.min(time - last, 50) * 0.00019;
      dirty = true;
    }
    last = time;
    if (dirty) {
      vehicle.rotation.y = angle;
      renderer.render(scene, camera);
      host.classList.add("is-live");
      dirty = false;
    }
    if (auto || targetAngle !== null) frame = requestAnimationFrame(draw);
  }
  function wake() {
    dirty = true;
    if (visible && !document.hidden && !frame)
      frame = requestAnimationFrame(draw);
  }
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    const distance = Math.max(5.5, 8.8 / camera.aspect) / zoom;
    camera.position.set(0, 0.85 + distance * 0.31, distance);
    camera.lookAt(0, 0.82, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    wake();
  }
  function magnify(value) {
    zoom = T.MathUtils.clamp(value, 0.78, 1.22);
    resize();
  }
  const events = new AbortController(),
    opts = { signal: events.signal };
  function focusComponent() {
    targetAngle = Number(host.dataset.componentAngle);
    resumeAt = performance.now() + 4500;
    wake();
  }
  host.addEventListener("componentview", focusComponent, opts);
  if (host.dataset.componentAngle !== undefined) focusComponent();
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      targetAngle = null;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      canvas.setPointerCapture(e.pointerId);
      pinch = 0;
      wake();
    },
    opts,
  );
  canvas.addEventListener(
    "pointermove",
    (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2) {
        const [a, b] = pointers.values();
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch && d) magnify((zoom * d) / pinch);
        pinch = d;
      } else {
        angle += (e.clientX - prev[0]) * 0.012;
      }
      wake();
    },
    opts,
  );
  function release(e) {
    pointers.delete(e.pointerId);
    pinch = 0;
    resumeAt = performance.now() + 1400;
    wake();
  }
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(event, release, opts);
  canvas.addEventListener(
    "dblclick",
    () => {
      angle = -0.42;
      magnify(1);
    },
    opts,
  );
  canvas.addEventListener(
    "keydown",
    (e) => {
      targetAngle = null;
      switch (e.key) {
        case "ArrowLeft":
          angle -= 0.18;
          break;
        case "ArrowRight":
          angle += 0.18;
          break;
        case "+":
        case "=":
          magnify(zoom + 0.08);
          break;
        case "-":
          magnify(zoom - 0.08);
          break;
        case "Home":
          angle = -0.42;
          magnify(1);
          break;
        case " ":
          paused = !paused;
          break;
        default:
          return;
      }
      e.preventDefault();
      resumeAt = performance.now() + 1400;
      wake();
    },
    opts,
  );
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    last = 0;
    if (!visible) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else wake();
  });
  observer.observe(host);
  document.addEventListener(
    "visibilitychange",
    () => {
      last = 0;
      wake();
    },
    opts,
  );
  reduced.addEventListener("change", wake, opts);
  function dispose() {
    cancelAnimationFrame(frame);
    observer.disconnect();
    resizeObserver.disconnect();
    events.abort();
    scene.traverse((o) => {
      o.geometry?.dispose();
      o.material?.map?.dispose();
      o.material?.dispose();
      if (o.isInstancedMesh) o.dispose();
    });
    renderer.dispose();
    canvas.remove();
    host.classList.remove("is-live");
  }
  canvas.addEventListener("webglcontextlost", dispose, opts);
  window.addEventListener(
    "pagehide",
    (e) => {
      if (!e.persisted) dispose();
    },
    opts,
  );
  resize();
}
