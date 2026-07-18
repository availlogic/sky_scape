# Functional Test Cases: Sky Scape

This document contains functional test cases for the user interface and features of the Sky Scape FPV Drone Simulator. These tests cover keyboard/mouse inputs, mobile touch controls, UI telemetry elements, and settings configurations.

---

## 1. FPV Physics & Flight Dynamics (FR-PHYSICS)

### Feature Name: Momentum & Inertia Simulation
*   **Test Case ID:** FT-PHYS-01
*   **Preconditions:** Keyboard/Mouse mode is selected. The drone is spawned at default coordinates.
*   **Steps:**
    1. Press and hold `W` for 3 seconds to pitch the drone forward.
    2. Release `W`.
    3. Observe the drone's position and velocity.
*   **Expected Result:** The drone pitches forward and accelerates. Upon releasing `W`, it does not stop instantly; it continues to slide forward under momentum (coasting) while slowly losing velocity due to linear drag.
*   **Priority:** Critical

### Feature Name: Camera Damping Adjustments
*   **Test Case ID:** FT-PHYS-02
*   **Preconditions:** Drone is flying. Access to Settings is available.
*   **Steps:**
    1. Open Settings, set **Camera Damping** to `1.0` (no damping), close Settings.
    2. Execute a sharp yaw rotation (`A`/`D` or mouse pan).
    3. Open Settings, set **Camera Damping** to `0.05` (high damping), close Settings.
    4. Execute the same sharp yaw rotation.
*   **Expected Result:** At damping `1.0`, the camera is rigidly locked to the drone’s frame with zero latency. At damping `0.05`, the camera displays clear visual latency, panning smoothly behind the drone's rotation axis, simulating a heavy camera gimbal weight.
*   **Priority:** High

### Feature Name: Slide-Bounce Collision Handler
*   **Test Case ID:** FT-PHYS-03
*   **Preconditions:** The drone is in flight over a terrain chunk.
*   **Steps:**
    1. Throttle down (`E` key or drag mobile slider down) to descend rapidly.
    2. Fly directly into a hillslope at `15 m/s` forward speed.
    3. Observe collision behavior and structural integrity.
*   **Expected Result:** The drone does not crash, stop, or show a crash menu. Instead, it slides off or bounces away from the terrain boundary, pushing its position above the ground level and scaling down velocity vectors to prevent clipping.
*   **Priority:** Critical

---

## 2. Input Control Mappings (FR-INPUT)

### Feature Name: Keyboard & Mouse Flight Mappings
*   **Test Case ID:** FT-INPUT-01
*   **Preconditions:** Keyboard/Mouse mode is active.
*   **Steps:**
    1. Press `Q` to increase throttle.
    2. Press `E` to decrease throttle.
    3. Press `W`/`S` and check drone pitch change.
    4. Press `A`/`D` and check drone roll change.
    5. Pan mouse horizontally and vertically.
*   **Expected Result:**
    *   `Q` raises drone altitude velocity.
    *   `E` decreases altitude velocity.
    *   `W`/`S` tilts the drone forward/backward.
    *   `A`/`D` rolls/strafes the drone left/right.
    *   Horizontal mouse movement pans drone yaw; vertical mouse movement pans drone/camera pitch.
*   **Priority:** High

### Feature Name: Mobile Joystick Rendering and Input
*   **Test Case ID:** FT-INPUT-02
*   **Preconditions:** App is loaded on a touch-enabled mobile browser simulator.
*   **Steps:**
    1. Tap and drag the Left Joystick handle upwards.
    2. Drag Left Joystick handle to the right.
    3. Tap and drag the Right Joystick handle upwards.
    4. Drag the Height Slider on the right edge upwards.
*   **Expected Result:**
    *   Left Joystick drag up moves the drone forward.
    *   Left Joystick drag right strafes the drone right.
    *   Right Joystick drag up pitches the camera/attitude down.
    *   Height Slider drag up increases throttle, raising altitude.
*   **Priority:** Critical

### Feature Name: Mobile Joystick Inactivity Fading
*   **Test Case ID:** FT-INPUT-03
*   **Preconditions:** Touch joysticks are rendered on screen.
*   **Steps:**
    1. Release all touch contact from the screen.
    2. Wait for `2.5 seconds`.
    3. Observe joystick opacity.
    4. Tap anywhere within the joystick active zones.
*   **Expected Result:** After 2.5 seconds of inactivity, the virtual controls fade smoothly to `20%` opacity (Idle State) over 0.5s. Tapping/touching the controls immediately snaps their opacity back to `100%` (Active State).
*   **Priority:** Medium

