import { operations } from "./maps/operations.js";
const $ = (selector) => document.querySelector(selector);

function setupResident() {
  const route = $("#resident-route"),
    stop = $("#resident-stop");
  operations.forEach((row) => route.add(new Option(row.truck.name, row.route)));
  function update(resetStops) {
    const row = operations.find((r) => r.route === route.value);
    if (resetStops) {
      stop.replaceChildren(...row.stops.map((name, i) => new Option(name, i)));
      stop.value = String(Math.min(row.completed, row.stops.length - 1));
    }
    const index = Number(stop.value),
      passed = index < row.completed;
    $("#report-ref").textContent = row.route + " · " + row.updated;
    $("#stop-state").textContent = passed
      ? "Coleta concluída neste ponto"
      : index === row.completed
        ? "Próximo ponto previsto"
        : "Passagem pendente";
    $("#resident-tip").textContent = passed
      ? "O caminhão já atendeu " +
        row.stops[index] +
        ". Para um novo descarte, consulte a próxima coleta."
      : row.stage === "Planejada"
        ? "A rota ainda não iniciou a coleta. Acompanhe o boletim antes de levar os resíduos."
        : row.delay
          ? "Há um atraso registrado. Confira a atualização da rota antes de levar os resíduos."
          : "Seu ponto ainda não foi atendido. Consulte o avanço do veículo para organizar o descarte.";
    $("#stop-line").replaceChildren(
      ...row.stops.map((name, i) => {
        const item = document.createElement("li"),
          state = document.createElement("small");
        state.textContent =
          i < row.completed
            ? "Atendido"
            : i === row.completed
              ? "Próximo"
              : "Previsto";
        item.append(name, state);
        if (i === index) item.setAttribute("aria-current", "step");
        return item;
      }),
    );
    $("#report-truck").textContent = row.vehicle;
    $("#report-progress").textContent =
      row.completed + " de " + row.stops.length + " pontos";
    $("#report-time").textContent = row.truck.time;
  }
  route.onchange = () => update(true);
  stop.onchange = () => update(false);
  update(true);
}

function setupParts() {
  const parts = [
    [
      "Cabine do motorista",
      "Abriga o motorista e os comandos de condução do caminhão.",
      -0.98,
    ],
    [
      "Carroceria",
      "Recebe e transporta os resíduos coletados até o local de descarga.",
      0.14,
    ],
    [
      "Sistema compactador",
      "Na traseira, o mecanismo empurra e comprime os resíduos para aproveitar o espaço da carroceria.",
      1.22,
    ],
    [
      "Rodas e estrutura",
      "As rodas apoiam o veículo no pavimento. O chassi sustenta a cabine, a carroceria e o conjunto de coleta.",
      -0.12,
    ],
  ];
  const host = $(".truck-stage");
  const buttons = parts.map(([name, description, angle], i) => {
    const button = document.createElement("button");
    button.textContent = name;
    button.setAttribute("aria-pressed", "false");
    button.onclick = () => {
      buttons.forEach((b, j) => b.setAttribute("aria-pressed", i === j));
      $("#part-description").textContent = description;
      host.dataset.componentAngle = angle;
      host.dispatchEvent(new Event("componentview"));
    };
    return button;
  });
  $("#part-buttons").append(...buttons);
}
export function setupSections() {
  setupResident();
  setupParts();
  $(".page-foot time").textContent = new Date().getFullYear();
}
