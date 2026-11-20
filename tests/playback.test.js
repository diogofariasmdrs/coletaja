import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  advance,
  resetPlayback,
  recordIssue,
} from "../js/maps/simulation.js";
import { estimate, arrivalSeconds } from "../js/maps/eta.js";
import { school, plannedRoutes } from "../js/maps/planning.js";
import { splitRoute } from "../js/maps/geometry.js";
import { snapshot } from "../js/maps/store.js";

test("recomeçar preserva frota e rotas, limpa a viagem e não inicia automaticamente", () => {
  const s = initialState(),
    plans = structuredClone(s.plans),
    vehicles = structuredClone(s.vehicles);
  s.anchor = 1000;
  advance(s, 51000);
  resetPlayback(s);
  assert.equal(s.anchor, null);
  assert.equal(s.elapsed, 0);
  assert.equal(s.speed, 1);
  assert.deepEqual(s.plans, plans);
  assert.deepEqual(s.vehicles, vehicles);
  assert.ok(
    Object.values(s.runs).every((r) => r.seconds === 0 && r.end === null),
  );
});
test("conclusão permanece concluída sem reinício automático", () => {
  const s = initialState();
  s.anchor = 1000;
  s.vehicles.forEach((v) => {
    v.status = "Em deslocamento";
  });
  advance(s, 1e10);
  const runs = structuredClone(s.runs);
  advance(s, 2e10);
  assert.deepEqual(s.runs, runs);
});

test("rotas ampliadas incluem ruas internas e registram as lacunas da base", () => {
  const routes = plannedRoutes(initialState());
  for (const route of routes) {
    assert.equal(route.revision, 2);
    assert.ok(route.coverage.covered / route.coverage.available > 0.85);
    assert.equal(
      route.coverage.covered + route.coverage.unconnected.length,
      route.coverage.available,
    );
    assert.equal(route.sourceIds.length, route.ends.length);
    assert.equal(route.ends.at(-1), route.path.length - 1);
  }
  const schoolRoute = routes[0];
  assert.equal(schoolRoute.coverage.covered, 328);
  for (const street of [
    "RUA AZEVEDO BOLAO",
    "RUA MOREIRA DE SOUSA",
    "RUA URUOCA",
  ]) {
    const normalized = schoolRoute.streets.map((s) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    );
    assert.ok(normalized.includes(street), street);
  }
});

test("retorno após tempo sem acompanhamento mantém a simulação pausada", () => {
  const s = initialState();
  s.anchor = Date.now() - 60000;
  let stored = JSON.stringify(s);
  globalThis.window = {};
  globalThis.localStorage = {
    getItem: () => stored,
    setItem: (_, v) => {
      stored = v;
    },
  };
  try {
    const result = snapshot();
    assert.equal(result.anchor, null);
    assert.equal(result.elapsed, 0);
    assert.equal(JSON.parse(stored).anchor, null);
  } finally {
    delete globalThis.localStorage;
    delete globalThis.window;
  }
});
test("janela de passagem também funciona depois da projeção do endereço", () => {
  const s = initialState();
  s.anchor = 1000;
  const route = plannedRoutes(s)[0],
    point = splitRoute({ truck: route, fraction: 0.12 }).position;
  s.plans = s.plans.slice(0, 1);
  s.runs[route.code].seconds = arrivalSeconds(route, 0.12 + 20 / route.meters);
  assert.equal(estimate(s, { point }).status, "passing");
});
test("migração reinicia trajetos modificados preservando cadastros do navegador", () => {
  const s = initialState();
  delete s.routeRevision;
  s.anchor = 1000;
  s.elapsed = 200;
  s.vehicles[0].notes = "Preservar";
  const saved = new Map([["coletaja.operations.v3", JSON.stringify(s)]]);
  globalThis.localStorage = {
    getItem: (k) => saved.get(k),
    setItem: (k, v) => saved.set(k, v),
  };
  try {
    const result = snapshot();
    assert.equal(result.routeRevision, 2);
    assert.equal(result.anchor, null);
    assert.equal(result.vehicles[0].notes, "Preservar");
    assert.equal(result.elapsed, 0);
  } finally {
    delete globalThis.localStorage;
  }
});
