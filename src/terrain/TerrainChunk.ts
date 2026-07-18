import * as THREE from 'three';
import type { ITerrainChunk } from './types';
import type { IBiomeConfig } from '../biomes/types';
import { getTerrainHeight, simplex2D } from './noise';
import { chunkRandom } from '../utils/math';

// Vite raw shader imports
import noiseShader from '../shaders/noise.glsl?raw';
import vertexShaderRaw from '../shaders/terrain.vert.glsl?raw';
import fragmentShaderRaw from '../shaders/terrain.frag.glsl?raw';
import waterVert from '../shaders/water.vert.glsl?raw';
import waterFrag from '../shaders/water.frag.glsl?raw';

// Inject noise code into vertex and fragment shaders
const vertexShader = vertexShaderRaw.replace('// %NOISE_INCLUDE%', noiseShader);
const fragmentShader = fragmentShaderRaw.replace('// %NOISE_INCLUDE%', noiseShader);

export class TerrainChunk implements ITerrainChunk {
  public mesh: THREE.Mesh | null = null;
  public waterMesh: THREE.Mesh | null = null;
  public waterMaterial: THREE.RawShaderMaterial | null = null;
  public foliageInstances: THREE.InstancedMesh[] = [];
  public isReady = false;

  private scene: THREE.Scene;
  private biome: IBiomeConfig;

  constructor(
    public readonly x: number,
    public readonly z: number,
    scene: THREE.Scene,
    biome: IBiomeConfig,
  ) {
    this.scene = scene;
    this.biome = biome;
  }

  public async initialize(_renderer: THREE.WebGLRenderer): Promise<void> {
    try {
      // 1. Create Terrain Mesh
      const geometry = new THREE.PlaneGeometry(64, 64, 64, 64);
      // Rotate to lie flat in XZ plane
      geometry.rotateX(-Math.PI / 2);

      const waterLevelNormalized = this.biome.waterLevel ?? 0.05;
      const waterLevel = this.biome.maxElevation * waterLevelNormalized;

      // Create Custom Shader Material with biome properties
      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        glslVersion: THREE.GLSL3,
        uniforms: {
          u_frequency: { value: this.biome.noise.frequency },
          u_octaves: { value: this.biome.noise.octaves },
          u_persistence: { value: this.biome.noise.persistence },
          u_lacunarity: { value: this.biome.noise.lacunarity },
          u_domainWarpAmplitude: { value: this.biome.noise.domainWarpAmplitude },
          u_maxElevation: { value: this.biome.maxElevation },
          u_waterLevel: { value: waterLevelNormalized },
          u_isCoastlines: { value: this.biome.name === 'coastlines' ? 1.0 : 0.0 },

          u_chunkOffset: { value: new THREE.Vector2(this.x * 64 + 32, this.z * 64 + 32) },

          u_primaryColor: { value: new THREE.Color(this.biome.primaryColor) },
          u_secondaryColor: { value: new THREE.Color(this.biome.secondaryColor) },
          u_waterColor: { value: new THREE.Color(this.biome.waterColor) },

          u_lightDirection: { value: new THREE.Vector3(1.0, 1.5, 0.5).normalize() },
          u_ambientColor: { value: new THREE.Color('#94A3B8') },
        },
        shadowSide: THREE.DoubleSide,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.frustumCulled = false;
      // Set mesh position
      this.mesh.position.set(this.x * 64 + 32, 0, this.z * 64 + 32);
      this.mesh.name = `chunk-${this.x}-${this.z}`;
      this.scene.add(this.mesh);

      // 2. Create Water Mesh (placed at water level)
      const waterGeom = new THREE.PlaneGeometry(64, 64, 32, 32);
      waterGeom.rotateX(-Math.PI / 2);

      this.waterMaterial = new THREE.RawShaderMaterial({
        vertexShader: waterVert,
        fragmentShader: waterFrag,
        glslVersion: THREE.GLSL3,
        uniforms: {
          u_time: { value: 0.0 },
          u_waveCount: { value: 4 },
          u_waterColor: { value: new THREE.Color(this.biome.waterColor) },
          u_lightDirection: { value: new THREE.Vector3(1.0, 1.5, 0.5).normalize() },
          u_ambientColor: { value: new THREE.Color('#94A3B8') },
        },
        transparent: true,
        side: THREE.DoubleSide,
      });

      this.waterMesh = new THREE.Mesh(waterGeom, this.waterMaterial);
      this.waterMesh.frustumCulled = false;
      this.waterMesh.position.set(this.x * 64 + 32, waterLevel, this.z * 64 + 32);
      this.waterMesh.name = `water-${this.x}-${this.z}`;
      this.scene.add(this.waterMesh);

      // 3. Generate Foliage Instances (WebGL 2.0 Fallback CPU logic)
      this.generateFoliage();

      this.isReady = true;
    } catch (e) {
      console.error('Error initializing chunk:', e);
      this.isReady = false;
      // Render placeholder flat mesh on failure
      const geometry = new THREE.PlaneGeometry(64, 64, 4, 4);
      geometry.rotateX(-Math.PI / 2);
      const material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(this.x * 64 + 32, 0, this.z * 64 + 32);
      this.scene.add(this.mesh);
    }
  }

