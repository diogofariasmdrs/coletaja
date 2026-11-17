import test from "node:test";
import assert from "node:assert/strict";
import districts from "../js/maps/districts.json" with { type: "json" };
import bounds from "../js/maps/districtBounds.json" with { type: "json" };
import streets from "../js/maps/fortaleza-streets.json" with { type: "json" };
import places from "../js/maps/places.json" with { type: "json" };
import {
  areaContains,
  pathInDistrict,
  parseLocation,
  matchingPlaces,
} from "../js/maps/localSearch.js";
import { coverage, templates } from "../js/maps/planning.js";
import { addRegionalRoutes } from "../js/maps/store.js";
import { initialState, rows, routes } from "../js/maps/simulation.js";
import { searchStreets } from "../js/maps/streetSearch.js";
import { buildNameIndex, suggest } from "../js/maps/suggestions.js";

test("cada bairro oficial tem referência interna, sugestão e circuitos planejáveis", () => {
  assert.equal(districts.length, 121);
  const index = buildNameIndex([]);
  for (const d of districts) {
    const { district } = parseLocation(d.name);
    assert.equal(district.name, d.name);
    assert.ok(areaContains(bounds[district.index], d.center));
    assert.equal(suggest(index, d.name)[0].label, d.name);
    assert.ok(
      templates.some(
        (t) =>
          t.region === d.name && pathInDistrict(t.path, bounds[district.index]),
      ),
    );
  }
});

test("as três ligações atravessam os bairros de origem e de destino", () => {
  for (const [code, names] of [
    ["RT-07", ["Barra do Ceará", "Vila Velha"]],
    ["RT-08", ["Jacareganga", "Presidente Kennedy"]],
    ["RT-09", ["Messejana", "Cambeba"]],
  ]) {
    for (const name of names)
      assert.ok(
        pathInDistrict(
          routes.find((r) => r.code === code).path,
          bounds[parseLocation(name).district.index],
        ),
      );
  }
});

test("endereço com número, bairro, cidade e CEP restringe a busca ao bairro", () => {
  const { street, district } = parseLocation(
    "Av. Filomeno Gomes, 293 - Jacarecanga, Fortaleza - CE, 60000-000",
  );
  const contains = (p) => areaContains(bounds[district.index], p);
  const found = searchStreets(street, streets, contains);
  assert.ok(
    found.choices.length && found.choices.every((c) => contains(c.point)),
  );
  const other = bounds[parseLocation("Messejana").district.index];
  assert.equal(
    searchStreets(street, streets, (p) => areaContains(other, p)).choices
      .length,
    0,
  );
});

test("shoppings distintos e erros de grafia funcionam sem API externa", () => {
  for (const query of [
    "RioMar Kennedy",
    "rio mar keneddy",
    "Shopping Rio Mar Kenedy",
  ]) {
    const [hit] = matchingPlaces(places, query);
    assert.equal(hit.place.label, "RioMar Kennedy");
    assert.equal(hit.rank, 0);
  }
  assert.equal(
    matchingPlaces(places, "RioMar").filter((h) => h.rank === 1).length,
    2,
  );
  assert.equal(matchingPlaces(places, "Via Sul Shopping")[0].rank, 0);
  const state = initialState(),
    point = places.find((p) => p.label === "RioMar Kennedy").point;
  assert.equal(coverage(point, state, rows(state)).match.row.route, "RT-08");
  state.plans = state.plans.filter((p) => p.code !== "RT-08");
  const result = coverage(point, state, []);
  assert.ok(!result.match && result.nearestRoute.meters > 180);
  assert.match(result.text, /Trajeto mais próximo/);
});

test("atualização da frota preserva cadastros antigos com códigos ocupados", () => {
  const state = initialState();
  state.plans = state.plans.slice(0, 6);
  state.vehicles = state.vehicles.slice(0, 6);
  state.runs = Object.fromEntries(Object.entries(state.runs).slice(0, 6));
  state.vehicles.push({
    ...state.vehicles[0],
    id: "CJ-07",
    route: "",
    notes: "cadastro anterior",
  });
  state.nextRoute = 7;
  delete state.regionalRoutes;
  addRegionalRoutes(state);
  addRegionalRoutes(state);
  assert.equal(state.plans.length, 9);
  assert.equal(new Set(state.vehicles.map((v) => v.id)).size, 10);
  assert.equal(
    state.vehicles.find((v) => v.id === "CJ-07").notes,
    "cadastro anterior",
  );
});
