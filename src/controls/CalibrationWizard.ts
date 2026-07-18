import type { GamepadCalibration, CalibrationStep } from './types';
import { StorageManager } from '../storage/StorageManager';

export class CalibrationWizard {
  private step: CalibrationStep = 'idle';
  private gamepadIndex: number;
  private storage: StorageManager;

  // Calibrated axis indexes
  private throttleAxis = -1;
  private yawAxis = -1;
  private pitchAxis = -1;
  private rollAxis = -1;

  // Inversion flags
  private inverted = {
    yaw: false,
    pitch: false,
    roll: false,
    throttle: false,
  };

  private activeIntervalId: any = null;

  constructor(gamepadIndex: number) {
    this.gamepadIndex = gamepadIndex;
    this.storage = new StorageManager();
  }

  public getStep(): CalibrationStep {
    return this.step;
  }

  public start(onStepChange: (step: CalibrationStep) => void): void {
    this.step = 'throttle_max';
    onStepChange(this.step);

    // Start polling axes deflection in background
    this.activeIntervalId = setInterval(() => {
      this.pollAxes(onStepChange);
    }, 100);
  }

  public next(onStepChange: (step: CalibrationStep) => void): void {
    if (this.step === 'throttle_max') {
      this.step = 'yaw_left';
    } else if (this.step === 'yaw_left') {
      this.step = 'pitch_up';
    } else if (this.step === 'pitch_up') {
      this.step = 'roll_right';
    } else if (this.step === 'roll_right') {
      this.step = 'complete';
      clearInterval(this.activeIntervalId);
    }
    onStepChange(this.step);
  }

  public save(): boolean {
    const calibration: GamepadCalibration = {
      yawAxis: this.yawAxis !== -1 ? this.yawAxis : 0,
      pitchAxis: this.pitchAxis !== -1 ? this.pitchAxis : 1,
      rollAxis: this.rollAxis !== -1 ? this.rollAxis : 2,
      throttleAxis: this.throttleAxis !== -1 ? this.throttleAxis : 3,
      inverted: { ...this.inverted },
    };

    return this.storage.saveGamepadCalibration(calibration);
  }

  public cancel(): void {
    clearInterval(this.activeIntervalId);
    this.step = 'idle';
  }

  public toggleInversion(axis: 'yaw' | 'pitch' | 'roll' | 'throttle', val: boolean): void {
    this.inverted[axis] = val;
  }

  public getLiveVerifyCoords(): { x: number; y: number; t: number } {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[this.gamepadIndex];
    if (!gp) return { x: 0, y: 0, t: 0 };

    const read = (idx: number, invert: boolean) => {
      if (idx < 0 || idx >= gp.axes.length) return 0;
      return invert ? -gp.axes[idx] : gp.axes[idx];
    };

    const x = read(this.rollAxis, this.inverted.roll);
    const y = read(this.pitchAxis, this.inverted.pitch);
    const rawT = gp.axes[this.throttleAxis] !== undefined ? gp.axes[this.throttleAxis] : -1.0;
    const t = (this.inverted.throttle ? -rawT : rawT + 1.0) / 2.0;

    return { x, y, t };
  }

  private pollAxes(_onStepChange: (step: CalibrationStep) => void): void {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[this.gamepadIndex];
    if (!gp) return;

    // Search for axis with highest absolute deflection
    let maxVal = 0;
    let maxIdx = -1;

    for (let i = 0; i < gp.axes.length; i++) {
      const val = Math.abs(gp.axes[i]);
      if (val > maxVal) {
        maxVal = val;
        maxIdx = i;
      }
    }

    // If stick deflection is significant (>0.75), auto-assign to active step
    if (maxVal > 0.75 && maxIdx !== -1) {
      if (this.step === 'throttle_max' && maxIdx !== this.yawAxis && maxIdx !== this.pitchAxis) {
        this.throttleAxis = maxIdx;
        this.updateStepProgress('cal-throttle-bar', maxVal);
      } else if (this.step === 'yaw_left' && maxIdx !== this.throttleAxis) {
        this.yawAxis = maxIdx;
        this.updateStepProgress('cal-yaw-bar', maxVal);
      } else if (
        this.step === 'pitch_up' &&
        maxIdx !== this.throttleAxis &&
        maxIdx !== this.yawAxis
      ) {
        this.pitchAxis = maxIdx;
        this.updateStepProgress('cal-pitch-bar', maxVal);
      } else if (
        this.step === 'roll_right' &&
        maxIdx !== this.throttleAxis &&
        maxIdx !== this.yawAxis &&
        maxIdx !== this.pitchAxis
      ) {
        this.rollAxis = maxIdx;
        this.updateStepProgress('cal-roll-bar', maxVal);
      }
    }
  }

  private updateStepProgress(elementId: string, value: number): void {
    const bar = document.getElementById(elementId);
    if (bar) {
      // Map deflection [0.0, 1.0] -> [0%, 100%]
      bar.style.width = `${Math.round(value * 100)}%`;
    }
  }
}
export default CalibrationWizard;
