import { describe, test, expect } from 'vitest';
import * as THREE from 'three';
import { FPVPhysicsEngine } from '../../src/physics/FPVPhysicsEngine';
import { DEFAULT_PHYSICS_CONFIG } from '../../src/physics/types';

describe('FPV Physics Engine', () => {
  const flatTerrain = () => 0;

  test('spawn resets position and velocity', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(120);

    expect(engine.position.x).toBe(0);
    expect(engine.position.y).toBe(120);
    expect(engine.position.z).toBe(0);
    expect(engine.velocity.length()).toBe(0);
    expect(engine.rotation.w).toBe(1); // identity quaternion
  });

  test('gravity pulls drone down when throttle is 0', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(150);

    // Trigger operation to enable physics
    engine.update(0.1, { yaw: 0, pitch: 0, roll: 0, throttle: 0.1 });

    const inputs = { yaw: 0, pitch: 0, roll: 0, throttle: 0 };
    engine.update(0.1, inputs);

    // Should fall down (velocity.y < 0)
    expect(engine.velocity.y).toBeLessThan(0);
    expect(engine.position.y).toBeLessThan(150);
  });

  test('thrust counteracts gravity and accelerates drone', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(150);

    // Trigger operation to enable physics
    engine.update(0.1, { yaw: 0, pitch: 0, roll: 0, throttle: 0.1 });

    // Apply full throttle
    const inputs = { yaw: 0, pitch: 0, roll: 0, throttle: 1.0 };

    // Step forward. Since maxThrust is 20m/s^2 and gravity is 9.81m/s^2, the net force is up.
    engine.update(0.5, inputs);

    expect(engine.velocity.y).toBeGreaterThan(0);
    expect(engine.position.y).toBeGreaterThan(150);
  });

  test('FT-PHYS-01: momentum and linear drag decay velocity over time', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(150);

    // 1. Accelerate drone
    engine.update(1.0, { yaw: 0, pitch: 0, roll: 0, throttle: 1.0 });
    const initialVel = engine.velocity.clone();
    expect(initialVel.y).toBeGreaterThan(0);

    // 2. Cut throttle, check coasting
    engine.update(0.1, { yaw: 0, pitch: 0, roll: 0, throttle: 0.0 });

    // Velocity should decay but still be in motion (momentum coasting)
    expect(engine.velocity.length()).toBeLessThan(initialVel.length());
    expect(engine.velocity.length()).toBeGreaterThan(0);
  });

  test('FT-PHYS-02: camera damping behaves correctly', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(150);

    // Rigid camera (damping = 1.0)
    engine.setCameraDamping(1.0);
    engine.update(0.1, { yaw: 0.0, pitch: 0.0, roll: 0.0, throttle: 1.0 });
    const stateRigid = engine.getCameraState();

    // Damped camera (damping = 0.05)
    engine.spawn(150);
    engine.setCameraDamping(0.05);
    engine.update(0.1, { yaw: 0.0, pitch: 0.0, roll: 0.0, throttle: 1.0 });
    const stateDamped = engine.getCameraState();

    // Damped camera should be lagging behind the drone more than rigid camera
    const rigidDist = stateRigid.position.distanceTo(engine.position);
    const dampedDist = stateDamped.position.distanceTo(engine.position);

    // Damped camera is further from the active target/delayed
    expect(dampedDist).not.toBe(rigidDist);
  });

  test('FT-PHYS-03: slide-bounce collision pushes drone above terrain height', () => {
    // Terrain with height 50m at x=0, z=0
    const variableTerrain = (x: number, z: number) => {
      if (Math.abs(x) < 10 && Math.abs(z) < 10) return 50;
      return 0;
    };

    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, variableTerrain);
    engine.spawn(150);

    // Manually place drone near terrain and moving down fast
    engine.position.set(0, 48, 0); // below terrain (50m) + safety margin (1.0m)
    engine.velocity.set(0, -10, 0);

    // Trigger operation to enable physics
    engine.update(0.1, { yaw: 0, pitch: 0, roll: 0, throttle: 0.1 });
    engine.position.set(0, 48, 0); // Reset position
    engine.velocity.set(0, -10, 0); // Reset velocity

    engine.update(0.1, { yaw: 0, pitch: 0, roll: 0, throttle: 0.0 });

    // Should be pushed up to 50 + safetyMargin (1.0m) = 51m
    expect(engine.position.y).toBeCloseTo(51.0);
    // Velocity.y should have bounced (positive direction now)
    expect(engine.velocity.y).toBeGreaterThan(0);
    // Velocity magnitude should be scaled down by energy loss
    expect(engine.velocity.length()).toBeLessThan(10 * 0.7);
  });

  test('drone hovers at start and does not fall until operated', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(150);

    // Update with neutral inputs
    engine.update(0.1, { yaw: 0, pitch: 0, roll: 0, throttle: 0 });

    // Should remain at spawn height
    expect(engine.position.y).toBe(150);
    expect(engine.velocity.length()).toBe(0);

    // Now send a non-neutral input
    engine.update(0.1, { yaw: 0.1, pitch: 0, roll: 0, throttle: 0 });

    // Subsequent updates should now apply physics (e.g. gravity pulls it down)
    engine.update(0.1, { yaw: 0, pitch: 0, roll: 0, throttle: 0 });
    expect(engine.velocity.y).toBeLessThan(0);
  });

  test('spectator fly-camera keyboard/mouse controls work correctly', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(150);

    // Set rotation to face forward (default identity)
    // W: Forward
    engine.update(0.1, {
      yaw: 0,
      pitch: 0,
      roll: 0,
      throttle: 0,
      forward: 1.0,
      sideway: 0,
      vertical: 0,
      isKeyboardMouse: true,
    });
    // Should move forward (towards -Z axis)
    expect(engine.velocity.z).toBeLessThan(0);

    // Q: Vertical Up
    engine.spawn(150);
    engine.update(0.1, {
      yaw: 0,
      pitch: 0,
      roll: 0,
      throttle: 0,
      forward: 0,
      sideway: 0,
      vertical: 1.0,
      isKeyboardMouse: true,
    });
    // Should move vertically up (+Y axis)
    expect(engine.velocity.y).toBeGreaterThan(0);

    // Mouse movement rotates the drone
    engine.spawn(150);
    engine.update(0.1, {
      yaw: 1.0, // turn right
      pitch: 1.0, // look down
      roll: 0,
      throttle: 0,
      forward: 0,
      sideway: 0,
      vertical: 0,
      isKeyboardMouse: true,
    });
    // Rotation should not be identity anymore
    expect(engine.rotation.w).not.toBe(1);
    // Roll (Z Euler angle) must be 0
    const euler = new THREE.Euler().setFromQuaternion(engine.rotation, 'YXZ');
    expect(euler.z).toBeCloseTo(0);
  });

  test('spectator camera translation does not rotate viewpoint', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(150);

    // Initial direction camera is looking
    const stateInit = engine.getCameraState();
    const lookInit = stateInit.target.clone().sub(stateInit.position).normalize();

    // Move drone sideways in spectator mode
    engine.update(0.1, {
      yaw: 0,
      pitch: 0,
      roll: 0,
      throttle: 0,
      forward: 0,
      sideway: 1.0,
      vertical: 0,
      isKeyboardMouse: true,
    });

    // Run update for a few frames to let camera interpolation settle
    for (let i = 0; i < 20; i++) {
      engine.update(0.1, {
        yaw: 0,
        pitch: 0,
        roll: 0,
        throttle: 0,
        forward: 0,
        sideway: 1.0,
        vertical: 0,
        isKeyboardMouse: true,
      });
    }

    const stateAfter = engine.getCameraState();
    const lookAfter = stateAfter.target.clone().sub(stateAfter.position).normalize();

    // Dot product should be 1.0 (or very close, i.e., no rotation/pivoting look)
    expect(lookAfter.dot(lookInit)).toBeCloseTo(1.0, 5);
  });

  test('mouse yaw input rotates camera at increased speed', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(150);

    const initEuler = new THREE.Euler().setFromQuaternion(engine.rotation, 'YXZ');

    engine.update(0.1, {
      yaw: 10.0, // apply mouse yaw
      pitch: 0,
      roll: 0,
      throttle: 0,
      forward: 0,
      sideway: 0,
      vertical: 0,
      isKeyboardMouse: true,
    });

    const afterEuler = new THREE.Euler().setFromQuaternion(engine.rotation, 'YXZ');
    const yawDelta = Math.abs(afterEuler.y - initEuler.y);

    // Expected sensitivity is 0.024 (3x increase from 0.008). For yaw 10.0, yawAngle change should be 10.0 * 0.024 = 0.24.
    expect(yawDelta).toBeCloseTo(0.24, 5);
  });

  test('spectator speed clamping using setCruiseSpeed', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(150);

    // Set speed limit to 50
    engine.setCruiseSpeed(50.0);

    // Run updates to accelerate forward
    for (let i = 0; i < 100; i++) {
      engine.update(0.1, {
        yaw: 0,
        pitch: 0,
        roll: 0,
        throttle: 0,
        forward: 1.0,
        sideway: 0,
        vertical: 0,
        isKeyboardMouse: true,
      });
    }

    expect(engine.speed).toBeCloseTo(50.0, 2);

    // Set speed limit to 100
    engine.setCruiseSpeed(100.0);

    // Run updates to accelerate forward again
    for (let i = 0; i < 100; i++) {
      engine.update(0.1, {
        yaw: 0,
        pitch: 0,
        roll: 0,
        throttle: 0,
        forward: 1.0,
        sideway: 0,
        vertical: 0,
        isKeyboardMouse: true,
      });
    }

    expect(engine.speed).toBeCloseTo(100.0, 2);
  });

  // --- Touch Spectator Mode Tests ---

  test('touch input uses spectator physics (no gravity)', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(150);

    // Apply touch input with forward movement only
    for (let i = 0; i < 10; i++) {
      engine.update(0.1, {
        yaw: 0,
        pitch: 0,
        roll: 0,
        throttle: 0,
        forward: 1.0,
        sideway: 0,
        vertical: 0,
        isTouch: true,
      });
    }

    // With no gravity, drone should NOT have fallen — y velocity should be ~0
    // (only forward movement along -Z, no downward pull)
    expect(engine.velocity.y).toBeCloseTo(0, 1);
    // Should have moved forward
    expect(engine.velocity.z).toBeLessThan(0);
  });

  test('touch translation speed is capped at half of cruiseSpeed', () => {
    const config = { ...DEFAULT_PHYSICS_CONFIG, cruiseSpeed: 30.0 };
    const engine = new FPVPhysicsEngine(config, flatTerrain);
    engine.spawn(150);

    // Accelerate forward at full deflection for many frames
    for (let i = 0; i < 100; i++) {
      engine.update(0.1, {
        yaw: 0,
        pitch: 0,
        roll: 0,
        throttle: 0,
        forward: 1.0,
        sideway: 0,
        vertical: 0,
        isTouch: true,
      });
    }

    // Touch speed should cap at cruiseSpeed * 0.5 = 15
    expect(engine.speed).toBeCloseTo(15.0, 0);
    expect(engine.speed).toBeLessThanOrEqual(15.01);
  });

  test('touch rotation sensitivity is halved compared to desktop', () => {
    // Desktop test: sensitivity = 0.024
    const engineDesktop = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engineDesktop.spawn(150);

    engineDesktop.update(0.1, {
      yaw: 10.0,
      pitch: 0,
      roll: 0,
      throttle: 0,
      forward: 0,
      sideway: 0,
      vertical: 0,
      isKeyboardMouse: true,
    });

    const desktopEuler = new THREE.Euler().setFromQuaternion(engineDesktop.rotation, 'YXZ');
    const desktopYawDelta = Math.abs(desktopEuler.y);

    // Touch test: sensitivity should be 0.012 (half of desktop 0.024)
    const engineTouch = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engineTouch.spawn(150);

    engineTouch.update(0.1, {
      yaw: 10.0,
      pitch: 0,
      roll: 0,
      throttle: 0,
      forward: 0,
      sideway: 0,
      vertical: 0,
      isTouch: true,
    });

    const touchEuler = new THREE.Euler().setFromQuaternion(engineTouch.rotation, 'YXZ');
    const touchYawDelta = Math.abs(touchEuler.y);

    // Touch yaw delta should be half of desktop yaw delta
    expect(touchYawDelta).toBeCloseTo(desktopYawDelta / 2, 5);
  });

  test('touch velocity decays when inputs are released', () => {
    const engine = new FPVPhysicsEngine(DEFAULT_PHYSICS_CONFIG, flatTerrain);
    engine.spawn(150);

    // Accelerate forward
    for (let i = 0; i < 10; i++) {
      engine.update(0.1, {
        yaw: 0,
        pitch: 0,
        roll: 0,
        throttle: 0,
        forward: 1.0,
        sideway: 0,
        vertical: 0,
        isTouch: true,
      });
    }

    const speedBeforeRelease = engine.speed;
    expect(speedBeforeRelease).toBeGreaterThan(0);

    // Release all inputs — velocity should decay via drag
    for (let i = 0; i < 10; i++) {
      engine.update(0.1, {
        yaw: 0,
        pitch: 0,
        roll: 0,
        throttle: 0,
        forward: 0,
        sideway: 0,
        vertical: 0,
        isTouch: true,
      });
    }

    expect(engine.speed).toBeLessThan(speedBeforeRelease);
    expect(engine.speed).toBeGreaterThanOrEqual(0);
  });
});
