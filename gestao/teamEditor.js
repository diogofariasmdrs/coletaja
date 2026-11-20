import { snapshot } from "../js/maps/store.js";
import {
  photos,
  readTeam,
  saveTeam,
  teamKey,
  teamVehicle,
} from "../js/maps/team.js";
import "../css/team.css";
export function setupTeamEditor() {
  const panel = document.createElement("details");
  panel.className = "team-editor";
  panel.innerHTML =
    '<summary>Equipe demonstrativa da Parquelândia</summary><p data-target></p><p>Equipe fictícia para demonstração acadêmica. Edite somente nomes e fotos autorizados. Salvar aqui altera apenas este navegador.</p><form><div data-members></div><label><input type="checkbox" required> Tenho autorização para usar os nomes e as fotos cadastrados.</label><p role="status"></p><button>Salvar equipe neste navegador</button><button type="button" data-default>Usar dados do projeto</button></form>';
  document.getElementById("frota").append(panel);
  const form = panel.querySelector("form"),
    rows = panel.querySelector("[data-members]"),
    message = form.querySelector("[role=status]");
  let vehicleId;
  photos.forEach((photo, i) => {
    const group = document.createElement("fieldset"),
      legend = document.createElement("legend");
    legend.textContent = "Integrante " + (i + 1);
    group.append(legend);
    for (const [key, label, max] of [
      ["name", "Nome", 60],
      ["role", "Função fictícia", 40],
    ]) {
      const wrap = document.createElement("label");
      wrap.textContent = label;
      const input = document.createElement("input");
      input.name = key + i;
      input.maxLength = max;
      wrap.append(input);
      group.append(wrap);
    }
    const hint = document.createElement("small");
    hint.textContent = "Foto: public/images/equipe/" + photo;
    group.append(hint);
    rows.append(group);
  });
  function load() {
    const s = snapshot(),
      v = teamVehicle(s);
    vehicleId = v?.id;
    panel.querySelector("[data-target]").textContent = v
      ? "Veículo atual: " + v.id + " · " + v.route
      : "Nenhum caminhão ativo atribuído ao percurso da escola.";
    form.hidden = !v;
    if (!v) return;
    let storage;
    try {
      storage = localStorage;
    } catch {}
    const members = readTeam(s, storage);
    photos.forEach((_, i) => {
      form.elements["name" + i].value = members[i]?.name || "";
      form.elements["role" + i].value = members[i]?.role || "";
    });
    message.textContent = "";
  }
  panel.addEventListener("toggle", () => {
    if (panel.open) load();
  });
  form.onsubmit = (e) => {
    e.preventDefault();
    try {
      const s = snapshot();
      if (teamVehicle(s)?.id !== vehicleId)
        throw Error("A atribuição mudou. Feche e abra esta seção novamente.");
      saveTeam(
        s,
        photos.map((photo, i) => ({
          name: form.elements["name" + i].value,
          role: form.elements["role" + i].value,
          photo,
        })),
        localStorage,
      );
      message.textContent = "Equipe salva somente neste navegador.";
      window.dispatchEvent(new Event("coleta-team"));
    } catch (error) {
      message.textContent =
        error.message || "Não foi possível salvar neste navegador.";
    }
  };
  panel.querySelector("[data-default]").onclick = () => {
    try {
      localStorage.removeItem(teamKey);
      load();
      window.dispatchEvent(new Event("coleta-team"));
    } catch {
      message.textContent = "O navegador bloqueou o armazenamento.";
    }
  };
}
