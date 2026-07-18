# Product Requirements Document (PRD): Sky Scape

**Project Name:** Sky Scape (Infinite Generative FPV Drone Shot Simulator)  
**Author:** Product Management  
**Status:** Ready for Architecture  
**Created:** 2026-07-18

---

## 1. Executive Summary

Sky Scape is an asset-light, pure-frontend, and fully generative FPV (First-Person View) drone flight simulation and visual exploration application. Built using modern browser graphics standards (WebGPU with a WebGL 2.0 fallback), the application generates endless natural landscapes procedurally on the client side. By bypassing traditional flight simulator complexities (e.g., runway takeoff, landing, complex instrumentation) and introducing camera damping and high-expo cinematic control curves, Sky Scape provides a seamless, immersive landscape cruising experience. It is built to run at 60 FPS across both desktop and mobile platforms, with a zero-server-cost static hosting footprint on Cloudflare Pages.

---

## 2. Background

First-Person View (FPV) drones have revolutionized modern visual storytelling, enabling filmmakers to capture dramatic, sweeping, and dynamic camera angles. However, learning to pilot FPV drones is notoriously difficult, with a high crash-and-damage rate. Traditional simulators exist to help pilots practice, but they are heavy native desktop installations (often >10 GB) with a strong bias toward competitive racing and freestyle gymnastics. 

Sky Scape targets the underserved niche of cinematic pilots, beginners, and casual gamers. It provides an immediate, zero-install, browser-based flight simulation that focuses entirely on scenic exploration, smooth camera maneuvers, and beautiful procedural landscapes.

---

## 3. Problem Statement

1. **High Hardware and Storage Barriers:** Existing simulators require expensive dedicated GPUs, gigabytes of local storage, and complex installations, excluding mobile, tablet, and low-end laptop users.
2. **Steep Setup and Calibration Curves:** Connecting and configuring FPV radio transmitters often requires third-party drivers, COM port adjustments, and tedious manual setups.
3. **Freestyle/Racing Bias:** Popular flight simulators default to highly sensitive, "twitchy" control rates optimized for stunts, making slow, cinematic camera sweeps difficult to execute.
4. **Static Environment Fatigue:** Standard flight simulators rely on finite, pre-built maps. Once a pilot flies the course a few times, exploration fatigue sets in.

---

## 4. Product Vision Alignment

Sky Scape aligns with the core vision of:
- **Zero-Friction Access:** No registration, no downloads, and instant mid-air spawning directly in a browser tab.
- **Infinite Discovery:** A deterministically randomized, procedural world containing six biomes that extends infinitely.
- **Serverless Scaling:** Zero backend operations or database dependencies, allowing scale-free hosting on static CDNs.

---

## 5. Goals

- **Performance Goal:** Maintain a stable 60 FPS across desktop and mobile devices via an automatic adaptive graphics engine.
- **Setup Goal:** Detect connected FPV transmitters natively via the HTML5 Gamepad API with a simple calibration helper UI.
- **Aesthetic Goal:** Deliver high-quality, procedural natural terrains (hills, water waves, trees, snow, sand dunes) generated entirely on the GPU.
- **Efficiency Goal:** Keep initial asset load size under 5 MB, ensuring a first-screen loading time of under 3 seconds.
- **Offline Goal:** Support offline play through Progressive Web App (PWA) service worker caching.

---

## 6. Non-Goals

- **Real-World GIS Reconstruction:** Recreating real-world cities, GPS locations, or satellite topography.
- **Destructible Flight Physics:** Simulating structural damage, engine failures, or drone crashes that interrupt exploration.
- **Multiplayer / Leaderboards:** Real-time multi-pilot lobbies, text chats, or shared databases.
- **Aerodynamic Certification:** Compliance with FAA flight training simulation standards.

---

## 7. Target Users

1. **Cinematic FPV Pilots:** Professionals and hobbyists looking to practice smooth camera movements and orbit techniques in visually engaging, open environments.
2. **FPV Beginners:** New users building basic muscle memory (throttle, pitch, roll, yaw) without the fear of damaging expensive physical drones.
3. **Zen Gamers:** Casual web users seeking a relaxing, visual experience of flying and discovering natural landscapes.

