import paths from "./sectorPaths.json" with { type: "json" };
import {
  segmentDistance,
  splitRoute,
  findCoverage,
  coverageMeters,
  pathMeasure,
} from "./geometry.js";
export const school = { lat: -3.739368338, lng: -38.56655153 };
export const templates = paths.map((p) => {
  const { meters } = pathMeasure(p.path);
  return { ...p, meters, duration: Math.round(meters / 4) };
});
const byKey = new Map(templates.map((t) => [t.key, t]));
export const sectors = templates
  .filter((t) => t.key === t.region + "-0")
  .map((t) => ({ name: t.region, center: t.center }))
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
export const blankRun = () => ({ seconds: 0, end: null, delay: 0, missed: [] });
const colors = [
  "#267047",
  "#926635",
  "#486e86",
  "#266c79",
  "#976020",
  "#625784",
];
export const stopCount = (key) =>
  Math.min(60, Math.max(2, Math.round(byKey.get(key).meters / 180)));
const initialKeys = [
  "Parquelândia-0",
  "Aldeota-0",
  "Meireles-0",
  "Benfica-0",
  "Montese-0",
  "Centro-0",
  "Vila Velha-2",
  "Jacarecanga-2",
  "Messejana-2",
];
export const defaultPlans = initialKeys.map((key, i) => ({
  code: "RT-" + String(i + 1).padStart(2, "0"),
  key,
  name: i < 6 ? byKey.get(key).region + " · Principal" : byKey.get(key).name,
  count: stopCount(key),
  active: true,
}));
function materialize(p, i) {
  return {
    ...byKey.get(p.key),
    ...p,
    id: "CJ-" + String(i + 1).padStart(2, "0"),
    color: colors[i % 6],
  };
}
export const routes = defaultPlans.map(materialize);
export const plannedRoutes = (s) => s.plans.map(materialize);
export function validatePlans(plans) {
  return (
    Array.isArray(plans) &&
    plans.length <= templates.length &&
    new Set(plans.map((p) => p.code)).size === plans.length &&
    new Set(plans.map((p) => p.key)).size === plans.length &&
    plans.every(
      (p) =>
        /^RT-\d{2,}$/.test(p.code) &&
        byKey.has(p.key) &&
        typeof p.active === "boolean" &&
        typeof p.name === "string" &&
        p.name.trim() &&
        Number.isInteger(p.count) &&
        p.count >= 2 &&
        p.count <= 60,
    )
  );
}
export function savePlan(s, p) {
  const old = s.plans.find((r) => r.code === p.code);
  const list = old ? s.plans.map((r) => (r === old ? p : r)) : [...s.plans, p];
  if (!validatePlans(list))
    throw Error("Informe o nome da rota e escolha um percurso disponível.");
  if (
    old &&
    (old.key !== p.key || old.count !== p.count) &&
    (s.runs[p.code].seconds > 0 || s.vehicles.some((v) => v.route === p.code))
  )
    throw Error(
      "Libere o veículo e reinicie os percursos antes de mudar a geometria ou os pontos.",
    );
  if (!p.active && s.vehicles.some((v) => v.route === p.code))
    throw Error("Libere o veículo antes de desativar a rota.");
  s.plans = list;
  if (!old) s.runs[p.code] = blankRun();
}
export function deletePlan(s, code) {
  if (
    s.vehicles.some((v) => v.route === code) ||
    s.issues.some((e) => e.open && e.route === code)
  )
    throw Error("Libere o veículo e resolva as ocorrências antes de remover.");
  s.plans = s.plans.filter((p) => p.code !== code);
  delete s.runs[code];
}
export function coverage(point, s, vehicles) {
  const active = plannedRoutes(s).filter((r) => r.active);
  const nearestRoute = findCoverage(
    point,
    active.map(
      (r) =>
        vehicles.find((v) => v.route === r.code) || { route: r.code, truck: r },
    ),
    Infinity,
  );
  const match = nearestRoute?.meters <= coverageMeters ? nearestRoute : null;
  if (match) {
    const { row } = match;
    const count = row.truck.count;
    let nearest = null;
    for (let i = 1; i <= count; i++) {
      const p = splitRoute({ ...row, fraction: i / count }).position;
      const m = segmentDistance(point, p, p);
      if (m <= 25 && (!nearest || m < nearest.m)) nearest = { i, m };
    }
    return {
      match,
      text:
        (nearest
          ? "Próximo ao ponto demonstrativo " +
            nearest.i +
            " da " +
            row.route +
            "."
          : "Endereço próximo da " +
            row.route +
            ", a " +
            Math.round(match.meters) +
            " m do trajeto.") +
        (row.vehicle ? "" : " Rota planejada, sem caminhão atribuído."),
    };
  }
  return {
    nearestRoute,
    text: nearestRoute
      ? "Este ponto está fora da faixa demonstrativa de 180 m. Trajeto mais próximo: " +
        nearestRoute.row.route +
        " · " +
        nearestRoute.row.truck.name +
        ", a " +
        (nearestRoute.meters < 1000
          ? Math.round(nearestRoute.meters) + " m"
          : (nearestRoute.meters / 1000).toLocaleString("pt-BR", {
              maximumFractionDigits: 1,
            }) + " km") +
        " em linha reta" +
        (nearestRoute.row.vehicle
          ? " (" + nearestRoute.row.vehicle + ")."
          : " (sem caminhão atribuído).")
      : "Não há rotas demonstrativas ativas neste momento.",
  };
}
