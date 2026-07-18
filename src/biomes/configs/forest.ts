import type { IBiomeConfig } from '../types';

export const FOREST_BIOME: IBiomeConfig = {
  name: 'forest',
  primaryColor: '#1B3F14', // Deep pine forest green
  secondaryColor: '#5C4033', // Dark earth brown (cliffs)
  waterColor: '#1A5276', // Deep lake blue
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
    { type: 'grass', density: 0.8, scaleMin: 0.3, scaleMax: 0.6 },
  ],
};
export default FOREST_BIOME;
