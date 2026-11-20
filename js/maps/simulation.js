import { motion } from "./eta.js";
import { routes, plannedRoutes, defaultPlans, blankRun } from "./planning.js";
export { routes } from "./planning.js";
export const statuses = ["Em coleta", "Em deslocamento", "Pausado"];
export const types = [
  "Problema mecânico",
  "Interrupção operacional",
  "Atraso na rota",
  "Ponto não atendido",
];
export function initialState() {
  return {
    version: 3,
    regionalRoutes: true,
    routeRevision: 2,
    playbackDefaults: 2,
    plans: structuredClone(defaultPlans),
    nextRoute: routes.length + 1,
    elapsed: 0,
    anchor: null,
    speed: 1,
    vehicles: routes.map((r, i) => ({
      id: r.id,
      name: "Compactador " + r.id,
      route: r.code,
      sector: r.region,
      status: statuses[i === 4 ? 2 : i % 2],
      color: r.color,
      notes: "",
      active: true,
    })),
    runs: Object.fromEntries(
      routes.map((r) => [
        r.code,
        { seconds: 0, end: null, delay: 0, missed: [] },
      ]),
    ),
    issues: [],
    history: [],
  };
}
export function clock(seconds) {
  const total = 8 * 3600 + Math.floor(seconds);
  return [
    Math.floor(total / 3600) % 24,
    Math.floor(total / 60) % 60,
    total % 60,
  ]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}
