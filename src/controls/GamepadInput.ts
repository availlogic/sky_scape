import type { DroneInputs, IInputSource, GamepadCalibration } from './types';
import { clamp } from '../utils/math';

export class GamepadInput implements IInputSource {
  private calibration: GamepadCalibration | null = null;
  private gamepadIndex: number | null = null;

  // Callback hooks for connection state changes
  public onDisconnect: (() => void) | null = null;
  public onConnect: (() => void) | null = null;

  constructor(calibration: GamepadCalibration | null = null) {
    this.calibration = calibration;
    this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
    this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
  }

  public init(): void {
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);

    // Initial check for already connected gamepads
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] !== null) {
        this.gamepadIndex = i;
        if (this.onConnect) this.onConnect();
        break;
      }
    }
  }

  public poll(): DroneInputs {
    const defaultInputs: DroneInputs = { yaw: 0, pitch: 0, roll: 0, throttle: 0 };

    if (this.gamepadIndex === null) {
      return defaultInputs;
    }

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[this.gamepadIndex];

    if (!gp) {
      // Disconnection detected during poll
      this.gamepadIndex = null;
      if (this.onDisconnect) this.onDisconnect();
      return defaultInputs;
    }

    if (!this.calibration) {
      // Not calibrated yet, return defaults
      return defaultInputs;
    }

    const cal = this.calibration;

    // Read raw values from axes (deadzone filter of 0.05)
    const readAxis = (axisIdx: number, invert: boolean): number => {
      if (axisIdx < 0 || axisIdx >= gp.axes.length) return 0;
      let val = gp.axes[axisIdx];

      // Apply simple deadzone
      if (Math.abs(val) < 0.05) {
        return 0;
      }

      const result = invert ? -val : val;
      return result === 0 ? 0 : result;
    };

    const rawYaw = readAxis(cal.yawAxis, cal.inverted.yaw);
    const rawPitch = readAxis(cal.pitchAxis, cal.inverted.pitch);
    const rawRoll = readAxis(cal.rollAxis, cal.inverted.roll);

    // Throttle is mapped from [-1.0, 1.0] to [0.0, 1.0]
    let rawThrottleVal = gp.axes[cal.throttleAxis] !== undefined ? gp.axes[cal.throttleAxis] : -1.0;
    if (cal.inverted.throttle) {
      rawThrottleVal = -rawThrottleVal;
    }
    // Convert from [-1.0, 1.0] -> [0.0, 1.0]
    const throttle = clamp((rawThrottleVal + 1.0) / 2.0, 0.0, 1.0);

    return {
      yaw: clamp(rawYaw, -1.0, 1.0),
      pitch: clamp(rawPitch, -1.0, 1.0),
      roll: clamp(rawRoll, -1.0, 1.0),
      throttle,
    };
  }

  public destroy(): void {
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
  }

  public setCalibration(calib: GamepadCalibration): void {
    this.calibration = calib;
  }

  public getCalibration(): GamepadCalibration | null {
    return this.calibration;
  }

  public isGamepadConnected(): boolean {
    return this.gamepadIndex !== null;
  }

  private handleGamepadConnected(e: GamepadEvent): void {
    if (this.gamepadIndex === null) {
      this.gamepadIndex = e.gamepad.index;
      if (this.onConnect) this.onConnect();
    }
  }

  private handleGamepadDisconnected(e: GamepadEvent): void {
    if (this.gamepadIndex === e.gamepad.index) {
      this.gamepadIndex = null;
      if (this.onDisconnect) this.onDisconnect();

      // Fallback search for another connected gamepad
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] !== null) {
          this.gamepadIndex = i;
          if (this.onConnect) this.onConnect();
          break;
        }
      }
    }
  }
}
export default GamepadInput;
