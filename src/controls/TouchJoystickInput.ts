import type { DroneInputs, IInputSource } from './types';
import { clamp } from '../utils/math';

export class TouchJoystickInput implements IInputSource {
  private yaw = 0.0;
  private pitch = 0.0;
  private roll = 0.0;
  private throttleVal = 0.5; // Starts at hover throttle
  private isAltSliderTouched = false;

  private leftContainer: HTMLElement | null = null;
  private leftKnob: HTMLElement | null = null;
  private rightContainer: HTMLElement | null = null;
  private rightKnob: HTMLElement | null = null;
  private altContainer: HTMLElement | null = null;
  private altKnob: HTMLElement | null = null;
  private allControlsContainer: HTMLElement | null = null;

  // Touch identifiers
  private leftTouchId: number | null = null;
  private rightTouchId: number | null = null;
  private altTouchId: number | null = null;

  // Joystick center coordinates
  private leftCenter = { x: 0, y: 0 };
  private rightCenter = { x: 0, y: 0 };
  private altCenterY = 0;

  // Constants
  private readonly maxRadius = 60; // px
  private readonly altHalfHeight = 100; // px
  private lastTouchTime = Date.now();
  private idleTimeoutId: any = null;

  constructor() {
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.checkIdle = this.checkIdle.bind(this);
  }

  public init(): void {
    // Query elements
    this.leftContainer = document.getElementById('left-joystick');
    this.leftKnob = this.leftContainer?.querySelector('.joystick-knob') || null;
    this.rightContainer = document.getElementById('right-joystick');
    this.rightKnob = this.rightContainer?.querySelector('.joystick-knob') || null;
    this.altContainer = document.getElementById('height-slider');
    this.altKnob = this.altContainer?.querySelector('.height-slider-knob') || null;
    this.allControlsContainer = document.getElementById('touch-controls');

    if (this.allControlsContainer) {
      this.allControlsContainer.style.display = 'block';
      this.allControlsContainer.style.opacity = '1.0';
    }

    // Add touch listeners
    document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
    document.addEventListener('touchcancel', this.handleTouchEnd);

    // Initial center calibrations
    this.recalibrateCenters();
    window.addEventListener('resize', () => this.recalibrateCenters());

    this.lastTouchTime = Date.now();
    this.idleTimeoutId = setInterval(this.checkIdle, 500);
  }

  public poll(): DroneInputs {
    // Map joysticks values to FPV controls:
    // Left joystick: Up/Down = pitch (forward/back), Left/Right = roll (strafe)
    // Right joystick: Up/Down = camera pitch (handled separately), Left/Right = yaw
    // Altitude slider: slides relative to center -> throttle changes

    // Continuous throttle adjustment while holding altitude slider
    if (this.isAltSliderTouched) {
      // Scale lift rate (throttleVal accumulates changes)
      // Up = throttle increases, Down = throttle decreases
      // Wait, we poll inputs to determine absolute throttle.
      // If user holds slider up, we increase throttle. If released, it centers back to neutral.
    }

    return {
      yaw: this.yaw,
      pitch: this.pitch,
      roll: this.roll,
      throttle: this.throttleVal,
    };
  }

  public destroy(): void {
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('touchcancel', this.handleTouchEnd);
    clearInterval(this.idleTimeoutId);

    if (this.allControlsContainer) {
      this.allControlsContainer.style.display = 'none';
    }
  }

