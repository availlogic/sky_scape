import type { GamepadCalibration } from '../controls/types';
import type { UserSettings } from './defaults';
import { DEFAULT_USER_SETTINGS, validateSettings, validateGamepadCalibration } from './defaults';

export interface IStorageManager {
  loadSettings(): UserSettings;
  saveSettings(settings: UserSettings): boolean;
  loadGamepadCalibration(): GamepadCalibration | null;
  saveGamepadCalibration(calibration: GamepadCalibration): boolean;
  clear(): void;
}

export class StorageManager implements IStorageManager {
  private readonly SETTINGS_KEY = 'skyscape_user_settings';
  private readonly MAPPINGS_KEY = 'skyscape_controller_mappings';

  public loadSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (!raw) {
        // First load, save default settings
        this.saveSettings(DEFAULT_USER_SETTINGS);
        return { ...DEFAULT_USER_SETTINGS };
      }
      const parsed = JSON.parse(raw);
      const validated = validateSettings(parsed);

      // Auto-update storage with validated/repaired fields if modified
      if (JSON.stringify(validated) !== JSON.stringify(parsed)) {
        this.saveSettings(validated);
      }
      return validated;
    } catch {
      // Corrupt JSON, reset to defaults
      this.saveSettings(DEFAULT_USER_SETTINGS);
      return { ...DEFAULT_USER_SETTINGS };
    }
  }

  public saveSettings(settings: UserSettings): boolean {
    try {
      const validated = validateSettings(settings);
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(validated));
      return true;
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        // Storage full
        return false;
      }
      return false;
    }
  }

  public loadGamepadCalibration(): GamepadCalibration | null {
    try {
      const raw = localStorage.getItem(this.MAPPINGS_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      return validateGamepadCalibration(parsed);
    } catch {
      localStorage.removeItem(this.MAPPINGS_KEY);
      return null;
    }
  }

  public saveGamepadCalibration(calibration: GamepadCalibration): boolean {
    try {
      const validated = validateGamepadCalibration(calibration);
      if (!validated) return false;

      localStorage.setItem(this.MAPPINGS_KEY, JSON.stringify(validated));
      return true;
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        return false;
      }
      return false;
    }
  }

  public clear(): void {
    localStorage.removeItem(this.SETTINGS_KEY);
    localStorage.removeItem(this.MAPPINGS_KEY);
  }
}
export default StorageManager;
