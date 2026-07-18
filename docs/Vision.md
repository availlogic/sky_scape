# Project Vision: Infinite Generative FPV Drone Shot Simulator

A pure-frontend, fully generative FPV drone aerial simulation and exploration application built for modern browsers.

## 1. Project Vision

To provide a pure, seamless, and visually stunning FPV drone cruising experience over infinitely generated, procedurally generated natural environments. The application eliminates the friction of traditional flight simulation (such as airport runway takeoff, landing, complex instrumentation, and configuration) and drops the user directly into a mid-air cruise. The world is built on deterministic mathematical noise algorithms, offering infinite exploration that is fully reproducible and zero-cost to host.

## 2. Target Users

- **FPV Drone Enthusiasts:** Pilots looking for a quick, zero-friction, and accessible way to practice FPV camera movement and explore scenic flight routes directly in a browser.
- **Aerial Photography Fans:** Users interested in capturing aesthetic landscape photos and cinematic drone shots without owning physical drone hardware.
- **Casual Explorers:** Users seeking a relaxing, immersive, and visually pleasing experience of discovering infinite natural landscapes (deserts, forests, snowlands, coasts, canyons).

## 3. User Problems Addressed

- **Complexity of Traditional Simulators:** Existing flight simulators have steep learning curves, requiring extensive calibration, runway controls, and understanding of complex cockpit telemetry.
- **Massive Resource Footprint:** Most flight simulators require tens of gigabytes of terrain, texture, and model assets, leading to long download times and high disk usage.
- **High Hardware & Network Barriers:** Many web-based or desktop map viewers require constant internet connectivity, high bandwidth, and expensive API integrations (like Mapbox or Google Maps), which also leads to high operating costs.

## 4. Product Goals

- **Direct Cruise Experience:** Mid-air spawn at cruising altitude (100–200m) with zero landing or airport takeoff mechanics.
- **Deterministic Infinite Landscapes:** Real-time generation of infinite terrains using purely mathematical noise algorithms, allowing the world to be endless yet consistent across multiple runs if the same seed is used.
- **Asset-Light & Offline-Capable:** Minimize the reliance on external models, textures, and assets, allowing the simulator to load within seconds and run entirely offline via PWA caching.
- **Cross-Platform Accessibility:** Deliver a unified 60 FPS experience with optimized controls on both desktop and mobile web browsers.
- **Zero Friction & Cost:** No account setup, login, or subscriptions. Zero backend costs for developers and users.

## 5. Core Capabilities

- **FPV Flight & Camera Control:** Smooth, momentum-based flight physics with camera damping to emulate professional FPV cinematic footage.
- **All-Platform Inputs:**
  - *Desktop:* Standard keyboard (WASD + QE) and mouse (pitch/yaw) mapping.
  - *Mobile/Tablet:* Dual virtual joysticks (movement and camera rotation) and a dedicated altitude slider.
  - *Dynamic Controls:* A persistent speed slider allowing real-time adjustment of cruising speed (e.g., 5 m/s to 30 m/s).
- **Procedural Landscape Generation (Six Biomes):**
  - **Desert:** Dynamic sand dunes, wind erosion, and yardang formations.
  - **Forest:** Rolling hills, grasslands, and high-performance instanced foliage.
  - **Valley:** Steep cliffs, canyons, and dry river beds.
  - **Snowland:** Majestic glaciers, snow-capped mountains, and sparse tundra.
  - **Coastlines & Archipelago:** Coastline cliffs, islands, and custom Gerstner wave sea water with simulated foam.
  - **Badlands & Canyons:** Striated Danxia landforms, red rocks, and layered terrain colors.
- **Atmospheric Weather & Lighting System:**
  - Real-time lighting incorporating directional sun light, ambient light, sky gradients, and atmospheric scattering.
  - Procedural time-of-day changes (sunset, golden hour, blue hour) and atmospheric conditions (clouds, fog, rain, snow).
- **Adaptive Performance Management:** Continuous FPS monitoring that automatically throttles render distances, level of detail (LOD), density, shadows, and resolution to ensure a consistent 60 FPS.

## 6. Success Metrics

- **Framerate Stability:** Maintain stable 60 FPS during flight across supported devices.
- **First Contentful Paint (FCP):** First-screen application load under 3 seconds on standard connections.
- **Memory Consumption:** RAM usage limited to < 500 MB.
- **GPU Memory Allocation:** VRAM usage limited to < 256 MB.
- **Thermal and Battery Life:** Sustainable, high-framerate mobile execution for at least 15 minutes without overheating or aggressive thermal throttling.

## 7. Out of Scope

- **Real-World Geography:** Rendering terrain based on real-world GIS, GPS, or satellite imagery coordinates.
- **Traditional Flight Dynamics:** Airport runway takeoff, landing mechanics, manual engine management, and instrument-only navigation (IFR).
- **Crash & Damage Simulation:** Collision physics that damage or destroy the drone, resetting the game. Flight remains continuous and exploratory.
- **Multiplayer and Account Management:** Live multiplayer lobbies, user profiles, cloud save integration, and leaderboard databases.
- **Physical Gamepad Support (V1.0):** Standard gamepad/joystick API mapping is excluded from the initial release, prioritizing keyboard/mouse and touchscreen controls.
