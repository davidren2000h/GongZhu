// Seeded pseudo-random number generator (mulberry32)
// Provides deterministic randomness for testing

/**
 * Creates a seeded PRNG using the mulberry32 algorithm.
 * @param {number} seed - The seed value
 * @returns {{ next: () => number, nextInt: (min: number, max: number) => number }}
 */
export function createSeededRng(seed) {
  let state = seed | 0;

  function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min, max) {
    return min + Math.floor(next() * (max - min + 1));
  }

  return { next, nextInt };
}

/**
 * Default RNG that uses Math.random() — used in production.
 */
export function createDefaultRng() {
  return {
    next: () => Math.random(),
    nextInt: (min, max) => min + Math.floor(Math.random() * (max - min + 1)),
  };
}

/**
 * Check if TEST MODE is active via env var or query string.
 */
export function isTestMode() {
  // Check Vite env var
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TEST_MODE === '1') {
    return true;
  }
  // Check query string (browser only)
  if (typeof window !== 'undefined' && window.location) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('test') === '1') return true;
  }
  return false;
}

/** Fixed seed used in TEST MODE */
export const TEST_SEED = 42;

/** Fixed AI names used in TEST MODE */
export const TEST_AI_NAMES = ['AI_1', 'AI_2', 'AI_3'];

/**
 * Get the appropriate RNG for current mode.
 * @param {number|null} seed - Optional explicit seed. If null, uses TEST_SEED in test mode or default RNG.
 * @returns {{ next: () => number, nextInt: (min: number, max: number) => number }}
 */
export function getRng(seed = null) {
  if (seed !== null) {
    return createSeededRng(seed);
  }
  if (isTestMode()) {
    return createSeededRng(TEST_SEED);
  }
  return createDefaultRng();
}
