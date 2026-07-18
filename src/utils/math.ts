/**
 * Clamp a number to a range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Inverse linear interpolation.
 */
export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return clamp((value - a) / (b - a), 0, 1);
}

/**
 * Hermite smoothstep.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

/**
 * Remap value from one range to another.
 */
export function remap(
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  value: number,
): number {
  const t = inverseLerp(inMin, inMax, value);
  return lerp(outMin, outMax, t);
}

/**
 * Exponential stick input curve.
 * Output = Input × (1 - ExpoFactor) + Input³ × ExpoFactor
 */
export function expo(input: number, factor: number): number {
  const clampedInput = clamp(input, -1.0, 1.0);
  const clampedFactor = clamp(factor, 0.0, 1.0);
  return clampedInput * (1 - clampedFactor) + Math.pow(clampedInput, 3) * clampedFactor;
}

/**
 * Deterministic PRNG for chunk coordinates.
 */
export function chunkRandom(cx: number, cz: number, seed: number): number {
  const x = Math.sin(cx * 12.9898 + cz * 78.233 + seed) * 43758.5453;
  return x - Math.floor(x);
}
