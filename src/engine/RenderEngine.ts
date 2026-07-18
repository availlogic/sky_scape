import * as THREE from 'three';

export class RenderEngine {
  public renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private onUpdateCallbacks: Array<(deltaTime: number) => void> = [];
  private lastTime = 0;
  private isRunning = false;
  private renderScale = 1.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Create standard WebGL 2.0 context
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Sync size on creation
    this.resize();

    this.animate = this.animate.bind(this);
  }

  public registerUpdateCallback(cb: (deltaTime: number) => void): void {
    this.onUpdateCallbacks.push(cb);
  }

  public setRenderScale(scale: number): void {
    this.renderScale = Math.max(0.5, Math.min(1.0, scale));
    this.resize();
  }

  public getRenderScale(): number {
    return this.renderScale;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.animate);
  }

  public stop(): void {
    this.isRunning = false;
  }

  public resize(): void {
    const width = this.canvas.parentElement?.clientWidth || window.innerWidth;
    const height = this.canvas.parentElement?.clientHeight || window.innerHeight;

    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * this.renderScale);
  }

  private animate(time: number): void {
    if (!this.isRunning) return;

    // Delta time calculation in seconds
    const deltaTime = Math.min(0.1, Math.max(0.001, (time - this.lastTime) / 1000));
    this.lastTime = time;

    // Fire frame ticks
    this.onUpdateCallbacks.forEach((cb) => {
      try {
        cb(deltaTime);
      } catch (e) {
        console.error('Error in render update callback:', e);
      }
    });

    requestAnimationFrame(this.animate);
  }

  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }

  public destroy(): void {
    this.stop();
    this.renderer.dispose();
  }
}
export default RenderEngine;
