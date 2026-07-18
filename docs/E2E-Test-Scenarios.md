# End-to-End (E2E) Test Scenarios: Sky Scape

This document specifies the end-to-end user journeys for the Sky Scape flight simulator. All E2E test cases MUST be automated using **Playwright** browser simulation. The test scenarios define exact execution scripts and browser assertions.

---

## 1. Desktop Flight & Biome Swap Journey (E2E-01)

### User Flow Reference: Journey 1 (Desktop Zen Explorer)
*   **Target Device:** Desktop (1920x1080 Viewport, Keyboard & Mouse)
*   **Playwright Test Script Plan:**
    1. Launch browser and navigate to the application root URL.
    2. Wait for the loading overlay to appear (`.loading-screen`) and assert it contains a progress bar.
    3. Wait for the loading screen to transition to hidden (timeout max `3000ms`).
    4. Assert that the flight HUD overlay is visible (`#flight-hud`) and displaying speed telemetry (e.g. `SPEED: 15.0 m/s`) and the default biome badge `[ 🌲 Forest ]`.
    5. Simulate key down events: Press and hold `W` for 2 seconds. Verify that speed telemetry increases and the camera moves forward.
    6. Hover mouse cursor near the right edge of the screen to reveal the Cruise Speed Slider (`#cruise-speed-slider`).
    7. Drag the slider handle to the top position. Assert that telemetry speed changes to `30.0 m/s`.
    8. Click the Settings gear button (`#settings-gear-btn`) in the top-right corner.
    9. Assert that the Settings Modal (`#settings-modal`) is visible and flight physics are paused (check that position coordinate values stop updating).
    10. Locate the Biome Selector Grid and click the card labeled **🏜️ Desert** (`.biome-card[data-biome="desert"]`).
    11. Assert that a loading indicator (`.biome-loading-spinner`) appears on the settings card.
    12. Click `[ Close & Save Settings ]` (`#save-settings-btn`).
    13. Assert that the settings modal fades out, the HUD biome badge updates to `[ 🏜️ Desert ]`, and the terrain geometry color shifts to yellow sand dunes.
*   **Required Assertions:**
    *   `await expect(page.locator('#flight-hud')).toBeVisible();`
    *   `await expect(page.locator('#settings-modal')).toBeVisible();`
    *   `await expect(page.locator('#biome-badge-text')).toHaveText(/Desert/);`
    *   Validate that flight physics resume after closing settings.

---

## 2. Mobile Joystick Layout & Idle Fading Journey (E2E-02)

### User Flow Reference: Journey 2 (Mobile Touchscreen Explorer)
*   **Target Device:** Emulated Mobile/Tablet Touchscreen (iPad Landscape, Touch Enabled)
*   **Playwright Test Script Plan:**
    1. Launch browser simulator with mobile touch settings enabled:
       ```typescript
       const context = await browser.newContext({
         viewport: { width: 1024, height: 768 },
         userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)',
         hasTouch: true,
       });
       ```
    2. Navigate to the application root URL.
    3. Wait for the simulator page to load and hide the progress bar.
    4. Assert that the virtual joysticks (`#left-joystick`, `#right-joystick`) and the altitude slider (`#height-slider`) are mounted and rendered on screen.
    5. Dispatch touch/pointer events to simulate active interaction:
       *   Trigger `pointerdown` and `pointermove` on `#left-joystick` coordinate zones.
       *   Assert that the joystick opacity style is `1` (or `100%`).
    6. Release touch input (`pointerup`).
    7. Wait for `2.5 seconds` using `page.waitForTimeout(2500)`.
    8. Assert that the joysticks and slider opacity styles transition to `0.2` (20% opacity) for high landscape visibility.
    9. Dispatch `pointerdown` on `#left-joystick` again.
    10. Assert that joystick opacity immediately returns to `1` (100% opacity).
*   **Required Assertions:**
    *   `await expect(page.locator('#left-joystick')).toHaveCSS('opacity', '1');` (during drag)
    *   `await expect(page.locator('#left-joystick')).toHaveCSS('opacity', '0.2');` (after 2.5s idle)
    *   Verify joysticks are hidden on standard non-touch desktop layouts.

---

## 3. Gamepad Calibration Wizard Setup (E2E-03)

