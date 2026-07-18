import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { GamepadInput } from '../../src/controls/GamepadInput';
import type { GamepadCalibration } from '../../src/controls/types';

describe('Gamepad Input Module', () => {
  let gamepadInput: GamepadInput;

  const mockCalibration: GamepadCalibration = {
    yawAxis: 0,
    pitchAxis: 1,
    rollAxis: 2,
    throttleAxis: 3,
    inverted: { yaw: false, pitch: true, roll: false, throttle: false },
  };

  const mockGamepad = {
    index: 0,
    axes: [0.1, -0.6, 0.4, 0.0], // yaw=0.1, pitch=-0.6, roll=0.4, throttle=0.0
    buttons: [],
  };

  beforeAll(() => {
    // Mock navigator.getGamepads globally
    vi.stubGlobal('navigator', {
      getGamepads: () => [mockGamepad],
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    gamepadInput = new GamepadInput(mockCalibration);
    gamepadInput.init();
  });

  afterEach(() => {
    gamepadInput.destroy();
  });

  test('isGamepadConnected is true when device connects', () => {
    // Triggers connect on init since mock returns gamepad
    expect(gamepadInput.isGamepadConnected()).toBe(true);
  });

  test('polls axis values according to calibration mappings', () => {
    const inputs = gamepadInput.poll();

    // yaw: axes[0] = 0.1, no invert
    expect(inputs.yaw).toBeCloseTo(0.1);

    // pitch: axes[1] = -0.6, inverted = true -> should become 0.6
    expect(inputs.pitch).toBeCloseTo(0.6);

    // roll: axes[2] = 0.4, no invert
    expect(inputs.roll).toBeCloseTo(0.4);

    // throttle: axes[3] = 0.0 -> converted from [-1, 1] to [0, 1]
    // 0.0 is center, so (0.0 + 1.0)/2.0 = 0.5
    expect(inputs.throttle).toBeCloseTo(0.5);
  });

  test('applies deadzone filter to low axis values', () => {
    // Modify mock axes to be below 0.05
    mockGamepad.axes = [0.03, -0.04, 0.01, -1.0]; // throttle at min

    const inputs = gamepadInput.poll();
    expect(inputs.yaw).toBe(0.0);
    expect(inputs.pitch).toBe(0.0);
    expect(inputs.roll).toBe(0.0);
    expect(inputs.throttle).toBe(0.0); // -1.0 -> 0.0
  });
});
