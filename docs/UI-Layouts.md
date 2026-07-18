# UI Layouts & Wireframes: Sky Scape

This document contains structural wireframes and page hierarchies for Sky Scape's responsive viewports, settings modal, and gamepad calibration wizard interface. 

---

## 1. Desktop Flight Viewport Layout (Keyboard/Mouse / Gamepad Mode)

The desktop HUD overlay is optimized for maximum screen real estate, keeping the middle 80% of the screen completely clear for scenic cruising.

```
+-----------------------------------------------------------------------------+
| [ SPEED: 15.0 m/s ]         [ 🌲 Forest ]               [ 60 FPS ] [ Gear ] |
| [ ALT:   152.3 m  ]                                                         |
|                                                                             |
|                                                                         +--+|
|                                                                         |  ||
|                                                                         |  ||
|                                                                         |S ||
|                                                                         |p ||
|                                                                         |e ||
|                                                                         |e ||
|                                                                         |d ||
|                                                                         |  ||
|                                                                         |  ||
|                                                                         +--+|
|                                                                             |
|                                                 [ ⚠️ Optimizing performance ] |
+-----------------------------------------------------------------------------+
```

### Component Details
*   **Top Left (Telemetry Panel):** High-contrast glassmorphic card housing speed and altitude readings.
*   **Top Center (Biome Pill):** Pill badge with the current biome icon and text.
*   **Top Right (System Controls):** FPS tracker aligned horizontally with the circular Settings gear button.
*   **Right Side (Speed Control Slider):** Floating vertical track to adjust target cruise speed.
*   **Bottom Right (Performance Warning):** Appears contextually when frame rate degrades.

---

## 2. Mobile Viewport Layout (Touch Controls Enabled)

The mobile layout introduces dual thumb-zone joysticks and a vertical throttle slider, all of which dynamically fade to `20%` opacity when not in use.

```
+-----------------------------------------------------------------------------+
| [ SPEED: 15.0 m/s ]         [ 🌲 Forest ]               [ 60 FPS ] [ Gear ] |
| [ ALT:   152.3 m  ]                                                         |
|                                                                             |
|                                                                             |
|                                                                         +--+|
|                                                                         |  ||
|                                                                         |H ||
|                                                                         |e ||
|                                                                         |i ||
|                                                                         |g ||
|       +----------+                                 +----------+         |h ||
|       |    ↑     |                                 |    ↑     |         |t ||
|       |  ← ● →   |                                 |  ← ● →   |         |  ||
|       |    ↓     |                                 |    ↓     |         +--+|
|       +----------+                                 +----------+             |
|    [ Left Joystick ]                            [ Right Joystick ]          |
+-----------------------------------------------------------------------------+
```

### Mobile Layout Dimensions
*   **Left Joystick Zone:** Fixed bottom-left corner (`140px x 140px` touch active area). Positioned `24px` from bottom and left edges to avoid thumb cramping.
*   **Right Joystick Zone:** Fixed bottom-right corner (`140px x 140px` touch active area). Positioned `100px` from the right edge to leave room for the vertical throttle slider.
*   **Height Slider (Altitude/Throttle):** Positioned on the far-right edge (`48px` width track).

---

## 3. Settings Modal Layout

A centered glassmorphic dialog card. Behind it, the 3D scene is heavily blurred, and flight physics are paused.

```
+-----------------------------------------------------------------------------+
|                                                                             |
|         +---------------------------------------------------------+         |
|         | SETTINGS                                            [X] |         |
|         +---------------------------------------------------------+         |
|         |                                                         |         |
|         |  BIOME SELECTOR (Active: Forest)                        |         |
|         |  +---------+  +---------+  +---------+  +---------+     |         |
|         |  |🌲 Forest|  |🏜️ Desert|  |🏔️ Snow  |  |🌅 Coast |     |         |
|         |  +---------+  +---------+  +---------+  +---------+     |         |
|         |                                                         |         |
|         |  INPUT MODE:   (o) Keyboard/Mouse     ( ) Gamepad       |         |
|         |  [ Calibrate Sticks ] (Active only when Gamepad selected)|         |
|         |                                                         |         |
|         |  FLIGHT SETTINGS                                        |         |
|         |  Camera Damping:  [───────────o──────────────] (0.35)   |         |
|         |  Stick Expo:      [───────o──────────────────] (0.15)   |         |
|         |                                                         |         |
|         |  GRAPHICS                                               |         |
|         |  Mode: (o) Auto-Adaptive   ( ) Manual [Low/Med/High]    |         |
|         |                                                         |         |
|         |  +---------------------------------------------------+  |         |
|         |  | [ Restore Defaults ]         [ Close & Apply ] |  |         |
|         |  +---------------------------------------------------+  |         |
|         +---------------------------------------------------------+         |
|                                                                             |
+-----------------------------------------------------------------------------+
```

---

## 4. Gamepad Stick Calibration Wizard Layout

Renders in a dedicated glassmorphic overlay. This wireframe details **Step 5: Live Verification Panel**, which displays the coordinates feedback grid.

```
+-----------------------------------------------------------------------------+
|                                                                             |
|         +---------------------------------------------------------+         |
|         | CONTROLLER CALIBRATION WIZARD                           |         |
|         +---------------------------------------------------------+         |
|         | Step 5 of 5: Verify Mappings                            |         |
|         |                                                         |         |
|         |  Verify that stick movements correspond to coordinates.  |         |
|         |                                                         |         |
|         |  GIMBAL COORDINATES              CHANNELS FEEDBACK      |         |
|         |      [ Pitch / Roll ]                                   |         |
|         |          ↑ (Pitch +)             Throttle (Axis 1)      |         |
|         |      +───────────+               [████████░░░░░░] 60%   |         |
|         |      |           |               [ ] Invert Throttle    |         |
|         |      |     ●     |                                      |         |
|         |  ← ──┼───────────┼── → (Roll +)  Yaw (Axis 2)           |         |
|         |      |           |               [████░░░░░░░░░░] 40%   |         |
|         |      |           |               [ ] Invert Yaw         |         |
|         |      +───────────+                                      |         |
|         |          ↓                       [ ] Invert Pitch       |         |
|         |                                  [ ] Invert Roll        |         |
|         |                                                         |         |
|         |  +---------------------------------------------------+  |         |
|         |  | [ Back ]         [ Cancel ]       [ Save Mappings ] |  |         |
|         |  +---------------------------------------------------+  |         |
|         +---------------------------------------------------------+         |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Gimbal Coordinate Mapping Details
*   **Coordinate Frame:** Pitch maps directly to the Y-axis (Up/Down) and Roll to the X-axis (Left/Right).
*   **Active Dot (`●`):** Moves continuously to show analog resolution and direction mapping values.
*   **Progress Bars:** Render linear channel updates for Throttle and Yaw inputs.
