import type { IBiomeConfig } from '../types';

export const FOREST_BIOME: IBiomeConfig = {
  name: 'forest',
  primaryColor: '#388E3C', // Vibrant grass green
  secondaryColor: '#795548', // Warm clay/earth brown (cliffs)
  waterColor: '#1A5276', // Deep lake blue
  skyColor: '#bae6fd', // Warm sunny sky blue
  ambientColor: '#bae6fd', // Matching ambient light fill
  ambientIntensity: 0.6,
  sunColor: '#fffbeb', // Warm golden sunlight
  sunIntensity: 1.2,
  noise: {
    frequency: 0.008,
    octaves: 6,
    persistence: 0.5,
    lacunarity: 2.0,
    domainWarpAmplitude: 30.0,
  },
  maxElevation: 200,
  foliage: [
    { type: 'tree', density: 1.8, scaleMin: 0.8, scaleMax: 2.2 },
    { type: 'rock', density: 0.05, scaleMin: 0.125, scaleMax: 0.375 },
    { type: 'grass', density: 2.5, scaleMin: 0.4, scaleMax: 0.8 },
    { type: 'shrub', density: 1.8, scaleMin: 0.6, scaleMax: 1.2 },
  ],
};
export default FOREST_BIOME;
