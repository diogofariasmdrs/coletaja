const $ = (selector) => document.querySelector(selector);

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
  setupParts();
}
