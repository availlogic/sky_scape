precision highp float;

// Attributes
in vec3 position;
in vec2 uv;

// Uniforms
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

uniform float u_time;
uniform int u_waveCount; // 0 = flat, 1 = low, 2 = medium, 4 = high

// Outputs to fragment shader
out vec3 v_worldPosition;
out vec3 v_normal;
out vec2 v_uv;

const float PI = 3.14159265359;

// Gerstner Wave parameter structure
struct Wave {
  float amplitude;
  float wavelength;
  float speed;
  vec2 direction;
  float steepness; // Q factor
};

// Define 4 waves
Wave waves[4] = Wave[4](
  Wave(1.0, 40.0, 2.0, vec2(1.0, 0.0), 0.5),
  Wave(0.5, 20.0, 3.5, vec2(0.7, 0.7), 0.4),
  Wave(0.25, 10.0, 5.0, vec2(0.0, 1.0), 0.3),
  Wave(0.1, 5.0, 7.5, vec2(-0.5, 0.8), 0.2)
);

void main() {
  vec3 displaced = position;
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);

  // Apply Gerstner waves displacement
  if (u_waveCount > 0) {
    float dx = 0.0;
    float dy = 0.0;
    float dz = 0.0;

    // Loop through waves based on complexity level
    int activeWaves = min(u_waveCount, 4);
    for (int i = 0; i < 4; i++) {
      if (i >= activeWaves) break;
      
      Wave w = waves[i];
      vec2 d = normalize(w.direction);
      float k = 2.0 * PI / w.wavelength;
      float phase = k * (dot(d, position.xz) - w.speed * u_time);
      float q = w.steepness / (w.amplitude * k * float(activeWaves));

      dx += q * w.amplitude * d.x * cos(phase);
      dy += w.amplitude * sin(phase);
      dz += q * w.amplitude * d.y * cos(phase);

      // Derivatives for normal calculation
      float cosP = cos(phase);
      float sinP = sin(phase);
      float kA = k * w.amplitude;

      tangent.x -= q * kA * d.x * d.x * sinP;
      tangent.y += kA * d.x * cosP;
      tangent.z -= q * kA * d.x * d.y * sinP;

      binormal.x -= q * kA * d.x * d.y * sinP;
      binormal.y += kA * d.y * cosP;
      binormal.z -= q * kA * d.y * d.y * sinP;
    }

    displaced.x += dx;
    displaced.y += dy;
    displaced.z += dz;
  }

  // Calculate analytical normal
  vec3 normal = normalize(cross(binormal, tangent));

  v_worldPosition = (modelViewMatrix * vec4(displaced, 1.0)).xyz;
  v_normal = normalMatrix * normal;
  v_uv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
