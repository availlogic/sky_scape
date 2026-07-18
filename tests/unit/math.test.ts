import { describe, test, expect } from 'vitest';
import {
  clamp,
  lerp,
  inverseLerp,
  smoothstep,
  remap,
  expo,
  chunkRandom,
} from '../../src/utils/math';

describe('Math Utilities', () => {
  test('clamp clamps values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  test('lerp interpolates correctly', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
  });

  test('inverseLerp calculates t value', () => {
    expect(inverseLerp(0, 10, 5)).toBe(0.5);
    expect(inverseLerp(10, 20, 10)).toBe(0);
    expect(inverseLerp(10, 20, 20)).toBe(1);
    expect(inverseLerp(10, 10, 5)).toBe(0); // handle a === b
  });

  test('smoothstep curves output', () => {
    expect(smoothstep(0, 10, 0)).toBe(0);
    expect(smoothstep(0, 10, 10)).toBe(1);
    expect(smoothstep(0, 10, 5)).toBe(0.5);
    expect(smoothstep(0, 10, 2.5)).toBeLessThan(0.5); // non-linear
  });

  test('remap maps between ranges', () => {
    expect(remap(0, 10, 10, 20, 5)).toBe(15);
    expect(remap(0, 10, 0, 100, 2.5)).toBe(25);
  });

  test('expo applies curve', () => {
    // factor = 0 should be linear
    expect(expo(0.5, 0)).toBeCloseTo(0.5);
    expect(expo(-0.5, 0)).toBeCloseTo(-0.5);

    // factor = 1 should be cubic
    expect(expo(0.5, 1)).toBeCloseTo(0.125); // 0.5^3 = 0.125
    expect(expo(-0.5, 1)).toBeCloseTo(-0.125);

    // intermediate factor
    expect(expo(0.5, 0.4)).toBeCloseTo(0.5 * 0.6 + 0.125 * 0.4); // 0.3 + 0.05 = 0.35
  });

  test('chunkRandom is deterministic and returns value in [0, 1)', () => {
    const val1 = chunkRandom(1, 2, 42);
    const val2 = chunkRandom(1, 2, 42);
    const val3 = chunkRandom(2, 1, 42);

    expect(val1).toBe(val2);
    expect(val1).not.toBe(val3);
    expect(val1).toBeGreaterThanOrEqual(0);
    expect(val1).toBeLessThan(1);
  });
});