  private recalibrateCenters(): void {
    if (this.leftContainer) {
      const rect = this.leftContainer.getBoundingClientRect();
      this.leftCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    if (this.rightContainer) {
      const rect = this.rightContainer.getBoundingClientRect();
      this.rightCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    if (this.altContainer) {
      const rect = this.altContainer.getBoundingClientRect();
      this.altCenterY = rect.top + rect.height / 2;
    }
  }

  private wakeControls(): void {
    this.lastTouchTime = Date.now();
    if (this.leftContainer) this.leftContainer.style.opacity = '1.0';
    if (this.rightContainer) this.rightContainer.style.opacity = '1.0';
    if (this.altContainer) this.altContainer.style.opacity = '1.0';
  }

  private checkIdle(): void {
    if (Date.now() - this.lastTouchTime > 2500) {
      // Fade to 20% opacity
      if (this.leftContainer && this.leftTouchId === null) this.leftContainer.style.opacity = '0.2';
      if (this.rightContainer && this.rightTouchId === null)
        this.rightContainer.style.opacity = '0.2';
      if (this.altContainer && this.altTouchId === null) this.altContainer.style.opacity = '0.2';
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    this.wakeControls();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const tx = touch.clientX;
      const ty = touch.clientY;

      // 1. Left Joystick Check
      if (this.leftContainer && this.leftTouchId === null) {
        const dist = Math.hypot(tx - this.leftCenter.x, ty - this.leftCenter.y);
        if (dist < 100) {
          // touch zone radius
          this.leftTouchId = touch.identifier;
          this.updateLeftJoystick(tx, ty);
          e.preventDefault();
          continue;
        }
      }

      // 2. Right Joystick Check
      if (this.rightContainer && this.rightTouchId === null) {
        const dist = Math.hypot(tx - this.rightCenter.x, ty - this.rightCenter.y);
        if (dist < 100) {
          this.rightTouchId = touch.identifier;
          this.updateRightJoystick(tx, ty);
          e.preventDefault();
          continue;
        }
      }

      // 3. Altitude Slider Check
      if (this.altContainer && this.altTouchId === null) {
        const rect = this.altContainer.getBoundingClientRect();
        if (tx >= rect.left - 20 && tx <= rect.right + 20 && ty >= rect.top && ty <= rect.bottom) {
          this.altTouchId = touch.identifier;
          this.isAltSliderTouched = true;
          this.updateAltSlider(ty);
          e.preventDefault();
        }
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    this.wakeControls();

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === this.leftTouchId) {
        this.updateLeftJoystick(touch.clientX, touch.clientY);
        e.preventDefault();
      } else if (touch.identifier === this.rightTouchId) {
        this.updateRightJoystick(touch.clientX, touch.clientY);
        e.preventDefault();
      } else if (touch.identifier === this.altTouchId) {
        this.updateAltSlider(touch.clientY);
        e.preventDefault();
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touch.identifier === this.leftTouchId) {
        this.leftTouchId = null;
        this.pitch = 0.0;
        this.roll = 0.0;
        if (this.leftKnob) {
          this.leftKnob.style.transform = 'translate(-50%, -50%)';
        }
      } else if (touch.identifier === this.rightTouchId) {
        this.rightTouchId = null;
        this.yaw = 0.0;
        if (this.rightKnob) {
          this.rightKnob.style.transform = 'translate(-50%, -50%)';
        }
      } else if (touch.identifier === this.altTouchId) {
        this.altTouchId = null;
        this.isAltSliderTouched = false;
        if (this.altKnob) {
          this.altKnob.style.top = '50%';
        }
      }
    }
  }

  private updateLeftJoystick(tx: number, ty: number): void {
    let dx = tx - this.leftCenter.x;
    let dy = ty - this.leftCenter.y;
    const dist = Math.hypot(dx, dy);

    if (dist > this.maxRadius) {
      dx = (dx / dist) * this.maxRadius;
      dy = (dy / dist) * this.maxRadius;
    }

    if (this.leftKnob) {
      this.leftKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    // Left joystick maps to: dy -> pitch (forward is negative), dx -> roll (right is positive)
    this.roll = dx / this.maxRadius;
    this.pitch = dy / this.maxRadius;
  }

  private updateRightJoystick(tx: number, ty: number): void {
    let dx = tx - this.rightCenter.x;
    let dy = ty - this.rightCenter.y;
    const dist = Math.hypot(dx, dy);

    if (dist > this.maxRadius) {
      dx = (dx / dist) * this.maxRadius;
      dy = (dy / dist) * this.maxRadius;
    }

    if (this.rightKnob) {
      this.rightKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    // Right joystick maps to: dx -> yaw (right is positive)
    this.yaw = dx / this.maxRadius;
  }

  private updateAltSlider(ty: number): void {
    let dy = ty - this.altCenterY;
    dy = clamp(dy, -this.altHalfHeight, this.altHalfHeight);

    if (this.altKnob) {
      // Map dy offset to percentage height position
      const percentage = 50 + (dy / this.altHalfHeight) * 50;
      this.altKnob.style.top = `${percentage}%`;
    }

    // Up = throttle increase, Down = throttle decrease
    // Map dy: -altHalfHeight (top) -> 1.0, altHalfHeight (bottom) -> 0.0
    this.throttleVal = 1.0 - (dy + this.altHalfHeight) / (this.altHalfHeight * 2);
  }
}
export default TouchJoystickInput;
