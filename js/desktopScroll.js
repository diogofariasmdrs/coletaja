import gsap from "gsap";
import Lenis from "lenis";
// Only schedule scrolling frames while a desktop wheel gesture is settling.
export function setupDesktopScroll() {
  const mq = matchMedia(
    "(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)",
  );
  let cleanup = () => {};
  function sync() {
    cleanup();
    cleanup = () => {};
    if (!mq.matches) return;
    const scroll = new Lenis({
      autoRaf: false,
      lerp: 0.17,
      syncTouch: false,
      prevent: (node) => !!node.closest("#plataforma,dialog"),
    });
    const tick = (seconds) => {
      scroll.raf(seconds * 1000);
      if (scroll.isScrolling !== "smooth") gsap.ticker.remove(tick);
    };
    scroll.on("virtual-scroll", () => gsap.ticker.add(tick));
    cleanup = () => {
      gsap.ticker.remove(tick);
      scroll.destroy();
    };
  }
  sync();
  mq.addEventListener("change", sync);
  return () => {
    cleanup();
    mq.removeEventListener("change", sync);
  };
}
