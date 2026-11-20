import defaults from "./team.json" with { type: "json" };
export const teamKey = "coletaja.team.v1";
export const photos = [
  "motorista.webp",
  "coletor-1.webp",
  "coletor-2.webp",
  "apoio.webp",
];
// Segue a atribuição do percurso da escola, nunca o número do caminhão.
export function teamVehicle(state) {
  const plan = state.plans.find((p) => p.active && p.key === "Parquelândia-0");
  return plan
    ? state.vehicles.find((v) => v.active && v.route === plan.code)
    : null;
}
export function validateTeam(members) {
  if (!Array.isArray(members) || members.length > 4)
    throw Error("Cadastre no máximo quatro integrantes.");
  return members.map((m) => {
    if (
      typeof m.name !== "string" ||
      typeof m.role !== "string" ||
      m.name.length > 60 ||
      m.role.length > 40 ||
      !photos.includes(m.photo)
    )
      throw Error("Confira nome, função e arquivo da foto.");
    const clean = { name: m.name.trim(), role: m.role.trim(), photo: m.photo };
    if (clean.name && !clean.role)
      throw Error("Informe a função dos integrantes cadastrados.");
    return clean;
  });
}
export function readTeam(state, storage) {
  const vehicle = teamVehicle(state);
  if (!vehicle) return [];
  try {
    const saved = JSON.parse(storage?.getItem(teamKey));
    if (saved?.vehicleId === vehicle.id) return validateTeam(saved.members);
  } catch {}
  return vehicle.id === defaults.vehicleId
    ? validateTeam(defaults.members)
    : photos.map((photo) => ({ name: "", role: "", photo }));
}
export function saveTeam(state, members, storage) {
  const vehicle = teamVehicle(state);
  if (!vehicle) throw Error("Não há veículo ativo no percurso da escola.");
  storage.setItem(
    teamKey,
    JSON.stringify({ vehicleId: vehicle.id, members: validateTeam(members) }),
  );
}
