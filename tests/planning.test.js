import test from "node:test";
import assert from "node:assert/strict";
import {
  templates,
  coverage,
  savePlan,
  deletePlan,
} from "../js/maps/planning.js";
import {
  initialState,
  rows,
  clock,
  saveVehicle,
  advance,
} from "../js/maps/simulation.js";
import { buildNameIndex, suggest } from "../js/maps/suggestions.js";
import { splitRoute } from "../js/maps/geometry.js";
test("Percursos dos 121 bairros mantêm limites e identificadores de trechos", () => {
  for (const t of templates) {
    assert.equal(t.ends.length, t.sourceIds.length);
    assert.equal(t.ends.at(-1), t.path.length - 1);
    assert.ok(t.ends.every((i, j) => i > (t.ends[j - 1] ?? 0)));
    assert.ok(t.streets.length >= 6 && t.meters > 3000);
  }
});
test("planejamento, reserva, troca, conflitos e remoção", () => {
  const s = initialState(),
    t = templates[1],
    p = {
      name: "Circuito escolar",
      key: t.key,
      count: 12,
      code: "RT-10",
      active: true,
    };
  savePlan(s, p);
  assert.throws(() => savePlan(s, { ...p, code: "RT-09" }));
  saveVehicle(s, {
    id: "CJ-10",
    route: "RT-10",
    sector: t.region,
    color: "#235634",
    notes: "",
    status: "Em coleta",
  });
  assert.equal(rows(s).at(-1).truck.key, t.key);
  assert.throws(() => deletePlan(s, p.code));
  s.anchor = 5000;
  advance(s, 10000);
  assert.throws(() => savePlan(s, { ...p, count: 20 }));
  saveVehicle(s, { ...s.vehicles.at(-1), route: "" }, true);
  savePlan(s, { ...p, active: false });
  assert.throws(() =>
    saveVehicle(s, { ...s.vehicles.at(-1), route: p.code }, true),
  );
  deletePlan(s, p.code);
  assert.ok(!s.runs[p.code]);
});
test("horário de 24h e progresso em trechos de comprimentos diferentes", () => {
  assert.equal(clock(16 * 3600), "00:00:00");
  assert.equal(clock(48 * 3600 + 1), "08:00:01");
  const row = {
    fraction: 0.5,
    truck: {
      path: [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 0.001 },
        { lat: 0, lng: 0.01 },
      ],
    },
  };
  assert.ok(Math.abs(splitRoute(row).position.lng - 0.005) < 1e-9);
});
test("consulta distingue ponto, rota sem caminhão, setor e exterior", () => {
  const s = initialState(),
    t = templates[0],
    point = t.path.at(-1);
  assert.match(coverage(point, s, rows(s)).text, /ponto demonstrativo/i);
  s.vehicles[0].route = "";
  assert.ok(coverage(point, s, rows(s)).match);
  const empty = { ...s, plans: [] };
  assert.match(
    coverage(t.center, empty, []).text,
    /Não há rotas demonstrativas ativas/,
  );
  assert.match(
    coverage({ lat: -4, lng: -39 }, s, []).text,
    /fora da faixa demonstrativa/,
  );
});
test("autocomplete parcial, acentos, bairros e deduplicação", () => {
  const index = buildNameIndex([
    "RUA PUEBLA",
    "RUA PUEBLA",
    "RUA POTIRA",
    "RUA AZEVEDO BOLÃO",
  ]);
  for (const q of ["pueb", "POTIR", "bolao", "Meire"])
    assert.equal(suggest(index, q).length, 1);
  assert.ok(suggest(index, "mont").some((i) => i.label === "Montese"));
  assert.equal(suggest(index, "xyzz").length, 0);
});
