import { describe, test, expect, beforeEach } from 'vitest';
import { StorageManager } from '../../src/storage/StorageManager';
import type { UserSettings } from '../../src/storage/defaults';
import type { GamepadCalibration } from '../../src/controls/types';

describe('Storage Manager Module', () => {
  let manager: StorageManager;

  beforeEach(() => {
    localStorage.clear();
    manager = new StorageManager();
  });

  test('IT-ST-DB-01: loads default settings when empty', () => {
    const settings = manager.loadSettings();
    expect(settings.biomeName).toBe('forest');
    expect(settings.graphicsQuality).toBe('auto');
    expect(settings.cruiseSpeed).toBe(15.0);
  });

  test('IT-ST-DB-01: invalid biome reverts to default forest', () => {
    localStorage.setItem(
      'skyscape_user_settings',
      JSON.stringify({
        biomeName: 'Mars', // Invalid
        graphicsQuality: 'high',
        cruiseSpeed: 10.0,
        cameraDamping: 0.1,
        expoFactor: 0.5,
      }),
    );

    const settings = manager.loadSettings();
    expect(settings.biomeName).toBe('forest'); // Reset to default
    expect(settings.graphicsQuality).toBe('high'); // Intact
  });

  test('IT-ST-DB-01: invalid graphics quality reverts to auto', () => {
    localStorage.setItem(
      'skyscape_user_settings',
      JSON.stringify({
        biomeName: 'desert',
        graphicsQuality: 'ultra_high', // Invalid
        cruiseSpeed: 10.0,
        cameraDamping: 0.1,
        expoFactor: 0.5,
      }),
    );

    const settings = manager.loadSettings();
    expect(settings.graphicsQuality).toBe('auto'); // Reset to default
    expect(settings.biomeName).toBe('desert'); // Intact
  });

  test('IT-ST-DB-01: clamped range validation for numerical settings', () => {
    localStorage.setItem(
      'skyscape_user_settings',
      JSON.stringify({
        biomeName: 'desert',
        graphicsQuality: 'medium',
        cruiseSpeed: 120.0, // Exceeds max 100
        cameraDamping: -1.2, // Below min 0.01
        expoFactor: 5.5, // Exceeds max 1.0
      }),
    );

    const settings = manager.loadSettings();
    expect(settings.cruiseSpeed).toBe(100.0);
    expect(settings.cameraDamping).toBe(0.01);
    expect(settings.expoFactor).toBe(1.0);
  });

  test('IT-ST-DB-01: corrupt JSON string resets cleanly to defaults', () => {
    localStorage.setItem('skyscape_user_settings', 'CRASH_TEST_CORRUPTED_STRING');

    const settings = manager.loadSettings();
    expect(settings.biomeName).toBe('forest');
    expect(settings.graphicsQuality).toBe('auto');
  });

  test('round-trip settings persistence works', () => {
    const newSettings: UserSettings = {
      biomeName: 'desert',
      graphicsQuality: 'low',
      cruiseSpeed: 24.5,
      cameraDamping: 0.88,
      expoFactor: 0.12,
    };

    const saved = manager.saveSettings(newSettings);
    expect(saved).toBe(true);

    const loaded = manager.loadSettings();
    expect(loaded).toEqual(newSettings);
  });

  test('gamepad calibration serialization and validation', () => {
    const validCalib: GamepadCalibration = {
      yawAxis: 0,
      pitchAxis: 1,
      rollAxis: 2,
      throttleAxis: 3,
      inverted: { yaw: false, pitch: true, roll: false, throttle: true },
    };

    // 1. Unsaved mapping returns null
    expect(manager.loadGamepadCalibration()).toBeNull();

    // 2. Save valid mapping
    const saved = manager.saveGamepadCalibration(validCalib);
    expect(saved).toBe(true);

    // 3. Load and match
    const loaded = manager.loadGamepadCalibration();
    expect(loaded).toEqual(validCalib);

    // 4. Save invalid mapping -> fails
    const invalidCalib = { yawAxis: -1 } as any;
    expect(manager.saveGamepadCalibration(invalidCalib)).toBe(false);
  });

  test('clear wipes all keys', () => {
    manager.saveSettings({
      biomeName: 'desert',
      graphicsQuality: 'low',
      cruiseSpeed: 20.0,
      cameraDamping: 0.5,
      expoFactor: 0.5,
    });
    manager.clear();

    const settings = manager.loadSettings();
    expect(settings.biomeName).toBe('forest'); // reset to defaults
    expect(localStorage.getItem('skyscape_user_settings')).not.toBeNull(); // defaults rewritten on load
  });
});
