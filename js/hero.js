const $ = (selector) => document.querySelector(selector);
export function setupHero() {
  const world = $(".hero-world"),
    still = $(".hero-still"),
    controls = $(".journey-controls"),
    tools = $(".vehicle-tools");
  const host = document.createElement("div");
  host.className = "hero-canvas";
  world.append(host);
  let film,
    paused = false,
    done = false,
    exploring = false,
    panel = false,
    version = 0,
    timer;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  function reveal() {
    $(".hero").dataset.revealed = "true";
  }
  function display() {
    world.dataset.exploring = exploring;
    controls.hidden = !film;
    tools.hidden = !film || !done;
    $("[data-skip]").hidden = done;
    $("[data-explore]").hidden = !done;
    $("[data-play]").textContent = done
      ? "Reiniciar apresentação"
      : paused
        ? "Continuar percurso"
        : "Pausar percurso";
    $("[data-explore]").textContent = exploring
      ? "Sair da exploração"
      : "Explorar em 3D";
    $("[data-explore]").setAttribute("aria-pressed", exploring);
    $(".orbit-tip").hidden = !exploring || panel;
    $(".vehicle-panel").hidden = !panel;
    $(".vehicle-tag").hidden = panel;
  }
  function fallback() {
    clearTimeout(timer);
    film?.dispose();
    film = null;
    still.hidden = false;
    still.classList.add("final-still");
    reveal();
    display();
  }
  async function start() {
    const token = ++version;
    fallback();
    if (motion.matches) return;
    $(".hero").dataset.revealed = "false";
    still.classList.remove("final-still");
    paused = done = exploring = panel = false;
    timer = setTimeout(() => {
      version++;
      fallback();
    }, 7500);
    try {
      const { startFilm } = await import("./scene/film.js");
      if (token !== version) return;
      film = startFilm(host, {
        onFrame() {
          clearTimeout(timer);
          still.hidden = true;
        },
        onReveal: reveal,
        onFail: fallback,
        onFinish() {
          done = true;
          reveal();
          film.explore(false);
          display();
        },
        onPick() {
          panel = true;
          display();
        },
      });
      display();
    } catch {
      fallback();
    }
  }
  $("[data-play]").onclick = () => {
    if (done) {
      done = paused = panel = exploring = false;
      $(".hero").dataset.revealed = "false";
      film.replay();
    } else {
      paused = !paused;
      film.pause(paused);
    }
    display();
  };
  $("[data-skip]").onclick = () => film.skip();
  $("[data-explore]").onclick = () => {
    exploring = !exploring;
    panel = false;
    film.explore(exploring);
    display();
  };
  $(".vehicle-tag").onclick = () => {
    panel = true;
    display();
  };
  $(".dismiss").onclick = () => {
    panel = false;
    display();
  };
  $(".vehicle-panel a").onclick = () => {
    panel = exploring = false;
    film.explore(false);
    display();
  };
  $(".hero-copy").addEventListener("focusin", reveal);
  motion.addEventListener("change", start);
  start();
}
