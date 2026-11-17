import {
  sectors,
  templates,
  savePlan,
  stopCount,
  deletePlan,
} from "../js/maps/planning.js";
import { snapshot, change } from "../js/maps/store.js";
import { saveVehicle, log } from "../js/maps/simulation.js";
export function setupPlanner(act, draw) {
  const get = (id) => document.getElementById(id),
    dialog = get("plan-dialog"),
    form = get("plan-form"),
    f = form.elements;
  let editing,
    fromVehicle = false;
  function paths() {
    const s = snapshot();
    const free = templates.filter(
      (t) =>
        t.region === f.sector.value &&
        !s.plans.some((p) => p.key === t.key && p.code !== editing),
    );
    f.path.replaceChildren(
      ...free.map(
        (t) =>
          new Option(t.name.split(" · ").at(-1) + " — " + t.streets[0], t.key),
      ),
    );
    if (!free.length) f.path.add(new Option("Nenhum percurso livre", ""));
    info();
  }
  function info() {
    const t = templates.find((t) => t.key === f.path.value);
    get("path-info").textContent = t
      ? (t.meters / 1000).toLocaleString("pt-BR", {
          maximumFractionDigits: 1,
        }) +
        " km · " +
        t.streets.length +
        " vias. Percurso: " +
        t.streets.join(", ")
      : "Edite ou libere um percurso já cadastrado neste setor.";
  }
  function open(code, sector) {
    const s = snapshot(),
      p = s.plans.find((p) => p.code === code);
    editing = code;
    f.sector.replaceChildren(...sectors.map((t) => new Option(t.name, t.name)));
    f.sector.value =
      templates.find((t) => t.key === p?.key)?.region ||
      sector ||
      "Parquelândia";
    f.title.value = p?.name || "";
    paths();
    if (p) f.path.value = p.key;
    info();
    const current = s.vehicles.find((v) => code && v.route === code);
    f.truck.replaceChildren(
      new Option("Sem atribuição", ""),
      ...s.vehicles
        .filter((v) => v === current || (v.active && !v.route))
        .map((v) => new Option(v.id, v.id)),
    );
    f.truck.value = current?.id || "";
    get("plan-error").textContent = "";
    dialog.showModal();
  }
  f.path.onchange = info;
  f.sector.onchange = paths;
  get("new-plan").onclick = () => {
    fromVehicle = false;
    open(null);
  };
  get("vehicle-plan").onclick = () => {
    fromVehicle = true;
    open(null, get("vehicle").elements.sector.value);
  };
  get("cancel-plan").onclick = () => dialog.close();
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const { id, action } = b.dataset;
    if (action === "plan-edit") {
      fromVehicle = false;
      open(id);
    }
    if (
      action === "plan-active" &&
      confirm("Alterar disponibilidade da rota " + id + "?")
    )
      act((s) => {
        const p = s.plans.find((p) => p.code === id);
        savePlan(s, { ...p, active: !p.active });
        log(s, "Disponibilidade alterada · " + id);
      }, "Disponibilidade atualizada.");
    if (
      action === "plan-delete" &&
      confirm("Remover a rota " + id + " e o progresso associado?")
    )
      act((s) => {
        deletePlan(s, id);
        log(s, "Rota removida · " + id);
      }, "Rota removida.");
  });
  form.onsubmit = (e) => {
    e.preventDefault();
    let code;
    try {
      change((s) => {
        code = editing || "RT-" + String(s.nextRoute++).padStart(2, "0");
        const old = s.plans.find((p) => p.code === code),
          current = s.vehicles.find((v) => v.route === code);
        if (current && current.id !== f.truck.value)
          saveVehicle(s, { ...current, route: "" }, true);
        savePlan(s, {
          code,
          name: f.title.value.trim(),
          key: f.path.value,
          count:
            old?.key === f.path.value ? old.count : stopCount(f.path.value),
          active: old?.active ?? true,
        });
        if (f.truck.value) {
          const v = s.vehicles.find((v) => v.id === f.truck.value);
          if (!v || (v.route && v.route !== code))
            throw Error("O veículo já foi atribuído.");
          saveVehicle(s, { ...v, route: code }, true);
        }
        log(s, "Planejamento salvo · " + code);
      });
      dialog.close();
      draw();
      if (fromVehicle) {
        const v = get("vehicle").elements;
        v.sector.value = f.sector.value;
        v.sector.dispatchEvent(new Event("change"));
        if ([...v.route.options].some((o) => o.value === code))
          v.route.value = code;
      }
    } catch (error) {
      get("plan-error").textContent = error.message;
    }
  };
}
