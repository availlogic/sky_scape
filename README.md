# Sky Scape: Infinite Generative FPV Drone Shot Simulator

An infinite, generative, pure-frontend FPV drone aerial simulation and exploration application built for modern web browsers.

## 1. Project Background

Sky Scape is a web-based FPV drone shot simulator designed to emulate the visual experience of flying a drone over vast, procedurally generated environments. Unlike traditional flight simulators that feature complex airport runaways, takeoff/landing logic, and cockpit telemetry, Sky Scape focuses entirely on the scenic FPV cruising experience. 

The application generates an endless, random, yet deterministic natural world in real time using client-side mathematical noise algorithms. It runs entirely in the browser using WebGPU (with WebGL 2.0 fallback) to ensure zero server-side processing costs and complete offline capability.

## 2. Project Documentation

The foundational and research documents for this project are organized in the `docs/` directory:
- [Idea.md](file:///Users/victorxu/projects/sky_scape/docs/Idea.md): Canonical document describing the user's initial natural-language product idea and architectural direction.
- [Vision.md](file:///Users/victorxu/projects/sky_scape/docs/Vision.md): Defines what the project is trying to achieve, its core capabilities, and success metrics.
- [Constraints.md](file:///Users/victorxu/projects/sky_scape/docs/Constraints.md): Establishes implementation boundaries, technologies, platforms, and performance limitations.
- [Research_Report.md](file:///Users/victorxu/projects/sky_scape/docs/Research_Report.md): Detailed market research, competitive analysis, technology comparison (WebGPU vs WebGL), and risk assessments.
- [PRD.md](file:///Users/victorxu/projects/sky_scape/docs/PRD.md): Product Requirements Document defining user stories, journeys, functional and non-functional requirements, and scope.
- [Architecture.md](file:///Users/victorxu/projects/sky_scape/docs/Architecture.md): High-level system architecture, module definitions, rendering pipelines, and performance state machine.
- [API_Spec.md](file:///Users/victorxu/projects/sky_scape/docs/API_Spec.md): Detailed TypeScript interfaces, data models, and event channels.
- [Database.md](file:///Users/victorxu/projects/sky_scape/docs/Database.md): Browser client storage schemas and Service Worker cache strategies.
- [User-Flows.md](file:///Users/victorxu/projects/sky_scape/docs/User-Flows.md): User personas, entry points, navigation flows, and interactive journeys.
- [Screen-Specs.md](file:///Users/victorxu/projects/sky_scape/docs/Screen-Specs.md): UI component layouts, states, virtual controls fading, and calibration steps.
- [Visual-Guidelines.md](file:///Users/victorxu/projects/sky_scape/docs/Visual-Guidelines.md): The "Aerospheric Glass" design system, color palette, typography, and styling rules.
- [UI-Layouts.md](file:///Users/victorxu/projects/sky_scape/docs/UI-Layouts.md): Responsive viewport wireframes for desktop, mobile, settings modal, and calibration coordinate charts.

## 3. Design Principles

- **Frontend Only:** Pure static assets with all calculation and rendering happening locally in the browser.
- **Fully Generative:** No pre-baked terrain maps or telemetry downloads. Everything is generated procedurally on-the-fly using mathematical noise.
- **Asset-Light:** Minimal external mesh, texture, or model downloads to maintain low memory footprints and sub-3-second load times.
- **Offline Friendly:** Full PWA and service worker caching capability, allowing complete offline execution.
- **High FPS First:** Continuous performance monitoring and dynamic rendering degradation to prioritize a consistent 60 FPS over resolution or detail.
- **Zero Friction:** No user registration, accounts, or telemetry upload. All preferences are preserved in local storage.

## 4. Architecture Overview

The application features a decoupled, modular client-side architecture:

- **Engine:** Coordinates the render loops, screen sizing, and graphics contexts (WebGPU / WebGL 2.0 fallback).
- **Terrain:** Manages dynamic chunk streaming, grid meshing, and GPU-driven height calculation.
- **Biomes:** Governs ecosystem configurations (Desert, Forest, Valley, Snowland, Coastlines, Badlands) and shader properties.
- **Controls:** Handles PC keyboard/mouse event mapping and Mobile dual virtual joysticks/sliders.
- **Physics:** Simulates FPV momentum-based flight dynamics and camera damping.
- **UI:** Overlays user controls, biome selector, speed slider, and performance metrics.
- **Shaders:** Houses custom WGSL and GLSL shader code for terrain heights, coloring, and water waves.

## 5. Dependency Setup Instructions

### Frontend Dependencies

To install the web application dependencies, navigate to the root directory and run:

```bash
npm install
```

### Tooling & Python Environment (if applicable)

For any Python-based helper tools, validation scripts, or asset pipeline processing, the project utilizes `uv` for dependency management:

```bash
# Initialize a virtual environment using uv
uv venv

# Install python dependencies (if any helper scripts are added)
uv add <package_name>
```

## 6. Build & Run Instructions

### Start Development Server

```bash
npm run dev
```

### Build Production Static Site

```bash
npm run build
```

The compiled static assets will be outputted to the `dist/` directory.

## 7. Testing Instructions

### Unit & Integration Tests

The project utilizes Jest/Vitest for unit testing of core engine math, physics equations, and controls.

```bash
npm run test
```

For test-driven development (TDD):
1. Write failing tests first under the test suites.
2. Implement minimum code changes to make the tests pass.
3. Refactor code while keeping tests green.

## 8. Deployment Instructions

### Cloudflare Pages Deployment

Since the application compiles to static assets, it can be hosted for free on Cloudflare Pages:

1. Connect the GitHub repository to the Cloudflare dashboard.
2. Configure a new Pages project with the following settings:
   - **Framework Preset:** None / Vite
   - **Build Command:** `npm run build`
   - **Build Output Directory:** `dist`
3. Click **Save and Deploy**. Cloudflare will automatically build and distribute the application globally via its CDN.

## 9. Usage Examples

### Controls Map

- **Desktop (PC/Mac):**
  - `W` / `S`: Fly forward / backward
  - `A` / `D`: Strafe left / right
  - `Q` / `E`: Elevate upward / downward
  - *Mouse Move*: Pitch / Yaw camera angles
  - *Cruise Speed Slider*: Adjust maximum velocity
- **Mobile (Phone/Tablet):**
  - *Left Virtual Joystick*: Forward, backward, and strafe movements
  - *Right Virtual Joystick*: Pitch and Yaw camera rotation
  - *Right Slide Bar*: Control elevation speed
  - *Cruise Speed Slider*: Adjust flight speed limits
