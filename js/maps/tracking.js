import { operations } from "./operations.js";
import { splitRoute } from "./geometry.js";
import { setupAddress } from "./address.js";
import { createFleetMap } from "./fleetMap.js";
import { fleet, school } from "./demoRoutes.js";
import { loadMaps } from "./googleMaps.js";
export function setupTracking() {
  const section = document.querySelector("#plataforma"),
    host = section.querySelector(".google-surface");
  const message = section.querySelector(".map-message"),
    detail = section.querySelector(".tracking-detail");
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim(),
    mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
  let map,
    layers,
    selected = fleet[0].id;
  const address = setupAddress(select);
  const toggle = section.querySelector(".fleet-toggle");
  toggle.onclick = () =>
    toggle.setAttribute(
      "aria-expanded",
      String(toggle.getAttribute("aria-expanded") !== "true"),
    );
  const list = section.querySelector(".truck-list");
  const buttons = fleet.map((vehicle, index) => {
    const button = document.createElement("button");
    const id = document.createElement("b");
    const name = document.createElement("span");
    id.textContent = vehicle.id;
    name.textContent = operations[index].route + " · " + vehicle.name;
    button.append(id, name);
    button.setAttribute("aria-pressed", index === 0);
    list.append(button);
    return button;
  });
  function select(id, focus = true) {
    selected = id;
    const row = operations.find((r) => r.vehicle === id);
    const vehicle = fleet.find((v) => v.id === id);
    buttons.forEach((b) =>
      b.setAttribute("aria-pressed", b.querySelector("b").textContent === id),
    );
    detail.querySelector("b").textContent = id + " · " + vehicle.status;
    detail.querySelector("p").textContent =
      row.route +
      " · " +
      vehicle.name +
      " · " +
      row.progress +
      "% do percurso simulado";
    layers?.highlight(id);
    if (focus && map) {
      map.panTo(splitRoute(row).position);
      map.setZoom(16);
      toggle.setAttribute("aria-expanded", "true");
    }
  }
  select(selected, false);
  buttons.forEach(
    (b) => (b.onclick = () => select(b.querySelector("b").textContent)),
  );
  const empty = document.createElement("p");
  empty.textContent = "Nenhum resultado.";
  empty.hidden = true;
  section.querySelector(".truck-list").append(empty);
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  section.querySelector("input").oninput = (e) => {
    for (const b of buttons)
      b.hidden = !normalize(
        b.querySelector("b").textContent +
          " " +
          b.querySelector("span").textContent +
          " " +
          fleet
            .find((v) => v.id === b.querySelector("b").textContent)
            .streets.join(" "),
      ).includes(normalize(e.target.value.trim()));
    empty.hidden = buttons.some((b) => !b.hidden);
  };
  const actions = document.createElement("div");
  actions.className = "map-actions";
  actions.hidden = true;
  actions.innerHTML =
    "<button>Voltar à escola</button><button>Minha localização</button>";
  host.parentElement.append(actions);
  actions.firstChild.onclick = () => {
    map?.panTo(school);
    map?.setZoom(16);
  };
  actions.lastChild.onclick = () => {
    document.getElementById("percurso").scrollIntoView();
    address.locate();
  };
  function setStatus(status) {
    message.hidden = status === "ready";
    actions.hidden = status !== "ready";
    message.querySelector("strong").textContent =
      status === "quota"
        ? "Cota do Google Maps esgotada"
        : status === "error"
          ? "Google Maps indisponível"
          : "Carregando Google Maps…";
    message.querySelector("p").textContent =
      status === "quota"
        ? "Aguarde a renovação da cota para abrir o mapa novamente."
        : status === "error"
          ? "Confira a conexão, a chave e o domínio permitido. Se a cota diária da Demo Key acabou, tente novamente após a renovação."
          : "Abrindo a região da escola.";
  }
  function initialize() {
    let disposed = false;
    const cleanup = [];
    const error = (cause) => {
      if (!disposed) {
        address.attach(null);
        layers?.dispose();
        layers = map = null;
        const reason = [cause?.code, cause?.status, cause?.message].join(" ");
        setStatus(
          /OVER_QUERY_LIMIT|RESOURCE_EXHAUSTED|OverQuotaMapError|\b429\b/i.test(
            reason,
          )
            ? "quota"
            : "error",
        );
      }
    };
    window.addEventListener("coleta-map-error", error);
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        setStatus("loading");
        try {
          await loadMaps(apiKey);
          if (disposed || !host) return;
          layers = createFleetMap(host, mapId, select);
          map = layers.map;
          layers.highlight(selected);
          address.attach(layers);
          cleanup.push(() => layers?.dispose());
          setStatus("ready");
        } catch (cause) {
          error(cause);
        }
      },
      { rootMargin: "80px" },
    );
    observer.observe(section);
    return () => {
      disposed = true;
      observer.disconnect();
      cleanup.forEach((f) => f());
      map = null;
      window.removeEventListener("coleta-map-error", error);
    };
  }

  if (apiKey) {
    setStatus("waiting");
    initialize();
  }
}
