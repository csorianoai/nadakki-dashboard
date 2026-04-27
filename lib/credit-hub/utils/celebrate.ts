"use client";

import confetti from "canvas-confetti";

export function celebrateSuccessRespectReduced() {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const duration = 2000;
  const end = Date.now() + duration;
  const colors = ["#FF6B35", "#FFB627", "#00C896"];

  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0.5, y: 0.6 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 0.5, y: 0.6 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();
}
