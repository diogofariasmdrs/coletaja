// Projeção local em metros, adequada aos percursos curtos desta demonstração.
export const coverageMeters = 180;
function offset(origin, point) {
  const scale = 111195;
  return {
    x:
      (point.lng - origin.lng) * scale * Math.cos((origin.lat * Math.PI) / 180),
    y: (point.lat - origin.lat) * scale,
  };
}

export function segmentDistance(point, start, end) {
  const p = offset(start, point);
  const v = offset(start, end);
  const squared = v.x * v.x + v.y * v.y;
  const t = squared
    ? Math.max(0, Math.min(1, (p.x * v.x + p.y * v.y) / squared))
    : 0;
  return Math.hypot(p.x - t * v.x, p.y - t * v.y);
}

export function findCoverage(point, rows) {
  let best = null;
  for (const row of rows) {
    const path = row.truck.path;
    for (let i = 1; i < path.length; i++) {
      const meters = segmentDistance(point, path[i - 1], path[i]);
      if (meters <= coverageMeters && (!best || meters < best.meters))
        best = { row, meters };
    }
  }
  return best;
}

// O boletim fixa a fração percorrida. O marcador divide a linha nessa distância.
export function splitRoute(row) {
  const path = row.truck.path;
  const lengths = path.slice(1).map((point, i) => {
    const { x, y } = offset(path[i], point);
    return Math.hypot(x, y);
  });
  let remaining =
    (lengths.reduce((sum, length) => sum + length, 0) * row.completed) /
    row.stops.length;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? Math.min(1, remaining / lengths[i]) : 0;
      const a = path[i],
        b = path[i + 1];
      const position = {
        lat: a.lat + t * (b.lat - a.lat),
        lng: a.lng + t * (b.lng - a.lng),
      };
      return {
        position,
        westbound: b.lng < a.lng,
        driven: [...path.slice(0, i + 1), position],
        planned: [position, ...path.slice(i + 1)],
      };
    }
    remaining -= lengths[i];
  }
}
