import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { TouchJoystickInput } from '../../src/controls/TouchJoystickInput';

describe('Touch Joystick Controls Module', () => {
  let touchInput: TouchJoystickInput;

  beforeEach(() => {
    // Setup dummy elements in mock DOM
    document.body.innerHTML = `
      <div id="touch-controls" style="display: none;">
        <div id="left-joystick"><div class="joystick-knob"></div></div>
        <div id="right-joystick"><div class="joystick-knob"></div></div>
        <div id="height-slider"><div class="height-slider-knob"></div></div>
      </div>
    `;

    // Stub bounding rect calls to mock center calculations
    HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.id === 'left-joystick') {
        return { left: 50, top: 500, width: 140, height: 140, right: 190, bottom: 640 } as DOMRect;
      }
      if (this.id === 'right-joystick') {
        return { left: 800, top: 500, width: 140, height: 140, right: 940, bottom: 640 } as DOMRect;
      }
      if (this.id === 'height-slider') {
        return { left: 950, top: 400, width: 48, height: 200, right: 998, bottom: 600 } as DOMRect;
      }
      return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 } as DOMRect;
    };

    touchInput = new TouchJoystickInput();
    touchInput.init();
  });

  afterEach(() => {
    touchInput.destroy();
  });

  test('initial values are neutral', () => {
    const inputs = touchInput.poll();
    expect(inputs.yaw).toBe(0.0);
    expect(inputs.pitch).toBe(0.0);
    expect(inputs.roll).toBe(0.0);
    expect(inputs.throttle).toBe(0.5); // hover defaults
  });

  test('left joystick touch changes pitch and roll', () => {
    // Left center is at x=120, y=570.
    // Simulate touchstart at x=180 (full deflection right -> roll=1.0), y=570
    const startEvent = new TouchEvent('touchstart', {
      changedTouches: [
        {
          identifier: 1,
          target: document.getElementById('left-joystick')!,
          clientX: 180,
          clientY: 570,
        } as any,
      ],
    });
    document.dispatchEvent(startEvent);

    let inputs = touchInput.poll();
    expect(inputs.roll).toBeCloseTo(1.0);
    expect(inputs.pitch).toBe(0.0);

    // Drag touch upwards to y=510 (full deflection up -> pitch=-1.0)
    const moveEvent = new TouchEvent('touchmove', {
      touches: [
        {
          identifier: 1,
          target: document.getElementById('left-joystick')!,
          clientX: 120,
          clientY: 510,
        } as any,
      ],
    });
    document.dispatchEvent(moveEvent);

    inputs = touchInput.poll();
    expect(inputs.roll).toBeCloseTo(0.0);
    expect(inputs.pitch).toBeCloseTo(-1.0);

    // Release touch
    const endEvent = new TouchEvent('touchend', {
      changedTouches: [
        {
          identifier: 1,
          target: document.getElementById('left-joystick')!,
          clientX: 120,
          clientY: 510,
        } as any,
      ],
    });
    document.dispatchEvent(endEvent);

    inputs = touchInput.poll();
    expect(inputs.roll).toBe(0.0);
    expect(inputs.pitch).toBe(0.0);
  });

  test('height slider touch changes throttle', () => {
    // Height slider center Y is 500. Height range is [400, 600].
    // Touch at top (y=400) -> full throttle (1.0)
    const startEvent = new TouchEvent('touchstart', {
      changedTouches: [
        {
          identifier: 2,
          target: document.getElementById('height-slider')!,
          clientX: 974,
          clientY: 400,
        } as any,
      ],
    });
    document.dispatchEvent(startEvent);

    let inputs = touchInput.poll();
    expect(inputs.throttle).toBe(1.0);

    // Touch at bottom (y=600) -> zero throttle (0.0)
    const moveEvent = new TouchEvent('touchmove', {
      touches: [
        {
          identifier: 2,
          target: document.getElementById('height-slider')!,
          clientX: 974,
          clientY: 600,
        } as any,
      ],
    });
    document.dispatchEvent(moveEvent);

    inputs = touchInput.poll();
    expect(inputs.throttle).toBe(0.0);
  });
});
