const CLOSE_MS = 90;
const HOLD_MS = 35;
const OPEN_MS = 165;
const DURATION = CLOSE_MS + HOLD_MS + OPEN_MS;
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Fast closure, a brief closed pause, then a slower, smooth reopening. */
export function blinkAmount(elapsed: number) {
  if (elapsed < 0 || elapsed >= DURATION) return 0;
  if (elapsed < CLOSE_MS) return smooth(elapsed / CLOSE_MS);
  if (elapsed < CLOSE_MS + HOLD_MS) return 1;
  return 1 - smooth((elapsed - CLOSE_MS - HOLD_MS) / OPEN_MS);
}

export function createBlinkController(random = Math.random) {
  let start = -Infinity, next = Infinity, second = false;
  const reset = (now: number) => {
    start = -Infinity; second = false;
    next = now + 2400 + random() * 3800;
  };
  return {
    reset,
    trigger(now: number) { start = now; next = now + DURATION + 2400 + random() * 3800; second = false; },
    sample(now: number) {
      if (next === Infinity) reset(now);
      if (now >= next) {
        start = now;
        if (!second && random() < .16) { next = now + DURATION + 140; second = true; }
        else { next = now + DURATION + 2400 + random() * 3800; second = false; }
      }
      return blinkAmount(now - start);
    },
  };
}
