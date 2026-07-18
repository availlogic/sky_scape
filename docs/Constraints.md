# Project Constraints: Infinite Generative FPV Drone Shot Simulator

This document outlines the technical, architectural, and operational constraints that must be adhered to during the development of the FPV Drone Shot Simulator.

## 1. Technology Constraints

- **Language & Runtime:** The codebase must use TypeScript and target modern ECMAScript modules (ESM).
- **Graphics Framework:** Three.js is the preferred 3D graphics library. Babylon.js remains an approved secondary option.
- **Render API:** 
  - The primary render pipeline must target **WebGPU** to leverage modern GPU computation for procedural terrain.
  - The engine must implement automatic graceful degradation to **WebGL 2.0** for browsers and devices that do not support WebGPU.
- **Procedural Logic:**
  - Terrains, biomes, waves, and coloring must be computed directly on the GPU using shaders (WGSL/GLSL) to maximize execution speed.
  - Core mathematical algorithms (Simplex Noise, Fractional Brownian Motion (FBM), Domain Warping, Gerstner Wave formulas, and Quaternion rotations) must be implemented with high numerical precision and performance.
- **Terrain Generation Math:**
  - Terrain must be formed dynamically on the GPU.
  - The macro-terrain must utilize 3 layers of low-frequency noise.
  - The micro-terrain details must utilize 3 layers of high-frequency noise.
- **Chunk Streaming Parameters:**
  - Terrain chunks must be structured with a fixed grid size of 64 × 64 vertices.
  - **PC/Mac Chunk Range:** Standard grid size of 8 × 8 chunks, scaling up to a maximum of 12 × 12 chunks.
  - **Mobile Chunk Range:** Restricted grid size of 3 × 3 or 4 × 4 chunks to maintain thermal and processing headroom.

## 2. Platform & Infrastructure Constraints

- **Static Deployment:** The application must compile to static assets (`dist/` directory via Vite) and deploy directly to **Cloudflare Pages**.
- **No Backend Services:** 
  - There must be absolutely no Node.js servers, Express/NestJS instances, Python web app layers, PHP, or Java backend code.
  - No database engines (MySQL, PostgreSQL, MongoDB, etc.) or caching layers (Redis) are permitted.
  - Third-party BaaS platforms (Firebase, Supabase) are strictly prohibited.
- **Data Source Restrictions:**
  - The simulator is forbidden from making network calls to online map providers, GIS services, or elevation databases (e.g., Google Maps, Mapbox, Bing Maps, Cesium World Terrain, OpenStreetMap).
  - All environmental features, heights, and assets must be generated on-the-fly.
- **Offline Capabilities:**
  - The project should support Progressive Web App (PWA) standards (Service Worker caching) so that once loaded, the application functions fully without network connectivity.

## 3. Data Storage & Privacy Constraints

- **Local Storage Only:** All user-specific settings (such as cruise speed, look sensitivity, preferred biome, custom weather seeds, and quality presets) must be stored on the client side using browser LocalStorage or IndexedDB.
- **Zero Telemetry & Authentication:** No user login system, auth cookies, or remote analytics endpoints may be configured. User privacy is absolute, and no telemetry data can be uploaded.

## 4. Performance Constraints

- **Framerate Target:** Must maintain a stable 60 FPS across both desktop and mobile platforms under nominal use.
- **Initial Load Budget:** Complete asset load and first-screen rendering must take less than 3 seconds.
- **Memory Limits:**
  - System memory (RAM) footprint must stay below 500 MB.
  - Graphics memory (VRAM) footprint must stay below 256 MB.
- **Mobile Thermal Control:** The app must run continuously on standard mobile devices for 15 minutes without causing thermal throttling or excessive battery drain.

## 5. Coding & Architecture Constraints

- **Strict Modularity:**
  - The codebase must strictly decouple mathematical utilities, shaders, UI elements, flight controls, rendering engine, and physics.
  - Files must be categorized into standard directories:
    ```
    src/
    ├── components/   # UI components
    ├── engine/       # Render loop and core engine setup
    ├── terrain/      # Terrain chunk streaming and generation
    ├── biomes/       # Biome rules and assets
    ├── render/       # Lighting and post-processing
    ├── controls/     # PC/Mobile input mapping
    ├── physics/      # FPV flight model and camera damping
    ├── ui/           # Controls overlay and menus
    ├── utils/        # Mathematical and noise helpers
    ├── shaders/      # WGSL/GLSL files
    └── assets/       # Mini visual assets
    ```
- **AI-Friendly Code Structure:**
  - Code files must be modular and single-purpose to allow easy editing and scaling by AI assistants.
  - Individual source files should generally be kept under 300 to 500 lines.
  - Reusable utility methods must be extracted, avoiding copy-pasted blocks.
- **Code Standards:** Must pass ESLint and Prettier checks cleanly, conforming to uniform TypeScript formatting guidelines.

## 6. Explicit Non-Goals

- **Real-World Geography:** There is no intent to replicate real flight spaces or ingest real coordinates.
- **Aerodynamic Simulation:** The project is a cinematic FPV simulator; it does not aim for flight physics certification (e.g., FAA flight model compliance).
- **Physical Collision Damage:** Drone destruction and crash recovery logic are out of scope.
- **Multiplayer/Online Lobby:** Real-time multi-agent flight, online communication, and user interaction are not supported.
