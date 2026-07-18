/**
 * Noise generation parameters for a biome's terrain.
 */
export interface NoiseConfig {
  frequency: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  domainWarpAmplitude: number;
}

/**
 * Foliage instance specification.
 */
export interface FoliageSpec {
  type: 'tree' | 'rock' | 'grass' | 'flower' | 'shrub';
  density: number;
  scaleMin: number;
  scaleMax: number;
}

/**
 * Contract for a biome configuration.
 */
export interface IBiomeConfig {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  waterColor: string;
  noise: NoiseConfig;
  maxElevation: number;
  foliage: FoliageSpec[];
  waterLevel?: number;
  skyColor?: string;
  ambientColor?: string;
  ambientIntensity?: number;
  sunColor?: string;
  sunIntensity?: number;
}
