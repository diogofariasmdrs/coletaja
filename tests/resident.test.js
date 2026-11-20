import test from "node:test";
import assert from "node:assert/strict";
import {
  createArrivalAlert,
  readPreferences,
  statusLabel,
} from "../js/maps/residentState.js";
const arriving = (seconds) => ({
  status: "arriving",
  vehicle: "CJ-01",
  wallSeconds: seconds,
});
test("alerta cruza limiar uma vez e respeita pausa, desativação e reinício", () => {
  const a = createArrivalAlert();
  assert.equal(a.check(arriving(1900), 30, "casa"), false);
  assert.equal(a.check({ status: "paused" }, 30, "casa"), false);
  assert.equal(a.check(arriving(1800), 30, "casa"), true);
  assert.equal(a.check(arriving(1700), 30, "casa"), false);
  assert.equal(a.check(arriving(300), 0, "casa"), false);
  a.reset();
  assert.equal(a.check(arriving(50), 5, "casa"), true);
});
test("mudar endereço ou limiar rearma; passagem e ausência de previsão não alertam", () => {
  const a = createArrivalAlert();
  assert.equal(a.check(arriving(120), 5, "a"), true);
  assert.equal(a.check(arriving(120), 5, "b"), true);
  assert.equal(a.check(arriving(120), 15, "b"), true);
  assert.equal(a.check({ status: "passing" }, 15, "b"), false);
  a.reset();
  assert.equal(a.check(arriving(NaN), 5, "a"), false);
});
test("preferências descartam endereço antigo e toleram armazenamento indisponível", () => {
  assert.deepEqual(
    readPreferences({
      getItem: () =>
        JSON.stringify({
          favorite: { label: "casa", point: { lat: 0, lng: 0 } },
          minutes: 15,
        }),
    }),
    { minutes: 15 },
  );
  assert.deepEqual(readPreferences(undefined), { minutes: 0 });
});
test("novo rótulo não altera valores de estado persistidos", () => {
  assert.equal(statusLabel("Em coleta"), "Recolhendo resíduos");
  assert.equal(statusLabel("Pausado"), "Pausado");
});
