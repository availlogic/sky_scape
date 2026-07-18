// ============================================================
// Terrain Fragment Shader (WebGL 2.0)
// Biome-driven color lookup based on height + slope
// ============================================================

precision highp float;

// Inputs from vertex shader
in vec3 v_worldPosition;
in vec3 v_normal;
in float v_height;
in float v_normalizedHeight;
in vec2 v_worldXZ;

// Biome color uniforms
uniform vec3 u_primaryColor;
uniform vec3 u_secondaryColor;
uniform vec3 u_waterColor;
uniform float u_isCoastlines;

// Lighting uniforms
uniform vec3 u_lightDirection;
uniform vec3 u_ambientColor;
uniform vec3 u_fogColor;

// Water level uniform
uniform float u_waterLevel;

// Include noise functions (injected at compile time)
// %NOISE_INCLUDE%

// Output
out vec4 fragColor;

void main() {
  // Normalise the interpolated normal
  vec3 normal = normalize(v_normal);

  // Slope calculation (dot with up vector)
  float slope = 1.0 - abs(dot(normal, vec3(0.0, 1.0, 0.0)));

  // Height-based color blending
  // Low areas = primary color, high areas = secondary color
  vec3 baseColor = mix(u_primaryColor, u_secondaryColor, smoothstep(0.2, 0.7, v_normalizedHeight));

  // Slope-based variation: steep slopes get secondary color (rock/cliff)
  baseColor = mix(baseColor, u_secondaryColor, smoothstep(0.3, 0.6, slope));

  // Custom shore sand blending for coastlines biome
  if (u_isCoastlines > 0.5) {
    // Flat inland areas of islands should be green, not sandy
    baseColor = mix(u_primaryColor, u_secondaryColor, smoothstep(0.4, 0.8, slope));
  }

  // Water: areas below a threshold get water color
  if (v_normalizedHeight < u_waterLevel) {
    baseColor = u_waterColor;
  }

  // Directional lighting (Lambert diffuse)
  float NdotL = max(dot(normal, normalize(u_lightDirection)), 0.0);
  float diffuse = NdotL * 0.7 + 0.3; // never fully dark

  // Ambient contribution
  vec3 ambient = u_ambientColor * 0.3;

  // Final color
  vec3 litColor = baseColor * diffuse + ambient;

  // Atmospheric fog based on distance from camera
  float fogDistance = length(v_worldPosition);
  float fogFactor = 1.0 - exp(-fogDistance * 0.0008);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  vec3 fogColor = u_fogColor; // sky-blue haze

  vec3 finalColor = mix(litColor, fogColor, fogFactor);

  fragColor = vec4(finalColor, 1.0);
}
