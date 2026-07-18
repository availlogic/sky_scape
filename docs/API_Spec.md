# TypeScript API Specification: Sky Scape

This document defines the TypeScript interface specifications and event-driven communication protocols for the **Sky Scape** core modules.

---

## 1. Input Module API

The input module translates physical device interactions (Keyboard, Mouse, Gamepad API) into unified controller values.

### 1.1 Types & Interfaces

```typescript
export interface DroneInputs {
    /** Yaw rotation rate: range [-1.0, 1.0] */
    yaw: number;
    /** Pitch rotation rate: range [-1.0, 1.0] */
    pitch: number;
    /** Roll rotation rate: range [-1.0, 1.0] */
    roll: number;
    /** Throttle value: range [0.0, 1.0] */
    throttle: number;
}

export interface IInputSource {
    /** Initialize listeners or search for connected devices */
    init(): void;
    /** Query current input state */
    poll(): DroneInputs;
    /** Cleanup listeners */
    destroy(): void;
}

export interface GamepadCalibration {
    /** Array index of the stick representing Yaw */
    yawAxis: number;
    /** Array index of the stick representing Pitch */
    pitchAxis: number;
    /** Array index of the stick representing Roll */
    rollAxis: number;
    /** Array index of the stick representing Throttle */
    throttleAxis: number;
    /** Inversion map: true if the axis value needs to be negated */
    inverted: {
        yaw: boolean;
        pitch: boolean;
        roll: boolean;
        throttle: boolean;
    };
}
```

### 1.2 Interactive Calibration Wizard Events
The Gamepad Calibrator uses a simple event emitter interface to guide the user:

```typescript
export type CalibrationStep = 'idle' | 'throttle_min' | 'throttle_max' | 'yaw_left' | 'pitch_up' | 'roll_right' | 'complete';

export interface CalibrationEventMap {
    'stepChange': (step: CalibrationStep) => void;
    'stickValueDetected': (axisIndex: number, value: number) => void;
    'calibrationComplete': (result: GamepadCalibration) => void;
}
```

---

## 2. Physics & Flight Module API

Computes momentum-based drone dynamics and applies camera damping.

### 2.1 Types & Interfaces

```typescript
import * as THREE from 'three';

export interface PhysicsConfig {
    /** Max thrust acceleration in m/s² */
    maxThrust: number;
    /** Linear drag coefficient */
    linearDrag: number;
    /** Angular drag coefficient */
    angularDrag: number;
    /** Gravity constant in m/s² (usually 9.81) */
    gravity: number;
    /** Mass of the drone in kg (controls linear inertia) */
    mass: number;
    /** Damping factor for camera tracking: range [0.01, 1.0] (1.0 = zero lag) */
    cameraDamping: number;
    /** Camera distance behind the drone in meters */
    cameraDistance: number;
}

export interface IDronePhysics {
    /** Current position of the drone in 3D space */
    position: THREE.Vector3;
    /** Current velocity vector of the drone in m/s */
    velocity: THREE.Vector3;
    /** Current rotation quaternion of the drone */
    rotation: THREE.Quaternion;
    /** Speed of the drone in m/s */
    speed: number;
    
    /** Reset drone position to target height */
    spawn(height: number): void;
    /** Step simulation forward by deltaTime (seconds) using polled inputs */
    update(deltaTime: number, inputs: DroneInputs): void;
    /** Returns the smoothed camera target position and lookAt vector */
    getCameraState(): { position: THREE.Vector3; target: THREE.Vector3 };
}
```

---

## 3. Terrain & Biome Module API

Manages noise heightmaps generation, chunk placement, and instanced vegetation.

### 3.1 Types & Interfaces

```typescript
export interface NoiseConfig {
    frequency: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
    domainWarpAmplitude: number;
}

export interface IBiomeConfig {
    name: string;
    /** Base terrain color scheme (for GPU shader mapping) */
    primaryColor: string;
    secondaryColor: string;
    waterColor: string;
    /** Noise generation params */
    noise: NoiseConfig;
    /** Maximum elevation limits in meters */
    maxElevation: number;
    /** Vegetation distribution templates */
    foliage: Array<{
        type: 'tree' | 'rock' | 'grass';
        density: number; // instances per chunk
        scaleMin: number;
        scaleMax: number;
    }>;
}

export interface ITerrainChunk {
    x: number;
    z: number;
    /** WebGL / WebGPU geometry container */
    mesh: THREE.Mesh | null;
    /** Array of instanced mesh references */
    foliageInstances: Array<THREE.InstancedMesh>;
    /** Whether chunk is loaded and visible */
    isReady: boolean;
    
    /** Build geometry and run height shader displacement */
    initialize(renderer: THREE.WebGLRenderer | GPUDevice): Promise<void>;
    /** Delete geometry, instances, and release GPU resources */
    dispose(): void;
}

export interface ITerrainManager {
    /** Map of active chunks: key format "x,z" */
    activeChunks: Map<string, ITerrainChunk>;
    /** Current active chunk coordinate based on target position */
    currentChunkCoord: THREE.Vector2;
    
    /** Update visible chunks based on drone position and current render radius */
    updateVisibleChunks(position: THREE.Vector3, renderRadius: number): void;
    /** Switch active biome and clear/regenerate all chunks */
    setBiome(biome: IBiomeConfig): void;
}
```

---

## 4. Adaptive Performance Engine API

Tracks framerate health and controls graphics quality presets dynamically.

### 4.1 Types & Interfaces

```typescript
export type PerformanceStateLevel = 0 | 1 | 2 | 3; // 0 = High, 3 = Ultra-Low

export interface PerformanceState {
    level: PerformanceStateLevel;
    renderRadius: number; // chunk count
    renderScale: number;  // internal resolution multiplier (0.5 to 1.0)
    enableShadows: boolean;
    foliageScale: number;  // density multiplier (0.0 to 1.0)
    waterComplexity: 'high' | 'medium' | 'low' | 'flat';
}

export interface IPerformanceMonitor {
    /** Get current performance configuration settings */
    currentState: PerformanceState;
    /** Push rendering tick time (duration in ms) to monitor buffer */
    recordFrame(frameTimeMs: number): void;
    /** Subscribe to quality adjustments */
    onStateChange(callback: (newState: PerformanceState) => void): void;
}
```

---

## 5. Storage Module API

Reads and writes settings and calibration matrices locally.

### 5.1 Types & Interfaces

```typescript
export interface UserSettings {
    biomeName: string;
    graphicsQuality: 'auto' | 'high' | 'medium' | 'low';
    cruiseSpeed: number; // m/s
    cameraDamping: number; // range [0.0, 1.0]
    expoFactor: number; // range [0.0, 1.0]
}

export interface IStorageManager {
    /** Fetch saved configurations. Returns defaults if key does not exist. */
    loadSettings(): UserSettings;
    /** Persist settings object to LocalStorage */
    saveSettings(settings: UserSettings): boolean;
    /** Fetch saved physical controller mapping matrices. Returns null if uncalibrated. */
    loadGamepadCalibration(): GamepadCalibration | null;
    /** Save gamepad calibration parameters */
    saveGamepadCalibration(calibration: GamepadCalibration): boolean;
    /** Clear all data */
    clear(): void;
}
```
