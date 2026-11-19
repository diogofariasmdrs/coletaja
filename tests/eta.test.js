import test from "node:test";
import assert from "node:assert/strict";
import { estimate, motion, arrivalSeconds } from "../js/maps/eta.js";
import {
  initialState,
  rows,
  advance,
  recordIssue,
} from "../js/maps/simulation.js";
import { plannedRoutes } from "../js/maps/planning.js";
import { splitRoute, pathMeasure } from "../js/maps/geometry.js";
const fixture = () => {
  const state = initialState();
  state.anchor = 1000;
  state.speed = 1;
  return { state, route: plannedRoutes(state)[0] };
};
test("ETA diminui pelo tempo percorrido e aceleração altera a espera real", () => {
  const { state, route } = fixture();
  const a = estimate(state, { routeCode: route.code, stop: 5 });
  advance(state, 11000);
  const b = estimate(state, { routeCode: route.code, stop: 5 });
  assert.ok(Math.abs(a.seconds - b.seconds - 10) < 0.001);
  state.speed = 4;
  const c = estimate(state, { routeCode: route.code, stop: 5 });
  assert.equal(b.seconds, c.seconds);
  assert.equal(c.wallSeconds, b.seconds / 4);
});
test("paradas mantêm o marcador imóvel e entram no ETA", () => {
  const { state, route } = fixture(),
    cycle = route.duration / route.count;
  assert.equal(
    motion(route, cycle * 0.8).fraction,
    motion(route, cycle * 0.9).fraction,
  );
  assert.ok(motion(route, cycle * 0.8).collecting);
  state.runs[route.code].seconds = cycle * 0.8;
  const e = estimate(state, { routeCode: route.code, stop: 2 });
  assert.ok(Math.abs(e.seconds - cycle * 0.95) < 1e-6);
  assert.ok(
    Math.abs(arrivalSeconds(route, 2 / route.count) - cycle * 1.75) < 1e-6,
  );
});
test("estados início, pausa, interrupção, passagem, conclusão e sem caminhão", () => {
  const { state, route } = fixture(),
    query = { routeCode: route.code, stop: 1 };
  state.anchor = null;
  assert.equal(estimate(state, query).status, "waiting");
  state.elapsed = 10;
  assert.equal(estimate(state, query).status, "paused");
  state.anchor = 1000;
  recordIssue(state, state.vehicles[0].id, "Problema mecânico", "Teste");
  assert.equal(estimate(state, query).status, "paused");
  state.issues = [];
  state.runs[route.code].seconds = route.duration * 0.5;
  assert.equal(estimate(state, query).status, "passed");
  state.runs[route.code].end = route.duration;
  assert.equal(estimate(state, query).status, "complete");
  state.vehicles[0].route = "";
  assert.equal(estimate(state, query).status, "unassigned");
  assert.equal(estimate(state, { routeCode: "RT-999" }).status, "unassigned");
});
test("atraso reduz velocidade e amplia ETA", () => {
  const { state, route } = fixture(),
    query = { routeCode: route.code, stop: 5 };
  const a = estimate(state, query);
  recordIssue(state, state.vehicles[0].id, "Atraso na rota", "Teste");
  assert.equal(estimate(state, query).seconds, a.seconds * 2);
});
test("endereço fora da cobertura e posição insuficiente", () => {
  const { state } = fixture();
  assert.equal(
    estimate(state, { point: { lat: 0, lng: 0 } }).status,
    "outside",
  );
  assert.equal(estimate(state, {}).status, "insufficient");
  assert.equal(
    estimate(state, { point: { lat: -3.74, lng: -38.56 }, reliable: false })
      .status,
    "insufficient",
  );
});
test("rua repetida escolhe próxima passagem na direção do percurso", () => {
  const { state, route } = fixture();
  state.plans = state.plans.slice(0, 1);
  const duplicates = new Map();
  let pair;
  route.path.forEach((p, i) => {
    const key = p.lat + "/" + p.lng;
    if (duplicates.has(key) && i - duplicates.get(key) > 8)
      pair = [duplicates.get(key), i];
    duplicates.set(key, i);
  });
  assert.ok(pair);
  const point = route.path[pair[0]];
  const before = estimate(state, { point });
  assert.equal(before.status, "arriving");
  const { lengths, meters } = pathMeasure(route.path);
  const first = lengths.slice(0, pair[0]).reduce((a, b) => a + b, 0) / meters;
  const second = lengths.slice(0, pair[1]).reduce((a, b) => a + b, 0) / meters;
  state.runs[route.code].seconds = arrivalSeconds(route, (first + second) / 2);
  const result = estimate(state, { point });
  assert.equal(result.status, "arriving");
  assert.ok(result.seconds > 0 && result.meters > 0);
  state.runs[route.code].seconds = route.duration;
  assert.equal(estimate(state, { point }).status, "complete");
});
test("posição e distância permanecem consistentes com o trajeto", () => {
  const { state, route } = fixture();
  state.runs[route.code].seconds = route.duration * 0.4;
  const row = rows(state)[0],
    point = splitRoute(row).position;
  const result = estimate(state, { point });
  assert.equal(result.status, "passing");
  assert.ok(result.meters < 3);
});

test("previsão do morador usa tempo de espera da reprodução e omite relógio interno", async () => {
  const { residentArrival } = await import("../js/maps/eta.js");
  const { state, route } = fixture();
  const normal = estimate(state, { routeCode: route.code, stop: 5 });
  assert.equal(
    residentArrival(normal).value,
    String(Math.ceil(normal.wallSeconds / 60)),
  );
  state.speed = 4;
  const accelerated = estimate(state, { routeCode: route.code, stop: 5 });
  assert.equal(
    residentArrival(accelerated).value,
    String(Math.ceil(normal.wallSeconds / 240)),
  );
  assert.equal(
    residentArrival({ status: "waiting" }).value,
    "Percurso ainda não iniciado",
  );
});
