import { plannedRoutes } from "./planning.js";
import { pathMeasure, coverageMeters } from "./geometry.js";

// Mantém a duração existente: 75% de cada etapa em movimento, 25% parado.
export function motion(route, seconds) {
  const cycle = route.duration / route.count;
  const stage = Math.min(route.count, Math.max(0, seconds / cycle));
  const completed = Math.floor(stage);
  const phase = stage - completed;
  return {
    fraction: Math.min(
      1,
      (completed + Math.min(1, phase / 0.75)) / route.count,
    ),
    completed,
    collecting: completed < route.count && phase >= 0.75,
    next: Math.min(route.count, completed + 1),
  };
}

export function arrivalSeconds(route, fraction) {
  const stage = Math.max(0, Math.min(1, fraction)) * route.count;
  const before = Math.max(0, Math.ceil(stage - 1e-9) - 1);
  return ((before + (stage - before) * 0.75) * route.duration) / route.count;
}

function projections(point, route) {
  const { lengths, meters } = pathMeasure(route.path);
  const scale = 111195,
    cosine = Math.cos((point.lat * Math.PI) / 180);
  let along = 0;
  return lengths.map((length, i) => {
    const a = route.path[i],
      b = route.path[i + 1];
    const x = (b.lng - a.lng) * scale * cosine,
      y = (b.lat - a.lat) * scale;
    const px = (point.lng - a.lng) * scale * cosine,
      py = (point.lat - a.lat) * scale;
    const t =
      x * x + y * y
        ? Math.max(0, Math.min(1, (px * x + py * y) / (x * x + y * y)))
        : 0;
    const result = {
      distance: Math.hypot(px - t * x, py - t * y),
      fraction: (along + t * length) / meters,
    };
    along += length;
    return result;
  });
}

const messages = {
  insufficient: "Informe um endereço com número ou escolha um ponto no mapa.",
  outside: "Endereço fora da cobertura demonstrativa.",
  unassigned: "Não há caminhão atribuído.",
  complete: "Rota concluída.",
  passed: "Caminhão já passou pelo endereço.",
  waiting: "Aguardando início do percurso.",
  paused: "Caminhão parado ou operação pausada.",
};
export function estimate(s, { point, routeCode, stop, reliable = true } = {}) {
  const state = (status, extra = {}) => ({
    status,
    text: messages[status],
    ...extra,
  });
  const routes = plannedRoutes(s).filter((r) => r.active);
  let route = routes.find((r) => r.code === routeCode),
    targets;
  if (!routeCode) {
    if (
      !reliable ||
      !Number.isFinite(point?.lat) ||
      !Number.isFinite(point?.lng)
    )
      return state("insufficient");
    const nearby = routes.map((r) => ({
      route: r,
      targets: projections(point, r),
    }));
    nearby.forEach(
      (r) => (r.distance = Math.min(...r.targets.map((p) => p.distance))),
    );
    nearby.sort((a, b) => a.distance - b.distance);
    if (!nearby.length || nearby[0].distance > coverageMeters)
      return state("outside");
    route = nearby[0].route;
    // Só agrupa projeções quase coincidentes; evita escolher outra rua paralela adiante.
    targets = nearby[0].targets.filter(
      (p) => p.distance <= Math.min(coverageMeters, nearby[0].distance + 2),
    );
  }
  if (!route) return state("unassigned");
  const vehicle = s.vehicles.find((v) => v.active && v.route === route.code),
    run = s.runs[route.code];
  const info = { route: route.code, vehicle: vehicle?.id, delay: run.delay };
  if (!vehicle) return state("unassigned", info);
  if (run.end !== null || run.seconds >= route.duration)
    return state("complete", info);
  const current = motion(route, run.seconds);
  const next = stop ?? current.next;
  if (routeCode) {
    if (!Number.isInteger(next) || next < 1 || next > route.count)
      return state("insufficient", info);
    targets = [{ fraction: next / route.count, distance: 0 }];
    info.stop = next;
  }
  const passing = targets
    .filter((p) => {
      const traveled = (current.fraction - p.fraction) * route.meters;
      return traveled >= -0.1 && traveled <= 60 && run.seconds > 0;
    })
    .sort(
      (a, b) =>
        Math.abs(a.fraction - current.fraction) -
        Math.abs(b.fraction - current.fraction),
    )[0];
  const future = targets
    .filter((p) => p.fraction >= current.fraction - 1e-7)
    .sort((a, b) => a.fraction - b.fraction);
  if (!future.length && !passing) return state("passed", info);
  const target = passing || future[0];
  info.targetFraction = target.fraction;
  info.meters = Math.max(
    0,
    (target.fraction - current.fraction) * route.meters,
  );
  const interrupted = s.issues.some(
    (e) =>
      e.open &&
      e.vehicle === vehicle.id &&
      ["Problema mecânico", "Interrupção operacional"].includes(e.type),
  );
  if (interrupted || vehicle.status === "Pausado") return state("paused", info);
  if (s.anchor === null)
    return state(
      s.elapsed === 0 && run.seconds === 0 ? "waiting" : "paused",
      info,
    );
  if (passing)
    return {
      ...info,
      status: "passing",
      text: "O caminhão está passando por aqui.",
    };
  const rate = s.issues.some(
    (e) => e.open && e.vehicle === vehicle.id && e.type === "Atraso na rota",
  )
    ? 0.5
    : 1;
  const seconds =
    Math.max(0, arrivalSeconds(route, target.fraction) - run.seconds) / rate;
  const wallSeconds = seconds / s.speed;
  return {
    ...info,
    status: "arriving",
    seconds,
    wallSeconds,
    at: s.elapsed + seconds,
    text:
      seconds < 1
        ? "Caminhão no trecho consultado"
        : "Chega em " + Math.ceil(seconds / 60) + " min simulados",
  };
}
export function etaText(result, speed = 1) {
  if (result.status !== "arriving") return result.text;
  const time = new Date((8 * 3600 + result.at) * 1000)
    .toISOString()
    .slice(11, 19);
  return (
    result.text +
    " · relógio " +
    time +
    (speed > 1
      ? " · " +
        Math.ceil(result.wallSeconds) +
        " s nesta reprodução a " +
        speed +
        "×"
      : "")
  );
}