---

## 8. Personas

### Persona A: "Cinematic Claire" (Professional FPV Filmmaker)
*   **Needs:** Realistic inertia, smooth camera damping, adjustable cruise speed, and beautiful scenic lighting (golden hour) to compose potential real-world shots.
*   **Pain Points:** Traditional simulators are too twitchy and require constant adjustments to mimic a heavy camera rig.

### Persona B: "Beginner Ben" (Novice Pilot)
*   **Needs:** Intuitive interface, simple calibration guides, high Expo rate defaults that prevent overcorrection, and instant reset capabilities.
*   **Pain Points:** Struggles with native software installations and driver conflicts when trying to connect his RadioMaster transmitter.

### Persona C: "Zen Zach" (Casual Web Explorer)
*   **Needs:** Quick access, simple WASD keyboard navigation or touchscreen joysticks, beautiful environments, and smooth performance on his iPad.
*   **Pain Points:** Doesn't own an FPV radio controller or high-end gaming PC. Just wants a peaceful visual getaway.

---

## 9. User Journeys

### User Journey 1: Desktop Zen Explorer
1. Zach navigates to the Sky Scape URL.
2. The page loads in under 3 seconds. The user is instantly spawned in mid-air at 150m, cruising forward over a procedural Forest biome.
3. Zach uses WASD keys to guide the drone, and his mouse to rotate the camera.
4. He slides the on-screen speed bar from 10 m/s to 20 m/s to fly faster.
5. He clicks the Biome selector, selects "Desert", and the terrain smoothly regenerates into sand dunes.

### User Journey 2: FPV Pilot Calibration
1. Claire plugs her RadioMaster transmitter via USB and opens Sky Scape on her laptop.
2. She clicks "Controller Settings" and is greeted with a calibration wizard.
3. The wizard prompts her to move the sticks to detect Throttle, Yaw, Pitch, and Roll axes.
4. She adjusts her camera damping rate and customizes the Expo curve in the settings.
5. She exits the menu and practices sweeping orbits around rock formations.

---

## 10. User Stories

1. **As a pilot**, I want to spawn immediately in mid-air so that I do not have to go through complex runway takeoffs or menus to start flying.
2. **As a mobile user**, I want to navigate the drone using virtual joysticks and a height slider so that I can fly on tablets or smartphones without a keyboard.
3. **As a filmmaker**, I want to adjust camera damping and cruise speed so that I can simulate different drone weights and capture smooth cinematic frames.
4. **As a player with low-end hardware**, I want the simulation to lower graphics quality automatically when performance drops below 55 FPS so that my flight remains smooth.
5. **As an FPV pilot**, I want to configure and map my physical radio controller axes in a simple wizard so that I can train with the same sticks I use in real life.
6. **As an offline user**, I want the app to load and run without an internet connection after my first visit so that I can practice flying on flights or in remote areas.

---

## 11. Functional Requirements

### 11.1 FPV Physics and Camera Engine (FR-PHYSICS)
- **FR-1.1:** Mid-air spawning between 100 and 200 meters above the terrain.
- **FR-1.2:** Simulated inertia and momentum-based flight dynamics (coasting, drag, angular momentum).
- **FR-1.3:** Adjustable camera damping (low, medium, high) to simulate heavy cinematic drone rigs.
- **FR-1.4:** Standard rates and customizable exponential curve (Expo) inputs to soften center-stick sensitivity.
- **FR-1.5:** No collision damage: colliding with terrain or foliage slide-bounces the drone without resetting the session.

### 11.2 Control Inputs (FR-INPUT)
- **FR-2.1: PC Keyboard/Mouse:**
  - `W` / `S`: Forward / Backward pitch push.
  - `A` / `D`: Left / Right roll (strafe).
  - `Q` / `E`: Raise / Lower altitude (throttle).
  - Mouse movement: Pitch (look up/down) and Yaw (pan left/right).
- **FR-2.2: Mobile Touchscreen:**
  - Left Virtual Joystick: Move forward, backward, left, and right.
  - Right Virtual Joystick: Look up, down, and rotate yaw left/right.
  - Right Edge Altitude Slider: Adjust vertical height velocity.
