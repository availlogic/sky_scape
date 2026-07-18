import { describe, test, expect } from 'vitest';
import { simplex2D, fbm, domainWarp, getTerrainHeight } from '../../src/terrain/noise';
import type { NoiseConfig } from '../../src/biomes/types';

describe('Procedural Noise Utilities', () => {
  const mockConfig: NoiseConfig = {
    frequency: 0.008,
    octaves: 6,
    persistence: 0.5,
    lacunarity: 2.0,
    domainWarpAmplitude: 30.0,
  };

  test('simplex2D is deterministic and returns range [-1, 1]', () => {
    const val1 = simplex2D(12.34, 56.78);
    const val2 = simplex2D(12.34, 56.78);
    const val3 = simplex2D(12.35, 56.78);

    expect(val1).toBe(val2);
    expect(val1).not.toBe(val3);

    // Test a grid of values
    for (let x = -10; x <= 10; x++) {
      for (let y = -10; y <= 10; y++) {
        const val = simplex2D(x * 0.1, y * 0.1);
        expect(val).toBeGreaterThanOrEqual(-1.0);
        expect(val).toBeLessThanOrEqual(1.0);
      }
    }
  });

  test('fbm accumulates multiple octaves', () => {
    const config1 = { ...mockConfig, octaves: 1 };
    const config6 = { ...mockConfig, octaves: 6 };

    const val1 = fbm(1.0, 2.0, config1);
    const val6 = fbm(1.0, 2.0, config6);

    // Different octave counts produce different values
    expect(val1).not.toBe(val6);
    expect(val6).toBeGreaterThanOrEqual(-1.0);
    expect(val6).toBeLessThanOrEqual(1.0);
  });

  test('domainWarp offsets coordinates', () => {
    const p1 = { x: 10.0, y: 20.0 };
    const warped = domainWarp(p1.x, p1.y, 30.0);

    expect(warped.x).not.toBe(p1.x);
    expect(warped.y).not.toBe(p1.y);

    // Zero amplitude means no warping
    const unwarped = domainWarp(p1.x, p1.y, 0.0);
    expect(unwarped.x).toBeCloseTo(p1.x);
    expect(unwarped.y).toBeCloseTo(p1.y);
  });

  test('getTerrainHeight returns height within valid range', () => {
    const h1 = getTerrainHeight(0, 0, mockConfig, 200);
    const h2 = getTerrainHeight(1000, 2000, mockConfig, 200);

    expect(h1).toBeGreaterThanOrEqual(0.0);
    expect(h2).toBeGreaterThanOrEqual(0.0);

    // Ensure it doesn't exceed reasonable limits
    expect(h1).toBeLessThan(400); // Should be roughly within [0, 200]
  });

  test('simplex2D matches polynomial GPU-like values exactly', () => {
    expect(simplex2D(0.0, 0.0)).toBeCloseTo(0.0, 5);
    expect(simplex2D(0.123, -0.456)).toBeCloseTo(-0.74325456, 5);
    expect(simplex2D(5.67, 8.91)).toBeCloseTo(0.24220752, 5);
  });
});
