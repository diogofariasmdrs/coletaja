import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
export const transition = { progress: 0 };
export function setupMapTransition() {
  gsap.registerPlugin(ScrollTrigger);
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
    const trigger = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => {
        transition.progress = self.progress;
        hero.style.setProperty("--departure", String(self.progress));
        hero.dispatchEvent(new Event("maptransition"));
      },
    });
    return () => {
      trigger.kill();
      transition.progress = 0;
      hero.style.removeProperty("--departure");
      hero.dispatchEvent(new Event("maptransition"));
    };
  });
  return () => media.revert();
}
