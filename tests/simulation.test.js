import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  advance,
  saveVehicle,
  removeVehicle,
  rows,
  routes,
  recordIssue,
  resolveIssue,
  totals,
} from "../js/maps/simulation.js";
import { splitRoute, findCoverage } from "../js/maps/geometry.js";
import { snapshot, change, restore } from "../js/maps/store.js";
test("simulação avança pela via, pausa, retoma, acelera e conclui", () => {
  const s = initialState();
  s.anchor = 1000;
  s.speed=1;
  advance(s, 11000);
  assert.equal(s.elapsed, 10);
  const row = rows(s)[0];
  assert.ok(row.fraction > 0);
  assert.ok(findCoverage(splitRoute(row).position, [row]).meters < 0.01);
  s.anchor = null;
  advance(s, 21000);
  assert.equal(s.elapsed, 10);
  s.anchor = 21000;
  s.speed = 4;
  advance(s, 22000);
  assert.equal(s.elapsed, 14);
  advance(s, 1000000000);
  assert.equal(totals(s).done, 8);
  assert.ok(s.runs["RT-01"].end > 0);
  assert.ok(totals(s).traveled <= totals(s).planned);
});
test("cadastro, atribuição, conflito, desativação e remoção", () => {
  const s = initialState(),
    other = { ...s.vehicles[0], id: "CJ-10", route: "" };
  saveVehicle(s, other);
  assert.equal(rows(s).length, 9);
  assert.throws(() => saveVehicle(s, other));
  assert.throws(() => saveVehicle(s, { ...other, route: "RT-01" }, true));
  saveVehicle(s, { ...s.vehicles[0], route: "" }, true);
  saveVehicle(s, { ...other, route: "RT-01" }, true);
  assert.ok(rows(s).some((r) => r.vehicle === "CJ-10" && r.route === "RT-01"));
  saveVehicle(s, { ...other, route: "RT-01", active: false }, true);
  assert.equal(rows(s).length, 8);
  removeVehicle(s, "CJ-10");
  assert.equal(s.vehicles.length, 9);
});
test("ocorrências afetam deslocamento, atendimento e indicadores", () => {
  const s = initialState();
  s.anchor = 1000;
  s.speed=1;
  recordIssue(s, "CJ-01", "Problema mecânico", "Motor");
  advance(s, 11000);
  assert.equal(s.runs["RT-01"].seconds, 0);
  assert.equal(totals(s).open, 1);
  resolveIssue(s, s.issues[0].id);
  recordIssue(s, "CJ-01", "Atraso na rota", "Desvio");
  advance(s, 21000);
  assert.equal(s.runs["RT-01"].seconds, 5);
  assert.ok(totals(s).late > 0);
  recordIssue(s, "CJ-01", "Ponto não atendido", "Acesso fechado");
  assert.throws(() =>
    recordIssue(s, "CJ-01", "Ponto não atendido", "Repetido"),
  );
  advance(s, 1000000000);
  assert.equal(
    totals(s).served,
    routes.filter((_, i) => i !== 4).reduce((n, r) => n + r.count, 0) - 1,
  );
});
test("persistência local, dados inválidos e restauração", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k),
    setItem: (k, v) => store.set(k, v),
  };
  change((s) => {
    s.speed = 4;
  });
  assert.equal(snapshot().speed, 4);
  store.set("coletaja.operations.v3", "{}");
  assert.equal(snapshot().speed, 1);
  restore();
  assert.equal(snapshot().vehicles.length, 9);
  delete globalThis.localStorage;
});
