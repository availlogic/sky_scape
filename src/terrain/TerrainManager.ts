import * as THREE from 'three';
import type { ITerrainChunk, ITerrainManager } from './types';
import { chunkKey, worldToChunk } from './types';
import type { IBiomeConfig } from '../biomes/types';
import { TerrainChunk } from './TerrainChunk';

export class TerrainManager implements ITerrainManager {
  public activeChunks = new Map<string, ITerrainChunk>();
  public currentChunkCoord = new THREE.Vector2(0, 0);

  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private biome: IBiomeConfig;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, biome: IBiomeConfig) {
    this.scene = scene;
    this.renderer = renderer;
    this.biome = biome;
  }

  public updateVisibleChunks(position: THREE.Vector3, renderRadius: number): void {
    const { cx, cz } = worldToChunk(position.x, position.z);

    // Update active center chunk coord
    this.currentChunkCoord.set(cx, cz);

    const neededKeys = new Set<string>();

    // 1. Determine chunks that should be loaded
    for (let xOffset = -renderRadius; xOffset <= renderRadius; xOffset++) {
      for (let zOffset = -renderRadius; zOffset <= renderRadius; zOffset++) {
        const tx = cx + xOffset;
        const tz = cz + zOffset;

        // Chebyshev distance check
        if (Math.max(Math.abs(xOffset), Math.abs(zOffset)) <= renderRadius) {
          const key = chunkKey(tx, tz);
          neededKeys.add(key);

          if (!this.activeChunks.has(key)) {
            // Spawn new chunk
            const chunk = new TerrainChunk(tx, tz, this.scene, this.biome);
            this.activeChunks.set(key, chunk);
            chunk.initialize(this.renderer);
          }
        }
      }
    }

    // 2. Unload chunks out of range
    for (const [key, chunk] of this.activeChunks.entries()) {
      if (!neededKeys.has(key)) {
        chunk.dispose();
        this.activeChunks.delete(key);
      }
    }
  }

  public setBiome(biome: IBiomeConfig): void {
    this.biome = biome;

    // Clear all existing chunks
    for (const chunk of this.activeChunks.values()) {
      chunk.dispose();
    }
    this.activeChunks.clear();

    // Trigger regeneration by forcing a re-poll at current position
    // (the caller will update visible chunks immediately)
  }
  public updateWater(time: number, waveCount: number): void {
    for (const chunk of this.activeChunks.values()) {
      if (chunk instanceof TerrainChunk) {
        chunk.updateWater(time, waveCount);
      }
    }
  }
}
export default TerrainManager;
