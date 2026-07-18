import type { GamepadCalibration } from '../controls/types';

export interface UserSettings {
  biomeName: string;
  graphicsQuality: 'auto' | 'high' | 'medium' | 'low';
  cruiseSpeed: number;
  cameraDamping: number;
  expoFactor: number;
}

export const VALID_BIOMES = ['desert', 'forest', 'snowland', 'coastlines'];
export const VALID_QUALITIES = ['auto', 'high', 'medium', 'low'];

export const DEFAULT_USER_SETTINGS: UserSettings = {
  biomeName: 'forest',
  graphicsQuality: 'auto',
  cruiseSpeed: 15.0,
  cameraDamping: 0.15,
  expoFactor: 0.4,
};

/**
 * Validates settings object and patches missing/invalid fields with defaults.
 */
export function validateSettings(raw: any): UserSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_USER_SETTINGS };
  }

  const settings: UserSettings = { ...DEFAULT_USER_SETTINGS };

  // Validate biomeName
  if (typeof raw.biomeName === 'string' && VALID_BIOMES.includes(raw.biomeName.toLowerCase())) {
    settings.biomeName = raw.biomeName.toLowerCase();
  }

  // Validate graphicsQuality
  if (
    typeof raw.graphicsQuality === 'string' &&
    VALID_QUALITIES.includes(raw.graphicsQuality.toLowerCase())
  ) {
    settings.graphicsQuality = raw.graphicsQuality.toLowerCase() as any;
  }

  // Validate cruiseSpeed (min 5.0, max 100.0)
  if (typeof raw.cruiseSpeed === 'number' && !isNaN(raw.cruiseSpeed)) {
    settings.cruiseSpeed = Math.max(5.0, Math.min(100.0, raw.cruiseSpeed));
  }

  // Validate cameraDamping (min 0.01, max 1.0)
  if (typeof raw.cameraDamping === 'number' && !isNaN(raw.cameraDamping)) {
    settings.cameraDamping = Math.max(0.01, Math.min(1.0, raw.cameraDamping));
  }

  // Validate expoFactor (min 0.0, max 1.0)
  if (typeof raw.expoFactor === 'number' && !isNaN(raw.expoFactor)) {
    settings.expoFactor = Math.max(0.0, Math.min(1.0, raw.expoFactor));
  }

  return settings;
}

/**
 * Validates controller mapping structure. Returns null if invalid.
 */
export function validateGamepadCalibration(raw: any): GamepadCalibration | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const { yawAxis, pitchAxis, rollAxis, throttleAxis, inverted } = raw;

  if (
    typeof yawAxis !== 'number' ||
    yawAxis < 0 ||
    typeof pitchAxis !== 'number' ||
    pitchAxis < 0 ||
    typeof rollAxis !== 'number' ||
    rollAxis < 0 ||
    typeof throttleAxis !== 'number' ||
    throttleAxis < 0
  ) {
    return null;
  }

  if (!inverted || typeof inverted !== 'object') {
    return null;
  }

  if (
    typeof inverted.yaw !== 'boolean' ||
    typeof inverted.pitch !== 'boolean' ||
    typeof inverted.roll !== 'boolean' ||
    typeof inverted.throttle !== 'boolean'
  ) {
    return null;
  }

  return {
    yawAxis: Math.floor(yawAxis),
    pitchAxis: Math.floor(pitchAxis),
    rollAxis: Math.floor(rollAxis),
    throttleAxis: Math.floor(throttleAxis),
    inverted: {
      yaw: inverted.yaw,
      pitch: inverted.pitch,
      roll: inverted.roll,
      throttle: inverted.throttle,
    },
  };
}
