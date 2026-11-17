import districts from "./districts.json" with { type: "json" };
import { normalizeAddress } from "./streetSearch.js";

const districtIndex = districts.map((d, index) => ({
  ...d,
  index,
  key: normalizeAddress(d.name),
}));
export { districtIndex };
export function similarName(a, b) {
  if (Math.min(a.length, b.length) < 6 || Math.abs(a.length - b.length) > 1)
    return false;
  if (a.length > b.length) return similarName(b, a);
  let edits = 0;
  for (let i = 0, j = 0; j < b.length; j++) {
    if (a[i] === b[j]) i++;
    else {
      if (++edits > 1) return false;
      if (a.length === b.length) i++;
    }
  }
  return true;
}
export function areaContains(area, point) {
  const { lng: x, lat: y } = point;
  const [west, south, east, north] = area.box;
  if (x < west || x > east || y < south || y > north) return false;
  function inside(ring) {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [ax, ay] = ring[i],
        [bx, by] = ring[j];
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
        hit = !hit;
    }
    return hit;
  }
  return area.polygons.some(
    ([outer, ...holes]) => inside(outer) && !holes.some(inside),
  );
}

export function parseLocation(text) {
  const clean = normalizeAddress(
    text.replace(/\b(?:cep\s*)?\d{5}[-\s]?\d{3}\b/gi, ""),
  ).replace(/\s+(?:fortaleza(?: ce(?:ara)?)?|ce)(?: brasil)?$/, "");
  const key = clean.replace(/^bairro (?:de |da |do )?/, "");
  const exact =
    districtIndex.find((d) => clean.replace(/^bairro /, "") === d.key) ||
    districtIndex.find((d) => key === d.key);
  const close = exact
    ? []
    : districtIndex.filter((d) => similarName(key, d.key));
  const district = exact || (close.length === 1 && close[0]);
  if (district) return { district, street: "" };
  const suffix = districtIndex
    .filter((d) => clean.endsWith(" " + d.key))
    .sort((a, b) => b.key.length - a.key.length)[0];
  // "Rua Vila Velha" também pode ser o nome completo de uma via.
  const prefix =
    suffix &&
    clean
      .slice(0, -suffix.key.length)
      .trim()
      .replace(/\s+bairro$/, "");
  return suffix &&
    prefix &&
    !/^(rua|avenida|travessa|praca|alameda)$/.test(prefix)
    ? { district: suffix, street: prefix }
    : { street: clean };
}

export function pathInDistrict(path, area) {
  if (path.some((point) => areaContains(area, point))) return true;
  // Uma avenida longa pode atravessar o bairro mesmo com os dois vértices fora dele.
  const [w, s, e, n] = area.box;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1],
      b = path[i];
    if (
      Math.max(a.lng, b.lng) < w ||
      Math.min(a.lng, b.lng) > e ||
      Math.max(a.lat, b.lat) < s ||
      Math.min(a.lat, b.lat) > n
    )
      continue;
    const dx = b.lng - a.lng,
      dy = b.lat - a.lat;
    for (const [ring] of area.polygons) {
      for (let k = 1; k < ring.length; k++) {
        const [x, y] = ring[k - 1],
          [u, v] = ring[k],
          ex = u - x,
          ey = v - y;
        const det = dx * ey - dy * ex;
        if (!det) continue;
        const t = ((x - a.lng) * ey - (y - a.lat) * ex) / det;
        const f = ((x - a.lng) * dy - (y - a.lat) * dx) / det;
        if (t >= 0 && t <= 1 && f >= 0 && f <= 1) return true;
      }
    }
  }
  return false;
}

// Compara espaços e consoantes duplicadas sem trocar palavras curtas por nomes parecidos.
function placeKey(s) {
  return normalizeAddress(s)
    .replace(/(.)\1+/g, "$1")
    .replace(/\s/g, "");
}
export function placeRank(place, query) {
  const q = placeKey(query);
  if (q.length < 3) return Infinity;
  const values = [
    place.label,
    place.alias,
    place.kind + " " + place.label,
    place.label + " " + (place.district || ""),
  ];
  for (const value of values) if (value && placeKey(value) === q) return 0;
  if (values.some((v) => v && placeKey(v).startsWith(q))) return 1;
  return placeKey(place.label).includes(q) ? 2 : Infinity;
}

export function matchingPlaces(places, query) {
  return places
    .map((p) => ({ place: p, rank: placeRank(p, query) }))
    .filter((p) => Number.isFinite(p.rank))
    .sort(
      (a, b) =>
        a.rank - b.rank || a.place.label.localeCompare(b.place.label, "pt-BR"),
    );
}
