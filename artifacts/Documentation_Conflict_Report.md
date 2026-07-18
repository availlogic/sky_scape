# Documentation Conflict Report: Sky Scape

This report documents discrepancies, structural inconsistencies, and design issues identified across the 17 documentation files of the Sky Scape project, along with their implemented mitigations in Phase 1.

---

## 1. Conflict: CPU/GPU Height Sync (CRITICAL)

### Conflicting Documents
- `docs/Constraints.md` (Section 1: Shaders)
- `docs/PRD.md` (FR-PHYSICS: Physics & Collision)
- `docs/Architecture.md` (Section 2.5: Biome Manager)

### Conflict Description
- **The Issue:** The project requirements state that all terrain noise calculations must run entirely on the GPU (WGSL/GLSL) to maintain 60 FPS. However, the physics engine (calculating drone momentum, drag, and collision checks) runs on the CPU and requires the terrain height at the drone's position to prevent clipping.
- **The Problem:** Querying height back from GPU textures to CPU memory (readback) causes major graphics pipeline stalls, breaking the 60 FPS requirement.
- **Implemented Mitigation:** We duplicated the Simplex noise, FBM, and domain-warping mathematical algorithms in TypeScript (`src/terrain/noise.ts`). The CPU directly queries this function for slide-bounce calculations. Since it uses identical seed formulas as the GLSL shaders, the height values match without reading from the GPU.

---

## 2. Conflict: Pitch Control Input Mismatch (HIGH)

### Conflicting Documents
- `docs/Acceptance-Criteria.md` (Feature 2: Keyboard Layout & Mouse Look)
- `docs/PRD.md` (FR-INPUT: Control Schemes)

### Conflict Description
- **The Issue:** The documentation specifies that keyboard `W`/`S` control drone `pitch` (tilting forward and backward), but also specifies that vertical mouse movement controls `pitch`.
- **The Problem:** This maps two separate devices (keyboard and mouse vertical axis) to the same single degree-of-freedom (`pitch`). If both are active, they will overwrite each other.
- **Implemented Mitigation:** We mapped `W`/`S` keys to change the drone's actual flight pitch (affecting the direction of thruster force), and mapped mouse vertical movements to change the *camera's look pitch* (accumulated separately as a gimbal angle in `KeyboardMouseInput.mousePitchLook`). This resolves the input conflict and allows natural FPV fly-and-look controls.

---

## 3. Conflict: WebGL 2.0 Foliage Placement height (HIGH)

### Conflicting Documents
- `docs/Architecture.md` (Section 4.2: WebGL 2.0 Fallback)
- `docs/Acceptance-Criteria.md` (Feature 5: Foliage Placement)

### Conflict Description
- **The Issue:** For the WebGL 2.0 fallback, foliage placements are calculated on the CPU, but the terrain height is calculated on the GPU.
- **The Problem:** The CPU needs to know the terrain height at the placement coordinate to prevent trees and rocks from floating or being buried under the terrain.
- **Implemented Mitigation:** We leveraged the same TS `getTerrainHeight` function to query heights during foliage instantiation, placing instances perfectly on the procedurally generated surface.

---

## 4. Conflict: Expo Factor Schema Mismatch (MEDIUM)

### Conflicting Documents
- `docs/Database.md` (LocalStorage UserSettings Schema)
- `docs/Screen-Specs.md` (Settings Panel sliders)

### Conflict Description
- **The Issue:** The Settings Panel specifications demand separate Expo sliders for Yaw, Pitch, and Roll. However, the documented LocalStorage schema has a single `expoFactor: number` field.
- **The Problem:** We cannot store individual Yaw/Pitch/Roll expo values without deviating from the strict LocalStorage schema.
- **Implemented Mitigation:** We implemented a single `expoFactor` applied uniformly to all raw rotational axes in `InputManager.ts` (matching the LocalStorage schema). In Phase 2, we recommend updating the database schema to store `yawExpo`, `pitchExpo`, and `rollExpo` if independent sliders are desired.

---

## Recommended Action
We recommend updating the product documentation in the next documentation cycle to reflect these architectural resolutions.
