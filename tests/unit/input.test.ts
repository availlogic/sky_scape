import { describe, test, expect } from 'vitest';
import { KeyboardMouseInput } from '../../src/controls/KeyboardMouseInput';
import { InputManager } from '../../src/controls/InputManager';

describe('Input Controls Module', () => {
  // Helper to dispatch key event
  const dispatchKey = (type: 'keydown' | 'keyup', key: string) => {
    const event = new KeyboardEvent(type, { key });
    document.dispatchEvent(event);
  };

  test('FT-INPUT-01: keyboard key mappings update raw inputs for spectator fly camera', () => {
    const source = new KeyboardMouseInput();
    source.init();

    // 1. Check default neutral state
    let inputs = source.poll();
    expect(inputs.forward).toBe(0);
    expect(inputs.sideway).toBe(0);
    expect(inputs.vertical).toBe(0);
    expect(inputs.isKeyboardMouse).toBe(true);

    // 2. Press W (Forward)
    dispatchKey('keydown', 'w');
    inputs = source.poll();
    expect(inputs.forward).toBe(1.0);

    // 3. Press S (Backward) alongside W -> should cancel to 0
    dispatchKey('keydown', 's');
    inputs = source.poll();
    expect(inputs.forward).toBe(0);

    dispatchKey('keyup', 'w');
    dispatchKey('keyup', 's');

    // 4. Press A (Strafe Left)
    dispatchKey('keydown', 'a');
    inputs = source.poll();
    expect(inputs.sideway).toBe(-1.0);
    dispatchKey('keyup', 'a');

    // 5. Press D (Strafe Right)
    dispatchKey('keydown', 'd');
    inputs = source.poll();
    expect(inputs.sideway).toBe(1.0);
    dispatchKey('keyup', 'd');

    // 6. Press Q (Vertical Up)
    dispatchKey('keydown', 'q');
    inputs = source.poll();
    expect(inputs.vertical).toBe(1.0);
    dispatchKey('keyup', 'q');

    // 7. Press E (Vertical Down)
    dispatchKey('keydown', 'e');
    inputs = source.poll();
    expect(inputs.vertical).toBe(-1.0);
    dispatchKey('keyup', 'e');

    source.destroy();
  });

  test('InputManager applies Expo curve to raw values', () => {
    const source = new KeyboardMouseInput();
    const manager = new InputManager(source);

    // Mock poll on source
    source.poll = () => ({
      yaw: 0.5,
      pitch: -0.5,
      roll: 0.8,
      throttle: 0.6, // should remain linear
    });

    // Case 1: Expo = 0 (Linear)
    manager.setExpoFactor(0.0);
    let inputs = manager.poll();
    expect(inputs.yaw).toBeCloseTo(0.5);
    expect(inputs.pitch).toBeCloseTo(-0.5);
    expect(inputs.roll).toBeCloseTo(0.8);
    expect(inputs.throttle).toBe(0.6);

    // Case 2: Expo = 1.0 (Pure cubic)
    manager.setExpoFactor(1.0);
    inputs = manager.poll();
    expect(inputs.yaw).toBeCloseTo(0.125); // 0.5^3
    expect(inputs.pitch).toBeCloseTo(-0.125); // (-0.5)^3
    expect(inputs.roll).toBeCloseTo(0.512); // 0.8^3
    expect(inputs.throttle).toBe(0.6); // Still linear!

    manager.destroy();
  });
});
