# Integration Test Cases: Sky Scape

This document contains integration test cases validating system boundaries, contract interfaces, and event-driven workflows across the Sky Scape core modules.

---

## 1. Input Module ↔ Physics Engine Mappings

### Test Case: Unified Control Value Translation
*   **Test Case ID:** IT-IN-PHYS-01
*   **Description:** Verify that raw device inputs (Keyboard, Mouse, Gamepad API) are translated by `IInputSource` and passed to `IDronePhysics.update` within the required ranges.
*   **Preconditions:** Active input polling loops are running.
*   **Contract Under Test:** `IInputSource.poll()` -> returns `DroneInputs` -> `IDronePhysics.update(deltaTime, inputs)`
*   **Test Steps:**
    1. Inject raw keyboard state: hold `W` (pitch push) and press `Q` (throttle increase).
    2. Call `IInputSource.poll()`. Verify output values.
    3. Feed output values to `IDronePhysics.update(0.016, inputs)`.
    4. Inject extreme stick values (e.g., raw stick axis value of `1.5` from Gamepad API).
    5. Call `poll()` and inspect boundary clamping.
*   **Expected Results:**
    *   `poll()` returns `yaw: 0.0`, `pitch: -1.0` (or matching negative pitch push), `roll: 0.0`, `throttle: 1.0`.
    *   Drone position updates dynamically according to thrust acceleration and momentum equations.
    *   Extreme input value `1.5` is clamped to the `[-1.0, 1.0]` contract boundary before being processed by the physics equations.
*   **Failure Handling & Resilience:** If `poll()` fails or returns `NaN` fields, the physics engine must catch the exception, fallback to a neutral input state (`0` for rotation, current throttle rate), and log the warning without crashing the loop.

---

## 2. Storage Manager ↔ LocalStorage Schema Integrity

### Test Case: LocalStorage Configuration Corruption Recovery
*   **Test Case ID:** IT-ST-DB-01
*   **Description:** Verify that `IStorageManager` validates data against schemas and handles corrupted or incompatible LocalStorage records gracefully.
*   **Preconditions:** Access to browser LocalStorage is initialized.
*   **Contract Under Test:** `IStorageManager.loadSettings()` and `IStorageManager.loadGamepadCalibration()`
*   **Test Steps:**
    1. Write a valid settings profile JSON string into `window.localStorage.getItem('skyscape_user_settings')`.
    2. Call `loadSettings()`. Verify settings load correctly.
    3. Intentionally write an invalid JSON string (e.g., `"{biomeName: 'Mars', graphicsQuality: 'ultra_high'}"` - which violates schema enum limits) to the storage key.
    4. Call `loadSettings()`.
    5. Write a corrupt/non-JSON string (e.g., `"CRASH_TEST"`) into the gamepad mapping storage key `skyscape_controller_mappings`.
    6. Call `loadGamepadCalibration()`.
*   **Expected Results:**
    *   Valid JSON loads successfully.
    *   Invalid biome `Mars` or quality `ultra_high` triggers schema validation failures. `loadSettings()` automatically discards the corrupted file, loads default settings (Forest biome, auto-adaptive quality), writes the valid default profile back to LocalStorage, and returns the default profile object.
    *   Non-JSON string in mappings triggers a parsing exception catch. `loadGamepadCalibration()` handles the error, clears the corrupted key, returns `null` (uncalibrated state), and prevents app launch failure.
*   **Failure Handling & Resilience:** Write operations are wrapped in try-catch blocks. If storage space is full (`QuotaExceededError`), the save action fails gracefully by returning `false` instead of throwing an unhandled exception.

---

## 3. Terrain Manager ↔ Biome Config ↔ GPU Buffer Allocations

### Test Case: Chunk Load, Displacement, and Disposal Lifecycle
*   **Test Case ID:** IT-TER-GPU-01
*   **Description:** Validate that chunks are streamed dynamically based on drone coordinates and discarded chunks release all GPU memory buffers.
*   **Preconditions:** WebGPU/WebGL 2 context is initialized.
*   **Contract Under Test:** `ITerrainManager.updateVisibleChunks(position, renderRadius)` and `ITerrainChunk.initialize()` / `ITerrainChunk.dispose()`
*   **Test Steps:**
    1. Set the drone position to `(0, 0, 0)`. Call `updateVisibleChunks` with a radius of 3.
    2. Check that the `activeChunks` map has 9 loaded chunks (coordinates from `(-1,-1)` to `(1,1)`).
    3. Update the drone position to `(128, 0, 0)` (moving 2 chunks East).
    4. Call `updateVisibleChunks` again.
    5. Track chunk statuses and inspect active VRAM buffers.
