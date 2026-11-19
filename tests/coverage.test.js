import test from "node:test";
import assert from "node:assert/strict";
import { routes } from "../js/maps/simulation.js";
import { school } from "../js/maps/planning.js";
import { operations } from "../js/maps/operations.js";
import {
  findCoverage,
  segmentDistance,
  splitRoute,
} from "../js/maps/geometry.js";

test("proximidade usa o interior do segmento e respeita o limite de 180 m", () => {
  const a = { lat: 0, lng: 0 },
    b = { lat: 0, lng: 0.02 };
  const row = { truck: { path: [a, b] } };
  assert.ok(findCoverage({ lat: 0.0016, lng: 0.01 }, [row]));
  assert.equal(findCoverage({ lat: 0.00164, lng: 0.01 }, [row]), null);
  assert.equal(findCoverage({ lat: 0, lng: -0.01 }, [row]), null);
  assert.equal(segmentDistance(a, a, a), 0);
});
test("escola próxima e região distante sem cobertura", () => {
  assert.ok(findCoverage(school, operations));
  assert.equal(findCoverage({ lat: -4, lng: -39 }, operations), null);
});
test("frota e marcador usam o mesmo boletim e trajeto", () => {
  for (const row of operations) {
    assert.equal(routes.find((v) => v.code === row.route).path, row.truck.path);
    const segment = splitRoute(row);
    assert.equal(segment.driven.at(-1), segment.position);
    assert.equal(segment.planned[0], segment.position);
    assert.ok(findCoverage(segment.position, [row]).meters < 0.001);
    assert.deepEqual(
      splitRoute({ ...row, fraction: 0 }).position,
      row.truck.path[0],
    );
    assert.deepEqual(
      splitRoute({ ...row, fraction: 1 }).position,
      row.truck.path.at(-1),
    );
  }
});
