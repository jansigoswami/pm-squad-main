import confetti from 'canvas-confetti';

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B'];

/**
 * Small celebratory burst, optionally originating from a screen element.
 */
export function burstAt(el) {
  let origin = { x: 0.5, y: 0.5 };
  if (el && el.getBoundingClientRect) {
    const r = el.getBoundingClientRect();
    origin = {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height / 2) / window.innerHeight,
    };
  }
  confetti({
    particleCount: 30,
    spread: 60,
    origin,
    colors: COLORS,
    disableForReducedMotion: true,
  });
}
