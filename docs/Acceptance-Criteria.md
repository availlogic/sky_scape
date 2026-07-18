# Acceptance Criteria: Sky Scape

This document defines the deterministic acceptance conditions and Definition of Done (DoD) for each major feature of the Sky Scape flight simulator, derived from the Product Requirements Document (PRD).

---

## 1. Feature: FPV Flight Physics & Damping (FR-PHYSICS)

### Acceptance Conditions
*   **Spawn Height:** The drone must spawn in mid-air at an altitude between 100 meters and 200 meters above ground level.
*   **Inertia:** Flight dynamics must incorporate drag and angular momentum. When forward pitch input is cut, forward velocity must decay exponentially via a linear drag coefficient rather than stopping instantly.
*   **Damping:** Camera damping must be adjustable. A lower damping coefficient (e.g. `0.05`) must visually delay the camera tracking rate relative to the drone's position, smoothing out high-frequency movement spikes.
*   **Expo Curves:** Adjustable Expo curves must soften center-stick sensitivity according to:
    \[
    \text{Output} = \text{Input} \times (1 - \text{Expo}) + \text{Input}^3 \times \text{Expo}
    \]
*   **No-Damage Collisions:** Colliding with terrain or foliage must not terminate the flight session or display crash overlays. The physics loop must slide-bounce the drone, adjusting its altitude above the terrain elevation and reducing velocity.

### Definition of Done (DoD)
1.  All physics update functions pass Vitest unit tests verifying correct Euler integration.
2.  Slide-bounce physics is verified to prevent clipping under the terrain mesh for at least 5 minutes of continuous flying.

---

## 2. Feature: Dual-Input System & Keyboard/Mouse Controls (FR-INPUT)

### Acceptance Conditions
*   **Keyboard Layout:** Standard PC keys must map exactly to:
    *   `W` / `S`: Pitch down / up (forward / backward tilt)
    *   `A` / `D`: Roll left / right bank
    *   `Q` / `E`: Raise / lower throttle velocity (altitude control)
*   **Mouse Look:** Horizontal mouse movements must steer Yaw; vertical mouse movements must steer camera/attitude Pitch.
*   **Input Clamping:** Input signals from all sources must be clamped to the range `[-1.0, 1.0]` (throttle range `[0.0, 1.0]`) before updating physics forces.

### Definition of Done (DoD)
1.  Keyboard keydown listeners bind and trigger the correct flight force variables.
2.  Mouse pointer locks to the viewport during active flight to prevent cursor exit.
3.  Playwright tests assert correct input values in the `poll()` return payload.

---

## 3. Feature: Gamepad API & Calibration Wizard (FR-INPUT)

### Acceptance Conditions
*   **Native Detection:** Plugging in a USB FPV transmitter or controller must trigger an on-screen prompt: *"New Gamepad Detected! Run Calibration Wizard?"* if no profile exists in LocalStorage.
*   **Calibration Wizard Steps:** The wizard must support a 5-step flow (Welcome -> Throttle -> Yaw -> Pitch -> Roll -> Verification).
*   **Stick Isolating:** Moving sticks during calibration must automatically isolate and map the active axis index by tracking maximum deflection.
*   **Verification Crosshair:** Step 5 must render a square coordinate box with crosshairs and a dot that moves dynamically to show Pitch/Roll axis values.
*   **Inversion Flags:** Checkboxes must let the user invert each axis individually. Saving must persist these mappings to LocalStorage immediately.

### Definition of Done (DoD)
1.  Playwright E2E calibration tests successfully mock a USB gamepad, complete the steps, and verify LocalStorage mappings match the configuration.
2.  Disconnecting the gamepad mid-flight pauses the physics simulation and opens the gamepad disconnection warning overlay.

---

## 4. Feature: Mobile Touch Joysticks & Idle Fading (FR-INPUT)

