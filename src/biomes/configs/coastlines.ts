import type { IBiomeConfig } from '../types';

export const COASTLINES_BIOME: IBiomeConfig = {
  name: 'coastlines',
  primaryColor: '#2C5E3B', // Island tropical green
  secondaryColor: '#DFD8C8', // Warm sandy shore
  waterColor: '#0E7490', // Cyan ocean water
  noise: {
    frequency: 0.004,
    octaves: 5,
    persistence: 0.48,
    lacunarity: 2.0,
    domainWarpAmplitude: 25.0,
  },
  maxElevation: 80, // Flat islands
  waterLevel: 0.15,
  foliage: [
    { type: 'tree', density: 0.15, scaleMin: 0.5, scaleMax: 1.2 }, // Palm trees
  ],
};
export default COASTLINES_BIOME;
