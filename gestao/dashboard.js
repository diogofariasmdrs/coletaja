import { setupVehicleEditor } from "./vehicleEditor.js";
import { plannedRoutes, blankRun } from "../js/maps/planning.js";
import { setupPlanner } from "./planner.js";
import "./style.css";
import { snapshot, change, restore } from "../js/maps/store.js";
import {
  clock,
  rows,
  statuses,
  types,
  condition,
  totals,
  initialState,
  saveVehicle,
  removeVehicle,
  recordIssue,
  resolveIssue,
  log,
} from "../js/maps/simulation.js";
import { openMap, updateMap, focusMap } from "./map.js";
const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const option = (value, label) => new Option(label, value);
const km = (m) =>
  (m / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " km";
let selected = null,
  page;
function renderHTML(id, html) {
  const el = $(id);
  if (
    el._last !== html &&
    !(
      el.contains(document.activeElement) &&
      document.activeElement.tagName === "SELECT"
    )
  ) {
    el.innerHTML = html;
    el._last = html;
  }
}
function metrics(id, items) {
  renderHTML(
    id,
    items
      .map(
        ([label, value]) =>
          "<div><dt>" + esc(label) + "</dt><dd>" + esc(value) + "</dd></div>",
      )
      .join(""),
  );
}
function record(title, desc, extra = "", controls = "") {
  return (
    '<article class="record"><div><strong>' +
    esc(title) +
    "</strong><p>" +
    esc(desc) +
    "</p><small>" +
    esc(extra) +
    "</small></div>" +
    controls +
    "</article>"
  );
}
function button(action, id, label) {
  return (
    '<button data-action="' +
    action +
    '" data-id="' +
    esc(id) +
    '">' +
    esc(label) +
    "</button>"
  );
}
function notify(text) {
  $("notice").textContent = text;
}
function act(fn, text) {
  try {
    change(fn);
    notify(text);
    draw();
    return true;
  } catch (e) {
    notify(e.message);
    return false;
  }
}
function select(id) {
  selected = id;
  draw();
  focusMap(id);
}
function setOptions(el, pairs) {
  const value = el.value,
    key = JSON.stringify(pairs);
  if (el.dataset.list === key) return;
  el.replaceChildren(...pairs.map(([id, label]) => option(id, label)));
  if (pairs.some((p) => p[0] === value)) el.value = value;
  el.dataset.list = key;
}
$("filter").append(
  option("", "Todas"),
  ...[...statuses, "Concluído"].map((s) => option(s, s)),
);
$("incident").elements.type.append(...types.map((t) => option(t, t)));

let isRunning = false;
function draw() {
  const s = snapshot(),
    t = totals(s),
    active = rows(s),
    routes = plannedRoutes(s);
  isRunning = s.anchor !== null;
  $("clock").textContent = clock(s.elapsed);
  $("elapsed").textContent =
    "Duração · " +
    Math.floor(s.elapsed / 3600) +
    " h " +
    Math.floor((s.elapsed % 3600) / 60) +
    " min";
  $("speed").value = s.speed;
  $("play").textContent =
    s.anchor !== null
      ? "Pausar"
      : s.elapsed
        ? "Continuar"
        : "Iniciar simulação";
  if (page === "operacao") {
    const count = (status) =>
      s.vehicles.filter((v) => condition(s, v) === status).length;
    metrics("metrics", [
      ["Frota total", s.vehicles.length],
      ["Em coleta", count("Em coleta")],
      ["Em deslocamento", count("Em deslocamento")],
      ["Pausados", count("Pausado")],
      ["Rotas em andamento", t.ongoing],
      ["Rotas concluídas", t.done],
      ["Ocorrências abertas", t.open],
      ["Rotas com atraso", t.late],
    ]);
    const filtered = active.filter(
      (r) => !$("filter").value || r.truck.status === $("filter").value,
    );
    if (!filtered.some((r) => r.vehicle === selected)) selected = null;
    renderHTML(
      "roster",
      filtered
        .map(
          (r) =>
            '<button aria-pressed="' +
            (selected === r.vehicle) +
            '" data-action="select" data-id="' +
            r.vehicle +
            '"><b>' +
            r.vehicle +
            "</b> · " +
            r.route +
            "<br>" +
            esc(r.truck.status) +
            "</button>",
        )
        .join("") || "Nenhum veículo em rota neste filtro.",
    );
    const row = filtered.find((r) => r.vehicle === selected);
    $("selection").textContent = row
      ? row.truck.name +
        " · " +
        row.progress +
        "% · " +
        (row.completed < row.stops.length
          ? "Próximo ponto " + (row.completed + 1) + " de " + row.stops.length
          : "Percurso concluído") +
        (row.truck.status === "Pausado"
          ? " · Previsão suspensa"
          : " · Restam aproximadamente " +
            Math.ceil(
              ((1 - row.fraction) *
                row.truck.duration *
                (s.issues.some(
                  (e) =>
                    e.open &&
                    e.vehicle === row.vehicle &&
                    e.type === "Atraso na rota",
                )
                  ? 2
                  : 1)) /
                60,
            ) +
            " min simulados")
      : "Selecione um veículo para acompanhar o percurso.";
    updateMap(filtered, selected);
    openMap(select);
  }
  if (page === "frota")
    renderHTML(
      "vehicles",
      s.vehicles
        .map((v) =>
          record(
            v.id + " · " + (v.sector || "Sem setor"),
            condition(s, v) + " · " + (v.route || "Sem rota"),
            v.notes,
            button("edit", v.id, "Editar") +
              button("active", v.id, v.active ? "Desativar" : "Reativar") +
              button("remove", v.id, "Remover"),
          ),
        )
        .join("") || "Frota vazia. Cadastre o primeiro veículo.",
    );
  if (page === "rotas")
    renderHTML(
      "routes",
      routes
        .map((r) => {
          const v = s.vehicles.find((v) => v.route === r.code),
            run = s.runs[r.code];
          return record(
            r.code + " · " + r.name,
            r.region +
              " · " +
              km(r.meters) +
              " · " +
              r.count +
              " pontos · " +
              Math.floor((run.seconds / r.duration) * 100) +
              "%",
            (v ? v.id + " · " + condition(s, v) : "Sem atribuição") +
              " · " +
              (r.active ? "Ativa" : "Inativa") +
              " · Início previsto 08:00 · " +
              (run.end !== null
                ? "Concluída às " + clock(run.end)
                : "Duração prevista " + Math.ceil(r.duration / 60) + " min"),
            '<label>Atribuição <select data-route="' +
              r.code +
              '"><option value="">Liberar rota</option>' +
              s.vehicles
                .filter((t) => (t.active && !t.route) || t === v)
                .map(
                  (t) =>
                    "<option " +
                    (t === v ? "selected" : "") +
                    ' value="' +
                    t.id +
                    '">' +
                    t.id +
                    "</option>",
                )
                .join("") +
              "</select></label>" +
              button("plan-edit", r.code, "Editar") +
              button("plan-active", r.code, r.active ? "Desativar" : "Ativar") +
              button("plan-delete", r.code, "Remover"),
          );
        })
        .join(""),
    );
  if (page === "ocorrencias") {
    const options = s.vehicles
      .filter((v) => v.active && v.route && s.runs[v.route].end === null)
      .map((v) => [v.id, v.id + " · " + v.route]);
    setOptions($("incident").elements.vehicle, options);
    renderHTML(
      "issues",
      s.issues
        .map((e) =>
          record(
            e.type + " · " + e.vehicle,
            e.description,
            e.route +
              " · " +
              clock(e.time) +
              " · " +
              (e.open ? "Aberta" : "Resolvida"),
            e.open ? button("resolve", e.id, "Resolver") : "",
          ),
        )
        .join("") || "Nenhuma ocorrência registrada.",
    );
  }
  if (page === "relatorio") {
    metrics("report", [
      ["Planejado", km(t.planned)],
      ["Percorrido", km(t.traveled)],
      ["Atendidos", t.served],
      ["Pendentes", t.pending],
      [
        "Não atendidos",
        routes.reduce(
          (n, r) =>
            n +
            s.runs[r.code].missed.filter(
              (p) =>
                p <=
                Math.floor((s.runs[r.code].seconds / r.duration) * r.count),
            ).length,
          0,
        ),
      ],
      ["Ocorrências", s.issues.length],
      ["Tempo simulado", Math.floor(s.elapsed) + " s"],
      ["Rotas concluídas", t.done],
    ]);
    renderHTML(
      "history",
      s.history
        .map((h) => "<li>" + clock(h.time) + " · " + esc(h.message) + "</li>")
        .join("") || "<li>Aguardando a primeira ação.</li>",
    );
  }
}
function navigate() {
  page = location.hash.slice(1);
  if (
    !["operacao", "frota", "rotas", "ocorrencias", "relatorio"].includes(page)
  )
    page = "operacao";
  document
    .querySelectorAll("main>section")
    .forEach((el) => (el.hidden = el.id !== page));
  document
    .querySelectorAll("nav a")
    .forEach((a) => a.toggleAttribute("aria-current", a.hash === "#" + page));
  draw();
}
const edit = setupVehicleEditor(setOptions, notify, draw);
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const { id, action } = b.dataset;
  if (action === "select") select(id);
  if (action === "edit") edit(id);
  if (
    action === "active" &&
    confirm("Alterar a disponibilidade de " + id + "?")
  )
    act((s) => {
      const v = s.vehicles.find((t) => t.id === id);
      v.active = !v.active;
      log(s, id + (v.active ? " reativado" : " desativado"));
    }, "Disponibilidade atualizada.");
  if (action === "remove" && confirm("Remover " + id + " da frota simulada?"))
    act((s) => removeVehicle(s, id), "Veículo removido.");
  if (action === "resolve")
    act((s) => resolveIssue(s, id), "Ocorrência resolvida.");
});
$("routes").onchange = (e) => {
  const code = e.target.dataset.route,
    id = e.target.value;
  act((s) => {
    const old = s.vehicles.find((v) => v.route === code);
    if (old) saveVehicle(s, { ...old, route: "" }, true);
    if (id) {
      const v = s.vehicles.find((v) => v.id === id);
      saveVehicle(s, { ...v, route: code }, true);
    }
  }, "Atribuição atualizada.");
  document.activeElement.blur();
  $("routes")._last = null;
  draw();
};
$("incident").onsubmit = (e) => {
  e.preventDefault();
  const f = e.target.elements;
  if (
    act(
      (s) => recordIssue(s, f.vehicle.value, f.type.value, f.description.value),
      "Ocorrência registrada.",
    )
  )
    f.description.value = "";
};
$("play").onclick = () =>
  act((s) => {
    s.anchor = s.anchor === null ? Date.now() : null;
    log(s, s.anchor ? "Simulação em execução" : "Simulação pausada");
  }, "Relógio atualizado.");
