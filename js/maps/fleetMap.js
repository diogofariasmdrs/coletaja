import { school } from "./demoRoutes.js";
import { operations } from "./operations.js";
import { splitRoute } from "./geometry.js";
import "../../css/fleet-map.css";

function truckIcon(row, westbound) {
  const pin = document.createElement("span");
  pin.className = "fleet-pin";
  pin.style.setProperty("--vehicle", row.truck.color);
  pin.dataset.westbound = String(westbound);
  pin.innerHTML = `<svg viewBox="0 0 80 54" aria-hidden="true">
    <ellipse cx="39" cy="41" rx="34" ry="6" fill="#173526" opacity=".16"/>
    <path d="m6 29 42 10 24-9 3 5-22 13L5 37z" fill="#22342f"/>
    <path d="m5 16 12-9 31 7 4 5-12 8z" fill="#d3e1b9"/>
    <path d="m5 16 34 8 3 13-7 4-31-8z" fill="var(--vehicle)"/>
    <path d="m39 24 13-8-1 16-10 7z" fill="#315944"/>
    <path d="m4 16 6 2-2 12-5 3-2-3z" fill="#58735d"/>
    <path d="m10 19 24 6m-25 5 26 6" stroke="#e2edae" stroke-width="1.7"/>
    <path d="m15 21-1 8m15-5-1 8" stroke="#193c2c" opacity=".45" stroke-width="2"/>
    <path d="m47 22 11-7 11 3 5 10-14 9-14-3z" fill="#faf5d6"/>
    <path d="m47 22 11 3 3 12-14-3z" fill="#d5d8b8"/>
    <path d="m58 24 10-5 4 8-11 6z" fill="#415f60"/>
    <path d="m49 24 6 2 1 6-7-2z" fill="#4e6964"/>
    <path d="m59 36 15-8v6l-14 8z" fill="#a6ae94"/>
    <path d="m69 32 4-2v2l-4 2z" fill="#fff0a5"/>
    <g fill="#26342e" stroke="#516054" stroke-width="1.2">
      <ellipse cx="13" cy="36" rx="4.7" ry="6"/><ellipse cx="24" cy="38.6" rx="4.7" ry="6"/><ellipse cx="51" cy="42" rx="5" ry="6.4"/>
    </g><g fill="#c0c5ad"><ellipse cx="13" cy="36" rx="2" ry="2.5"/><ellipse cx="24" cy="38.6" rx="2" ry="2.5"/><ellipse cx="51" cy="42" rx="2" ry="2.5"/></g></svg><b></b>`;
  pin.querySelector("b").textContent = row.vehicle;
  return pin;
}

export function createFleetMap(host, mapId, select) {
  const maps = google.maps;
  const map = new maps.Map(host, {
    center: school,
    zoom: 16,
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
  const Marker = maps.marker.AdvancedMarkerElement;
  const campus = new Marker({
    map,
    position: school,
    title: "EEEP Joaquim Nogueira",
  });
  let pickPoint;
  const vehicles = operations.map((row) => {
    const segment = splitRoute(row);
    const icon = truckIcon(row, segment.westbound);
    const marker = new Marker({
      map,
      position: segment.position,
      title: [row.vehicle, row.truck.status, row.truck.name].join(" · "),
      content: icon,
    });
    const line = { map, strokeColor: row.truck.color };
    const driven = new maps.Polyline({ ...line, path: segment.driven });
    const planned = new maps.Polyline({
      ...line,
      path: segment.planned,
      strokeOpacity: 0,
    });
    const listeners = [marker, driven, planned].map((layer) =>
      layer.addListener("click", (event) => {
        if (pickPoint) pickPoint(event?.latLng?.toJSON() || segment.position);
        else select(row.vehicle);
      }),
    );
    return { row, marker, icon, driven, planned, listeners };
  });
  function highlight(id) {
    for (const { row, marker, icon, driven, planned } of vehicles) {
      const selected = row.vehicle === id;
      const opacity = !id || selected ? 1 : 0.48;
      marker.zIndex = selected ? 5 : 1;
      icon.dataset.selected = String(selected);
      planned.setOptions({
        zIndex: selected ? 3 : 0,
        icons: [
          {
            icon: {
              path: "M 0,-1 0,1",
              strokeColor: row.truck.color,
              strokeOpacity: opacity,
              strokeWeight: selected ? 5 : 3,
              scale: 2,
            },
            offset: "0",
            repeat: "12px",
          },
        ],
      });
      driven.setOptions({
        strokeOpacity: opacity,
        strokeWeight: selected ? 7 : 4,
        zIndex: selected ? 4 : 1,
      });
    }
  }
  highlight();
  return {
    map,
    highlight,
    setPickHandler(handler) {
      pickPoint = handler;
    },
    dispose() {
      campus.map = null;
      for (const v of vehicles) {
        v.listeners.forEach((l) => l.remove());
        v.marker.map = null;
        v.driven.setMap(null);
        v.planned.setMap(null);
      }
      maps.event.clearInstanceListeners(map);
    },
  };
}
