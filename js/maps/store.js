import {
  plannedRoutes,
  validatePlans,
  templates,
  stopCount,
} from "./planning.js";
import {
  initialState,
  advance,
  statuses,
  types,
  resetPlayback,
} from "./simulation.js";
const key = "coletaja.operations.v3";
let memory = initialState();
// Acrescenta os circuitos interbairros uma vez, mesmo se os códigos padrão já estiverem ocupados.
export function addRegionalRoutes(s) {
  if (s.regionalRoutes) return s;
  const defaults = initialState();
  for (const plan of defaults.plans.slice(6)) {
    if (s.plans.some((p) => p.key === plan.key)) continue;
    let code;
    do {
      code = "RT-" + String(s.nextRoute++).padStart(2, "0");
    } while (s.plans.some((p) => p.code === code));
    s.plans.push({ ...plan, code });
    s.runs[code] = defaults.runs[plan.code];
    if (s.vehicles.length >= 12) continue;
    let n = 7;
    while (s.vehicles.some((v) => v.id === "CJ-" + String(n).padStart(2, "0")))
      n++;
    const id = "CJ-" + String(n).padStart(2, "0");
    const vehicle = defaults.vehicles.find((v) => v.route === plan.code);
    s.vehicles.push({ ...vehicle, id, name: "Compactador " + id, route: code });
  }
  s.regionalRoutes = true;
  return s;
}
function valid(s) {
  const num = (n) => Number.isFinite(n) && n >= 0;
  return (
    s?.version === 3 &&
    validatePlans(s.plans) &&
    Number.isInteger(s.nextRoute) &&
    s.nextRoute >= 7 &&
    num(s.elapsed) &&
    (s.anchor === null || num(s.anchor)) &&
    [0.5, 1, 2, 4].includes(s.speed) &&
    Array.isArray(s.vehicles) &&
    s.vehicles.length <= 12 &&
    s.vehicles.every(
      (v) =>
        /^CJ-\d{2,3}$/.test(v.id) &&
        typeof v.name === "string" &&
        typeof v.notes === "string" &&
        typeof v.active === "boolean" &&
        /^#[a-f0-9]{6}$/i.test(v.color) &&
        statuses.includes(v.status) &&
        (!v.route ||
          plannedRoutes(s).some((r) => r.active && r.code === v.route)),
    ) &&
    new Set(s.vehicles.map((v) => v.id)).size === s.vehicles.length &&
    new Set(s.vehicles.filter((v) => v.route).map((v) => v.route)).size ===
      s.vehicles.filter((v) => v.route).length &&
    plannedRoutes(s).every((r) => {
      const t = s.runs?.[r.code];
      return (
        t &&
        num(t.seconds) &&
        t.seconds <= r.duration &&
        num(t.delay) &&
        (t.end === null || num(t.end)) &&
        Array.isArray(t.missed) &&
        t.missed.every((n) => Number.isInteger(n) && n > 0 && n <= r.count)
      );
    }) &&
    Array.isArray(s.issues) &&
    s.issues.every(
      (e) =>
        e &&
        types.includes(e.type) &&
        typeof e.description === "string" &&
        num(e.time) &&
        typeof e.open === "boolean",
    ) &&
    Array.isArray(s.history) &&
    s.history.every((h) => h && num(h.time) && typeof h.message === "string")
  );
}
function read() {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const s = JSON.parse(raw);
      if (s?.version === 3 && !s.plans && Array.isArray(s.vehicles)) {
        // Os trajetos mudaram. Reaproveite a frota, nunca segundos de outro percurso.
        const fresh = initialState();
        fresh.vehicles = s.vehicles.map((v) => ({
          ...v,
          sector:
            fresh.plans.find((p) => p.code === v.route)?.name.split(" · ")[0] ||
            "",
        }));
        if (valid(fresh)) {
          try {
            localStorage.setItem(key, JSON.stringify(fresh));
          } catch {}
          return fresh;
        }
      }
      if (!valid(s)) return initialState();
      if (!s.regionalRoutes) {
        addRegionalRoutes(s);
        try {
          localStorage.setItem(key, JSON.stringify(s));
        } catch {}
      }
      if (s.routeRevision !== 2) {
        for (const plan of s.plans)
          if (templates.find((t) => t.key === plan.key)?.revision === 2)
            plan.count = stopCount(plan.key);
        resetPlayback(s);
        s.routeRevision = 2;
        try {
          localStorage.setItem(key, JSON.stringify(s));
        } catch {}
      }
      return s;
    }
  } catch {}
  return structuredClone(memory);
}
export function snapshot() {
  const s = read();
  const now = Date.now();
  const age = s.anchor === null ? 0 : now - s.anchor;
  // A demonstração só avança enquanto uma página continua acompanhando o relógio.
  if (typeof window !== "undefined" && age > 15000) s.anchor = null;
  advance(s, now);
  if (typeof window !== "undefined" && age > 5000) {
    memory = structuredClone(s);
    try {
      localStorage.setItem(key, JSON.stringify(s));
    } catch {}
  }
  return s;
}
export function change(fn) {
  const s = snapshot();
  fn(s);
  memory = structuredClone(s);
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch {}
  return s;
}
export function restore() {
  return change((s) => Object.assign(s, initialState()));
}

export function setupPlaybackLifecycle() {
  const pause = () => {
    const s = snapshot();
    if (s.anchor !== null)
      change((state) => {
        state.anchor = null;
      });
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  window.addEventListener("pagehide", pause);
}
