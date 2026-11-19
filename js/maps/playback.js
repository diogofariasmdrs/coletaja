import { snapshot, change, setupPlaybackLifecycle } from "./store.js";
import { resetPlayback, log } from "./simulation.js";

export function setupPlayback() {
  const hosts = [...document.querySelectorAll("[data-playback]")];
  const notify = () => window.dispatchEvent(new Event("coleta-playback"));
  for (const host of hosts) {
    host.innerHTML =
      '<div class="playback-status"><span></span><small>Escolha o endereço antes de iniciar.</small></div><div class="playback-actions"><button type="button" data-toggle-playback>Iniciar simulação</button><button type="button" data-reset-playback>Recomeçar</button><label>Ritmo<select aria-label="Velocidade da demonstração"><option value="0.5">Lento · 0,5×</option><option value="1">Normal · 1×</option><option value="2">Rápido · 2×</option><option value="4">4×</option></select></label></div>';
    host.querySelector("[data-toggle-playback]").onclick = () => {
      change((s) => {
        s.anchor = s.anchor === null ? Date.now() : null;
        log(
          s,
          s.anchor === null ? "Demonstração pausada" : "Demonstração iniciada",
        );
      });
      notify();
    };
    host.querySelector("[data-reset-playback]").onclick = () => {
      if (
        !confirm(
          "Recomeçar os percursos e limpar as ocorrências? Os veículos e rotas cadastrados serão mantidos.",
        )
      )
        return;
      change(resetPlayback);
      notify();
    };
    host.querySelector("select").onchange = (e) => {
      change((s) => {
        s.speed = Number(e.target.value);
      });
      notify();
    };
  }
  function update() {
    const s = snapshot();
    const assigned = s.vehicles.filter((v) => v.active && v.route);
    const complete =
      assigned.length > 0 &&
      assigned.every((v) => s.runs[v.route].end !== null);
    const started = Object.values(s.runs).some((run) => run.seconds > 0);
    for (const host of hosts) {
      host.querySelector("select").value = String(s.speed);
      const button = host.querySelector("[data-toggle-playback]");
      button.disabled = !assigned.length || complete;
      button.textContent =
        s.anchor !== null
          ? "Pausar simulação"
          : started && s.elapsed > 0
            ? "Continuar simulação"
            : "Iniciar simulação";
      host.querySelector(".playback-status > span").textContent = complete
        ? "Circuitos concluídos"
        : !assigned.length
          ? "Sem veículos atribuídos"
          : s.anchor !== null
            ? "Simulação em andamento"
            : started
              ? "Simulação pausada"
              : "Pronto para começar";
      host.querySelector("small").textContent = complete
        ? "Use Recomeçar para uma nova apresentação."
        : s.anchor !== null
          ? "Ao sair desta aba, a reprodução pausa."
          : "Escolha o endereço antes de iniciar.";
    }
  }
  setupPlaybackLifecycle();
  update();
  return { update };
}
