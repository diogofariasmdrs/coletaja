export function normalizeAddress(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\b(av|aven)\b/g, "avenida")
    .replace(/\br\b/g, "rua")
    .replace(/\bdr\b/g, "doutor")
    .replace(/\bprof\b/g, "professor");
}
const streetKey = (text) =>
  normalizeAddress(text).replace(/^(rua|avenida|travessa|praca|alameda) /, "");
function parseQuery(text) {
  const q = normalizeAddress(text).replace(
    /\s+(?:fortaleza(?: ce)?|ceara|ce)$/,
    "",
  );
  const match = q.match(/^(.*[a-z0-9)])\s+(?:n[ºo]?\s*)?(\d+)$/);
  return {
    fullName: match ? match[1] : q,
    street: streetKey(match ? match[1] : q),
    number: match ? Number(match[2]) : null,
  };
}

export function searchStreets(query, streets) {
  const { fullName, street, number } = parseQuery(query);
  if (street.length < 2) return { choices: [] };
  const typed = /^(rua|avenida|travessa|praca|alameda) /.test(fullName);
  const exact = streets.filter(([name]) =>
    typed ? normalizeAddress(name) === fullName : streetKey(name) === street,
  );
  if (!exact.length) {
    const parts = street.split(" ");
    const names = streets.filter(([name]) =>
      parts.every((word) => streetKey(name).includes(word)),
    );
    return {
      suggestions: [...new Set(names.map(([name]) => name))]
        .slice(0, 6)
        .map((name) => (number === null ? name : name + ", " + number)),
    };
  }
  const choices = [];
  for (const [name, segments] of exact) {
    const pretty = name
      .toLocaleLowerCase("pt-BR")
      .replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
    // Há faixas sobrepostas no cadastro. Mostre as alternativas em ordem de precisão.
    const matches =
      number === null
        ? [segments[Math.floor(segments.length / 2)]]
        : segments
            .filter(([min, max]) => min > 0 && min <= number && number <= max)
            .sort((a, b) => a[1] - a[0] - (b[1] - b[0]));
    for (const [min, max, lat, lng] of matches) {
      choices.push({
        label: pretty + (number === null ? "" : ", " + number),
        detail:
          number === null
            ? "Ponto de referência da rua"
            : "Centro do trecho · nº " + min + " a " + max,
        point: { lat: lat / 100000, lng: lng / 100000 },
      });
    }
  }
  return { choices, streetFound: true };
}
