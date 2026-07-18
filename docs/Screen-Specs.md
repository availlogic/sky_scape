# Screen Specifications: Sky Scape

This document provides detailed specifications for each screen overlay in the Sky Scape flight simulator. All UI interfaces are designed using a modern, clean light-mode theme with high-contrast elements, glassmorphism, and minimal screen obstruction to preserve the landscape view.

---

## 1. Flight HUD Overlay (Active Flight View)

*   **Screen Name:** Flight HUD
*   **Purpose:** Provide real-time telemetry, environmental info, and configuration access during active flight.
*   **User Goals:** Track flight speed/altitude, see current biome, adjust cruise speed, and access settings.

### Visual & Layout Structure
*   **Layout:** Borderless floating viewport overlay. Text is rendered in dark slate gray (`#1E293B`) with a semi-transparent white backdrop (`rgba(255, 255, 255, 0.7)`) to ensure high contrast against light or bright terrain features.
*   **Telemetry Bar (Top Left):**
    *   **Speedometer:** Display format: `SPEED: XX.X m/s`.
    *   **Altimeter:** Display format: `ALT: XXX m` (meters above ground level).
*   **Environment Badge (Top Center):**
    *   Rounded pill badge containing the current biome. E.g., `[ 🌲 Forest ]`, `[ 🏜️ Desert ]`, `[ ❄️ Snowland ]`.
*   **Status & Settings Controls (Top Right):**
    *   **FPS Tracker:** Real-time FPS count. Format: `XX FPS`. Color shifts to warning amber (`#D97706`) if FPS falls below 55.
    *   **Settings Button:** Round, frosted glass gear button. Clicking opens the **Settings Panel**.
*   **Cruise Speed Slider (Right Edge - Floating):**
    *   Vertical floating slider track.
    *   **Range:** `5 m/s` to `100 m/s` (default `15 m/s`).
    *   **Interaction:** Drag-to-adjust. Instantly updates the drone's forward velocity.
*   **Performance Optimization Indicator (Bottom Right):**
    *   Floating status text reading: `⚠️ Optimizing performance...`.
    *   **Visibility Rules:** Only visible when the Adaptive Performance Degradation Engine is actively downscaling graphics parameters (Resolution, Draw Distance, or LOD). Fades out when system returns to baseline high-performance state.

---

## 2. Mobile Joysticks Overlay (Mobile/Touch Only)

*   **Screen Name:** Mobile Virtual Controls
*   **Purpose:** Provide touch-based flight controls for mobile and tablet devices.
*   **Visibility Rules:** Renders only when the device supports touch interaction (`ontouchstart` is true) and no physical gamepad is mapped.

### Interactive Components

#### Left Virtual Joystick (Bottom Left)
*   **Behavior:** Directs planar translation movement.
    *   **Drag Up/Down:** Pitch forward/backward translation.
    *   **Drag Left/Right:** Roll left/right translation (strafing).
*   **Visuals:** Frosted glass circular track (radius: `60px`) with a floating joystick knob (radius: `24px`).

#### Right Virtual Joystick (Bottom Right)
*   **Behavior:** Directs camera/attitude rotation.
    *   **Drag Up/Down:** Look pitch up/down.
    *   **Drag Left/Right:** Rotate yaw left/right.
*   **Visuals:** Matching frosted glass circular track and knob.

#### Altitude Slider (Far Right Edge - Vertical)
*   **Behavior:** Adjusts vertical lift (Throttle).
    *   **Slide Up:** Accelerate upward.
    *   **Slide Down:** Accelerate downward.
    *   **Center Release:** Auto-returns to center (hover altitude hold).
*   **Visuals:** Thin vertical slider track parallel to the screen edge.

### Component Opacity States

| State | Condition | Joystick/Slider Opacity | Transition Speed |
| :--- | :--- | :--- | :--- |
| **Active / Touched** | Active touch input on joystick boundary | `1.0 (100%)` | Instant |
| **Idle** | No touch input detected for `> 2.5 seconds` | `0.2 (20%)` | `0.5s` linear transition |

---

## 3. Settings Panel

*   **Screen Name:** Settings Panel
*   **Purpose:** Configure biomes, control input types, adjust sensitivity curves, and toggle performance modes.
*   **Trigger:** Pressing `Esc` or clicking the HUD Gear button. Pauses the flight simulation physics.

### Visual & Layout Structure
*   **Background:** Screen-wide blur overlay (`backdrop-filter: blur(8px)`) with a light-mode card modal in the center (`background: rgba(255, 255, 255, 0.85)`).
*   **Typography:** Dark gray headers with clean, borderless layout grids.