export function residentArrival(result) {
  const labels = {
    passing: [
      "Passando por aqui",
      "O caminhão está no trecho próximo ao ponto escolhido.",
    ],
    waiting: [
      "Percurso ainda não iniciado",
      "A previsão aparece quando o veículo começa o percurso.",
    ],
    paused: [
      "Percurso pausado",
      "A previsão será atualizada quando o caminhão retomar o trajeto.",
    ],
    passed: [
      "O caminhão já passou",
      "Este trecho já foi percorrido nesta viagem.",
    ],
    complete: ["Percurso encerrado", "Aguarde o início de uma nova viagem."],
    unassigned: [
      "Aguardando um veículo",
      "Esta rota ainda não tem um caminhão em operação.",
    ],
    outside: [
      "Fora do percurso",
      "Confira abaixo a rota mais próxima do endereço.",
    ],
    insufficient: [
      "Escolha um endereço",
      "Informe a rua e o número ou marque o ponto no mapa.",
    ],
  };
  if (result.status !== "arriving") {
    const [value, detail] = labels[result.status] || labels.insufficient;
    return { label: "Situação do percurso", value, unit: "", detail };
  }
  if (result.wallSeconds < 1)
    return {
      label: "Chegada estimada",
      value: "No trecho",
      unit: "",
      detail: "O veículo está passando pelo ponto consultado.",
    };
  return {
    label: "Chegada estimada",
    value: String(Math.ceil(result.wallSeconds / 60)),
    unit: "min",
    detail: "Tempo restante até o ponto, no ritmo atual da demonstração.",
  };
}

export function prepareArrival(s, point) {
  const ready = {
    ...s,
    runs: Object.fromEntries(
      Object.entries(s.runs).map(([key, run]) => [
        key,
        { ...run, seconds: 0, end: null },
      ]),
    ),
  };
  const result = estimate(ready, { point });
  if (!result.vehicle || result.targetFraction === undefined)
    throw Error("Escolha um ponto próximo de uma rota com caminhão.");
  if (s.issues.some((e) => e.open && e.vehicle === result.vehicle))
    throw Error(
      "Resolva as ocorrências deste caminhão no painel antes de preparar a passagem.",
    );
  const route = plannedRoutes(s).find((r) => r.code === result.route);
  s.anchor = null;
  s.speed = 0.5;
  const run = s.runs[result.route];
  run.seconds = Math.max(0, arrivalSeconds(route, result.targetFraction) - 30);
  run.end = null;
  run.delay = 0;
  run.missed = [];
  s.vehicles.find((v) => v.id === result.vehicle).status = "Em deslocamento";
  s.history.unshift({
    time: s.elapsed,
    message: "Passagem preparada em " + result.route + " para apresentação.",
  });
  return result;
}
