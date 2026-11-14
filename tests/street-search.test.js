import test from "node:test";
import assert from "node:assert/strict";
import streets from "../js/maps/fortaleza-streets.json" with { type: "json" };
import { searchStreets } from "../js/maps/streetSearch.js";
import { findCoverage } from "../js/maps/geometry.js";
import { operations } from "../js/maps/operations.js";

test("busca por trecho, abreviação, nomes incompletos e ausência no cadastro", () => {
  const local = searchStreets("R. Moreira de Sousa, 327, Fortaleza", streets);
  assert.ok(local.choices.length);
  assert.ok(local.choices.some((c) => findCoverage(c.point, operations)));
  const coast = searchStreets("Av. Beira Mar", streets);
  assert.equal(coast.choices.length, 1);
  assert.equal(findCoverage(coast.choices[0].point, operations), null);
  assert.ok(
    searchStreets("azevedo bol", streets).suggestions.includes(
      "RUA AZEVEDO BOLÃO",
    ),
  );
  assert.equal(
    searchStreets("Rua Inexistente XYZ", streets).suggestions.length,
    0,
  );
  assert.equal(
    searchStreets("Rua Moreira de Sousa, 999999", streets).choices.length,
    0,
  );
});

test("cada caminhão percorre várias vias conectadas por mais de 1,5 km", () => {
  for (const row of operations) {
    assert.ok(row.truck.osmWays.length >= 3);
    const path = row.truck.path;
    const distances = path
      .slice(1)
      .map(
        (p, i) =>
          111000 *
          Math.hypot(p.lat - path[i].lat, (p.lng - path[i].lng) * 0.998),
      );
    assert.ok(distances.reduce((a, b) => a + b, 0) > 1500);
  }
});
