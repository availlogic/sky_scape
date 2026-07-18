import type { DroneInputs, IInputSource } from './types';
import { KeyboardMouseInput } from './KeyboardMouseInput';
import { expo } from '../utils/math';

export class InputManager {
  private activeSource: IInputSource;
  private expoFactor = 0.4; // Default from PRD

  constructor(source?: IInputSource) {
    this.activeSource = source || new KeyboardMouseInput();
    this.activeSource.init();
  }

  public poll(): DroneInputs {
    const raw = this.activeSource.poll();

    // Apply expo factor to Yaw, Pitch, Roll (Throttle is kept linear)
    return {
      ...raw,
      yaw: expo(raw.yaw, this.expoFactor),
      pitch: expo(raw.pitch, this.expoFactor),
      roll: expo(raw.roll, this.expoFactor),
      throttle: raw.throttle,
    };
  }

  public setExpoFactor(factor: number): void {
    this.expoFactor = Math.max(0.0, Math.min(1.0, factor));
  }

  public getExpoFactor(): number {
    return this.expoFactor;
  }

  public setActiveSource(source: IInputSource): void {
    this.activeSource.destroy();
    this.activeSource = source;
    this.activeSource.init();
  }

  public getActiveSource(): IInputSource {
    return this.activeSource;
  }

  public destroy(): void {
    this.activeSource.destroy();
  }
}
export default InputManager;
