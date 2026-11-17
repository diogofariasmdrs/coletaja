import { normalizeAddress } from "./streetSearch.js";
import { districtIndex, placeRank, similarName } from "./localSearch.js";
export function buildNameIndex(names, places = []) {
  return [
    ...districtIndex.map((d) => ({
      label: d.name,
      key: d.key,
      kind: "Bairro",
    })),
    ...places.map((p) => ({
      label: p.label,
      key: normalizeAddress(p.label),
      kind: p.kind,
      place: p,
    })),
    ...[...new Set(names)].map((label) => ({
      label,
      key: normalizeAddress(label),
      kind: "Rua",
    })),
  ];
}
export function suggest(index, text) {
  const q = normalizeAddress(text);
  if (q.length < 2) return [];
  const parts = q.split(" ");
  const buckets = [[], [], [], []];
  for (const item of index) {
    const key = item.key;
    const placeScore = item.place ? placeRank(item.place, text) : Infinity;
    if (
      !parts.every((p) => key.includes(p)) &&
      !Number.isFinite(placeScore) &&
      !(item.kind === "Bairro" && similarName(q, key))
    )
      continue;
    const rank =
      key === q || placeScore === 0
        ? 0
        : key.startsWith(q) || placeScore === 1
          ? 1
          : key.split(" ").some((w) => w.startsWith(parts[0]))
            ? 2
            : 3;
    if (buckets[rank].length < 7) buckets[rank].push(item);
  }
  return buckets.flat().slice(0, 7);
}
export function setupSuggestions(input, form) {
  const list = document.createElement("div");
  list.id = "street-suggestions";
  list.className = "street-suggestions";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", "Sugestões locais");
  form.append(list);
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-controls", list.id);
  input.setAttribute("aria-autocomplete", "list");
  input.autocomplete = "off";
  let index,
    timer,
    items = [],
    active = -1,
    sequence = 0;
  function close() {
    sequence++;
    clearTimeout(timer);
    list.hidden = true;
    active = -1;
    input.removeAttribute("aria-activedescendant");
    input.setAttribute("aria-expanded", "false");
  }
  function accept(i) {
    if (!items[i]) return;
    input.value = items[i].label;
    close();
    form.requestSubmit();
  }
  function render(text) {
    items = suggest(index, text);
    list.replaceChildren();
    active = -1;
    input.removeAttribute("aria-activedescendant");
    for (const [i, item] of items.entries()) {
      const el = document.createElement("div");
      el.id = "street-option-" + i;
      el.setAttribute("role", "option");
      const normalized = item.label
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase(),
        part = normalizeAddress(text)
          .split(" ")
          .find((q) => normalized.includes(q));
      const offset = part ? normalized.indexOf(part) : -1;
      if (offset >= 0) {
        const mark = document.createElement("mark");
        mark.textContent = item.label.slice(offset, offset + part.length);
        el.append(
          item.label.slice(0, offset),
          mark,
          item.label.slice(offset + part.length),
        );
      } else el.textContent = item.label;
      if (item.kind !== "Rua")
        el.append(
          " · " +
            item.kind +
            (item.place?.district ? " · " + item.place.district : ""),
        );
      el.onpointerdown = (e) => e.preventDefault();
      el.onclick = () => accept(i);
      list.append(el);
    }
    if (!items.length) {
      close();
      return;
    }
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }
  input.addEventListener("input", () => {
    close();
    const text = input.value.trim(),
      id = sequence;
    if (text.length < 2) return;
    timer = setTimeout(async () => {
      try {
        if (!index) {
          const [names, places] = await Promise.all([
            import("./streetNames.json"),
            import("./places.json"),
          ]);
          index ??= buildNameIndex(names.default, places.default);
        }
        if (id === sequence) render(text);
      } catch {
        if (id === sequence) close();
      }
    }, 120);
  });
  input.addEventListener("keydown", (e) => {
    if (list.hidden) return;
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      accept(active);
      return;
    }
    if (!items.length || !["ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    active =
      (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    [...list.children].forEach((el, i) =>
      el.setAttribute("aria-selected", String(i === active)),
    );
    input.setAttribute("aria-activedescendant", list.children[active].id);
  });
  input.addEventListener("blur", close);
  form.addEventListener("submit", close);
  close();
}
