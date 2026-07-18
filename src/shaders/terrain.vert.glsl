// ============================================================
// Terrain Vertex Shader (WebGL 2.0)
// Displaces a flat 64x64 plane mesh using GPU-generated heightmap
// ============================================================

precision highp float;

// Attributes
in vec3 position;
in vec2 uv;

// Uniforms
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

// Biome noise parameters
uniform float u_frequency;
uniform int u_octaves;
uniform float u_persistence;
uniform float u_lacunarity;
uniform float u_domainWarpAmplitude;
uniform float u_maxElevation;

// Chunk world offset
uniform vec2 u_chunkOffset;

// Outputs to fragment shader
out vec3 v_worldPosition;
out vec3 v_normal;
out float v_height;
out float v_normalizedHeight;
out vec2 v_worldXZ;

// Include noise functions (injected at compile time)
// %NOISE_INCLUDE%

void main() {
  // World position of this vertex
  vec2 worldPos2D = position.xz + u_chunkOffset;

  // Calculate terrain height
  float height = getTerrainHeight(
    worldPos2D,
    u_frequency,
    u_octaves,
    u_persistence,
    u_lacunarity,
    u_domainWarpAmplitude,
    u_maxElevation
  );

  // Displace vertex vertically
  vec3 displacedPos = vec3(position.x, height, position.z);

  // Calculate normal via finite differences
  float eps = 0.5;
  float hL = getTerrainHeight(worldPos2D + vec2(-eps, 0.0), u_frequency, u_octaves, u_persistence, u_lacunarity, u_domainWarpAmplitude, u_maxElevation);
  float hR = getTerrainHeight(worldPos2D + vec2(eps, 0.0), u_frequency, u_octaves, u_persistence, u_lacunarity, u_domainWarpAmplitude, u_maxElevation);
  float hD = getTerrainHeight(worldPos2D + vec2(0.0, -eps), u_frequency, u_octaves, u_persistence, u_lacunarity, u_domainWarpAmplitude, u_maxElevation);
  float hU = getTerrainHeight(worldPos2D + vec2(0.0, eps), u_frequency, u_octaves, u_persistence, u_lacunarity, u_domainWarpAmplitude, u_maxElevation);

  vec3 normal = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));

  // Pass to fragment
  v_worldPosition = (modelViewMatrix * vec4(displacedPos, 1.0)).xyz;
  v_normal = normalMatrix * normal;
  v_height = height;
  v_normalizedHeight = clamp(height / u_maxElevation, 0.0, 1.0);
  v_worldXZ = worldPos2D;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
}
