import * as THREE from 'three';
import type { DroneInputs } from '../controls/types';
import type { IDronePhysics, PhysicsConfig, TerrainHeightFn } from './types';
import { DEFAULT_PHYSICS_CONFIG } from './types';
import { clamp } from '../utils/math';

export class FPVPhysicsEngine implements IDronePhysics {
  public readonly position = new THREE.Vector3();
  public readonly velocity = new THREE.Vector3();
  public readonly rotation = new THREE.Quaternion();
  public readonly angularVelocity = new THREE.Vector3(); // x = pitch rate, y = yaw rate, z = roll rate
  public speed = 0;

  private config: PhysicsConfig;
  private heightFn: TerrainHeightFn;
  private cameraPosition = new THREE.Vector3();
  private hasOperated = false;

  // Angular rate constants
  private readonly maxAngularAcc = 35.0; // rad/s^2

  constructor(config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG, heightFn: TerrainHeightFn = () => 0) {
    this.config = config;
    this.heightFn = heightFn;
    this.spawn(150); // Default spawn height between 100-200m
  }

  public spawn(height: number): void {
    this.position.set(0, height, 0);
    this.velocity.set(0, 0, 0);
    this.rotation.set(0, 0, 0, 1);
    this.angularVelocity.set(0, 0, 0);
    this.speed = 0;
    this.hasOperated = false;

    // Position camera behind the drone initially
    const forward = new THREE.Vector3(0, 0, -1);
    this.cameraPosition.copy(this.position).addScaledVector(forward, -this.config.cameraDistance);
    const terrainHeight = this.heightFn(this.cameraPosition.x, this.cameraPosition.z);
    if (this.cameraPosition.y < terrainHeight + 1.0) {
      this.cameraPosition.y = terrainHeight + 1.0;
    }
  }

  public update(deltaTime: number, inputs: DroneInputs): void {
    // Avoid updating with 0 or negative time steps
    if (deltaTime <= 0) return;

    // 1. Hover state logic: only start physics after user performs any non-neutral input
    if (!this.hasOperated) {
      const isOperating =
        Math.abs(inputs.yaw) > 1e-4 ||
        Math.abs(inputs.pitch) > 1e-4 ||
        Math.abs(inputs.roll) > 1e-4 ||
        Math.abs(inputs.throttle) > 1e-4 ||
        Math.abs(inputs.forward || 0) > 1e-4 ||
        Math.abs(inputs.sideway || 0) > 1e-4 ||
        Math.abs(inputs.vertical || 0) > 1e-4;

      if (isOperating) {
        this.hasOperated = true;
      } else {
        // Drone hovers in place: no gravity, no movement
        return;
      }
    }

    if (inputs.isKeyboardMouse || inputs.isTouch) {
      // --- Spectator Fly-Camera Control Logic ---

      // Update orientation (yaw & pitch) via mouse deltas or touch joystick
      const euler = new THREE.Euler().setFromQuaternion(this.rotation, 'YXZ');
      let yawAngle = euler.y;
      let pitchAngle = euler.x;

      // Touch sensitivity is halved compared to desktop
      const sensitivity = inputs.isTouch ? 0.012 : 0.024;
      yawAngle -= inputs.yaw * sensitivity;
      pitchAngle -= inputs.pitch * sensitivity;

      // Limit pitch look angle to prevent going upside down
      const pitchLimit = (85 * Math.PI) / 180;
      pitchAngle = clamp(pitchAngle, -pitchLimit, pitchLimit);

      this.rotation.setFromEuler(new THREE.Euler(pitchAngle, yawAngle, 0, 'YXZ'));
      this.angularVelocity.set(0, 0, 0);

      // Update position via keyboard keys W/S/A/D/Q/E or touch joystick
      const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rotation);
      const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.rotation);
      const verticalDir = new THREE.Vector3(0, 1, 0);

      const moveDirection = new THREE.Vector3();
      if (inputs.forward) moveDirection.addScaledVector(forwardDir, inputs.forward);
      if (inputs.sideway) moveDirection.addScaledVector(rightDir, inputs.sideway);
      if (inputs.vertical) moveDirection.addScaledVector(verticalDir, inputs.vertical);

      // Touch speed is halved compared to desktop
      const baseCruise = this.config.cruiseSpeed ?? 30.0;
      const maxSpeed = inputs.isTouch ? baseCruise * 0.5 : baseCruise;
      const accel = maxSpeed * 10.0;
      const drag = 5.0;


      if (moveDirection.lengthSq() > 0) {
        moveDirection.normalize();
        this.velocity.addScaledVector(moveDirection, accel * deltaTime);
      }

      // Apply linear drag
      this.velocity.multiplyScalar(Math.max(0, 1 - drag * deltaTime));

