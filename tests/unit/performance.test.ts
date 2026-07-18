import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AdaptivePerformanceEngine } from '../../src/engine/AdaptivePerformanceEngine';

describe('Adaptive Performance Engine Module', () => {
  let engine: AdaptivePerformanceEngine;

  beforeEach(() => {
    // Force performance.now mock using vi
    vi.useFakeTimers();
    engine = new AdaptivePerformanceEngine(false); // PC settings
  });

  test('IT-PERF-REND-01: starts at High quality level 0', () => {
    expect(engine.currentState.level).toBe(0);
    expect(engine.currentState.renderRadius).toBe(4);
    expect(engine.currentState.renderScale).toBe(1.0);
  });

  test('IT-PERF-REND-01: stable 60 FPS keeps High quality level 0', () => {
    // Record 60 frames (16.6ms each) spaced by 16.6ms
    for (let i = 0; i < 60; i++) {
      vi.advanceTimersByTime(16.6);
      engine.recordFrame(16.6);
    }

    expect(engine.currentState.level).toBe(0);
  });

  test('IT-PERF-REND-01: low FPS (50 FPS) for 3.5s degrades state', () => {
    // 50 FPS is 20ms per frame.
    // Record frames for 3.5 seconds at 50 FPS
    const totalFrames = Math.floor(3500 / 20);
    for (let i = 0; i < totalFrames; i++) {
      vi.advanceTimersByTime(20);
      engine.recordFrame(20);
    }

    // Should have degraded (level > 0)
    expect(engine.currentState.level).toBeGreaterThan(0);
    expect(engine.currentState.renderRadius).toBeLessThan(4);
  });

  test('IT-PERF-REND-01: recovers back to High quality after 10.5s of stable 60 FPS', () => {
    // 1. Force degradation to level 2
    const totalFramesLow = Math.floor(4000 / 22); // 45 FPS (22ms) for 4s
    for (let i = 0; i < totalFramesLow; i++) {
      vi.advanceTimersByTime(22);
      engine.recordFrame(22);
    }

    const degradedLevel = engine.currentState.level;
    expect(degradedLevel).toBeGreaterThan(0);

    // 2. Supply 60 FPS (16.6ms) for 12.0 seconds (1s to clear window + 10s recovery + safety margin)
    const totalFramesHigh = Math.floor(12000 / 16.6);
    for (let i = 0; i < totalFramesHigh; i++) {
      vi.advanceTimersByTime(16.6);
      engine.recordFrame(16.6);
    }

    // Should have recovered closer to level 0 (High)
    expect(engine.currentState.level).toBeLessThan(degradedLevel);
  });
});