### User Flow Reference: Journey 3 (FPV Pilot Calibration)
*   **Target Device:** Desktop with Gamepad Mocking
*   **Playwright Test Script Plan:**
    1. Launch browser context and mock the Gamepad API on window initialization:
       ```typescript
       await page.addInitScript(() => {
         const mockGamepad = {
           id: "RadioMaster TX16S (Vendor: 0c26 Product: 0018)",
           index: 0,
           connected: true,
           axes: [0.0, 0.0, 0.0, 0.0],
           buttons: [ { pressed: false, value: 0.0 } ],
           timestamp: performance.now()
         };
         navigator.getGamepads = () => [mockGamepad];
       });
       ```
    2. Load application.
    3. Assert that a detection overlay displays: *"New Gamepad Detected! Run Calibration Wizard?"*
    4. Click the button **[Calibrate Now]** (`#calibrate-now-btn`).
    5. Assert that the Gamepad Calibration Wizard (`#calibration-wizard`) mounts.
    6. Run through the calibration wizard steps sequentially:
       *   **Step 1 (Throttle):** Update mock gamepad axis indices to simulate stick movements. Click `[ Next ]`.
       *   **Step 2 (Yaw):** Simulate stick left/right. Click `[ Next ]`.
       *   **Step 3 (Pitch):** Simulate stick up/down. Click `[ Next ]`.
       *   **Step 4 (Roll):** Simulate stick left/right. Click `[ Next ]`.
    7. **Step 5 (Verification):** Check the Gimbal Coordinates display grid (`#gimbal-coord-grid`).
       *   Inject mock axis inputs: Pitch = `0.5`, Roll = `0.5`.
       *   Assert that the target indicator dot (`#gimbal-indicator-dot`) moves to coordinate `(75%, 75%)` inside the grid boundary.
       *   Check the "Invert Pitch" checkbox (`#invert-pitch-cb`).
       *   Verify the indicator dot shifts to `(75%, 25%)` (Y-axis inverted).
    8. Click `[ Save & Finish ]` (`#save-calibration-btn`).
    9. Assert that the wizard modal closes and `skyscape_controller_mappings` in LocalStorage contains the configured mappings.
*   **Required Assertions:**
    *   `await expect(page.locator('#calibration-wizard')).toBeVisible();`
    *   `await expect(page.locator('#gimbal-indicator-dot')).toHaveCSS('left', '135px');` (assuming 180px grid width)
    *   Check LocalStorage contents:
        ```typescript
        const mappings = await page.evaluate(() => localStorage.getItem('skyscape_controller_mappings'));
        expect(JSON.parse(mappings)).toMatchObject({ pitchAxis: 2, inverted: { pitch: true } });
        ```

---

## 4. Performance Degradation & Recovery (E2E-04)

### User Flow Reference: Journey 4 (Adaptive Performance Degradation)
*   **Target Device:** Desktop Viewport
*   **Playwright Test Script Plan:**
    1. Load application in Auto-Adaptive graphics mode.
    2. Verify the performance warning element (`#perf-warning-alert`) is hidden.
    3. Access the window object and inject a simulated low framerate sequence (mocking frame updates at `22ms` intervals, indicating ~45 FPS) for 3.5 seconds.
    4. Assert that the HUD warning element `#perf-warning-alert` transitions to visible and displays: `⚠️ Optimizing performance...`.
    5. Assert that the render distance configuration has decreased (State level > 0).
    6. Inject high performance frame timings (mocking `16.6ms` updates, stable 60 FPS) for 10.5 seconds.
    7. Assert that the HUD warning element `#perf-warning-alert` fades to hidden.
    8. Assert that graphics parameters recover to high performance values.
*   **Required Assertions:**
    *   `await expect(page.locator('#perf-warning-alert')).toBeVisible();`
    *   `await expect(page.locator('#perf-warning-alert')).toBeHidden();` (after recovery duration)

---

## 5. PWA Offline Access Validation (E2E-05)

### User Flow Reference: PWA Offline Entry Point
*   **Target Device:** PWA Sandbox Context
*   **Playwright Test Script Plan:**
    1. Load application, ensuring the service worker installs and registers in the background.
    2. Wait for PWA service worker state to be active:
       ```typescript
       await page.evaluate(async () => {
         const reg = await navigator.serviceWorker.ready;
         return reg.active?.state;
       });
       ```
    3. Simulate network offline status using Playwright context rules:
       ```typescript
       await context.setOffline(true);
       ```
    4. Refresh the page (`await page.reload()`).
    5. Verify the page finishes rendering in < 3 seconds.
    6. Assert that the Three.js viewport initializes successfully and the flight HUD displays active telemetry.
*   **Required Assertions:**
    *   `await expect(page.locator('#flight-hud')).toBeVisible();`
    *   Validate that network tabs inside chrome tools return cache hits for all core script files.

---

## 6. Gamepad Disconnection Interrupt (E2E-06)

### User Flow Reference: Exception: Gamepad Disconnected Mid-Flight
*   **Target Device:** Desktop with Gamepad Mocking
*   **Playwright Test Script Plan:**
    1. Initialize the app with a mocked gamepad connection.
    2. Start flight mode.
    3. Simulate a gamepad disconnection event:
       ```typescript
       await page.evaluate(() => {
         const event = new Event('gamepaddisconnected') as any;
         event.gamepad = { index: 0 };
         window.dispatchEvent(event);
       });
       ```
    4. Assert that the warning banner overlay `#controller-disconnected-modal` displays immediately.
    5. Assert that flight physics are paused (drone speed/position updates freeze).
    6. Press `Esc` key. Verify that the warning modal closes, and the input mode switches back to Keyboard defaults.
*   **Required Assertions:**
    *   `await expect(page.locator('#controller-disconnected-modal')).toBeVisible();`
    *   Assert physics state changes to paused.