export function log(s, message) {
  s.history.unshift({ time: s.elapsed, message });
  s.history = s.history.slice(0, 150);
}
export function condition(s, v) {
  if (!v.active) return "Desativado";
  if (!v.route) return "Sem rota";
  if (s.runs[v.route].end !== null) return "Concluído";
  if (
    s.issues.some(
      (e) => e.open && e.vehicle === v.id && types.slice(0, 2).includes(e.type),
    )
  )
    return "Pausado";
  if (v.status !== "Pausado" && s.runs[v.route].seconds > 0) {
    const r = plannedRoutes(s).find((r) => r.code === v.route);
    const moving = motion(r, s.runs[v.route].seconds);
    return moving.collecting ? "Em coleta" : "Em deslocamento";
  }
  return v.status;
}
export function advance(s, now = Date.now()) {
  if (s.anchor === null) return;
  const delta = Math.max(0, (now - s.anchor) / 1000) * s.speed;
  for (const v of s.vehicles.filter(
    (v) =>
      statuses.slice(0, 2).includes(condition(s, v)) ||
      condition(s, v) === "Pausado",
  )) {
    if (!v.route) continue;
    const run = s.runs[v.route],
      route = plannedRoutes(s).find((r) => r.code === v.route);
    if (condition(s, v) === "Pausado") {
      run.delay += delta;
      continue;
    }
    const old = run.seconds;
    const delayed = s.issues.some(
      (e) => e.open && e.vehicle === v.id && e.type === "Atraso na rota",
    );
    const rate = delayed ? 0.5 : 1;
    run.seconds = Math.min(route.duration, old + delta * rate);
    if (delayed) run.delay += run.seconds - old;
    if (run.seconds === route.duration) {
      run.end = s.elapsed + (route.duration - old) / rate;
      s.history.unshift({
        time: run.end,
        message: route.code + " concluída por " + v.id,
      });
    }
  }
  s.elapsed += delta;
  s.anchor = now;
}
export function saveVehicle(s, v, editing = false) {
  const prior = s.vehicles.find((t) => t.id === v.id);
  if (
    !/^CJ-[0-9]{2,3}$/.test(v.id) ||
    !statuses.includes(v.status) ||
    !/^#[0-9a-f]{6}$/i.test(v.color)
  )
    throw Error("Confira identificador, nome, cor e situação.");
  if (editing ? !prior : prior || s.vehicles.length >= 12)
    throw Error("Identificador ocupado ou limite de 12 veículos atingido.");
  if (
    v.route &&
    (!plannedRoutes(s).some((r) => r.active && r.code === v.route) ||
      s.vehicles.some((t) => t.id !== v.id && t.route === v.route))
  )
    throw Error("Rota ocupada. Libere a atribuição anterior primeiro.");
  if (
    prior &&
    prior.route !== v.route &&
    s.issues.some((e) => e.open && e.vehicle === v.id)
  )
    throw Error("Resolva as ocorrências antes de trocar a rota.");
  v.sector =
    plannedRoutes(s).find((r) => r.code === v.route)?.region ||
    v.sector ||
    prior?.sector ||
    "";
  v.name = v.name || v.id;
  if (prior) Object.assign(prior, v);
  else s.vehicles.push({ ...v, active: true });
  log(s, (prior ? "Alterado " : "Cadastrado ") + v.id);
}
export function removeVehicle(s, id) {
  if (s.issues.some((e) => e.open && e.vehicle === id))
    throw Error("Resolva as ocorrências antes da remoção.");
  s.vehicles = s.vehicles.filter((v) => v.id !== id);
  log(s, "Removido " + id);
}
export function recordIssue(s, id, type, description) {
  const v = s.vehicles.find((v) => v.id === id);
  if (
    !v?.active ||
    !v.route ||
    s.runs[v.route].end !== null ||
    !types.includes(type) ||
    !description.trim()
  )
    throw Error("Selecione uma operação ativa e descreva a ocorrência.");
  const run = s.runs[v.route],
    r = plannedRoutes(s).find((r) => r.code === v.route);
  if (type === types[3]) {
    const point = Math.floor((run.seconds / r.duration) * r.count) + 1;
    if (run.missed.includes(point))
      throw Error("Este ponto já foi registrado.");
    run.missed.push(point);
  }
  s.issues.unshift({
    id:
      globalThis.crypto?.randomUUID?.() ||
      String(Date.now()) + "-" + s.issues.length,
    vehicle: id,
    route: v.route,
    type,
    description,
    time: s.elapsed,
    open: true,
  });
  log(s, type + " · " + id);
}
export function resolveIssue(s, id) {
  const e = s.issues.find((e) => e.id === id);
  if (e?.open) {
    e.open = false;
    log(s, "Resolvida · " + e.type + " · " + e.vehicle);
  }
}
export function rows(s) {
  return s.vehicles
    .filter((v) => v.active && v.route)
    .map((v) => {
      const r = plannedRoutes(s).find((r) => r.code === v.route),
        run = s.runs[r.code],
        fraction = motion(r, run.seconds).fraction;
      return {
        vehicle: v.id,
        route: r.code,
        truck: { ...r, id: v.id, color: v.color, status: condition(s, v) },
        fraction,
        progress: Math.floor(fraction * 100),
        completed: motion(r, run.seconds).completed,
        stops: Array.from({ length: r.count }, (_, i) => "Ponto " + (i + 1)),
      };
    });
}
export function totals(s) {
  let planned = 0,
    traveled = 0,
    served = 0,
    pending = 0,
    done = 0,
    ongoing = 0,
    late = 0;
  for (const r of plannedRoutes(s)) {
    const run = s.runs[r.code],
      f = motion(r, run.seconds).fraction,
      passed = motion(r, run.seconds).completed;
    planned += r.meters;
    traveled += f * r.meters;
    served += passed - run.missed.filter((n) => n <= passed).length;
    pending += r.count - passed;
    done += Number(run.end !== null);
    ongoing += Number(f > 0 && run.end === null);
    late += Number(run.delay >= 1);
  }
  return {
    planned,
    traveled,
    served,
    pending,
    done,
    ongoing,
    late,
    open: s.issues.filter((e) => e.open).length,
  };
}

export function resetPlayback(s) {
  s.anchor = null;
  s.elapsed = 0;
  s.speed = 1;
  s.runs = Object.fromEntries(s.plans.map((p) => [p.code, blankRun()]));
  s.issues = [];
  s.history = [];
  log(s, "Demonstração reiniciada; escolha um endereço antes de iniciar.");
}