  public dispose(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }

    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      if (this.waterMaterial) {
        this.waterMaterial.dispose();
      }
      this.waterMesh = null;
      this.waterMaterial = null;
    }

    this.foliageInstances.forEach((inst) => {
      this.scene.remove(inst);
      inst.geometry.dispose();
      if (Array.isArray(inst.material)) {
        inst.material.forEach((m) => m.dispose());
      } else {
        inst.material.dispose();
      }
    });
    this.foliageInstances = [];
    this.isReady = false;
  }

  public updateWater(time: number, waveCount: number): void {
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.u_time.value = time;
      this.waterMaterial.uniforms.u_waveCount.value = waveCount;
    }
  }

  private generateFoliage(): void {
    const waterLevel = this.biome.maxElevation * (this.biome.waterLevel ?? 0.05);

    this.biome.foliage.forEach((spec, specIndex) => {
      if (spec.density <= 0) return;

      const densityCount = Math.floor(spec.density * 30); // scale max count
      if (densityCount <= 0) return;

      let geo: THREE.BufferGeometry;
      let mat: THREE.Material;

      // Create basic geometries for trees, rocks, grass, flowers
      if (spec.type === 'tree') {
        geo = getCachedGeometry(`tree-${this.biome.name}`, () =>
          createTreeGeometry(this.biome.name),
        );
        mat = new THREE.MeshLambertMaterial({ vertexColors: true });
      } else if (spec.type === 'rock') {
        geo = getCachedGeometry(`rock-${this.biome.name}`, () =>
          createRockGeometry(this.biome.name),
        );
        mat = new THREE.MeshLambertMaterial({ vertexColors: true });
      } else if (spec.type === 'flower') {
        geo = getCachedGeometry('flower', createFlowerGeometry);
        mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
      } else {
        // Grass
        geo = new THREE.PlaneGeometry(0.8, 1.2);
        geo.rotateY(Math.PI / 4); // cross plane
        geo.translate(0, 0.6, 0); // Translate so base sits at y = 0
        mat = new THREE.MeshBasicMaterial({ color: 0x4d7c0f, side: THREE.DoubleSide });
      }

      const instMesh = new THREE.InstancedMesh(geo, mat, densityCount);
      instMesh.frustumCulled = false;
      const dummy = new THREE.Object3D();
      let placedCount = 0;

      for (let i = 0; i < densityCount; i++) {
        // Deterministic positioning via PRNG
        const seedX = specIndex * 1000 + i * 3;
        const seedZ = specIndex * 1000 + i * 3 + 1;
        const seedScale = specIndex * 1000 + i * 3 + 2;

        const rx = chunkRandom(this.x, this.z, seedX);
        const rz = chunkRandom(this.x, this.z, seedZ);
        const rscale = chunkRandom(this.x, this.z, seedScale);

        const localX = rx * 64 - 32;
        const localZ = rz * 64 - 32;

        const worldX = this.x * 64 + 32 + localX;
        const worldZ = this.z * 64 + 32 + localZ;

        // Apply tree clustering in forest biome
        if (this.biome.name === 'forest' && spec.type === 'tree') {
          const clusterValue = simplex2D(worldX * 0.05, worldZ * 0.05);
          if (clusterValue <= -0.1) {
            continue;
          }
        }

        // Query height on CPU
        const height = getTerrainHeight(worldX, worldZ, this.biome.noise, this.biome.maxElevation);

        // Exclude placing below water line
        if (height < waterLevel) continue;

        // Position on terrain surface
        dummy.position.set(worldX, height, worldZ);

        // Random yaw rotation
        dummy.rotation.y = rx * Math.PI * 2;

        // Scale
        const scale = spec.scaleMin + rscale * (spec.scaleMax - spec.scaleMin);
        dummy.scale.set(scale, scale, scale);

        dummy.updateMatrix();
        instMesh.setMatrixAt(placedCount, dummy.matrix);
        placedCount++;
      }

      if (placedCount > 0) {
        instMesh.count = placedCount;
        instMesh.instanceMatrix.needsUpdate = true;
        this.scene.add(instMesh);
        this.foliageInstances.push(instMesh);
      } else {
        instMesh.dispose();
      }
    });
  }
}

