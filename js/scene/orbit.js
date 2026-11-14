import { MathUtils } from "three";
export function bindOrbit(canvas, exploring, active, invalidate, state) {
  state.yaw = 0;
  state.pitch = 0;
  state.dragged = false;
  invalidate();
  if (!active) return () => {};
  let pointer = null,
    startX = 0,
    startY = 0,
    baseYaw = 0,
    basePitch = 0;
  const down = (e) => {
    state.dragged = false;
    if (!exploring || !e.isPrimary) return;
    pointer = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    baseYaw = state.yaw;
    basePitch = state.pitch;
    canvas.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (pointer === e.pointerId) {
      const dx = e.clientX - startX,
        dy = e.clientY - startY;
      state.dragged ||= Math.abs(dx) + Math.abs(dy) > 5;
      state.yaw = MathUtils.clamp(baseYaw - dx * 0.003, -0.48, 0.48);
      state.pitch = MathUtils.clamp(basePitch + dy * 0.0014, -0.09, 0.16);
    } else if (!exploring && e.pointerType === "mouse") {
      const r = canvas.getBoundingClientRect();
      state.yaw = ((e.clientX - r.left) / r.width - 0.5) * 0.055;
      state.pitch = ((e.clientY - r.top) / r.height - 0.5) * 0.022;
    } else return;
    invalidate();
  };
  const end = () => {
    pointer = null;
  };
  const leave = () => {
    if (!exploring) {
      state.yaw = 0;
      state.pitch = 0;
      invalidate();
    }
  };
  const key = (e) => {
    if (!exploring) return;
    const sign = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    if (sign) {
      e.preventDefault();
      state.yaw = MathUtils.clamp(state.yaw + sign * 0.09, -0.48, 0.48);
      invalidate();
    }
  };
  canvas.setAttribute("tabindex", exploring ? "0" : "-1");
  canvas.setAttribute(
    "aria-label",
    "Vista do compactador. Use as setas esquerda e direita para girar.",
  );
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("keydown", key);
  if (exploring) canvas.focus({ preventScroll: true });
  return () => {
    canvas.setAttribute("tabindex", "-1");
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", end);
    canvas.removeEventListener("pointercancel", end);
    canvas.removeEventListener("pointerleave", leave);
    canvas.removeEventListener("keydown", key);
  };
}
