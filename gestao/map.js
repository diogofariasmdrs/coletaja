import { createFleetMap } from "../js/maps/fleetMap.js";
import { loadMaps } from "../js/maps/googleMaps.js";
import { splitRoute } from "../js/maps/geometry.js";
import { routes } from "../js/maps/simulation.js";
let layers,
  loading = false;
let state = [],
  chosen = null;
export function updateMap(rows, selected) {
  state = rows;
  chosen = selected;
  if (layers) {
    layers.sync(rows);
    layers.highlight(selected);
  }
}
export function focusMap(id) {
  if (!layers) return;
  const row = state.find((r) => r.vehicle === id);
  if (row) {
    layers.map.panTo(splitRoute(row).position);
    layers.map.setZoom(16);
  } else {
    const bounds = new google.maps.LatLngBounds();
    for (const r of state.length ? state.map((v) => v.truck) : routes)
      for (const p of r.path) bounds.extend(p);
    layers.map.fitBounds(bounds, 32);
  }
}
export function openMap(select) {
  if (layers || loading) return;
  const msg = document.querySelector("#map-state"),
    key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    msg.textContent =
      "Mapa aguarda configuração da chave Google. A simulação está disponível.";
    return;
  }
  loading = true;
  const error = () => {
    msg.hidden = false;
    msg.textContent =
      "Google Maps indisponível. Confira conexão, chave e cota.";
  };
  window.addEventListener("coleta-map-error", error);
  loadMaps(key)
    .then(() => {
      layers = createFleetMap(
        document.querySelector("#surface"),
        import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
        select,
      );
      updateMap(state, chosen);
      focusMap(chosen);
      msg.hidden = true;
    })
    .catch(error);
}
