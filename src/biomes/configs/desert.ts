import type { IBiomeConfig } from '../types';

export const DESERT_BIOME: IBiomeConfig = {
  name: 'desert',
  primaryColor: '#C2B280', // Sand gold
  secondaryColor: '#8B6914', // Rock brown (cliffs)
  waterColor: '#1A5276', // Oasis blue
  noise: {
    frequency: 0.005,
    octaves: 4,
    persistence: 0.45,
    lacunarity: 2.2,
    domainWarpAmplitude: 50.0, // High warping for sand dunes
  },
  maxElevation: 150,
  foliage: [],
};
export default DESERT_BIOME;