- **FR-2.3: Gamepad API:**
  - Detect USB-connected gamepads and FPV transmitters natively.
  - Calibration Wizard: Interactive stick-movement prompts to map analog channels (Throttle, Yaw, Pitch, Roll).

### 11.3 Procedural Terrain and Biomes (FR-TERRAIN)
- **FR-3.1:** Terrain heightmaps generated procedurally on the GPU using multi-octave Simplex Noise and FBM.
- **FR-3.2:** Infinite chunk streaming: chunks (64x64 grid size) load ahead of the flight path and unload behind.
- **FR-3.3: Six Procedural Biomes:**
  - *Desert:* Sand dunes, yardangs, wind erosion textures.
  - *Forest:* Grasslands, rolling hills, high-density instanced trees.
  - *Valley:* Cliffs, riverbeds, steep rock faces.
  - *Snowland:* Glaciers, snow peaks, tundra.
  - *Coastlines:* Cliffs, islands, Gerstner wave ocean simulation with shore foam.
  - *Badlands:* Multi-layered Danxia red rock formations.

### 11.4 Adaptive Performance Degradation Engine (FR-PERFORMANCE)
- **FR-4.1:** Continuous frame rate monitoring (FPS calculated every 1 second).
- **FR-4.2: Level 1 Degradation (FPS < 55 for 3s):** Reduce render distance chunk radius, increase fog thickness.
- **FR-4.3: Level 2 Degradation (FPS < 50 for 3s):** Scales down internal render resolution (75%, 50%).
- **FR-4.4: Level 3 Degradation (FPS < 45 for 3s):** Lowers LOD (Level of Detail), reduces foliage instance density, disables shadow casting/reflections.
- **FR-4.5:** Graceful recovery: slowly restore quality levels when average FPS exceeds 58 for 10 seconds.

### 11.5 User Interface and Settings (FR-UI)
- **FR-5.1:** Clean, minimal HUD overlay featuring a speedometer (m/s), altitude indicator, current biome name, and FPS tracker.
- **FR-5.2:** Floating edge sliders: Cruise Speed (adjust from 5 m/s to 30 m/s).
- **FR-5.3: Settings Panel:**
  - Biome Selector (6 options).
  - Input Calibration (Keyboard vs. Gamepad).
  - Sensitivity and Expo sliders.
  - Graphics Mode: Manual Quality (Low, Medium, High) vs. Auto-Adaptive.
- **FR-5.4:** Persistence: Save settings locally using browser LocalStorage.

---

## 12. Non-Functional Requirements

- **Performance (NFR-1):** Stable 60 FPS on desktop (GTX 1060 / Apple M1 or higher) and mobile devices (iPhone 11 / Snapdragon 865 or higher).
- **Load Time (NFR-2):** Initial JS bundle execution and page rendering in < 3 seconds on standard 3G/4G network speeds.
- **Memory Limits (NFR-3):** System RAM footprint < 500 MB, GPU VRAM footprint < 256 MB.
- **Battery/Thermal (NFR-4):** Safe continuous mobile operation for 15 minutes without overheating or severe device throttling.
- **Hosting & Cost (NFR-5):** Deployed purely as a static website on Cloudflare Pages. Zero hosting costs.
- **Accessibility & Compatibility (NFR-6):** Broad browser compatibility (Chrome, Edge, Safari, Firefox). Automatic fallback to WebGL 2.0 if WebGPU API is unavailable.

---

## 13. Business Rules

- **BR-1: Zero Backend Policy:** No server-side user databases, credentials, or sessions. All operations must run client-side.
- **BR-2: Asset-Light Policy:** All terrain, vegetation meshes, and water textures must be generated procedurally. Static image/model downloads are restricted to basic UI icons or minor assets (< 1 MB total).
- **BR-3: Strict Privacy Policy:** No user tracking, analytical telemetry, or data upload. The application must operate fully without data collection.

---

## 14. Assumptions