      // Clamp max speed
      if (this.velocity.length() > maxSpeed) {
        this.velocity.setLength(maxSpeed);
      }

      this.speed = this.velocity.length();
      this.position.addScaledVector(this.velocity, deltaTime);

      // Slide-bounce collision resolution (against terrain)
      const terrainHeight = this.heightFn(this.position.x, this.position.z);
      const safetyMargin = 1.0;
      if (this.position.y < terrainHeight + safetyMargin) {
        this.position.y = terrainHeight + safetyMargin;
        this.velocity.y = Math.max(0, this.velocity.y);
        this.velocity.multiplyScalar(0.7);
        this.speed = this.velocity.length();
      }

      // Update camera follow (damped)
      const targetCamPos = this.position
        .clone()
        .addScaledVector(forwardDir, -this.config.cameraDistance);
      targetCamPos.y += 1.5;

      this.cameraPosition.lerp(targetCamPos, this.config.cameraDamping);

      // Prevent camera from clipping through terrain
      const camTerrainHeight = this.heightFn(this.cameraPosition.x, this.cameraPosition.z);
      if (this.cameraPosition.y < camTerrainHeight + 1.0) {
        this.cameraPosition.y = camTerrainHeight + 1.0;
      }
    } else {
      // --- Original FPV ACRO Physics Logic ---

      const pInput = isNaN(inputs.pitch) ? 0 : clamp(inputs.pitch, -1, 1);
      const rInput = isNaN(inputs.roll) ? 0 : clamp(inputs.roll, -1, 1);
      const yInput = isNaN(inputs.yaw) ? 0 : clamp(inputs.yaw, -1, 1);
      const tInput = isNaN(inputs.throttle) ? 0 : clamp(inputs.throttle, 0, 1);

      const pitchAcc = pInput * this.maxAngularAcc;
      const yawAcc = yInput * (this.maxAngularAcc * 0.5);
      const rollAcc = rInput * this.maxAngularAcc;

      this.angularVelocity.x += pitchAcc * deltaTime;
      this.angularVelocity.y += yawAcc * deltaTime;
      this.angularVelocity.z += rollAcc * deltaTime;

      this.angularVelocity.multiplyScalar(Math.max(0, 1 - this.config.angularDrag * deltaTime));

      const deltaRot = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          this.angularVelocity.x * deltaTime,
          this.angularVelocity.y * deltaTime,
          -this.angularVelocity.z * deltaTime,
          'YXZ',
        ),
      );
      this.rotation.multiply(deltaRot).normalize();

      const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.rotation);
      const thrustAcc = localUp.multiplyScalar((tInput * this.config.maxThrust) / this.config.mass);
      const gravityAcc = new THREE.Vector3(0, -this.config.gravity, 0);

      const totalAcc = thrustAcc.add(gravityAcc);
      this.velocity.addScaledVector(totalAcc, deltaTime);

      this.velocity.multiplyScalar(Math.max(0, 1 - this.config.linearDrag * deltaTime));
      this.speed = this.velocity.length();
      this.position.addScaledVector(this.velocity, deltaTime);

      const terrainHeight = this.heightFn(this.position.x, this.position.z);
      const safetyMargin = 1.0;
      if (this.position.y < terrainHeight + safetyMargin) {
        this.position.y = terrainHeight + safetyMargin;
        this.velocity.y = Math.abs(this.velocity.y) * 0.3;
        this.velocity.multiplyScalar(0.7);
        this.speed = this.velocity.length();
      }

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rotation);
      const targetCamPos = this.position
        .clone()
        .addScaledVector(forward, -this.config.cameraDistance);
      targetCamPos.y += 1.5;

      this.cameraPosition.lerp(targetCamPos, this.config.cameraDamping);

      const camTerrainHeight = this.heightFn(this.cameraPosition.x, this.cameraPosition.z);
      if (this.cameraPosition.y < camTerrainHeight + 1.0) {
        this.cameraPosition.y = camTerrainHeight + 1.0;
      }
    }
  }

  public getCameraState(): { position: THREE.Vector3; target: THREE.Vector3 } {
    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rotation);
    return {
      position: this.cameraPosition.clone(),
      target: this.cameraPosition.clone().add(forwardDir),
    };
  }

  // Allow dynamic updates to camera damping
  public setCameraDamping(damping: number): void {
    this.config.cameraDamping = clamp(damping, 0.01, 1.0);
  }

  // Allow dynamic updates to cruise speed limit
  public setCruiseSpeed(speed: number): void {
    this.config.cruiseSpeed = clamp(speed, 5.0, 100.0);
  }
}
export default FPVPhysicsEngine;