---

## 3. Telemetry HUD Display (FR-UI)

### Feature Name: Telemetry HUD Layout
*   **Test Case ID:** FT-UI-01
*   **Preconditions:** The simulator is active in normal flight.
*   **Steps:**
    1. Observe the telemetry panel on the top-left, the biome badge in the top-center, and system status on the top-right.
    2. Increase speed using the Cruise Speed Slider.
    3. Verify text contrast.
*   **Expected Result:** Speedometer format is `SPEED: XX.X m/s`, altimeter is `ALT: XXX m`. Biome badge shows matching icon (e.g. `[ 🏜️ Desert ]`). Text remains readable with high-contrast borders/glassmorphism backdrop over light backgrounds.
*   **Priority:** High

### Feature Name: FPS Tracker and Warning States
*   **Test Case ID:** FT-UI-02
*   **Preconditions:** Flight simulation is running.
*   **Steps:**
    1. Observe FPS tracker color when frame rate is stable at `60 FPS`.
    2. Simulate a frame rate drop down to `52 FPS`.
*   **Expected Result:** FPS displays `60 FPS` in standard slate gray (`#1E293B`). When FPS falls below 55, the color shifts to warning amber (`#D97706`) within 1 second.
*   **Priority:** High

### Feature Name: Performance Optimization Alert
*   **Test Case ID:** FT-UI-03
*   **Preconditions:** App is running in Auto-Adaptive graphics mode.
*   **Steps:**
    1. Inject lower frame times to drop FPS below 55 for 3 seconds.
    2. Verify HUD warnings.
    3. Restore stable 60 FPS performance for 10 seconds.
*   **Expected Result:** When performance degrades below 55 FPS for 3s, the warning text `⚠️ Optimizing performance...` appears in the bottom-right corner. Once performance stabilizes at >58 FPS for 10s, this warning smoothly fades out.
*   **Priority:** Medium

---

## 4. Settings Panel UI (FR-UI)

### Feature Name: Settings Modal Invocation & Pause
*   **Test Case ID:** FT-UI-04
*   **Preconditions:** Drone is flying forward at `15 m/s`.
*   **Steps:**
    1. Click the gear icon or press `Esc`.
    2. Observe the background scene and drone movement.
    3. Click the close button `[X]` or press `Esc` again.
*   **Expected Result:** The Settings Panel overlay mounts with a blur backdrop. Flight physics pauses instantly (drone stops in mid-air). Closing the settings unpauses physics, resuming forward momentum.
*   **Priority:** High

### Feature Name: Biome Selection Change
*   **Test Case ID:** FT-UI-05
*   **Preconditions:** Settings panel is open. Active biome is "Forest".
*   **Steps:**
    1. Click on the "Desert" biome card.
    2. Observe visual indicators on the settings panel.
    3. Close the settings.
*   **Expected Result:** The "Desert" card gains a thick blue border (`#3B82F6`) and checkmark. A loading spinner displays briefly while the background terrain regenerates. The top-center HUD badge updates to `[ 🏜️ Desert ]` after closing settings.
*   **Priority:** High

### Feature Name: Graphics Mode Selection
*   **Test Case ID:** FT-UI-06
*   **Preconditions:** Settings panel is open.
*   **Steps:**
    1. Select Graphics Mode `[ Manual ]`.
    2. Observe the Quality options.
    3. Select `[ Low ]`.
    4. Select Graphics Mode `[ Auto-Adaptive ]`.
*   **Expected Result:** Selecting `[ Manual ]` enables the quality segments `[ Low ]`, `[ Medium ]`, and `[ High ]`. Clicking `[ Low ]` immediately reduces render distance. Switching back to `[ Auto-Adaptive ]` disables manual segment clicks, handing control back to the performance engine.
*   **Priority:** High

### Feature Name: Settings LocalStorage Persistence
*   **Test Case ID:** FT-UI-07
*   **Preconditions:** Default settings are loaded.
*   **Steps:**
    1. Open settings, change **Cruise Speed** to `25 m/s` and **Camera Damping** to `0.45`.
    2. Close the settings modal.
    3. Refresh the browser tab.
    4. Inspect LocalStorage and verify Settings overlay.
*   **Expected Result:** Mappings are saved under `skyscape_user_settings` in LocalStorage. On reloading, settings default to `25 m/s` and `0.45` damping, and the drone spawns with these parameters pre-configured.
*   **Priority:** Medium
