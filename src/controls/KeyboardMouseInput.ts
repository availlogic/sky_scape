import type { DroneInputs, IInputSource } from './types';
import { clamp } from '../utils/math';

export class KeyboardMouseInput implements IInputSource {
  private keysPressed = new Set<string>();
  private throttle = 0.0;
  private currentMovementX = 0;
  private currentMovementY = 0;

  public mousePitchLook = 0.0; // Accumulated camera pitch look
  public sensitivity = 0.009;
  public throttleSpeed = 1.0; // Rate of change per second

  // Last update timestamp for calculating deltaTime inside poll
  private lastTime = 0;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  public init(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    this.lastTime = performance.now();
  }

  public poll(): DroneInputs {
    this.lastTime = performance.now();

    // Movement: Forward/Backward (W/S or Arrow keys)
    let forward = 0;
    if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) forward += 1.0;
    if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) forward -= 1.0;

    // Strafe: Left/Right (A/D or Arrow keys)
    let sideway = 0;
    if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) sideway += 1.0;
    if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) sideway -= 1.0;

    // Vertical: Up/Down (Q/E)
    let vertical = 0;
    if (this.keysPressed.has('q')) vertical += 1.0;
    if (this.keysPressed.has('e')) vertical -= 1.0;

    // Mouse rotation: raw deltas passed directly
    const yaw = this.currentMovementX;
    const pitch = this.currentMovementY;

    this.currentMovementX = 0; // Reset for next frame
    this.currentMovementY = 0; // Reset for next frame

    // Accumulate local pitch look just in case any UI components query it
    this.mousePitchLook = clamp(
      this.mousePitchLook + pitch * this.sensitivity,
      -Math.PI / 3,
      Math.PI / 3,
    );

    return {
      yaw,
      pitch,
      roll: 0,
      throttle: 0,
      forward,
      sideway,
      vertical,
      isKeyboardMouse: true,
    };
  }

  public destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    this.keysPressed.clear();
  }

  // Exposed for setting/resetting throttle directly
  public setThrottle(val: number): void {
    this.throttle = clamp(val, 0.0, 1.0);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keysPressed.add(e.key.toLowerCase());
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysPressed.delete(e.key.toLowerCase());
  }

  private handleMouseMove(e: MouseEvent): void {
    // Only capture movement if mouse is pointer-locked
    if (document.pointerLockElement) {
      this.currentMovementX += e.movementX;
      this.currentMovementY += e.movementY;
    }
  }
}
export default KeyboardMouseInput;