$("speed").onchange = (e) =>
  act((s) => {
    s.speed = Number(e.target.value);
    log(s, "Velocidade " + s.speed + "×");
  }, "Velocidade atualizada.");
$("restart").onclick = () => {
  if (
    confirm(
      "Zerar relógio, percursos e ocorrências? A frota cadastrada será mantida.",
    )
  )
    act((s) => {
      const { vehicles, plans, nextRoute } = s;
      Object.assign(s, initialState(), {
        vehicles,
        plans,
        nextRoute,
        runs: Object.fromEntries(plans.map((p) => [p.code, blankRun()])),
      });
      log(s, "Percursos reiniciados");
    }, "Percursos reiniciados.");
};
$("restore").onclick = () => {
  if (
    confirm(
      "Restaurar a frota demonstrativa e apagar as alterações locais?",
    )
  ) {
    restore();
    notify("Demonstração restaurada.");
    draw();
  }
};
$("overview").onclick = () => {
  selected = null;
  $("filter").value = "";
  draw();
  focusMap();
};
$("filter").onchange = () => {
  draw();
  focusMap(selected);
};
$("export").onclick = () => {
  const s = snapshot(),
    lines = [
      [
        "Rota",
        "Região",
        "Veículo",
        "Metros planejados",
        "Metros percorridos",
        "Pontos",
        "Progresso %",
        "Tempo simulado (s)",
        "Ocorrências",
      ],
    ];
  for (const r of plannedRoutes(s)) {
    const run = s.runs[r.code];
    lines.push([
      r.code,
      r.region,
      s.vehicles.find((v) => v.route === r.code)?.id || "",
      Math.round(r.meters),
      Math.round((r.meters * run.seconds) / r.duration),
      r.count,
      Math.floor((100 * run.seconds) / r.duration),
      Math.floor(s.elapsed),
      s.issues.filter((e) => e.route === r.code).length,
    ]);
  }
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + lines.map((line) => line.join(";")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "ColetaJa-operacao.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
setupPlanner(act, draw);
window.addEventListener("hashchange", navigate);
window.addEventListener("storage", draw);
navigate();
setInterval(() => {
  if (!document.hidden && isRunning) draw();
}, 500);
