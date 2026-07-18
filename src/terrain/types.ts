import * as THREE from 'three';
import type { IBiomeConfig } from '../biomes/types';

/**
 * Contract for a single terrain chunk.
 */
export interface ITerrainChunk {
  readonly x: number;
  readonly z: number;
  mesh: THREE.Mesh | null;
  foliageInstances: THREE.InstancedMesh[];
  isReady: boolean;

  /** Generate heightmap and build mesh geometry. */
  initialize(renderer: THREE.WebGLRenderer): Promise<void>;

  /** Release GPU resources (geometry, materials, instance buffers). */
  dispose(): void;
}

/**
 * Contract for the terrain chunk streaming manager.
 */
export interface ITerrainManager {
  activeChunks: Map<string, ITerrainChunk>;
  currentChunkCoord: THREE.Vector2;

  /** Load/unload chunks around the given world position within renderRadius. */
  updateVisibleChunks(position: THREE.Vector3, renderRadius: number): void;

  /** Switch active biome and regenerate terrain. */
  setBiome(biome: IBiomeConfig): void;
}

/** Size of one terrain chunk in world units (64×64 vertices). */
export const CHUNK_SIZE = 64;

/** Build a chunk cache key from chunk coordinates. */
export function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

/** Convert a world position to chunk coordinates. */
export function worldToChunk(wx: number, wz: number): { cx: number; cz: number } {
  return {
    cx: Math.floor(wx / CHUNK_SIZE),
    cz: Math.floor(wz / CHUNK_SIZE),
  };
}
