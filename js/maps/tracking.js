import {createFleetMap} from "./fleetMap.js";
import { fleet, school } from "./demoRoutes.js";
import { loadMaps } from "./googleMaps.js";
export function setupTracking() {
  const section = document.querySelector("#plataforma"),
    host = section.querySelector(".google-surface");
  const message = section.querySelector(".map-message"),
    detail = section.querySelector(".tracking-detail");
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim(),
    mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
  let map;
  const list = section.querySelector(".truck-list");
  const buttons = fleet.map((vehicle, index) => {
    const button = document.createElement("button");
    const id = document.createElement("b");
    const name = document.createElement("span");
    id.textContent = vehicle.id;
    name.textContent = vehicle.name;
    button.append(id, name);
    button.setAttribute("aria-pressed", index === 0);
    list.append(button);
    return button;
  });
  function select(id) {
    const vehicle = fleet.find((v) => v.id === id);
    buttons.forEach((b) =>
      b.setAttribute("aria-pressed", b.querySelector("b").textContent === id),
    );
    detail.querySelector("b").textContent = id + " · " + vehicle.status;
    detail.querySelector("p").textContent =
      vehicle.name + " · Parada simulada às " + vehicle.time;
    map?.panTo(vehicle.path[1]);
    map?.setZoom(16);
  }
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
          b.querySelector("span").textContent,
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
    map?.setZoom(15);
  };
  actions.lastChild.onclick = locate;
  const notice = document.createElement("p");
  notice.className = "map-notice";
  notice.setAttribute("role", "status");
  notice.hidden = true;
  host.parentElement.append(notice);
  function setNotice(text) {
    notice.hidden = false;
    notice.textContent = text;
  }
  function setStatus(status) {
    message.hidden = status === "ready";
    actions.hidden = status !== "ready";
    message.querySelector("strong").textContent =
      status === "quota" ? "Cota do Google Maps esgotada" : status === "error"
        ? "Google Maps indisponível"
        : "Carregando Google Maps…";
    message.querySelector("p").textContent =
      status === "quota" ? "Aguarde a renovação da cota para abrir o mapa novamente." : status === "error"
        ? "Confira a conexão, a chave e o domínio permitido. Se a cota diária da Demo Key acabou, tente novamente após a renovação."
        : "Abrindo a região da escola.";
  }
  function locate() {
    if (!navigator.geolocation) {
      setNotice("Localização indisponível neste navegador.");
      return;
    }
    setNotice("Buscando sua posição…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        map?.panTo({ lat: p.coords.latitude, lng: p.coords.longitude });
        map?.setZoom(16);
        setNotice("Mapa centralizado na sua posição.");
      },
      () => setNotice("Não foi possível acessar sua localização."),
      { timeout: 9000 },
    );
  }

  function initialize() {
    let disposed = false;
    const cleanup = [];
    const error = (cause) => {
      if (!disposed) {
        map = null;
        const reason = [cause?.code, cause?.status, cause?.message].join(" ");
        setStatus(/OVER_QUERY_LIMIT|RESOURCE_EXHAUSTED|OverQuotaMapError|\b429\b/i.test(reason) ? "quota" : "error");
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
          const layers=createFleetMap(host,mapId,select);
          map=layers.map;cleanup.push(layers.dispose);
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