1. The HTML5 Gamepad API has sufficient browser integration to recognize raw signals from USB FPV controllers on both Windows and macOS.
2. Modern mobile browsers (Safari on iOS 17+, Chrome on Android) have stable WebGPU or highly optimized WebGL 2.0 implementations capable of handling real-time noise computation.
3. Static resources can be fully cached via PWA manifests to enable complete offline access.

---

## 15. Constraints

- **Deployment:** Deployment target must be Cloudflare Pages.
- **No Backend:** No API servers (Express, NestJS, Spring Boot, FastAPI, etc.) or database servers (Postgres, MongoDB, Redis, etc.) are allowed.
- **External Map Restriction:** No external map API requests (Google Maps, Mapbox, Cesium) can be made.
- **File Length Limit:** Code files must remain modular, with individual file lengths targeted below 300 to 500 lines for AI developer readability.

---

## 16. Dependencies

- **Build System:** Vite, TypeScript, ES Modules.
- **3D Render Library:** Three.js (primary WebGPU / WebGL 2 rendering).
- **Hosting:** Cloudflare CDN.

---

## 17. Risks

| Risk Description | Severity | Probability | Mitigation Strategy |
|------------------|----------|-------------|---------------------|
| WebGPU API is disabled/missing on user device. | High | Medium | Implement WebGL 2.0 fallback with noise calculations optimized using CPU Web Workers. |
| Gamepad API fails to map FPV transmitter axes correctly. | Medium | Medium | Provide an axis-mapping calibration wizard in the settings overlay. |
| High noise calculation load causes mobile overheating. | High | Medium | Execute aggressive adaptive degradation, capping mobile rendering distance to 3x3 chunks. |

---

## 18. Acceptance Criteria

- **AC-1:** The page loads and displays a responsive 3D viewport containing terrain in < 3 seconds on standard network speeds.
- **AC-2:** Flight feels smooth, maintaining 60 FPS over 5 minutes of continuous flying on desktop and mobile.
- **AC-3:** If WebGPU is unavailable, the application automatically mounts the WebGL 2.0 rendering context without crash overlays.
- **AC-4:** Turning off the internet connection and refreshing the page after the initial load still launches the simulator successfully (PWA verification).
- **AC-5:** Calibrating a USB gamepad assigns the correct physical stick inputs to Throttle, Yaw, Pitch, and Roll controls.

---

## 19. Success Metrics

- **Average Load Time:** < 3.0 seconds.
- **Frame Rate target:** 60 FPS on 90% of tested devices.
- **Server Maintenance Cost:** $0.00 USD.
- **Lighthouse Performance Score:** > 90/100.

---

## 20. Scope

### Phase 1: Foundation (Milestone 1)
- Set up Vite + TS template.
- Implement FPV flight model physics and camera damping equations.
- Create keyboard/mouse input handlers.
- Develop WebGL 2 / WebGPU renderer contexts.
- Implement procedural Forest and Desert biomes.

### Phase 2: Mobile & Settings (Milestone 2)
- Build touch screen UI dual joysticks and altitude slider.
- Build Valley and Snowland biomes.
- Add settings panel and LocalStorage settings persistence.
- Implement Adaptive Performance Degradation Engine.

### Phase 3: Ocean, Gamepad, and PWA (Milestone 3)
- Implement Coastline biome (ocean waves & foam) and Badlands biome.
- Integrate Gamepad API and the FPV transmitter calibration wizard.
- Add Service Worker support and PWA configuration for offline capabilities.

---

## 21. Future Scope

- **Custom Terrain Seeds:** Let users type and share world seed codes.
- **Dynamic Subject Tracking:** Introduce moving vehicles, birds, or other target objects to practice cinematic chase sequences.
- **Propeller Audio Synthesis:** Integrate the Web Audio API to procedurally synthesize motor pitches and wind hums.

---

## 22. Open Questions

1. Do we need custom calibrations saved for multiple gamepad models, or is one active profile sufficient?
2. What is the optimal number of noise octaves for mobile WebGL fallbacks to maintain thermal health?

---

## 23. Change Log

| Timestamp | Type | Summary | Sections |
|-----------|------|---------|----------|
| 2026-07-18T10:38:23Z | Add | Initial release of PRD for Sky Scape | All Sections |
