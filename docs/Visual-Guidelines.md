# Visual Guidelines: Sky Scape

This document establishes the visual design system, styling patterns, typography, color palette, and accessibility requirements for the Sky Scape flight simulator. The aesthetic is built on a clean, light-mode, glassmorphic theme designed to feel like a high-end aviation interface overlaying a natural canvas.

---

## 1. Design Philosophy

Sky Scape's visual theme is **"Aerospheric Glass"**:
*   **Minimalist & Non-Intrusive:** The visual UI must not detract from the scenic beauty of the procedural terrain. Elements are compact, transparent, and positioned at the viewport borders.
*   **Zen-Like Light Theme:** Clean white glass backdrops replace dark, heavy gaming UI overlays, giving the app a breezy, modern, and open feeling.
*   **Precision Telemetry:** Telemetry data is presented cleanly and stably without flickering or resizing.

---

## 2. Color System

To maintain readability against a variety of procedurally generated landscapes (including white snow and bright yellow deserts), all text elements use high-contrast dark slate gray.

### Core Palettes

| Color Role | Hex Value | RGB Equivalent | CSS Variable Name | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Glass Backdrop** | N/A | `rgba(255, 255, 255, 0.70)` | `--glass-bg-normal` | Standard overlay card background |
| **Glass Backdrop Active** | N/A | `rgba(255, 255, 255, 0.90)` | `--glass-bg-active` | Hovered or focused card state |
| **Slate Gray (Primary Text)** | `#1E293B` | `rgb(30, 41, 59)` | `--text-primary` | Main titles, labels, speed values |
| **Muted Slate (Secondary Text)**| `#475569` | `rgb(71, 85, 105)` | `--text-secondary` | Helper descriptions, captions |
| **Aviation Blue (Accent)** | `#2563EB` | `rgb(37, 99, 235)` | `--accent-blue` | Active toggle, selected biome border |
| **Aviation Blue Light** | `#DBEAFE` | `rgb(219, 234, 254)` | `--accent-blue-light` | Button hover background, slider tracks |
| **Warning Amber** | `#D97706` | `rgb(217, 119, 6)` | `--color-warning` | Performance optimization status text |
| **Alert Red** | `#DC2626` | `rgb(220, 38, 38)` | `--color-danger` | Disconnect alerts, hardware errors |

### Shadow & Borders
*   **Borders:** `1px solid rgba(255, 255, 255, 0.40)` for internal glass layers; `1px solid rgba(30, 41, 59, 0.15)` for light separation borders.
*   **Shadows:** Low-opacity, broad-spread ambient shadows to lift overlays from the terrain:
    *   `box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02);`

---

## 3. Typography

Fonts are split between primary branding/controls and monospace telemetry data.

| Font Stack Role | Fonts | CSS Stack | Usage |
| :--- | :--- | :--- | :--- |
| **UI & Controls** | Inter, System Sans | `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | Buttons, modal titles, menu options |
| **Telemetry & Readouts** | Roboto Mono, Monospace | `"Roboto Mono", Consolas, "Courier New", monospace` | Speed, altitude, FPS, coordinates |

### Typography Scale

*   **HUD Telemetry Values:** `20px` / `bold` / `monospace` (ensures numerical stability)
*   **Modal Headers (H1):** `24px` / `semibold` / `letter-spacing: -0.025em`
*   **Component Headers (H2):** `16px` / `semibold`
*   **Body & Buttons:** `14px` / `medium`
*   **Labels & Helper Text:** `12px` / `regular`

---

## 4. Layout Principles & Spacing

*   **Grid System:** 8px base spacing grid (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`).
*   **HUD Safety Margins:** Telemetry boxes must maintain a minimum distance of `16px` from the screen viewport boundaries. On mobile, this safety margin increases to `24px` to prevent overlap with hardware notches or rounded display corners.
*   **Z-Index Hierarchy:**
    *   `z-index: 10` - Virtual Touch Joysticks
    *   `z-index: 20` - HUD Telemetry & Navigation Overlays
    *   `z-index: 100` - Settings Modal Backing
    *   `z-index: 110` - Calibration Wizard Overlay

---

## 5. UI Component Specifications

### 1. The Glassmorphic Container
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
}
```

### 2. Form Sliders (Expo / Sensitivity)
*   **Track:** `6px` height, color `rgba(30, 41, 59, 0.1)`. Active filled portion colored in `--accent-blue`.
*   **Thumb:** Round, solid white circular thumb (diameter `18px`) with border `2px solid --accent-blue` and a distinct drop shadow. Hover state triggers a blue glow halo.

### 3. Biome Selector Cards
*   **Card Styling:** Frosted glass backing, custom icon/emoji, and bold label.
*   **Active Highlight:** Thick `2px` solid `--accent-blue` outline and `rgba(37, 99, 235, 0.06)` background tint overlay.

### 4. Calibration Gimbal Graph
*   **Box:** Square grid (aspect-ratio `1:1`, dimensions `180px x 180px`), with a light gray border.
*   **Gridlines:** Dotted crosshairs intersecting in the center (`#E2E8F0`).
*   **Target Dot:** Solid circular knob (`#2563EB`, diameter `12px`). Moves smoothly according to real-time stick inputs.

---

## 6. Accessibility & Responsiveness

*   **Contrast Compliance:** Ensure a minimum color contrast ratio of `4.5:1` for all text elements. If background landscapes are excessively white (e.g., Snowland biome), the HUD panels dynamically apply a thin text shadow (`text-shadow: 0 1px 2px rgba(255,255,255,0.8)`) to maintain legibility.
*   **Touch Targets:**
    *   Virtual Joystick touch active zones: `140px x 140px` (actual graphic is smaller, but click threshold is wide).
    *   Buttons and selectors: Minimum size of `44px x 44px` with clear padding.
*   **Keyboard Navigation:**
    *   A visible blue focus outline (`outline: 2px solid #2563EB; outline-offset: 2px;`) must highlight any active element navigated via the Tab key.
    *   The Settings menu can be closed instantly using the `Esc` key.
