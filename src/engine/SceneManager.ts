import * as THREE from 'three';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;
  private resizeObserver: ResizeObserver;
  private sunLight!: THREE.DirectionalLight;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    // Slate/sky color gradient background
    this.scene.background = new THREE.Color('#cbd5e1');

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );

    this.setupLights();

    // Track parent container resize to scale canvas
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas.parentElement || document.body);
    this.resize();
  }

  public updateCamera(position: THREE.Vector3, target: THREE.Vector3): void {
    this.camera.position.copy(position);
    this.camera.lookAt(target);

    // Shift the directional light to follow the camera (keeps shadow maps active near the drone)
    this.sunLight.position.set(position.x + 100, position.y + 150, position.z + 50);
    this.sunLight.target.position.copy(target);
  }

  public resize(): void {
    const width = this.canvas.parentElement?.clientWidth || window.innerWidth;
    const height = this.canvas.parentElement?.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public destroy(): void {
    this.resizeObserver.disconnect();
  }

  private setupLights(): void {
    // Ambient fill light
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.4);
    this.scene.add(ambientLight);

    // Directional sunlight
    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.sunLight.position.set(100, 150, 50);
    this.sunLight.castShadow = true;

    // Shadow maps
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 400;

    const d = 100;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }
}
export default SceneManager;
