/**
 * Raw drone input values from any input source.
 * All axes normalised: rotation axes [-1.0, 1.0], throttle [0.0, 1.0].
 */
export interface DroneInputs {
  yaw: number;
  pitch: number;
  roll: number;
  throttle: number;
  forward?: number;
  sideway?: number;
  vertical?: number;
  isKeyboardMouse?: boolean;
}

/**
 * Contract that every input source (keyboard, touch, gamepad) must implement.
 */
export interface IInputSource {
  /** Initialise listeners / detect devices. */
  init(): void;
  /** Return current input state. Called every frame. */
  poll(): DroneInputs;
  /** Tear down listeners and release resources. */
  destroy(): void;
}

/**
 * Gamepad axis-to-function mapping produced by the calibration wizard.
 */
export interface GamepadCalibration {
  yawAxis: number;
  pitchAxis: number;
  rollAxis: number;
  throttleAxis: number;
  inverted: {
    yaw: boolean;
    pitch: boolean;
    roll: boolean;
    throttle: boolean;
  };
}

/**
 * Steps the calibration wizard walks through.
 */
export type CalibrationStep =
  'idle' | 'throttle_min' | 'throttle_max' | 'yaw_left' | 'pitch_up' | 'roll_right' | 'complete';
