import { describe, test, expect, vi } from 'vitest';
import * as THREE from 'three';
import { TerrainChunk } from '../../src/terrain/TerrainChunk';
import FOREST_BIOME from '../../src/biomes/configs/forest';
import SNOWLAND_BIOME from '../../src/biomes/configs/snowland';
import DESERT_BIOME from '../../src/biomes/configs/desert';
import COASTLINES_BIOME from '../../src/biomes/configs/coastlines';
import { simplex2D } from '../../src/terrain/noise';

vi.mock('../../src/shaders/noise.glsl?raw', () => ({ default: '' }));
vi.mock('../../src/shaders/terrain.vert.glsl?raw', () => ({ default: '' }));
vi.mock('../../src/shaders/terrain.frag.glsl?raw', () => ({ default: '' }));
vi.mock('../../src/shaders/water.vert.glsl?raw', () => ({ default: '' }));
vi.mock('../../src/shaders/water.frag.glsl?raw', () => ({ default: '' }));

describe('TerrainChunk culling', () => {
  test('frustumCulled is disabled for chunk, water, and foliage meshes', async () => {
    const scene = new THREE.Scene();
    const renderer = {} as THREE.WebGLRenderer;
    const chunk = new TerrainChunk(0, 0, scene, FOREST_BIOME);

    await chunk.initialize(renderer);

    expect(chunk.mesh).not.toBeNull();
    expect(chunk.mesh!.frustumCulled).toBe(false);

    expect(chunk.waterMesh).not.toBeNull();
    expect(chunk.waterMesh!.frustumCulled).toBe(false);

    expect(chunk.foliageInstances.length).toBeGreaterThan(0);
    for (const inst of chunk.foliageInstances) {
      expect(inst.frustumCulled).toBe(false);
    }
  });

  test('passes u_waterLevel to terrain material and handles custom water levels', async () => {
    const scene = new THREE.Scene();
    const renderer = {} as THREE.WebGLRenderer;

    // Test with default waterLevel (should be 0.05)
    const chunkDefault = new TerrainChunk(0, 0, scene, FOREST_BIOME);
    await chunkDefault.initialize(renderer);
    const matDefault = chunkDefault.mesh!.material as THREE.RawShaderMaterial;
    expect(matDefault.uniforms.u_waterLevel).toBeDefined();
    expect(matDefault.uniforms.u_waterLevel.value).toBe(0.05);

    // Test with custom waterLevel config (e.g. 0.15)
    const customBiome = { ...FOREST_BIOME, waterLevel: 0.15 };
    const chunkCustom = new TerrainChunk(0, 0, scene, customBiome);
    await chunkCustom.initialize(renderer);
    const matCustom = chunkCustom.mesh!.material as THREE.RawShaderMaterial;
    expect(matCustom.uniforms.u_waterLevel.value).toBe(0.15);
  });

  test('foliage materials are initialized with vertexColors enabled for trees', async () => {
    const scene = new THREE.Scene();
    const renderer = {} as THREE.WebGLRenderer;
    const chunk = new TerrainChunk(0, 0, scene, FOREST_BIOME);
    await chunk.initialize(renderer);

    expect(chunk.foliageInstances.length).toBeGreaterThan(0);

    // Find the instanced mesh corresponding to 'tree' (index 0 in FOREST_BIOME.foliage)
    const treeInst = chunk.foliageInstances[0];
    expect((treeInst.material as THREE.Material).vertexColors).toBe(true);
  });

  test('biomes have expected rock densities', () => {
    const getRockDensity = (foliageList: Array<{ type: string; density: number }>) => {
      const rockSpec = foliageList.find((f) => f.type === 'rock');
      return rockSpec ? rockSpec.density : undefined;
    };

    expect(getRockDensity(SNOWLAND_BIOME.foliage)).toBeUndefined();
    expect(getRockDensity(FOREST_BIOME.foliage)).toBe(0.05);
    expect(getRockDensity(DESERT_BIOME.foliage)).toBeUndefined();
    expect(getRockDensity(COASTLINES_BIOME.foliage)).toBeUndefined();
  });

  test('snowland trees and rocks are significantly whitish (highly snow-covered)', async () => {
    const scene = new THREE.Scene();
    const renderer = {} as THREE.WebGLRenderer;

    // 1. Check forest tree has NO snow color (R > 0.8)
    const forestChunk = new TerrainChunk(0, 0, scene, FOREST_BIOME);
    await forestChunk.initialize(renderer);
    const forestTreeMesh = forestChunk.foliageInstances.find(
      (inst) =>
        inst.geometry.name === 'tree-forest' ||
        inst.geometry.name === 'tree' ||
        inst.geometry.getAttribute('color'),
    );
    if (forestTreeMesh) {
      const colors = forestTreeMesh.geometry.getAttribute('color').array as Float32Array;
      let hasSnow = false;
      for (let i = 0; i < colors.length; i += 3) {
        if (colors[i] > 0.8) hasSnow = true;
      }
      expect(hasSnow).toBe(false);
    }

    // 2. Check snowland tree has snow colors and is overall whitish
    const snowChunk = new TerrainChunk(0, 0, scene, SNOWLAND_BIOME);
    await snowChunk.initialize(renderer);
    const snowTreeMesh = snowChunk.foliageInstances.find(
      (inst) => inst.geometry.name === 'tree-snowland' || inst.geometry.name === 'tree',
    );
    expect(snowTreeMesh).toBeDefined();
    const snowTreeColors = snowTreeMesh!.geometry.getAttribute('color').array as Float32Array;

    // Calculate average R, G, B for leaves
    let totalR = 0,
      totalG = 0,
      totalB = 0;
    let leafVertexCount = 0;
    for (let i = 0; i < snowTreeColors.length; i += 3) {
      totalR += snowTreeColors[i];
      totalG += snowTreeColors[i + 1];
      totalB += snowTreeColors[i + 2];
      leafVertexCount++;
    }
    const avgR = totalR / leafVertexCount;
    const avgG = totalG / leafVertexCount;
    const avgB = totalB / leafVertexCount;

    // Average color of snowland tree should be highly whitish (e.g. > 0.65)
    expect(avgR).toBeGreaterThan(0.65);
    expect(avgG).toBeGreaterThan(0.65);
    expect(avgB).toBeGreaterThan(0.65);
  });

  test('forest biome rock size is reduced to 1/4', () => {
    const rockSpec = FOREST_BIOME.foliage.find((f) => f.type === 'rock')!;
    expect(rockSpec.scaleMin).toBe(0.125);
    expect(rockSpec.scaleMax).toBe(0.375);
  });

  test('passes u_isCoastlines uniform correctly', async () => {
    const scene = new THREE.Scene();
    const renderer = {} as THREE.WebGLRenderer;

    const chunkCoastlines = new TerrainChunk(0, 0, scene, COASTLINES_BIOME);
    await chunkCoastlines.initialize(renderer);
    const matCoastlines = chunkCoastlines.mesh!.material as THREE.RawShaderMaterial;
    expect(matCoastlines.uniforms.u_isCoastlines).toBeDefined();
    expect(matCoastlines.uniforms.u_isCoastlines.value).toBe(1.0);

    const chunkForest = new TerrainChunk(0, 0, scene, FOREST_BIOME);
    await chunkForest.initialize(renderer);
    const matForest = chunkForest.mesh!.material as THREE.RawShaderMaterial;
    expect(matForest.uniforms.u_isCoastlines.value).toBe(0.0);
  });

  test('forest trees are clustered using simplex noise', async () => {
    const scene = new THREE.Scene();
    const renderer = {} as THREE.WebGLRenderer;
    const chunk = new TerrainChunk(0, 0, scene, FOREST_BIOME);
    await chunk.initialize(renderer);

    const forestTreeMesh = chunk.foliageInstances.find(
      (inst) => inst.geometry.name === 'tree-forest' || inst.geometry.name === 'tree',
    );
    expect(forestTreeMesh).toBeDefined();

    // Ensure that all placed forest trees satisfy the noise threshold condition
    const instMesh = forestTreeMesh!;
    const count = instMesh.count;
    expect(count).toBeGreaterThan(0);

    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < count; i++) {
      instMesh.getMatrixAt(i, matrix);
      matrix.decompose(position, rotation, scale);

      // Calculate noise at tree position
      const noiseVal = simplex2D(position.x * 0.05, position.z * 0.05);
      expect(noiseVal).toBeGreaterThan(-0.1);
    }
  });

  test('shrub foliage is correctly generated for forest biome', async () => {
    const scene = new THREE.Scene();
    const renderer = {} as THREE.WebGLRenderer;
    const chunk = new TerrainChunk(0, 0, scene, FOREST_BIOME);
    await chunk.initialize(renderer);

    const shrubInst = chunk.foliageInstances.find(
      (inst) => inst.geometry.name === 'shrub',
    );
    expect(shrubInst).toBeDefined();
    expect(shrubInst!.count).toBeGreaterThan(0);
    expect(shrubInst!.geometry.getAttribute('position')).toBeDefined();
    expect(shrubInst!.geometry.getAttribute('color')).toBeDefined();
  });

  test('passes u_fogColor uniform correctly to terrain and water materials', async () => {
    const scene = new THREE.Scene();
    const renderer = {} as THREE.WebGLRenderer;
    const chunk = new TerrainChunk(0, 0, scene, FOREST_BIOME);
    await chunk.initialize(renderer);

    const terrainMat = chunk.mesh!.material as THREE.RawShaderMaterial;
    expect(terrainMat.uniforms.u_fogColor).toBeDefined();
    expect(terrainMat.uniforms.u_fogColor.value).toBeInstanceOf(THREE.Color);

    const waterMat = chunk.waterMesh!.material as THREE.RawShaderMaterial;
    expect(waterMat.uniforms.u_fogColor).toBeDefined();
    expect(waterMat.uniforms.u_fogColor.value).toBeInstanceOf(THREE.Color);
  });
});
