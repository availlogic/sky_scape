import { describe, test, expect, vi } from 'vitest';
import * as THREE from 'three';
import { TerrainManager } from '../../src/terrain/TerrainManager';
import { worldToChunk } from '../../src/terrain/types';
import FOREST_BIOME from '../../src/biomes/configs/forest';
import DESERT_BIOME from '../../src/biomes/configs/desert';

// Mock raw shader imports in Vitest
vi.mock('../../src/shaders/noise.glsl?raw', () => ({ default: '' }));
vi.mock('../../src/shaders/terrain.vert.glsl?raw', () => ({ default: '' }));
vi.mock('../../src/shaders/terrain.frag.glsl?raw', () => ({ default: '' }));

// Mock TerrainChunk's initialize to bypass WebGL dependency in unit tests
vi.mock('../../src/terrain/TerrainChunk', () => {
  return {
    TerrainChunk: class {
      public mesh = null;
      public foliageInstances = [];
      public isReady = false;
      constructor(
        public readonly x: number,
        public readonly z: number,
      ) {}
      initialize() {
        this.isReady = true;
        return Promise.resolve();
      }
      dispose() {
        this.isReady = false;
      }
    },
  };
});

describe('Terrain Module', () => {
  const mockScene = {} as THREE.Scene;
  const mockRenderer = {} as THREE.WebGLRenderer;

  test('worldToChunk correctly partitions coordinates', () => {
    expect(worldToChunk(0, 0)).toEqual({ cx: 0, cz: 0 });
    expect(worldToChunk(63, 63)).toEqual({ cx: 0, cz: 0 });
    expect(worldToChunk(64, 64)).toEqual({ cx: 1, cz: 1 });
    expect(worldToChunk(-1, -1)).toEqual({ cx: -1, cz: -1 });
  });

  test('IT-TER-GPU-01: updates active chunks within render radius', () => {
    const manager = new TerrainManager(mockScene, mockRenderer, FOREST_BIOME);

    // 1. Initial position (0,0) with radius 1 (should load a 3x3 grid = 9 chunks)
    manager.updateVisibleChunks(new THREE.Vector3(0, 0, 0), 1);
    expect(manager.activeChunks.size).toBe(9);
    expect(manager.activeChunks.has('0,0')).toBe(true);
    expect(manager.activeChunks.has('1,1')).toBe(true);

    // 2. Move slightly (within same chunk (0,0)) -> size stays 9
    manager.updateVisibleChunks(new THREE.Vector3(30, 0, 30), 1);
    expect(manager.activeChunks.size).toBe(9);

    // 3. Move far away to x=128 (chunk 2,0) -> shifts loading window
    manager.updateVisibleChunks(new THREE.Vector3(128, 0, 0), 1);

    // Chunk (2,0) with radius 1 covers cx in [1, 3], cz in [-1, 1]
    expect(manager.activeChunks.size).toBe(9);
    expect(manager.activeChunks.has('2,0')).toBe(true);
    expect(manager.activeChunks.has('-1,0')).toBe(false); // Disposed!
  });

  test('setBiome disposes of active chunks', () => {
    const manager = new TerrainManager(mockScene, mockRenderer, FOREST_BIOME);
    manager.updateVisibleChunks(new THREE.Vector3(0, 0, 0), 1);

    expect(manager.activeChunks.size).toBe(9);

    manager.setBiome(DESERT_BIOME);
    expect(manager.activeChunks.size).toBe(0); // Cleared!
  });
});
