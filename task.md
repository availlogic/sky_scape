# Sky Scape Task Checklist

## [x] Phase 1 — Foundation & Desktop
(Completed)

## [/] Phase 2 — Mobile & Settings

### Touch Controls
- [x] Write failing unit tests for new Keyboard/Mouse control mappings and physics engine behaviors
- [x] Implement new Keyboard/Mouse controls in `KeyboardMouseInput.ts`
- [x] Implement initial hover state and fly-camera spectator physics in `FPVPhysicsEngine.ts`
- [x] Fix the Simplex 2D noise permute bug in `noise.glsl`
- [x] Fix the foliage tree geometry translation bug in `TerrainChunk.ts`
- [/] Redesign terrain generation for realistic hills, valleys, and biomes in `noise.ts` and `noise.glsl`

### Adaptive Performance Degradation Engine (APDE)
- [ ] src/engine/AdaptivePerformanceEngine.ts (FPS monitor, 4-state degradation, HUD feedback)
- [ ] Integrate APDE into src/main.ts render loop

### Additional Biomes
- [ ] src/biomes/configs/valley.ts
- [ ] src/biomes/configs/snowland.ts
- [ ] Register new biomes in src/biomes/BiomeManager.ts

### Phase 2 Tests
- [ ] tests/unit/performance.test.ts (APDE state machine transitions)
- [ ] tests/unit/touch-input.test.ts (Joysticks coordinates & fading)
- [ ] tests/e2e/mobile-joystick.spec.ts (Touch layout layout & opacity transition)
- [ ] tests/e2e/settings.spec.ts (Quality toggling, sliders persistence)

---

## [/] Phase 3 — Ocean, Gamepad, PWA

### Gamepad Controls
- [ ] src/controls/GamepadInput.ts (Gamepad API axis poll, mapping)
- [ ] Gamepad disconnect listener & modal overlay in src/main.ts

### Calibration Wizard
- [ ] src/controls/CalibrationWizard.ts (5-step wizard logic, live gimbal coordinates dot, calibration UI)
- [ ] Save mapping validation and LocalStorage serialization

### Additional Biomes & Shaders
- [ ] src/biomes/configs/coastlines.ts
- [ ] src/biomes/configs/badlands.ts
- [ ] src/shaders/water.vert.glsl + water.frag.glsl (Gerstner waves, foam mapping)
- [ ] Integrate water mesh rendering in src/terrain/TerrainChunk.ts

### PWA Offline
- [ ] public/manifest.webmanifest (PWA configuration)
- [ ] src/sw.ts (Service worker with Stale-While-Revalidate caching)
- [ ] Register service worker in src/main.ts

### Phase 3 Tests
- [ ] tests/unit/gamepad.test.ts (Gamepad axis mapping, inversion checks)
- [ ] tests/integration/calibrator-ui.test.ts (Wizard step flows)
- [ ] tests/e2e/gamepad-calibration.spec.ts (Mocked gamepad E2E calibration)
- [ ] tests/e2e/performance-degradation.spec.ts (FPS drop triggers APDE warning)
- [ ] tests/e2e/pwa-offline.spec.ts (Offline PWA loading check)
- [ ] tests/e2e/gamepad-disconnect.spec.ts (Gamepad disconnect pause prompt)
