// ============================================================
// Simplex Noise GLSL — shared by all terrain shaders
// Matches the CPU-side TypeScript implementation in noise.ts
// ============================================================

// Permutation-based Simplex 2D noise, returns value in [-1, 1].
// Based on Stefan Gustavson's implementation.

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float simplex2D(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,   // (3.0 - sqrt(3.0)) / 6.0
    0.366025403784439,   // 0.5 * (sqrt(3.0) - 1.0)
    -0.577350269189626,  // -1.0 + 2.0 * C.x
    0.024390243902439    // 1.0 / 41.0
  );

  // Skew the input space to determine which simplex cell we're in
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  // Determine which simplex we're in
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

  // Offsets for the other corners
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  // Permutations
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;

  // Gradients
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

// Fractal Brownian Motion with configurable parameters
float fbm(vec2 p, float frequency, int octaves, float persistence, float lacunarity) {
  float sum = 0.0;
  float amplitude = 1.0;
  float maxAmplitude = 0.0;
  vec2 coords = p * frequency;

  for (int i = 0; i < octaves; i++) {
    sum += simplex2D(coords) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= persistence;
    coords *= lacunarity;
  }

  return sum / maxAmplitude;
}

// Domain warping — offsets input coordinates using noise
vec2 domainWarp(vec2 p, float amplitude) {
  float offsetX = simplex2D(p + vec2(5.2, 1.3));
  float offsetY = simplex2D(p + vec2(9.7, 6.1));
  return p + vec2(offsetX, offsetY) * amplitude;
}

// Full terrain height calculation
// 3 low-frequency layers (macro) + 3 high-frequency layers (micro) + domain warping
float getTerrainHeight(vec2 worldPos, float frequency, int octaves, float persistence,
                       float lacunarity, float domainWarpAmplitude, float maxElevation) {
  // Apply domain warping
  vec2 warped = domainWarp(worldPos * 0.2, domainWarpAmplitude * 0.05);

  // Macro terrain (large-scale hills and mountains)
  float macroVal = fbm(warped, frequency, min(octaves, 4), persistence, lacunarity);
  macroVal = macroVal * 0.5 + 0.5; // normalise to [0, 1]

  // Micro terrain (small-scale surface detail)
  float microVal = fbm(worldPos * 0.5, frequency * 8.0, min(octaves, 3), persistence * 0.6, lacunarity);

  // Plains vs Mountains mask
  float maskNoise = simplex2D(worldPos * 0.001) * 0.5 + 0.5;
  float t = clamp((maskNoise - 0.35) / 0.3, 0.0, 1.0);
  float smoothT = t * t * (3.0 - 2.0 * t); // smoothstep

  float plains = (macroVal * 0.15 + 0.05) * maxElevation;
  float mountains = (macroVal * 0.8 + microVal * 0.15 + 0.1) * maxElevation;

  float height = plains + (mountains - plains) * smoothT;

  return max(height, 0.0);
}
