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

  test('initial values are neutral and isTouch is true', () => {
    const inputs = touchInput.poll();
    expect(inputs.yaw).toBe(0.0);
    expect(inputs.pitch).toBe(0.0);
    expect(inputs.forward).toBe(0.0);
    expect(inputs.sideway).toBe(0.0);
    expect(inputs.vertical).toBe(0.0);
    expect(inputs.isTouch).toBe(true);
  });

  test('left joystick controls forward/sideway translation', () => {
    // Left center is at x=120, y=570.
    // Simulate touchstart at x=180 (full deflection right -> sideway=1.0), y=570
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
    expect(inputs.sideway).toBeCloseTo(1.0);
    expect(inputs.forward).toBeCloseTo(0.0);

    // Drag touch upwards to y=510 (full deflection up -> forward=1.0)
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
    expect(inputs.sideway).toBeCloseTo(0.0);
    expect(inputs.forward).toBeCloseTo(1.0);

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
    expect(inputs.sideway).toBe(0.0);
    expect(inputs.forward).toBe(0.0);
  });

  test('right joystick controls yaw and pitch rotation', () => {
    // Right center is at x=870, y=570.
    // Simulate touchstart at x=930 (full deflection right -> yaw=1.0), y=570
    const startEvent = new TouchEvent('touchstart', {
      changedTouches: [
        {
          identifier: 3,
          target: document.getElementById('right-joystick')!,
          clientX: 930,
          clientY: 570,
        } as any,
      ],
    });
    document.dispatchEvent(startEvent);

    let inputs = touchInput.poll();
    expect(inputs.yaw).toBeCloseTo(1.0);
    expect(inputs.pitch).toBeCloseTo(0.0);

    // Drag touch downwards to y=630 (full deflection down -> pitch=1.0)
    const moveEvent = new TouchEvent('touchmove', {
      touches: [
        {
          identifier: 3,
          target: document.getElementById('right-joystick')!,
          clientX: 870,
          clientY: 630,
        } as any,
      ],
    });
    document.dispatchEvent(moveEvent);

    inputs = touchInput.poll();
    expect(inputs.yaw).toBeCloseTo(0.0);
    expect(inputs.pitch).toBeCloseTo(1.0);

    // Release touch
    const endEvent = new TouchEvent('touchend', {
      changedTouches: [
        {
          identifier: 3,
          target: document.getElementById('right-joystick')!,
          clientX: 870,
          clientY: 630,
        } as any,
      ],
    });
    document.dispatchEvent(endEvent);

    inputs = touchInput.poll();
    expect(inputs.yaw).toBe(0.0);
    expect(inputs.pitch).toBe(0.0);
  });

  test('height slider controls vertical movement (up=1.0, center=0.0, down=-1.0)', () => {
    // Height slider center Y is 500. Height range is [400, 600].
    // Touch at top (y=400) -> vertical=1.0 (ascend)
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
    expect(inputs.vertical).toBe(1.0);

    // Touch at center (y=500) -> vertical=0.0
    const moveCenterEvent = new TouchEvent('touchmove', {
      touches: [
        {
          identifier: 2,
          target: document.getElementById('height-slider')!,
          clientX: 974,
          clientY: 500,
        } as any,
      ],
    });
    document.dispatchEvent(moveCenterEvent);

    inputs = touchInput.poll();
    expect(inputs.vertical).toBeCloseTo(0.0);

    // Touch at bottom (y=600) -> vertical=-1.0 (descend)
    const moveBottomEvent = new TouchEvent('touchmove', {
      touches: [
        {
          identifier: 2,
          target: document.getElementById('height-slider')!,
          clientX: 974,
          clientY: 600,
        } as any,
      ],
    });
    document.dispatchEvent(moveBottomEvent);

    inputs = touchInput.poll();
    expect(inputs.vertical).toBe(-1.0);

    // Release touch -> vertical resets to 0
    const endEvent = new TouchEvent('touchend', {
      changedTouches: [
        {
          identifier: 2,
          target: document.getElementById('height-slider')!,
          clientX: 974,
          clientY: 600,
        } as any,
      ],
    });
    document.dispatchEvent(endEvent);

    inputs = touchInput.poll();
    expect(inputs.vertical).toBe(0.0);
  });
});
