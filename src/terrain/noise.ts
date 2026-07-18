import type { NoiseConfig } from '../biomes/types';

function mod289(x: number): number {
  return x - Math.floor(x * (1.0 / 289.0)) * 289.0;
}

function permute(x: number): number {
  return mod289((x * 34.0 + 1.0) * x);
}

/**
 * 2D Simplex Noise returning values in [-1.0, 1.0].
 * Matches the GPU-side GLSL shader implementation using polynomial permutations.
 */
export function simplex2D(xin: number, yin: number): number {
  const C_x = 0.211324865405187; // (3.0 - Math.sqrt(3.0)) / 6.0
  const C_y = 0.366025403784439; // 0.5 * (Math.sqrt(3.0) - 1.0)
  const C_z = -0.577350269189626; // -1.0 + 2.0 * C_x
  const C_w = 0.024390243902439; // 1.0 / 41.0

  const dot_v_Cyy = (xin + yin) * C_y;
  const i_x = Math.floor(xin + dot_v_Cyy);
  const i_y = Math.floor(yin + dot_v_Cyy);

  const dot_i_Cxx = (i_x + i_y) * C_x;
  const x0_x = xin - i_x + dot_i_Cxx;
  const x0_y = yin - i_y + dot_i_Cxx;

  const i1_x = x0_x > x0_y ? 1.0 : 0.0;
  const i1_y = x0_x > x0_y ? 0.0 : 1.0;

  const x12_x = x0_x + C_x - i1_x;
  const x12_y = x0_y + C_x - i1_y;
  const x12_z = x0_x + C_z;
  const x12_w = x0_y + C_z;

  const i_mod_x = mod289(i_x);
  const i_mod_y = mod289(i_y);

  const p_in_0 = permute(i_mod_y + 0.0);
  const p_in_1 = permute(i_mod_y + i1_y);
  const p_in_2 = permute(i_mod_y + 1.0);

  const p_0 = permute(p_in_0 + i_mod_x + 0.0);
  const p_1 = permute(p_in_1 + i_mod_x + i1_x);
  const p_2 = permute(p_in_2 + i_mod_x + 1.0);

  const dot0 = x0_x * x0_x + x0_y * x0_y;
  const dot1 = x12_x * x12_x + x12_y * x12_y;
  const dot2 = x12_z * x12_z + x12_w * x12_w;

  let m_0 = Math.max(0.5 - dot0, 0.0);
  let m_1 = Math.max(0.5 - dot1, 0.0);
  let m_2 = Math.max(0.5 - dot2, 0.0);

  m_0 = m_0 * m_0 * m_0 * m_0;
  m_1 = m_1 * m_1 * m_1 * m_1;
  m_2 = m_2 * m_2 * m_2 * m_2;

  const fract = (val: number) => val - Math.floor(val);

  const x_0 = 2.0 * fract(p_0 * C_w) - 1.0;
  const x_1 = 2.0 * fract(p_1 * C_w) - 1.0;
  const x_2 = 2.0 * fract(p_2 * C_w) - 1.0;

  const h_0 = Math.abs(x_0) - 0.5;
  const h_1 = Math.abs(x_1) - 0.5;
  const h_2 = Math.abs(x_2) - 0.5;

  const ox_0 = Math.floor(x_0 + 0.5);
  const ox_1 = Math.floor(x_1 + 0.5);
  const ox_2 = Math.floor(x_2 + 0.5);

  const a0_0 = x_0 - ox_0;
  const a0_1 = x_1 - ox_1;
  const a0_2 = x_2 - ox_2;

  m_0 *= 1.79284291400159 - 0.85373472095314 * (a0_0 * a0_0 + h_0 * h_0);
  m_1 *= 1.79284291400159 - 0.85373472095314 * (a0_1 * a0_1 + h_1 * h_1);
  m_2 *= 1.79284291400159 - 0.85373472095314 * (a0_2 * a0_2 + h_2 * h_2);

  const g_0 = a0_0 * x0_x + h_0 * x0_y;
  const g_1 = a0_1 * x12_x + h_1 * x12_y;
  const g_2 = a0_2 * x12_z + h_2 * x12_w;

  return 130.0 * (m_0 * g_0 + m_1 * g_1 + m_2 * g_2);
}

/**
 * Fractal Brownian Motion.
 */
export function fbm(x: number, y: number, config: NoiseConfig): number {
  let sum = 0.0;
  let amplitude = 1.0;
  let maxAmplitude = 0.0;
  let freq = config.frequency;

  for (let i = 0; i < config.octaves; i++) {
    sum += simplex2D(x * freq, y * freq) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= config.persistence;
    freq *= config.lacunarity;
  }

  return sum / maxAmplitude;
}

/**
 * Domain warping.
 */
export function domainWarp(x: number, y: number, amplitude: number): { x: number; y: number } {
  const offsetX = simplex2D(x + 5.2, y + 1.3);
  const offsetY = simplex2D(x + 9.7, y + 6.1);
  return {
    x: x + offsetX * amplitude,
    y: y + offsetY * amplitude,
  };
}

/**
 * Procedural terrain height generation matching the shader noise model.
 */
export function getTerrainHeight(
  worldX: number,
  worldZ: number,
  config: NoiseConfig,
  maxElevation: number,
): number {
  // Apply domain warping on macro coordinates
  const warped = domainWarp(worldX * 0.2, worldZ * 0.2, config.domainWarpAmplitude * 0.05);

  // Macro terrain (large scale features)
  const macroConfig: NoiseConfig = {
    frequency: config.frequency,
    octaves: Math.min(config.octaves, 4),
    persistence: config.persistence,
    lacunarity: config.lacunarity,
    domainWarpAmplitude: 0,
  };
  const macroVal = fbm(warped.x, warped.y, macroConfig) * 0.5 + 0.5;

  // Micro terrain (surface details)
  const microConfig: NoiseConfig = {
    frequency: config.frequency * 8.0,
    octaves: Math.min(config.octaves, 3),
    persistence: config.persistence * 0.6,
    lacunarity: config.lacunarity,
    domainWarpAmplitude: 0,
  };
  const microVal = fbm(worldX * 0.5, worldZ * 0.5, microConfig);

  // Plains vs Mountains mask
  const maskNoise = simplex2D(worldX * 0.001, worldZ * 0.001) * 0.5 + 0.5;
  const t = Math.max(0.0, Math.min(1.0, (maskNoise - 0.35) / 0.3));
  const smoothT = t * t * (3.0 - 2.0 * t); // smoothstep

  const plains = (macroVal * 0.15 + 0.05) * maxElevation;
  const mountains = (macroVal * 0.8 + microVal * 0.15 + 0.1) * maxElevation;

  const height = plains + (mountains - plains) * smoothT;
  return Math.max(height, 0.0);
}
