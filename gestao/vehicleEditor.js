import { snapshot, change } from "../js/maps/store.js";
import { saveVehicle, statuses } from "../js/maps/simulation.js";
import { plannedRoutes, sectors } from "../js/maps/planning.js";
const $ = (id) => document.getElementById(id);
export function setupVehicleEditor(setOptions, notify, draw) {
  let editing = false;
  $("vehicle").elements.status.append(...statuses.map((t) => new Option(t, t)));
  function edit(id) {
    const s = snapshot(),
      v = s.vehicles.find((v) => v.id === id),
      f = $("vehicle").elements;
    editing = !!v;
    let n = 1;
    while (s.vehicles.some((v) => v.id === "CJ-" + String(n).padStart(2, "0")))
      n++;
    f.id.value = v?.id || "CJ-" + String(n).padStart(2, "0");
    f.id.readOnly = editing;
    setOptions(
      f.sector,
      sectors.map((t) => [t.name, t.name]),
    );
    f.sector.value = v?.sector || sectors[0].name;
    f.notes.value = v?.notes || "";
    f.color.value = v?.color || "#387c54";
    f.status.value = v?.status || statuses[0];
    function choices() {
    const latest=snapshot();
      setOptions(f.route, [
        ["", "Sem rota"],
        ...plannedRoutes(latest)
          .filter((r) => r.active && r.region === f.sector.value)
          .filter(
            (r) =>
              !latest.vehicles.some(
                (t) => t.route === r.code && t.id !== id,
              ),
          )
          .map((r) => [r.code, r.code + " · " + r.name]),
      ]);
      $("availability").textContent =
        f.route.options.length === 1
          ? "As rotas deste setor estão ocupadas ou inativas. Salve o veículo em reserva ou cadastre outro percurso."
          : "";
    }
    choices();
    f.sector.onchange = choices;
    f.route.value = v?.route || "";
    $("form-error").textContent = "";
    $("editor").showModal();
  }
  $("vehicle").onsubmit = (e) => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.target));
    try {
      change((s) => saveVehicle(s, v, editing));
      $("editor").close();
      notify("Cadastro salvo.");
      draw();
    } catch (err) {
      $("form-error").textContent = err.message;
    }
  };
  $("add").onclick = () => edit();
  $("cancel").onclick = () => $("editor").close();

  return edit;
}
