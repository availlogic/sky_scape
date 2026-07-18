import { describe, test, expect, beforeEach } from 'vitest';
import { KeyboardMouseInput } from '../../src/controls/KeyboardMouseInput';
import { InputManager } from '../../src/controls/InputManager';
import { FPVPhysicsEngine } from '../../src/physics/FPVPhysicsEngine';
import { DEFAULT_PHYSICS_CONFIG } from '../../src/physics/types';

describe('Input ↔ Physics Integration', () => {
  let source: KeyboardMouseInput;
  let manager: InputManager;
  let physics: FPVPhysicsEngine;

  beforeEach(() => {
    // Clear DOM listeners
    document.body.innerHTML = '';
    source = new KeyboardMouseInput();
    manager = new InputManager(source);
    physics = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, () => 0);
  });

  test('IT-IN-PHYS-01: keystrokes steer drone physics correctly', async () => {
    physics.spawn(100);

    // 1. Dispatch keydown for W (forward) and Q (vertical up)
    const eventW = new KeyboardEvent('keydown', { key: 'w' });
    const eventQ = new KeyboardEvent('keydown', { key: 'q' });
    document.dispatchEvent(eventW);
    document.dispatchEvent(eventQ);

    // 2. Poll inputs from manager
    const inputs = manager.poll();
    expect(inputs.forward).toBe(1.0);
    expect(inputs.vertical).toBe(1.0);

    // 3. Update physics
    physics.update(0.1, inputs);

    // 4. Verify physical reaction
    expect(physics.velocity.length()).toBeGreaterThan(0);
    expect(physics.velocity.z).toBeLessThan(0); // moves forward along -Z
    expect(physics.velocity.y).toBeGreaterThan(0); // moves up along +Y

    // Clean up
    const eventWUp = new KeyboardEvent('keyup', { key: 'w' });
    const eventQUp = new KeyboardEvent('keyup', { key: 'q' });
    document.dispatchEvent(eventWUp);
    document.dispatchEvent(eventQUp);
    manager.destroy();
  });

  test('IT-IN-PHYS-01: clamps invalid input ranges securely', () => {
    // If poll somehow returns out-of-range coordinates, physics must clamp it
    const badInputs = {
      yaw: 5.5, // exceeds 1.0
      pitch: -12.0, // exceeds -1.0
      roll: 0.0,
      throttle: -2.3, // below 0.0
    };

    physics.spawn(100);
    // Trigger operation to enable physics
    physics.update(0.1, { yaw: 0, pitch: 0, roll: 0, throttle: 0.1 });
    physics.update(0.1, badInputs);

    // Should successfully solve frame without breaking, clamped inside range
    expect(physics.position.y).toBeLessThan(100); // falls under gravity
    expect(physics.velocity.length()).toBeGreaterThan(0);
  });

  test('IT-IN-PHYS-01: handles NaN inputs gracefully by neutralizing values', () => {
    const corruptInputs = {
      yaw: NaN,
      pitch: NaN,
      roll: NaN,
      throttle: NaN,
    };

    physics.spawn(100);
    // Trigger operation to enable physics
    physics.update(0.1, { yaw: 0, pitch: 0, roll: 0, throttle: 0.1 });
    // Should fallback to neutral controls (0 pitch/yaw/roll, 0 throttle)
    physics.update(0.1, corruptInputs);

    // Fall under gravity (since throttle clamped to 0)
    expect(physics.velocity.y).toBeLessThan(0);
    expect(physics.position.y).toBeLessThan(100);
    expect(physics.angularVelocity.length()).toBe(0); // no rotation torque applied
  });
});
