import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { CalibrationWizard } from '../../src/controls/CalibrationWizard';

describe('Calibration Wizard Integration', () => {
  let wizard: CalibrationWizard;
  const mockGamepad = {
    index: 0,
    axes: [0.0, 0.0, 0.0, 0.0],
  };

  beforeAll(() => {
    vi.stubGlobal('navigator', {
      getGamepads: () => [mockGamepad],
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    // Setup dummy indicator elements in mock DOM
    document.body.innerHTML = `
      <div id="cal-throttle-bar" style="width: 0%;"></div>
      <div id="cal-yaw-bar" style="width: 0%;"></div>
      <div id="cal-pitch-bar" style="width: 0%;"></div>
      <div id="cal-roll-bar" style="width: 0%;"></div>
    `;

    vi.useFakeTimers();
    wizard = new CalibrationWizard(0);
  });

  afterEach(() => {
    wizard.cancel();
  });

  test('walks through 5 steps sequentially', () => {
    const steps: string[] = [];

    // 1. Start wizard
    wizard.start((step) => steps.push(step));
    expect(wizard.getStep()).toBe('throttle_max');

    // 2. Advance to Yaw
    wizard.next((step) => steps.push(step));
    expect(wizard.getStep()).toBe('yaw_left');

    // 3. Advance to Pitch
    wizard.next((step) => steps.push(step));
    expect(wizard.getStep()).toBe('pitch_up');

    // 4. Advance to Roll
    wizard.next((step) => steps.push(step));
    expect(wizard.getStep()).toBe('roll_right');

    // 5. Complete
    wizard.next((step) => steps.push(step));
    expect(wizard.getStep()).toBe('complete');

    expect(steps).toEqual(['throttle_max', 'yaw_left', 'pitch_up', 'roll_right', 'complete']);
  });

  test('isolates active axis on stick deflection', () => {
    wizard.start(() => {});

    // Deflect Axis 3 to +0.9 (this should become throttle)
    mockGamepad.axes = [0.0, 0.0, 0.0, 0.9];
    vi.advanceTimersByTime(150);

    // Verify throttle bar updated to 90%
    const bar = document.getElementById('cal-throttle-bar');
    expect(bar?.style.width).toBe('90%');

    // Advance to next step (yaw)
    wizard.next(() => {});

    // Deflect Axis 0 to -0.8 (this should become yaw)
    mockGamepad.axes = [-0.8, 0.0, 0.0, 0.0];
    vi.advanceTimersByTime(150);

    const yawBar = document.getElementById('cal-yaw-bar');
    expect(yawBar?.style.width).toBe('80%');
  });

  test('toggles inversion and saves correctly', () => {
    wizard.toggleInversion('yaw', true);
    wizard.toggleInversion('throttle', true);

    const saved = wizard.save();
    expect(saved).toBe(true);

    const calibration = localStorage.getItem('skyscape_controller_mappings');
    expect(calibration).not.toBeNull();
    const parsed = JSON.parse(calibration!);
    expect(parsed.inverted.yaw).toBe(true);
    expect(parsed.inverted.throttle).toBe(true);
    expect(parsed.inverted.pitch).toBe(false);
  });
});
