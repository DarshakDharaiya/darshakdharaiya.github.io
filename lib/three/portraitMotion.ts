/** Exact underdamped spring step; consistent at both 30 Hz and 120 Hz. */
export function stepPortraitSpring(
  value: number,
  velocity: number,
  target: number,
  delta: number,
): [number, number] {
  const frequency = 13;
  const damping = 0.82;
  const decayRate = damping * frequency;
  const dampedFrequency = frequency * Math.sqrt(1 - damping * damping);
  const displacement = value - target;
  const decay = Math.exp(-decayRate * delta);
  const sine = Math.sin(dampedFrequency * delta);
  const cosine = Math.cos(dampedFrequency * delta);
  const nextDisplacement = decay * (
    displacement * cosine + (velocity + decayRate * displacement) / dampedFrequency * sine
  );
  const nextVelocity = decay * (
    velocity * cosine - (decayRate * velocity + frequency * frequency * displacement) / dampedFrequency * sine
  );
  return [target + nextDisplacement, nextVelocity];
}

/** Fast closing lids, a short hold, then a gentler reopening. */
export function portraitBlink(elapsed: number): number {
  if (elapsed < 0 || elapsed >= 0.27) return 0;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  if (elapsed < 0.09) return smooth(elapsed / 0.09);
  if (elapsed < 0.12) return 1;
  return 1 - smooth((elapsed - 0.12) / 0.15);
}
