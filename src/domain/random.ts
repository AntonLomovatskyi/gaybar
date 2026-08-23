/**
 * Deterministic randomness for the "random cocktail" walk.
 *
 * The pick has to survive re-renders and be reproducible on another screen (the home card and
 * the recipe page walk the same sequence), so nothing here calls Math.random: a seed fixes the
 * order. Walking a *shuffled* pool rather than stepping `seed + n` through the sorted list means
 * consecutive picks are unrelated drinks, and a full lap shows every drink exactly once.
 */

/** mulberry32 — small, fast, well-distributed seeded PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates driven by a seeded PRNG. Pure — the input is not modified. */
export function shuffleSeeded<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const rnd = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Days since the epoch — the seed that keeps the cocktail of the day stable for a day. */
export function dailySeed(now: number): number {
  return Math.floor(now / 86_400_000);
}

/**
 * The `step`-th item of an already-shuffled order. Steps wrap both ways, so ‹ › can walk
 * forever and a negative step is just as valid as a positive one.
 */
export function pickAtStep<T>(order: readonly T[], step: number): T | null {
  if (!order.length) return null;
  const n = order.length;
  return order[((Math.trunc(step) % n) + n) % n];
}