// Cache for compiled geometries to avoid rebuilding them for every chunk
const geometryCache = new Map<string, THREE.BufferGeometry>();

function getCachedGeometry(key: string, creator: () => THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geometryCache.has(key)) {
    geometryCache.set(key, creator());
  }
  return geometryCache.get(key)!.clone();
}

function createTreeGeometry(biomeName: string): THREE.BufferGeometry {
  if (biomeName === 'coastlines') {
    // Palm tree geometry
    const trunk = new THREE.CylinderGeometry(0.08, 0.15, 2.0, 4);
    trunk.translate(0, 1.0, 0);
    const trunkGeo = trunk.toNonIndexed();
    trunk.dispose();

    const geos: THREE.BufferGeometry[] = [trunkGeo];

    // Create 6 leaves pointing outward and slightly downward
    const leafCount = 6;
    for (let i = 0; i < leafCount; i++) {
      const leaf = new THREE.BoxGeometry(0.22, 0.04, 1.1);
      // Offset so the leaf center is at (0, 1.9, 0.5)
      leaf.translate(0, 1.9, 0.5);
      // Tilt it down at the outer edge (Z increases, so X rotation tilts it)
      leaf.rotateX(0.35);
      // Rotate around the Y axis to distribute the leaves
      leaf.rotateY((i * 2 * Math.PI) / leafCount);

      const leafGeo = leaf.toNonIndexed();
      geos.push(leafGeo);
      leaf.dispose();
    }

    // Colors
    // Trunk: warm brown (0.45, 0.32, 0.16)
    // Leaves: bright green (0.15, 0.48, 0.09)
    const trunkColor = { r: 0.45, g: 0.32, b: 0.16 };
    const leafColor = { r: 0.15, g: 0.48, b: 0.09 };

    let totalVertices = 0;
    geos.forEach((g) => {
      totalVertices += g.attributes.position.count;
    });

    const mergedPositions = new Float32Array(totalVertices * 3);
    const mergedNormals = new Float32Array(totalVertices * 3);
    const mergedColors = new Float32Array(totalVertices * 3);

    let offset = 0;
    geos.forEach((g, idx) => {
      const pos = g.attributes.position.array as Float32Array;
      const norm = g.attributes.normal.array as Float32Array;
      const isTrunk = idx === 0;
      const color = isTrunk ? trunkColor : leafColor;
      const count = g.attributes.position.count;

      mergedPositions.set(pos, offset * 3);
      mergedNormals.set(norm, offset * 3);

      for (let i = 0; i < count; i++) {
        mergedColors[(offset + i) * 3] = color.r;
        mergedColors[(offset + i) * 3 + 1] = color.g;
        mergedColors[(offset + i) * 3 + 2] = color.b;
      }

      offset += count;
      g.dispose();
    });

    const mergedGeo = new THREE.BufferGeometry();
    mergedGeo.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
    mergedGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
    mergedGeo.setAttribute('color', new THREE.BufferAttribute(mergedColors, 3));

    return mergedGeo;
  } else {
    // Pine tree geometry
    const trunk = new THREE.CylinderGeometry(0.14, 0.22, 1.5, 4);
    trunk.translate(0, 0.75, 0);
    const trunkGeo = trunk.toNonIndexed();
    trunk.dispose();

    const bottom = new THREE.ConeGeometry(1.2, 2.0, 4);
    bottom.translate(0, 2.0, 0);
    const bottomGeo = bottom.toNonIndexed();
    bottom.dispose();

    const middle = new THREE.ConeGeometry(0.9, 1.7, 4);
    middle.translate(0, 3.1, 0);
    const middleGeo = middle.toNonIndexed();
    middle.dispose();

    const top = new THREE.ConeGeometry(0.6, 1.4, 4);
    top.translate(0, 4.1, 0);
    const topGeo = top.toNonIndexed();
    top.dispose();

    const geos = [trunkGeo, bottomGeo, middleGeo, topGeo];

    const isSnowland = biomeName === 'snowland';
    const greenColors = isSnowland
      ? [
          { r: 0.45, g: 0.35, b: 0.25 }, // trunk brown (slightly frosty)
          { r: 0.5, g: 0.65, b: 0.55 }, // frosty pale bottom green
          { r: 0.55, g: 0.7, b: 0.6 }, // frosty pale middle green
          { r: 0.6, g: 0.75, b: 0.65 }, // frosty pale top green
        ]
      : [
          { r: 0.4, g: 0.25, b: 0.12 }, // trunk brown
          { r: 0.1, g: 0.25, b: 0.07 }, // bottom green
          { r: 0.12, g: 0.28, b: 0.08 }, // middle green
          { r: 0.15, g: 0.32, b: 0.1 }, // top green
        ];
    const snowColor = { r: 0.95, g: 0.96, b: 0.98 };

    let totalVertices = 0;
    geos.forEach((g) => {
      totalVertices += g.attributes.position.count;
    });

    const mergedPositions = new Float32Array(totalVertices * 3);
    const mergedNormals = new Float32Array(totalVertices * 3);
    const mergedColors = new Float32Array(totalVertices * 3);

    let offset = 0;
    geos.forEach((g, idx) => {
      const pos = g.attributes.position.array as Float32Array;
      const norm = g.attributes.normal.array as Float32Array;
      const baseColor = greenColors[idx];
      const count = g.attributes.position.count;

      mergedPositions.set(pos, offset * 3);
      mergedNormals.set(norm, offset * 3);

      for (let i = 0; i < count; i++) {
        let r = baseColor.r;
        let gColor = baseColor.g;
        let b = baseColor.b;

        if (isSnowland) {
          const ny = norm[i * 3 + 1];
          if (idx > 0) {
            let snowFactor = 0.5;
            if (ny > -0.2) {
              snowFactor = 0.5 + Math.max(0, Math.min(1.0, (ny + 0.2) / 0.8)) * 0.5;
            }
            r = baseColor.r * (1 - snowFactor) + snowColor.r * snowFactor;
            gColor = baseColor.g * (1 - snowFactor) + snowColor.g * snowFactor;
            b = baseColor.b * (1 - snowFactor) + snowColor.b * snowFactor;
          } else {
            // trunk frost
            if (ny > 0.2) {
              const snowFactor = Math.min(0.4, (ny - 0.2) * 0.5);
              r = baseColor.r * (1 - snowFactor) + snowColor.r * snowFactor;
              gColor = baseColor.g * (1 - snowFactor) + snowColor.g * snowFactor;
              b = baseColor.b * (1 - snowFactor) + snowColor.b * snowFactor;
            }
          }
        }

        mergedColors[(offset + i) * 3] = r;
        mergedColors[(offset + i) * 3 + 1] = gColor;
        mergedColors[(offset + i) * 3 + 2] = b;
      }

      offset += count;
      g.dispose();
    });

    const mergedGeo = new THREE.BufferGeometry();
    mergedGeo.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
    mergedGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
    mergedGeo.setAttribute('color', new THREE.BufferAttribute(mergedColors, 3));
    mergedGeo.name = `tree-${biomeName}`;

    return mergedGeo;
  }
}

