import { RenderEngine } from './engine/RenderEngine';
import { SceneManager } from './engine/SceneManager';
import { InputManager } from './controls/InputManager';
import { KeyboardMouseInput } from './controls/KeyboardMouseInput';
import { TouchJoystickInput } from './controls/TouchJoystickInput';
import { GamepadInput } from './controls/GamepadInput';
import { CalibrationWizard } from './controls/CalibrationWizard';
import { FPVPhysicsEngine } from './physics/FPVPhysicsEngine';
import { TerrainManager } from './terrain/TerrainManager';
import { BiomeManager } from './biomes/BiomeManager';
import { StorageManager } from './storage/StorageManager';
import { getTerrainHeight } from './terrain/noise';
import { AdaptivePerformanceEngine } from './engine/AdaptivePerformanceEngine';
import { isTouchDevice, isMobileDevice } from './utils/deviceDetection';

console.log('main.ts script executed. document.readyState =', document.readyState);

export function bootstrap(): void {
  console.log('bootstrap() started.');

  // 1. Core Service Init
  const storage = new StorageManager();
  const settings = storage.loadSettings();

  const biomeManager = new BiomeManager();
  const activeBiome = biomeManager.setActiveBiome(settings.biomeName);

  // Setup DOM elements
  const canvas = document.getElementById('viewport-canvas') as HTMLCanvasElement;
  console.log('Canvas element:', canvas);
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  const renderEngine = new RenderEngine(canvas);
  console.log('RenderEngine initialized');
  const sceneManager = new SceneManager(canvas);
  sceneManager.applyBiomeEnvironment(activeBiome);
  console.log('SceneManager initialized');

  // CPU terrain height function matching GPU heightmap
  const terrainHeightFn = (x: number, z: number) => {
    const currentBiome = biomeManager.getActiveBiome();
    return getTerrainHeight(x, z, currentBiome.noise, currentBiome.maxElevation);
  };

  const physics = new FPVPhysicsEngine(
    {
      maxThrust: 20.0,
      linearDrag: 0.5,
      angularDrag: 3.0,
      gravity: 9.81,
      mass: 1.0,
      cameraDamping: settings.cameraDamping,
      cameraDistance: 8.0,
      cruiseSpeed: settings.cruiseSpeed,
    },
    terrainHeightFn,
  );
  console.log('PhysicsEngine initialized');

  // Inputs Sources
  const keyboardSource = new KeyboardMouseInput();
  const touchSource = new TouchJoystickInput();
  const gamepadSource = new GamepadInput(storage.loadGamepadCalibration());

  const inputManager = new InputManager(keyboardSource);
  inputManager.setExpoFactor(settings.expoFactor);
  console.log('InputManager initialized');

  // Adaptive Performance Engine
  const isMobile = isMobileDevice();
  const apde = new AdaptivePerformanceEngine(isMobile);
  (window as any).apde = apde;
  let renderRadius = apde.currentState.renderRadius;

  apde.onStateChange((state) => {
    renderRadius = state.renderRadius;
    renderEngine.setRenderScale(state.renderScale);

    // Performance warn indicator
    const perfWarn = document.getElementById('perf-warning-alert');
    if (perfWarn) {
      perfWarn.style.display = state.level > 0 ? 'block' : 'none';
    }
  });

  const terrainManager = new TerrainManager(sceneManager.scene, renderEngine.renderer, activeBiome);
  console.log('TerrainManager initialized');

  // 2. Initialise Drone and Terrain Loading
  physics.spawn(150); // Spawn at y = 150m AGL
  console.log('Drone spawned');
  terrainManager.updateVisibleChunks(physics.position, renderRadius);

  // 3. UI State Management
  let isPaused = false;
  let frameCount = 0;
  let fpsLastTime = performance.now();
  let fpsValue = 60;
  let activeInputMode: 'keyboard' | 'gamepad' | 'touch' = 'keyboard';

  const hudSpeed = document.getElementById('hud-speed');
  const hudAltitude = document.getElementById('hud-altitude');
  const fpsTracker = document.getElementById('fps-tracker');
  const biomeBadgeName = document.getElementById('biome-name');
  const settingsModal = document.getElementById('settings-modal');
  const settingsGearBtn = document.getElementById('settings-gear-btn');
  const settingsCloseBtn = document.getElementById('settings-close-btn');
  const settingsSaveBtn = document.getElementById('settings-save-btn');
  const settingsResetBtn = document.getElementById('settings-reset-btn');
  const loadingScreen = document.getElementById('loading-screen');
  const loadingBar = document.getElementById('loading-bar');
  const flightHud = document.getElementById('flight-hud');

  // Input selectors
  const modeButtons = document.querySelectorAll('.mode-btn[data-mode]');
  const calibrateBtn = document.getElementById('btn-calibrate-gamepad');

  // Gamepad disconnection warning
  const disconnectModal = document.getElementById('controller-disconnected-modal');

  // Calibration Wizard step DOM elements
  const calModal = document.getElementById('calibration-modal');
  const calCloseBtn = document.getElementById('calibration-close-btn');
  const calStartBtn = document.getElementById('cal-start-btn');
  const calThrottleNext = document.getElementById('cal-throttle-next');
  const calYawNext = document.getElementById('cal-yaw-next');
  const calPitchNext = document.getElementById('cal-pitch-next');
  const calRollNext = document.getElementById('cal-roll-next');
  const calSaveBtn = document.getElementById('cal-save-btn');

  // Sliders
  const dampingSlider = document.getElementById('damping-slider') as HTMLInputElement;
  const dampingValue = document.getElementById('damping-value');
  const expoSlider = document.getElementById('expo-slider') as HTMLInputElement;
  const expoValue = document.getElementById('expo-value');
  const cruiseSlider = document.getElementById('cruise-speed-slider') as HTMLInputElement;
  const cruiseValue = document.getElementById('cruise-speed-value');

  // Biome cards
  const biomeCards = document.querySelectorAll('.biome-card');

  // Initial UI Loading
  if (dampingSlider && dampingValue) {
    dampingSlider.value = settings.cameraDamping.toString();
    dampingValue.textContent = settings.cameraDamping.toFixed(2);
  }
  if (expoSlider && expoValue) {
    expoSlider.value = settings.expoFactor.toString();
    expoValue.textContent = settings.expoFactor.toFixed(2);
  }
  if (cruiseSlider && cruiseValue) {
    cruiseSlider.value = settings.cruiseSpeed.toString();
    cruiseValue.textContent = `${Math.round(settings.cruiseSpeed)} m/s`;
  }
  if (biomeBadgeName) {
    biomeBadgeName.textContent =
      activeBiome.name.charAt(0).toUpperCase() + activeBiome.name.slice(1);
  }

  // Active biome card class syncing
  biomeCards.forEach((card) => {
    const name = card.getAttribute('data-biome');
    if (name === settings.biomeName) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  // Touch device check
  if (isTouchDevice()) {
    activeInputMode = 'touch';
    inputManager.setActiveSource(touchSource);
  }

  // Hide loading screen after 1.5s
  if (loadingScreen && loadingBar && flightHud) {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      loadingBar.style.width = `${progress}%`;
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          loadingScreen.style.opacity = '0';
          setTimeout(() => {
            loadingScreen.style.display = 'none';
            flightHud.style.display = 'block';
            // Start pointer lock on desktop if not paused
            if (activeInputMode === 'keyboard' && !isPaused) {
              canvas.requestPointerLock().catch(() => {});
            }
          }, 300);
        }, 200);
      }
    }, 50);
  }

  // Telemetry HUD updates
  const updateHUD = (_deltaTime: number) => {
    if (hudSpeed) {
      hudSpeed.textContent = `${physics.speed.toFixed(1)} m/s`;
    }
    if (hudAltitude) {
      const terrainHeight = terrainHeightFn(physics.position.x, physics.position.z);
      const aglAltitude = Math.max(0, Math.round(physics.position.y - terrainHeight));
      hudAltitude.textContent = `${aglAltitude} m`;
    }

    // FPS computation
    frameCount++;
    const now = performance.now();
    if (now - fpsLastTime >= 1000) {
      fpsValue = Math.round((frameCount * 1000) / (now - fpsLastTime));
      frameCount = 0;
      fpsLastTime = now;

      if (fpsTracker) {
        fpsTracker.textContent = `${fpsValue} FPS`;
        if (fpsValue < 55) {
          fpsTracker.classList.add('warning');
        } else {
          fpsTracker.classList.remove('warning');
        }
      }
    }
  };

  // Toggle settings panel
  const toggleSettings = (forceState?: boolean) => {
    const nextState = forceState !== undefined ? forceState : !isPaused;
    isPaused = nextState;
    if (settingsModal) {
      settingsModal.style.display = nextState ? 'flex' : 'none';
    }

    // Capture/release pointer lock safely
    if (activeInputMode === 'keyboard') {
      if (!nextState) {
        const p = canvas.requestPointerLock() as any;
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } else {
        const p = document.exitPointerLock() as any;
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      }
    }
  };

  // Gamepad Connection Listeners
  gamepadSource.onDisconnect = () => {
    if (activeInputMode === 'gamepad') {
      isPaused = true;
      if (disconnectModal) {
        disconnectModal.style.display = 'flex';
      }
    }
  };

  gamepadSource.onConnect = () => {
    if (disconnectModal) {
      disconnectModal.style.display = 'none';
    }
  };

  // Calibration Wizard State
  let activeWizard: CalibrationWizard | null = null;

  const showWizardStep = (step: string) => {
    const stepsList = ['welcome', 'throttle', 'yaw', 'pitch', 'roll', 'verification'];
    stepsList.forEach((s) => {
      const el = document.getElementById(`calibration-step-${s}`);
      if (el) el.style.display = s === step ? 'block' : 'none';
    });
  };

  const handleStepProgressUpdate = (stepName: string) => {
    if (stepName === 'throttle_max') showWizardStep('throttle');
    else if (stepName === 'yaw_left') showWizardStep('yaw');
    else if (stepName === 'pitch_up') showWizardStep('pitch');
    else if (stepName === 'roll_right') showWizardStep('roll');
    else if (stepName === 'complete') {
      showWizardStep('verification');
      // Begin live dot verification ticker
      const tickVerification = () => {
        if (!activeWizard || activeWizard.getStep() !== 'complete') return;
        const coords = activeWizard.getLiveVerifyCoords();
        const dot = document.getElementById('cal-verification-dot');
        if (dot) {
          // Map x, y [-1.0, 1.0] -> [0%, 100%]
          const leftPercent = 50 + coords.x * 50;
          const topPercent = 50 + coords.y * 50;
          dot.style.left = `${leftPercent}%`;
          dot.style.top = `${topPercent}%`;
        }
        requestAnimationFrame(tickVerification);
      };
      requestAnimationFrame(tickVerification);
    }
  };

  // 4. Bind UI Click handlers
  if (settingsGearBtn) {
    settingsGearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSettings(true);
    });
  }

  if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener('click', () => toggleSettings(false));
  }

  if (settingsSaveBtn) {
    settingsSaveBtn.addEventListener('click', () => {
      const currentSettings = storage.loadSettings();
      currentSettings.cameraDamping = parseFloat(dampingSlider.value);
      currentSettings.expoFactor = parseFloat(expoSlider.value);
      currentSettings.cruiseSpeed = parseFloat(cruiseSlider.value);
      currentSettings.biomeName = biomeManager.getActiveBiome().name;

      storage.saveSettings(currentSettings);
      toggleSettings(false);
    });
  }

  if (settingsResetBtn) {
    settingsResetBtn.addEventListener('click', () => {
      storage.clear();
      const defaults = storage.loadSettings();

      dampingSlider.value = defaults.cameraDamping.toString();
      dampingValue!.textContent = defaults.cameraDamping.toFixed(2);
      expoSlider.value = defaults.expoFactor.toString();
      expoValue!.textContent = defaults.expoFactor.toFixed(2);
      cruiseSlider.value = defaults.cruiseSpeed.toString();
      cruiseValue!.textContent = `${Math.round(defaults.cruiseSpeed)} m/s`;

      physics.setCameraDamping(defaults.cameraDamping);
      physics.setCruiseSpeed(defaults.cruiseSpeed);
      inputManager.setExpoFactor(defaults.expoFactor);

      const defaultBiome = biomeManager.setActiveBiome(defaults.biomeName);
      terrainManager.setBiome(defaultBiome);
      sceneManager.applyBiomeEnvironment(defaultBiome);
      if (biomeBadgeName) {
        biomeBadgeName.textContent =
          defaultBiome.name.charAt(0).toUpperCase() + defaultBiome.name.slice(1);
      }

      biomeCards.forEach((card) => {
        const name = card.getAttribute('data-biome');
        if (name === defaults.biomeName) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    });
  }

  // Settings Sliders
  if (dampingSlider) {
    dampingSlider.addEventListener('input', () => {
      const val = parseFloat(dampingSlider.value);
      if (dampingValue) dampingValue.textContent = val.toFixed(2);
      physics.setCameraDamping(val);
    });
  }
  if (expoSlider) {
    expoSlider.addEventListener('input', () => {
      const val = parseFloat(expoSlider.value);
      if (expoValue) expoValue.textContent = val.toFixed(2);
      inputManager.setExpoFactor(val);
    });
  }
  if (cruiseSlider) {
    cruiseSlider.addEventListener('input', () => {
      const val = parseFloat(cruiseSlider.value);
      if (cruiseValue) cruiseValue.textContent = `${Math.round(val)} m/s`;
      physics.setCruiseSpeed(val);
    });
  }

  // Biome Selection Grid
  biomeCards.forEach((card) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('disabled')) return;
      const biomeName = card.getAttribute('data-biome');
      if (biomeName) {
        biomeCards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        const newBiome = biomeManager.setActiveBiome(biomeName);
        terrainManager.setBiome(newBiome);
        sceneManager.applyBiomeEnvironment(newBiome);
        if (biomeBadgeName) {
          biomeBadgeName.textContent =
            newBiome.name.charAt(0).toUpperCase() + newBiome.name.slice(1);
        }
      }
    });
  });

  // Input Mode Toggles
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode') as 'keyboard' | 'gamepad';

      if (mode === 'keyboard') {
        activeInputMode = 'keyboard';
        inputManager.setActiveSource(keyboardSource);
        if (calibrateBtn) calibrateBtn.style.display = 'none';
      } else if (mode === 'gamepad') {
        activeInputMode = 'gamepad';
        inputManager.setActiveSource(gamepadSource);
        if (calibrateBtn) calibrateBtn.style.display = 'block';

        // Check if gamepad is connected
        if (!gamepadSource.isGamepadConnected()) {
          // Triggers warn immediately
          isPaused = true;
          if (disconnectModal) disconnectModal.style.display = 'flex';
        }
      }
    });
  });

  // Calibration Wizard Actions
  if (calibrateBtn) {
    calibrateBtn.addEventListener('click', () => {
      if (calModal) calModal.style.display = 'flex';
      showWizardStep('welcome');
      activeWizard = new CalibrationWizard(0); // target index 0
    });
  }

  if (calCloseBtn) {
    calCloseBtn.addEventListener('click', () => {
      if (calModal) calModal.style.display = 'none';
      if (activeWizard) activeWizard.cancel();
      activeWizard = null;
    });
  }

  if (calStartBtn) {
    calStartBtn.addEventListener('click', () => {
      if (activeWizard) {
        activeWizard.start((step) => handleStepProgressUpdate(step));
      }
    });
  }

  if (calThrottleNext) {
    calThrottleNext.addEventListener('click', () => {
      if (activeWizard) activeWizard.next((step) => handleStepProgressUpdate(step));
    });
  }
  if (calYawNext) {
    calYawNext.addEventListener('click', () => {
      if (activeWizard) activeWizard.next((step) => handleStepProgressUpdate(step));
    });
  }
  if (calPitchNext) {
    calPitchNext.addEventListener('click', () => {
      if (activeWizard) activeWizard.next((step) => handleStepProgressUpdate(step));
    });
  }
  if (calRollNext) {
    calRollNext.addEventListener('click', () => {
      if (activeWizard) activeWizard.next((step) => handleStepProgressUpdate(step));
    });
  }

  if (calSaveBtn) {
    calSaveBtn.addEventListener('click', () => {
      if (activeWizard) {
        // Map checkbox inversions
        const tInv =
          (document.getElementById('inv-throttle') as HTMLInputElement)?.checked || false;
        const yInv = (document.getElementById('inv-yaw') as HTMLInputElement)?.checked || false;
        const pInv = (document.getElementById('inv-pitch') as HTMLInputElement)?.checked || false;
        const rInv = (document.getElementById('inv-roll') as HTMLInputElement)?.checked || false;

        activeWizard.toggleInversion('throttle', tInv);
        activeWizard.toggleInversion('yaw', yInv);
        activeWizard.toggleInversion('pitch', pInv);
        activeWizard.toggleInversion('roll', rInv);

        activeWizard.save();

        // Reload settings in source
        const newCal = storage.loadGamepadCalibration();
        if (newCal) gamepadSource.setCalibration(newCal);

        if (calModal) calModal.style.display = 'none';
        activeWizard = null;
      }
    });
  }

  // Keyboard Escape listener
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();

      // Allow Esc to escape gamepad disconnect warn overlay
      if (disconnectModal && disconnectModal.style.display === 'flex') {
        disconnectModal.style.display = 'none';
        activeInputMode = 'keyboard';
        inputManager.setActiveSource(keyboardSource);
        modeButtons.forEach((b) => {
          if (b.getAttribute('data-mode') === 'keyboard') b.classList.add('active');
          else b.classList.remove('active');
        });
        if (calibrateBtn) calibrateBtn.style.display = 'none';
        isPaused = false;
        canvas.requestPointerLock().catch(() => {});
      } else {
        toggleSettings();
      }
    }
  });

  canvas.addEventListener('click', () => {
    if (!isPaused && activeInputMode === 'keyboard') {
      canvas.requestPointerLock().catch(() => {});
    }
  });

  // 5. Game Loop Tick
  let totalTime = 0.0;

  renderEngine.registerUpdateCallback((deltaTime) => {
    // Record frame times for APDE (FPS monitor)
    apde.recordFrame(deltaTime * 1000);

    if (!isPaused) {
      const inputs = inputManager.poll();
      physics.update(deltaTime, inputs);
      terrainManager.updateVisibleChunks(physics.position, renderRadius);

      // Update ocean waves
      totalTime += deltaTime;
      const complexity = apde.currentState.waterComplexity;
      const waveCount =
        complexity === 'high' ? 4 : complexity === 'medium' ? 2 : complexity === 'low' ? 1 : 0;
      terrainManager.updateWater(totalTime, waveCount);
    } else {
      inputManager.poll();
    }

    // camera follows drone
    const camState = physics.getCameraState();
    sceneManager.updateCamera(camState.position, camState.target);

    // Render viewport pass
    renderEngine.render(sceneManager.scene, sceneManager.camera);

    // Refresh HUD
    updateHUD(deltaTime);
  });

  // Start engine loop
  renderEngine.start();
}

// Auto-run bootstrap if running in a browser window
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // Register Service Worker for PWA support
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('ServiceWorker registration failed: ', err);
      });
    });
  }
}
