import type { IBiomeConfig } from './types';
import { FOREST_BIOME } from './configs/forest';
import { DESERT_BIOME } from './configs/desert';
import { SNOWLAND_BIOME } from './configs/snowland';
import { COASTLINES_BIOME } from './configs/coastlines';

export class BiomeManager {
  private biomes = new Map<string, IBiomeConfig>();
  private activeBiome: IBiomeConfig;

  constructor() {
    // Register biomes
    this.registerBiome(FOREST_BIOME);
    this.registerBiome(DESERT_BIOME);
    this.registerBiome(SNOWLAND_BIOME);
    this.registerBiome(COASTLINES_BIOME);

    // Default biome is forest
    this.activeBiome = FOREST_BIOME;
  }

  public registerBiome(config: IBiomeConfig): void {
    this.biomes.set(config.name.toLowerCase(), config);
  }

  public getActiveBiome(): IBiomeConfig {
    return this.activeBiome;
  }

  public setActiveBiome(name: string): IBiomeConfig {
    const key = name.toLowerCase();
    const config = this.biomes.get(key);
    if (!config) {
      throw new Error(`Biome "${name}" is not registered.`);
    }
    this.activeBiome = config;
    return config;
  }

  public getBiome(name: string): IBiomeConfig | undefined {
    return this.biomes.get(name.toLowerCase());
  }

  public getAvailableBiomes(): string[] {
    return Array.from(this.biomes.keys());
  }
}
export default BiomeManager;