function createRockGeometry(biomeName: string): THREE.BufferGeometry {
  const baseGeo = new THREE.DodecahedronGeometry(1.5);
  const geo = baseGeo.index ? baseGeo.toNonIndexed() : baseGeo;
  geo.name = `rock-${biomeName}`;
  const isSnowland = biomeName === 'snowland';

  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const normals = geo.attributes.normal.array as Float32Array;

  const baseColor = isSnowland
    ? { r: 0.65, g: 0.7, b: 0.75 } // light frosty slate
    : { r: 0.392, g: 0.455, b: 0.545 }; // #64748b
  const snowColor = { r: 0.95, g: 0.96, b: 0.98 };

  for (let i = 0; i < count; i++) {
    const ny = normals[i * 3 + 1];
    let r = baseColor.r;
    let g = baseColor.g;
    let b = baseColor.b;

    if (isSnowland) {
      let snowFactor = 0.4;
      if (ny > -0.2) {
        snowFactor = 0.4 + Math.max(0, Math.min(1.0, (ny + 0.2) / 0.8)) * 0.6;
      }
      r = baseColor.r * (1 - snowFactor) + snowColor.r * snowFactor;
      g = baseColor.g * (1 - snowFactor) + snowColor.g * snowFactor;
      b = baseColor.b * (1 - snowFactor) + snowColor.b * snowFactor;
    }

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function createFlowerGeometry(): THREE.BufferGeometry {
  const plane1 = new THREE.PlaneGeometry(0.5, 0.9);
  plane1.rotateY(Math.PI / 4);
  const plane2 = new THREE.PlaneGeometry(0.5, 0.9);
  plane2.rotateY(-Math.PI / 4);

  const nonIndexed1 = plane1.toNonIndexed();
  const nonIndexed2 = plane2.toNonIndexed();
  plane1.dispose();
  plane2.dispose();

  const totalVerts = nonIndexed1.attributes.position.count + nonIndexed2.attributes.position.count;
  const mergedPositions = new Float32Array(totalVerts * 3);
  const mergedNormals = new Float32Array(totalVerts * 3);
  const mergedColors = new Float32Array(totalVerts * 3);

  mergedPositions.set(nonIndexed1.attributes.position.array as Float32Array, 0);
  mergedNormals.set(nonIndexed1.attributes.normal.array as Float32Array, 0);

  mergedPositions.set(
    nonIndexed2.attributes.position.array as Float32Array,
    nonIndexed1.attributes.position.count * 3,
  );
  mergedNormals.set(
    nonIndexed2.attributes.normal.array as Float32Array,
    nonIndexed1.attributes.position.count * 3,
  );

  for (let i = 0; i < totalVerts; i++) {
    const yVal = mergedPositions[i * 3 + 1];
    if (yVal < 0) {
      // Stem: green
      mergedColors[i * 3] = 0.2;
      mergedColors[i * 3 + 1] = 0.5;
      mergedColors[i * 3 + 2] = 0.1;
    } else {
      // Petals: warm red-orange
      mergedColors[i * 3] = 0.95;
      mergedColors[i * 3 + 1] = 0.3;
      mergedColors[i * 3 + 2] = 0.1;
    }
  }

  nonIndexed1.dispose();
  nonIndexed2.dispose();

  const mergedGeo = new THREE.BufferGeometry();
  mergedGeo.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
  mergedGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
  mergedGeo.setAttribute('color', new THREE.BufferAttribute(mergedColors, 3));

  // Translate so bottom of stem sits at y = 0
  mergedGeo.translate(0, 0.45, 0);

  return mergedGeo;
}
export default TerrainChunk;
