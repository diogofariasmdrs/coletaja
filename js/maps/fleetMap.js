import { school, fleet } from "./demoRoutes.js";
export function createFleetMap(host, mapId, select) {
  const cleanup = [];
  const maps = google.maps;
  const m = new maps.Map(host, {
    center: school,
    zoom: 15,
    mapId,
    renderingType: maps.RenderingType.VECTOR,
    tilt: 32,
    tiltInteractionEnabled: true,
    headingInteractionEnabled: true,
    gestureHandling: "cooperative",
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    keyboardShortcuts: true,
  });
  const lines = new Map();
  const campus = new maps.marker.AdvancedMarkerElement({
    map: m,
    position: school,
    title: "EEEP Joaquim Nogueira",
  });
  cleanup.push(() => {
    campus.map = null;
    maps.event.clearInstanceListeners(m);
  });
  for (const v of fleet) {
    const line = new maps.Polyline({
      map: m,
      path: v.path,
      strokeColor: v.color,
      strokeOpacity: 0.86,
      strokeWeight: 5,
    });
    lines.set(v.id, line);
    const pin = document.createElement("span");
    pin.className = "truck-pin";
    pin.textContent = v.id;
    pin.style.backgroundColor = v.color;
    const marker = new maps.marker.AdvancedMarkerElement({
      map: m,
      position: v.path[1],
      title: v.id + " · " + v.name,
      content: pin,
    });
    const listener = marker.addListener("click", () => select(v.id));
    cleanup.push(() => {
      listener.remove();
      line.setMap(null);
      marker.map = null;
    });
  }
  return {
    map: m,
    highlight(id) {
      for (const [vehicle, line] of lines) {
        line.setOptions({
          strokeOpacity: !id || vehicle === id ? 0.86 : 0.22,
          strokeWeight: vehicle === id ? 7 : 5,
        });
      }
    },
    dispose() {
      cleanup.forEach((fn) => fn());
    },
  };
}
