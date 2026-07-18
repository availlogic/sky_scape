precision highp float;

in vec3 v_worldPosition;
in vec3 v_normal;
in vec2 v_uv;

uniform vec3 u_waterColor;
uniform vec3 u_lightDirection;
uniform vec3 u_ambientColor;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(v_normal);
  vec3 viewDirection = normalize(-v_worldPosition);

  // Deep ocean color
  vec3 baseColor = u_waterColor;

  // Simple foam/crest coloring based on normal vertical deviation
  float foamFactor = smoothstep(0.85, 0.95, 1.0 - normal.y);
  vec3 foamColor = vec3(0.9, 0.95, 1.0);
  baseColor = mix(baseColor, foamColor, foamFactor * 0.4);

  // Diffuse Lambert shading
  float diffuse = max(dot(normal, normalize(u_lightDirection)), 0.0);
  diffuse = diffuse * 0.5 + 0.5; // Soften shading

  // Specular Blinn-Phong reflections (Sun highlight)
  vec3 halfVec = normalize(normalize(u_lightDirection) + viewDirection);
  float spec = pow(max(dot(normal, halfVec), 0.0), 64.0); // sharp highlights
  vec3 specularColor = vec3(1.0, 0.95, 0.8) * spec * 0.8;

  // Final lit color
  vec3 litColor = baseColor * (u_ambientColor * 0.4 + diffuse * 0.6) + specularColor;

  // Distance fog matching terrain
  float fogDistance = length(v_worldPosition);
  float fogFactor = 1.0 - exp(-fogDistance * 0.0008);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  vec3 fogColor = vec3(0.75, 0.82, 0.92); // sky-blue haze

  vec3 finalColor = mix(litColor, fogColor, fogFactor);

  fragColor = vec4(finalColor, 0.85); // slight transparency
}
