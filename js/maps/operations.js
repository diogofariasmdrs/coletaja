import { fleet } from "./demoRoutes.js";

// Cada registro representa o último boletim fictício de uma rota.
const reports = [
  {
    route: "RT-01",
    vehicle: "CJ-01",
    updated: "08:10",
    stops: ["Praça", "Escola", "Avenida"],
    completed: 1,
    delay: 0,
  },
  {
    route: "RT-02",
    vehicle: "CJ-02",
    updated: "08:12",
    stops: ["Quadra norte", "Travessia", "Praça do setor", "Saída"],
    completed: 1,
    delay: 6,
  },
  {
    route: "RT-03",
    vehicle: "CJ-03",
    updated: "08:09",
    stops: ["Entrada sul", "Quadra sul", "Calçada"],
    completed: 0,
    delay: 0,
  },
];

export const operations = reports.map((report) => {
  const truck = fleet.find((v) => v.id === report.vehicle);
  const progress = Math.round((100 * report.completed) / report.stops.length);
  const stage =
    progress === 100
      ? "Concluída"
      : progress === 0
        ? "Planejada"
        : "Em andamento";
  return {
    ...report,
    truck,
    progress,
    stage,
    region: "Parquelândia · Fortaleza",
  };
});