*   **Expected Results:**
    *   New chunks are generated and initialized on the GPU via shader height displacement.
    *   Chunks that fell outside the radius (e.g., `x < -1` columns) are deleted from the map, and their `dispose()` methods are executed.
    *   `dispose()` immediately deletes plane geometries, unbinds materials, and releases instance attribute buffers to keep VRAM footprint under 256 MB.
*   **Failure Handling & Resilience:** If a chunk fails to initialize on the GPU (e.g., shader compile error), it is marked as `isReady = false` but is not re-attempted infinitely. A placeholder flat chunk is rendered to preserve flight continuity.

---

## 4. Gamepad Calibrator ↔ Wizard UI Event Flow

### Test Case: Step-by-Step Calibration Event Dispatching
*   **Test Case ID:** IT-CAL-UI-01
*   **Description:** Verify the interactive gamepad calibration wizard correctly isolates axes and emits validation states to the front-end layout.
*   **Preconditions:** Gamepad controller is plugged in. Input mode is set to Gamepad.
*   **Contract Under Test:** `CalibrationEventMap` event handler listeners.
*   **Test Steps:**
    1. Initialize the calibration helper. Step changes to `throttle_min`.
    2. Push throttle stick to minimum. Verify `stickValueDetected` is emitted with the isolated channel index.
    3. Trigger step change to `throttle_max`, `yaw_left`, `pitch_up`, and `roll_right` consecutively, feeding stick inputs.
    4. Verify final results payload matches `GamepadCalibration` structure.
*   **Expected Results:**
    *   `stepChange` event correctly fires with active step names.
    *   `stickValueDetected` isolates the correct axis index by selecting the channel with the largest delta change.
    *   `calibrationComplete` delivers a fully formed `GamepadCalibration` object containing correct axis indexes and inversion flags.
*   **Failure Handling & Resilience:** If the user cancels the wizard mid-step, the calibrator cleanly calls `destroy()`, clears temporary listening hooks, and does not overwrite current mappings in LocalStorage.

---

## 5. Performance Engine ↔ Render Engine Preset Adjustments

### Test Case: Rolling FPS Threshold State Shift
*   **Test Case ID:** IT-PERF-REND-01
*   **Description:** Validate that the Adaptive Performance Degradation Engine computes average FPS and triggers render quality state updates.
*   **Preconditions:** Game loop is running.
*   **Contract Under Test:** `IPerformanceMonitor.recordFrame(frameTimeMs)` and `onStateChange` callbacks.
*   **Test Steps:**
    1. Register callback via `onStateChange`.
    2. Feed stable frame times of `16.6ms` (60 FPS) to `recordFrame` for 10 seconds. Verify performance level remains at `0`.
    3. Feed poor frame times of `20.0ms` (50 FPS) to `recordFrame` for 4 seconds.
    4. Observe callback execution and output `PerformanceState` params.
    5. Feed poor frame times of `23.0ms` (43 FPS) for 4 seconds. Verify level degrades further.
    6. Restore frame times of `16.6ms` for 12 seconds. Observe recovery behavior.
*   **Expected Results:**
    *   At stable 60 FPS, state level remains at `0`.
    *   After 3 seconds of sub-55 FPS performance, level shifts to `1` (or State 1). The callback executes, changing `renderRadius` and increasing fog.
    *   After another 3 seconds of sub-45 FPS, state level shifts down. `renderScale` is reduced to 75% or 50% and shadows are disabled.
    *   Once FPS remains above 58 for 10 seconds, the engine triggers recovery, incrementing state back towards level `0`.
*   **Failure Handling & Resilience:** Performance states cannot exceed level `3` (Ultra-Low) or fall below level `0` (High). State transitions are debounced to prevent visual settings flickering.
