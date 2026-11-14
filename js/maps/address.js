import { searchStreets } from "./streetSearch.js";
import { school } from "./demoRoutes.js";
import { operations } from "./operations.js";
import { findCoverage } from "./geometry.js";

const normalize = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,]/g, "")
    .trim();
const schoolAddress = "Rua Dr. Moreira de Sousa, 327";
const schoolAliases = [
  "EEEP Joaquim Nogueira",
  schoolAddress,
  "Rua Moreira de Sousa 327",
  "Rua Doutor Moreira de Sousa 327",
].map(normalize);

export function setupAddress(select) {
  const el = (id) => document.getElementById(id);
  const section = el("percurso");
  const pick = el("address-pick"),
    view = el("address-view");
  const geocoding = import.meta.env.VITE_ENABLE_GEOCODING === "true";
  const help = el("address-help");
  const mapBox = document.querySelector(".map-space");
  const pickBar = document.createElement("div");
  pickBar.className = "pick-bar";
  pickBar.hidden = true;
  pickBar.innerHTML =
    '<strong>Seleção no mapa</strong><span role="status">Toque em uma rua para consultar.</span><div><button>Usar centro</button><button disabled>Concluir</button><button>Cancelar seleção</button></div>';
  mapBox.append(pickBar);
  const [useCenter, confirmPick, cancelPick] =
    pickBar.querySelectorAll("button");
  let layers,
    marker,
    click,
    candidate,
    last,
    request = 0;
  function announce(title, message) {
    el("street-choices").replaceChildren();
    el("coverage-facts").hidden = true;
    el("address-status").textContent = title;
    el("address-result").textContent = message;
  }
  function stopPicking() {
    click?.remove();
    click = null;
    candidate = null;
    layers?.setPickHandler(null);
    pick.setAttribute("aria-pressed", "false");
    mapBox.classList.remove("is-picking");
    pickBar.hidden = true;
    layers?.map.setOptions({ draggableCursor: null });
  }
  function begin() {
    stopPicking();
    if (marker) marker.map = null;
    marker = last = null;
    view.hidden = true;
    return ++request;
  }
  function placeMarker(point, label) {
    if (!layers) return;
    if (marker) {
      marker.position = point;
      marker.title = label;
      return;
    }
    const content = document.createElement("span");
    content.className = "address-dot";
    marker = new google.maps.marker.AdvancedMarkerElement({
      map: layers.map,
      position: point,
      title: label,
      content,
      zIndex: 7,
    });
  }
  function showPoint() {
    if (!layers || !last) return;
    placeMarker(last.point, last.label);
    layers.map.panTo(last.point);
    layers.map.setZoom(17);
  }
  function display(point, label, precision = "") {
    stopPicking();
    const match = findCoverage(point, operations);
    last = { point, label, match };
    if (match) {
      const { row, meters } = match;
      select(row.vehicle, false);
      announce(label, row.route + " · " + row.truck.name);
      el("coverage-vehicle").textContent =
        row.vehicle + " · " + row.truck.status;
      el("coverage-progress").textContent = row.progress + "%";
      el("coverage-distance").textContent = Math.round(meters) + " m";
      el("coverage-facts").hidden = false;
    } else {
      layers?.highlight();
      announce(
        label,
        "Ainda não há rota demonstrativa cadastrada para este endereço.",
      );
    }
    if (precision) el("address-result").textContent += " · " + precision;
    view.hidden = !layers;
    showPoint();
  }
  el("address-form").onsubmit = async (event) => {
    event.preventDefault();
    const id = begin(),
      query = el("address-input").value.trim();
    if (schoolAliases.includes(normalize(query))) {
      display(school, schoolAddress + " · EEEP Joaquim Nogueira");
      return;
    }
    announce(
      "Consultando o cadastro de ruas…",
      "Localizando o trecho em Fortaleza.",
    );
    try {
      const { default: streets } = await import("./fortaleza-streets.json");
      if (id !== request) return;
      const result = searchStreets(query, streets);
      const choices = result.choices || [];
      const accept = (choice) =>
        display(choice.point, choice.label, choice.detail);
      if (choices.length === 1) {
        accept(choices[0]);
        return;
      }
      if (choices.length || result.suggestions?.length) {
        announce(
          choices.length ? "Escolha o trecho" : "Qual destas ruas?",
          choices.length
            ? "O cadastro indica mais de um trecho possível. Escolha pela faixa de números ou confira um ponto no mapa."
            : "Selecione o nome da rua para continuar.",
        );
        const chooser = document.createElement("select");
        chooser.setAttribute(
          "aria-label",
          choices.length ? "Trechos encontrados" : "Ruas encontradas",
        );
        chooser.add(new Option("Selecione uma opção", ""));
        if (choices.length)
          choices.forEach((c, i) =>
            chooser.add(
              new Option(
                c.label + " · " + c.detail + " (" + (i + 1) + ")",
                String(i),
              ),
            ),
          );
        else
          result.suggestions.forEach((name) =>
            chooser.add(new Option(name, name)),
          );
        chooser.onchange = () => {
          if (!chooser.value) return;
          if (choices.length) accept(choices[Number(chooser.value)]);
          else {
            el("address-input").value = chooser.value;
            el("address-form").requestSubmit();
          }
        };
        el("street-choices").append(chooser);
        chooser.focus({ preventScroll: true });
        return;
      }
      if (!geocoding || !layers) {
        announce(
          result.streetFound
            ? "Número fora das faixas cadastradas"
            : "Rua não encontrada no cadastro",
          result.streetFound
            ? "Pesquise apenas o nome da rua para ver um ponto de referência ou escolha o local no mapa."
            : "Confira a grafia e tente o nome da rua sem bairro ou CEP. Também é possível marcar o local no mapa.",
        );
        return;
      }
    } catch {
      if (id !== request) return;
      if (!geocoding || !layers) {
        announce(
          "O cadastro não carregou",
          "Tente buscar novamente ou escolha um ponto no mapa.",
        );
        return;
      }
    }
    announce("Localizando endereço…", "Consultando o Google Maps.");
    try {
      const { Geocoder } = await google.maps.importLibrary("geocoding");
      const { results } = await new Geocoder().geocode({
        address: query + ", Fortaleza, Ceará",
        componentRestrictions: { country: "BR" },
      });
      if (id !== request) return;
      const result = results.find(
        (item) =>
          !item.partial_match &&
          item.address_components.some(
            (c) =>
              (c.types.includes("administrative_area_level_2") ||
                c.types.includes("locality")) &&
              normalize(c.long_name) === "fortaleza",
          ),
      );
      if (result)
        display(result.geometry.location.toJSON(), result.formatted_address);
      else
        announce(
          "Endereço não encontrado em Fortaleza",
          "Confira a rua e o número ou escolha um ponto no mapa.",
        );
    } catch (error) {
      if (id !== request) return;
      const reason = String(error?.code || error?.message || error);
      const title = reason.includes("ZERO_RESULTS")
        ? "Endereço não encontrado"
        : reason.includes("OVER_QUERY_LIMIT")
          ? "Cota de pesquisa esgotada"
          : "Falha na pesquisa do endereço";
      announce(
        title,
        "Confira o endereço ou escolha um ponto diretamente no mapa.",
      );
    }
  };
  function locate() {
    const id = begin();
    if (!navigator.geolocation) {
      announce(
        "Localização indisponível",
        "Pesquise o endereço ou selecione um ponto no mapa.",
      );
      return;
    }
    announce("Buscando sua localização…", "Aguarde a resposta do navegador.");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (request === id)
          display(
            { lat: position.coords.latitude, lng: position.coords.longitude },
            "Sua localização",
          );
      },
      (err) => {
        if (request === id)
          announce(
            err.code === 1
              ? "Permissão de localização negada"
              : "Não foi possível obter a localização",
            "Pesquise o endereço ou escolha um ponto no mapa.",
          );
      },
      { timeout: 9000 },
    );
  }
  el("address-locate").onclick = locate;
  function previewPick(point) {
    candidate = point;
    const match = findCoverage(point, operations);
    layers.highlight(match?.row.vehicle);
    placeMarker(point, "Ponto em consulta");
    pickBar.querySelector("span").textContent = match
      ? match.row.route +
        " · " +
        match.row.vehicle +
        " · " +
        Math.round(match.meters) +
        " m do trajeto"
      : "Sem rota demonstrativa a até 180 m deste ponto.";
    confirmPick.disabled = false;
  }
  pick.onclick = () => {
    if (!layers || click) return;
    ++request;
    pickBar.hidden = false;
    confirmPick.disabled = true;
    pickBar.querySelector("span").textContent =
      "Toque em uma rua ou use o centro do mapa.";
    pick.setAttribute("aria-pressed", "true");
    mapBox.classList.add("is-picking");
    layers.map.setOptions({ draggableCursor: "crosshair" });
    layers.setPickHandler(previewPick);
    click = layers.map.addListener("click", (event) => {
      if (event.latLng) {
        event.stop?.();
        previewPick(event.latLng.toJSON());
      }
    });
    mapBox.scrollIntoView({ block: "center" });
    useCenter.focus({ preventScroll: true });
  };
  useCenter.onclick = () => previewPick(layers.map.getCenter().toJSON());
  confirmPick.onclick = () => {
    if (!candidate) return;
    display(candidate, "Ponto escolhido no mapa");
    section.scrollIntoView();
    view.focus({ preventScroll: true });
  };
  cancelPick.onclick = () => {
    stopPicking();
    if (last) showPoint();
    else if (marker) {
      marker.map = null;
      marker = null;
    }
    const selectedId = document.querySelector(
      '.truck-list [aria-pressed="true"] b',
    )?.textContent;
    layers?.highlight(last?.match?.row.vehicle || selectedId);
    section.scrollIntoView();
    pick.focus({ preventScroll: true });
  };
  view.onclick = () => {
    if (last?.match) select(last.match.row.vehicle, false);
    showPoint();
    mapBox.scrollIntoView({ block: "center" });
    mapBox.focus({ preventScroll: true });
  };
  function attach(next) {
    stopPicking();
    layers = next;
    pick.disabled = !layers;
    view.hidden = !layers || !last;
    help.textContent =
      "Digite a rua e, se souber, o número. A busca localiza o trecho cadastrado em Fortaleza." +
      (geocoding && layers
        ? " Sem correspondência local, o endereço é consultado no Google."
        : "");
    if (layers && last) showPoint();
  }
  attach(null);
  return { attach, locate };
}
