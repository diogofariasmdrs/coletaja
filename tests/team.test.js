import test from "node:test";
import assert from "node:assert/strict";
import { initialState } from "../js/maps/simulation.js";
import {
  teamVehicle,
  readTeam,
  saveTeam,
  validateTeam,
  photos,
} from "../js/maps/team.js";
const member = { name: "Pessoa de teste", role: "Coletor", photo: photos[1] };
const store = () => {
  let value = null;
  return {
    getItem: () => value,
    setItem: (_, v) => {
      value = v;
    },
  };
};
test("equipe segue atribuição real da Parquelândia, não presume identificador", () => {
  const s = initialState();
  assert.equal(teamVehicle(s).id, "CJ-01");
  s.vehicles[0].route = null;
  s.vehicles[1].route = "RT-01";
  assert.equal(teamVehicle(s).id, "CJ-02");
  s.plans[0].active = false;
  assert.equal(teamVehicle(s), null);
});
test("equipe é opcional e privada ao navegador e ao veículo atribuído", () => {
  const s = initialState(),
    storage = store();
  assert.equal(readTeam(s, storage).filter((m) => m.name).length, 0);
  saveTeam(s, [member], storage);
  assert.deepEqual(readTeam(s, storage), [member]);
  s.vehicles[0].route = null;
  s.vehicles[1].route = "RT-01";
  assert.equal(readTeam(s, storage).filter((m) => m.name).length, 0);
});
test("até quatro pessoas, funções obrigatórias e apenas arquivos WebP permitidos", () => {
  assert.throws(() => validateTeam(Array(5).fill(member)));
  assert.throws(() =>
    validateTeam([{ ...member, photo: "data:image/png;base64,xxx" }]),
  );
  assert.throws(() =>
    validateTeam([{ ...member, photo: "https://example.com/foto.webp" }]),
  );
  assert.throws(() => validateTeam([{ ...member, role: "" }]));
  assert.deepEqual(
    validateTeam([{ ...member, name: "  Nome  " }])[0].name,
    "Nome",
  );
});
test("dados corrompidos não quebram ficha, equipe vazia remove exibição", () => {
  const s = initialState(),
    storage = store();
  storage.setItem("", "broken");
  assert.equal(readTeam(s, storage).filter((m) => m.name).length, 0);
  saveTeam(s, [], storage);
  assert.deepEqual(readTeam(s, storage), []);
});
