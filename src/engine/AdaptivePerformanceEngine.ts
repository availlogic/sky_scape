export type PerformanceStateLevel = 0 | 1 | 2 | 3;

export interface PerformanceState {
  level: PerformanceStateLevel;
  renderRadius: number; // chunk radius
  renderScale: number; // viewport multiplier (0.5 to 1.0)
  enableShadows: boolean;
  foliageScale: number; // foliage density factor (0.0 to 1.0)
  waterComplexity: 'high' | 'medium' | 'low' | 'flat';
}

export const PERFORMANCE_STATES: Record<PerformanceStateLevel, PerformanceState> = {
  0: {
    level: 0,
    renderRadius: 4, // 8x8 chunks total
    renderScale: 1.0,
    enableShadows: true,
    foliageScale: 1.0,
    waterComplexity: 'high',
  },
  1: {
    level: 1,
    renderRadius: 3, // 6x6 chunks total
    renderScale: 1.0,
    enableShadows: true, // low-res shadows managed in renderer
    foliageScale: 0.5,
    waterComplexity: 'medium',
  },
  2: {
    level: 2,
    renderRadius: 2, // 4x4 chunks total
    renderScale: 0.75,
    enableShadows: false,
    foliageScale: 0.2,
    waterComplexity: 'low',
  },
  3: {
    level: 3,
    renderRadius: 1, // 3x3 chunks total (or 2x2 on mobile)
    renderScale: 0.5,
    enableShadows: false,
    foliageScale: 0.0,
    waterComplexity: 'flat',
  },
};

export class AdaptivePerformanceEngine {
  public currentState: PerformanceState;

  private frameTimes: number[] = [];
  private onStateChangeCallbacks: Array<(state: PerformanceState) => void> = [];

  // Timer markers
  private lowFpsStart: number | null = null;
  private highFpsStart: number | null = null;

  // Window constants
  private readonly windowDuration = 1000; // ms (1s rolling window)
  private isMobile = false;

  constructor(isMobile = false) {
    this.isMobile = isMobile;

    // Initialise at State 0 (High)
    this.currentState = { ...PERFORMANCE_STATES[0] };

    // Mobile starts with smaller default radius if needed
    if (this.isMobile) {
      this.currentState.renderRadius = 2; // default 4x4 for mobile
    }
  }

  public recordFrame(frameTimeMs: number): void {
    const now = performance.now();
    this.frameTimes.push(frameTimeMs);

    // Cull old frames from window
    let totalWindowTime = 0;
    let keepIndex = this.frameTimes.length - 1;
    while (keepIndex >= 0) {
      totalWindowTime += this.frameTimes[keepIndex];
      if (totalWindowTime > this.windowDuration) {
        break;
      }
      keepIndex--;
    }
    if (keepIndex > 0) {
      this.frameTimes.splice(0, keepIndex);
    }

    // Compute average FPS
    const count = this.frameTimes.length;
    const windowSumMs = this.frameTimes.reduce((a, b) => a + b, 0);
    const avgFps = windowSumMs > 0 ? (count * 1000) / windowSumMs : 60;

    this.updateStateMachine(avgFps, now);
  }

  public onStateChange(callback: (state: PerformanceState) => void): void {
    this.onStateChangeCallbacks.push(callback);
  }

  private updateStateMachine(fps: number, now: number): void {
    const level = this.currentState.level;

    // 1. Check for Downgrade thresholds (FPS < 55)
    if (fps < 55) {
      this.highFpsStart = null; // Reset recovery timer

      if (this.lowFpsStart === null) {
        this.lowFpsStart = now;
      } else if (now - this.lowFpsStart >= 3000) {
        // 3 seconds threshold
        // Determine target level based on severity
        let targetLevel = level;
        if (fps < 45 && level < 3) {
          targetLevel = 3;
        } else if (fps < 50 && level < 2) {
          targetLevel = 2;
        } else if (level < 3) {
          targetLevel = (level + 1) as PerformanceStateLevel;
        }

        if (targetLevel !== level) {
          this.changeState(targetLevel);
        }
        this.lowFpsStart = null; // Reset timer
      }
    }
    // 2. Check for Upgrade thresholds (FPS > 58)
    else if (fps > 58) {
      this.lowFpsStart = null; // Reset degradation timer

      if (level > 0) {
        if (this.highFpsStart === null) {
          this.highFpsStart = now;
        } else if (now - this.highFpsStart >= 10000) {
          // 10 seconds recovery
          this.changeState((level - 1) as PerformanceStateLevel);
          this.highFpsStart = null; // Reset timer
        }
      } else {
        this.highFpsStart = null;
      }
    }
    // 3. Steady state (between 55 and 58)
    else {
      this.lowFpsStart = null;
      this.highFpsStart = null;
    }
  }

  private changeState(newLevel: PerformanceStateLevel): void {
    const baseState = PERFORMANCE_STATES[newLevel];
    this.currentState = { ...baseState };

    // Mobile adjustments
    if (this.isMobile) {
      if (newLevel === 0)
        this.currentState.renderRadius = 2; // 4x4
      else if (newLevel === 1)
        this.currentState.renderRadius = 2; // 3x3 or 4x4
      else if (newLevel === 2)
        this.currentState.renderRadius = 2; // 3x3
      else this.currentState.renderRadius = 1; // 2x2
    }

    // Trigger listeners
    this.onStateChangeCallbacks.forEach((cb) => cb(this.currentState));
  }
}
export default AdaptivePerformanceEngine;
