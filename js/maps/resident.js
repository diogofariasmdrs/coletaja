import {
  readPreferences,
  residentKey,
  createArrivalAlert,
} from "./residentState.js";
export function setupResident(getSelection) {
  let storage;
  try {
    storage = window.localStorage;
  } catch {}
  const prefs = readPreferences(storage),
    alerts = createArrivalAlert();
  const host = document.createElement("div");
  host.className = "resident-tools";
  host.innerHTML =
    '<label>Avisar antes da chegada<select aria-label="Avisar antes da chegada"><option value="0">Desativado</option><option value="30">30 minutos</option><option value="15">15 minutos</option><option value="5">5 minutos</option></select></label><small>Avisos nesta página enquanto ela estiver aberta e visível. Tempo no ritmo da demonstração.</small><p role="status" class="resident-feedback"></p>';
  document.getElementById("address-form").after(host);
  const select = host.querySelector("select"),
    feedback = host.querySelector(".resident-feedback");
  select.value = String(prefs.minutes);
  const banner = document.createElement("div");
  banner.className = "arrival-banner";
  banner.hidden = true;
  banner.innerHTML =
    '<span role="status" aria-live="polite"></span><button type="button" aria-label="Fechar aviso">×</button>';
  document.querySelector(".map-space").append(banner);
  let alertFeedback = "";
  let dismissed = "",
    lastMessage = "",
    previousElapsed = 0;
  function message(text) {
    if (text !== lastMessage) {
      lastMessage = text;
      banner.querySelector("span").textContent = text;
    }
    banner.hidden = !text || dismissed === text;
  }
  banner.querySelector("button").onclick = () => {
    dismissed = lastMessage;
    banner.hidden = true;
  };
  function persist() {
    try {
      storage.setItem(residentKey, JSON.stringify(prefs));
      return true;
    } catch {
      feedback.textContent =
        "O navegador não permitiu salvar. As opções valem apenas nesta visita.";
      return false;
    }
  }
  // Descarta endereços salvos pela versão anterior, preservando só o alerta.
  try {
    storage.setItem(residentKey, JSON.stringify(prefs));
  } catch {}
  select.onchange = () => {
    prefs.minutes = Number(select.value);
    alerts.reset();
    dismissed = "";
    message("");
    if (persist())
      feedback.textContent = prefs.minutes
        ? "Aviso ativado. Se já faltar menos que o tempo escolhido, você será avisado agora."
        : "Avisos desativados.";
    window.dispatchEvent(new Event("coleta-playback"));
  };
  return {
    reset() {
      alerts.reset();
      dismissed = "";
      message("");
      if (feedback.textContent === alertFeedback) feedback.textContent = "";
      alertFeedback = "";
    },
    update(result, state) {
      if (state.elapsed < previousElapsed) {
        alerts.reset();
        dismissed = "";
        message("");
      }
      previousElapsed = state.elapsed;
      if (
        result?.status !== "arriving" &&
        feedback.textContent === alertFeedback
      )
        feedback.textContent = "";
      const choice = getSelection();
      if (!choice?.reliable || !result) {
        message("");
        return;
      }
      if (
        result.status !== "passing" &&
        lastMessage.includes("passando próximo")
      )
        message("");
      if (result.status === "passing")
        message(result.vehicle + " passando próximo ao endereço escolhido");
      else if (
        alerts.check(result, prefs.minutes, JSON.stringify(choice.point))
      ) {
        const text =
          result.vehicle +
          " chega em até " +
          Math.max(1, Math.ceil(result.wallSeconds / 60)) +
          " min no ritmo atual.";
        message(text);
        feedback.textContent = text;
        alertFeedback = text;
      } else if (result.status !== "arriving") message("");
    },
  };
}