### Acceptance Conditions
*   **Layout Render:** If touch interface capabilities are detected, the app must render dual virtual joysticks at the bottom corners and a vertical height slider on the right edge.
*   **Touch Targets:** Active touch targets for joysticks must be a minimum of `140px x 140px` to allow fat-finger ease of use.
*   **Opacity States:**
    *   Active touch events on control zones keep opacity at `100%`.
    *   Releasing touch input (idle state) for more than `2.5 seconds` must trigger a linear transition over `0.5 seconds` reducing opacity to `20%`.
    *   Tapping the zone again must instantly restore opacity to `100%`.

### Definition of Done (DoD)
1.  Device-emulated touch tests verify that joysticks load on touch devices and are omitted on desktop environments.
2.  Playwright tests verify the transition from 100% opacity to 20% opacity after the idle timeout period.

---

## 5. Feature: Procedural Terrain & Biomes (FR-TERRAIN)

### Acceptance Conditions
*   **Procedural Heightmaps:** Terrain must be generated procedurally on the GPU using multi-octave Simplex noise with FBM.
*   **Four Biomes:** The engine must support four distinct biomes (Desert, Forest, Snowland, Coastlines) with matching color palettes and instanced foliage templates.
*   **Infinite Chunk Streaming:** Terrain must stream in 64x64 grids. New chunks load ahead of the flight path; chunks outside the active render radius are disposed of.
*   **Foliage Placement:** Foliage instances must match the biome layout and render directly on the terrain surface (no floating trees, no buried instances).

### Definition of Done (DoD)
1.  Graphics contexts support WebGPU with an automatic fallback to WebGL 2.0 if WebGPU is unavailable.
2.  Switching biomes regenerates terrain without reloading the browser tab.
3.  VRAM allocations remain under `256 MB` for the terrain and instances cache.

---

## 6. Feature: Adaptive Performance Degradation Engine (FR-PERFORMANCE)

### Acceptance Conditions
*   **FPS Monitoring:** Frame rates must be monitored continuously, computing a rolling average every 1 second.
*   **Automated Quality Shifting:**
    *   If FPS drops below 55 for 3s, quality shifts from State 0 (High) to State 1.
    *   If FPS drops below 50 for 3s, quality shifts to State 2.
    *   If FPS drops below 45 for 3s, quality shifts to State 3.
*   **Subtle Status Feedback:** When downscaling, the HUD warning text `⚠️ Optimizing performance...` must display in the bottom-right corner.
*   **Recovery:** Once FPS remains above 58 for 10s, quality steps up toward State 0. The HUD warning fades out when baseline High quality is restored.

### Definition of Done (DoD)
1.  Playwright E2E simulation verifies the state machine shifts down when mock frame times are slow and recovers when frame times are fast.
2.  A 5-minute flight test maintains a stable 60 FPS on target reference hardware.

---

## 7. Feature: Settings UI & Storage Persistence (FR-UI)

### Acceptance Conditions
*   **Modal Pause:** Accessing Settings pauses the physics engine and applies a `blur(8px)` backdrop filter to the viewport.
*   **Biome Card Selection:** The active biome must display with a thick blue border (`#3B82F6`) and checkmark icon.
*   **Settings Persistence:** User settings must save to LocalStorage key `skyscape_user_settings` and auto-load on tab refreshes.

### Definition of Done (DoD)
1.  LocalStorage parsing catches exceptions and recovers cleanly if invalid JSON is injected.
2.  Pressing `Esc` successfully closes the modal and resumes flight.

---

## 8. Feature: PWA Offline Availability (FR-OFFLINE)

### Acceptance Conditions
*   **Offline Support:** Once cached on initial load, turning off network access and refreshing the tab must successfully boot the simulator.
*   **Load Speeds:** Page initialization (static shell assets load) must complete in under 3 seconds.

### Definition of Done (DoD)
1.  The PWA manifest registers and service worker caches all static assets listed in the caching manifest.
2.  Playwright offline context reload succeeds and displays the functional HUD overlay.