### Form Components

#### 1. Biome Selector (Grid Layout)
*   **Options:** 4 options (Desert, Forest, Snowland, Coastlines).
*   **Component Visuals:** High-contrast thumbnail cards. Hovering scales up slightly. Active biome has a thick blue border (`#3B82F6`) and checkmark.

#### 2. Input Mode Toggle
*   **Options:** `[ Keyboard & Mouse ]` vs. `[ Gamepad / FPV Controller ]`.
*   **Behavior:** Toggling to Gamepad activates gamepad listening. If no gamepad is detected, displays warning: *"No gamepad detected. Connect via USB to map axes."*

#### 3. Controller Calibration Shortcut
*   **Component:** Button labeled `[ Calibrate Controller Sticks ]`.
*   **Visibility:** Only enabled/visible when Gamepad input mode is active. Clicking opens the **Calibration Wizard Overlay**.

#### 4. Physics & Curve Sliders
*   **Camera Damping:** Slider (Range: `0.0` to `1.0`). Controls inertia latency.
*   **Yaw/Pitch/Roll Expo Curves:** Sliders (Range: `0.0` to `1.0`). Adjusts exponential sensitivity curves, rendering a live mini mathematical curve graph alongside to visualize stick sensitivity.

#### 5. Graphics Mode Selector
*   **Options:** Toggle switch between `[ Auto-Adaptive ]` and `[ Manual ]`.
*   **Manual Settings:** If Manual is selected, enables a segment control: `[ Low ]`, `[ Medium ]`, `[ High ]`.

#### 6. Action Row
*   **Buttons:** `[ Close & Save Settings ]` (Primary blue) and `[ Reset Mappings ]` (Secondary border-only).
*   **Persistence:** All modified parameters auto-commit to `LocalStorage` on close.

---

## 4. Gamepad Stick Calibration Wizard

*   **Screen Name:** Gamepad Calibration Wizard
*   **Purpose:** Guide users through mapping physical sticks (analog channels) on their FPV transmitter or game controller.
*   **Trigger:** Triggered via the Settings Panel, or automatically on first spawn if a new gamepad is plugged in.

### Step-by-Step Flow

#### Welcome Screen
*   **Instruction:** *"Connect your controller via USB. Push any button or move sticks to start."*
*   **Action:** Detects device ID and populates standard details.

#### Step 1: Throttle Axis
*   **Instruction:** *"Push Throttle Stick Up and Down."*
*   **Feedback:** Reads raw axes inputs to isolate the active axis index. Displays raw value range dynamically.

#### Step 2: Yaw Axis
*   **Instruction:** *"Move Yaw Stick Left and Right."*

#### Step 3: Pitch Axis
*   **Instruction:** *"Move Pitch Stick Up and Down."*

#### Step 4: Roll Axis
*   **Instruction:** *"Move Roll Stick Left and Right."*

### Live Validation Display (Step 5 - Calibration Review)
*   **Instruction:** *"Verify your stick calibration values. If directions are inverted, check 'Invert' boxes."*
*   **Visual Mappings Check:**
    *   **Live Gimbal Coordinate Graph:**
        *   Renders a coordinate box with central crosshairs.
        *   Contains a small dot representing the Pitch (Y-axis) and Roll (X-axis) inputs.
        *   **Direction Indicator:** Moving the physical right stick (Pitch forward) must move the dot **UP**. Moving Roll right must move the dot **RIGHT**.
        *   **Axis Label:**
            ```
                     ↑ (Pitch +)
                     ●
            ← ─────────────── → (Roll +)
            (Roll -) │
                     ↓ (Pitch -)
            ```
    *   **Linear Telemetry Mappings:**
        *   **Throttle Gauge:** Vertical progress bar (fills from bottom to top as stick moves up). Checkbox: `[ ] Invert Throttle`.
        *   **Yaw Gauge:** Horizontal progress bar (fills from center to outer edges as stick moves left/right). Checkbox: `[ ] Invert Yaw`.
        *   **Pitch Checkbox:** `[ ] Invert Pitch`.
        *   **Roll Checkbox:** `[ ] Invert Roll`.
*   **Controls:**
    *   `[ < Back ]`: Re-run previous steps.
    *   `[ Save & Finish ]`: Writes gamepad mapping configuration to LocalStorage and returns to the Settings Panel.
    *   `[ Cancel ]`: Aborts mapping, discarding current inputs.
