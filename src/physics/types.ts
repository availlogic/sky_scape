import * as THREE from 'three';
import type { DroneInputs } from '../controls/types';

/**
 * Configurable physics parameters for the FPV drone.
 */
export interface PhysicsConfig {
  /** Maximum thrust acceleration (m/s²) */
  maxThrust: number;
  /** Linear drag coefficient — decelerates translational movement */
  linearDrag: number;
  /** Angular drag coefficient — decelerates rotational movement */
  angularDrag: number;
  /** Gravitational acceleration (m/s²), typically 9.81 */
  gravity: number;
  /** Drone mass (kg) */
  mass: number;
  /** Camera follow damping factor [0.01, 1.0] — lower = smoother */
  cameraDamping: number;
  /** Camera distance behind drone (meters) */
  cameraDistance: number;
  /** Cruise speed limit for spectator mode (m/s) */
  cruiseSpeed?: number;
}

/**
 * Contract for the FPV physics engine.
 */
export interface IDronePhysics {
  readonly position: THREE.Vector3;
  readonly velocity: THREE.Vector3;
  readonly rotation: THREE.Quaternion;
  readonly speed: number;

  /** Place drone at a given altitude, reset velocity. */
  spawn(height: number): void;

  /** Advance physics by deltaTime seconds using the supplied inputs. */
  update(deltaTime: number, inputs: DroneInputs): void;

  /** Get the damped camera position and look-at target. */
  getCameraState(): { position: THREE.Vector3; target: THREE.Vector3 };

  /** Allow dynamic updates to cruise speed. */
  setCruiseSpeed(speed: number): void;

  /** Allow dynamic updates to camera damping. */
  setCameraDamping(damping: number): void;
}

/**
 * Function signature for querying terrain height at a world position.
 * Used by physics for slide-bounce collision.
 */
export type TerrainHeightFn = (x: number, z: number) => number;

/**
 * Default physics config matching the PRD specifications.
 */
export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  maxThrust: 20.0,
  linearDrag: 0.5,
  angularDrag: 3.0,
  gravity: 9.81,
  mass: 1.0,
  cameraDamping: 0.15,
  cameraDistance: 8.0,
  cruiseSpeed: 30.0,
};
