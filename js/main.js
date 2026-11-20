import "../css/style.css";
import { setupHero } from "./hero.js";
import { setupMapTransition } from "./mapTransition.js";
import { setupDesktopScroll } from "./desktopScroll.js";

import { setupSections } from "./sections.js";
import "../css/sections.css";

setupSections();
setupDesktopScroll();
setupMapTransition();
const loadTracking = new IntersectionObserver(
  async (entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    loadTracking.disconnect();
    try {
      const { setupTracking } = await import("./maps/tracking.js");
      setupTracking();
    } catch {
      document.querySelector(".map-message strong").textContent =
        "Não foi possível carregar a plataforma";
      document.querySelector(".map-message p").textContent =
        "Confira a conexão e recarregue a página.";
    }
  },
  { rootMargin: "500px" },
);
loadTracking.observe(document.querySelector("#plataforma"));
loadTracking.observe(document.querySelector("#percurso"));
setupHero();
for (const button of document.querySelectorAll(
  ".nav-demo,.hero-copy .primary",
)) {
  button.onclick = () => document.querySelector("#plataforma").scrollIntoView();
}
const inspection = document.querySelector(".truck-stage");
const loadInspection = new IntersectionObserver(
  async ([entry]) => {
    if (!entry.isIntersecting) return;
    loadInspection.disconnect();
    try {
      const { mountTurntable } = await import("./scene/turntable.js");
      mountTurntable(inspection);
    } catch {
      inspection.classList.remove("is-live");
    }
  },
  { rootMargin: "150px" },
);
loadInspection.observe(inspection);
const mobileMenu = document.querySelector(".mobile-menu");
mobileMenu.addEventListener("click", (event) => {
  if (event.target.closest("a")) mobileMenu.open = false;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileMenu.open) {
    mobileMenu.open = false;
    mobileMenu.querySelector("summary").focus();
  }
});

import "./install.js";
