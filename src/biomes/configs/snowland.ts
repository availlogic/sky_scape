import type { IBiomeConfig } from '../types';

export const SNOWLAND_BIOME: IBiomeConfig = {
  name: 'snowland',
  primaryColor: '#F8FAFC', // Snow white
  secondaryColor: '#E2E8F0', // Ice slate gray
  waterColor: '#0F172A', // Deep ice water
  noise: {
    frequency: 0.007,
    octaves: 5,
    persistence: 0.52,
    lacunarity: 2.1,
    domainWarpAmplitude: 35.0,
  },
  maxElevation: 250,
  foliage: [{ type: 'tree', density: 0.2, scaleMin: 0.5, scaleMax: 1.5 }],
};
export default SNOWLAND_BIOME;
