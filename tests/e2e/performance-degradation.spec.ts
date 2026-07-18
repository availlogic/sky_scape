import { test, expect } from '@playwright/test';

test.describe('Adaptive Performance degradation & Recovery E2E', () => {
  test('E2E-06: triggers low FPS degradation warning and verifies automatic recovery', async ({
    page,
  }) => {
    // 1. Visit URL
    await page.goto('/');

    const loadingScreen = page.locator('#loading-screen');
    await expect(loadingScreen).toBeHidden({ timeout: 10000 });

    // Force reset initial load performance degradation flakiness
    await page.evaluate(() => {
      const apde = (window as any).apde;
      apde.changeState(0);
      const alert = document.getElementById('perf-warning-alert');
      if (alert) alert.style.display = 'none';
    });

    const perfWarning = page.locator('#perf-warning-alert');
    await expect(perfWarning).toBeHidden();

    // 2. Simulate low FPS (45 FPS = 22ms per frame) for 4.5 seconds to trigger degradation warning
    // We stub performance.now to control elapsed time in the sync loop
    await page.evaluate(() => {
      const apde = (window as any).apde;
      const originalNow = performance.now.bind(performance);
      let mockTime = originalNow();

      performance.now = () => mockTime;

      const totalFrames = Math.floor(4500 / 22);
      for (let i = 0; i < totalFrames; i++) {
        mockTime += 22;
        apde.recordFrame(22);
      }

      // Restore original performance.now
      performance.now = originalNow;
    });

    // Expect warning alert to be visible
    await expect(perfWarning).toBeVisible();

    // 3. Simulate high stable FPS (60 FPS = 16.6ms per frame) for 22.0 seconds to trigger recovery
    await page.evaluate(() => {
      const apde = (window as any).apde;
      const originalNow = performance.now.bind(performance);
      let mockTime = originalNow();

      performance.now = () => mockTime;

      const totalFrames = Math.floor(32000 / 16.6);
      for (let i = 0; i < totalFrames; i++) {
        mockTime += 16.6;
        apde.recordFrame(16.6);
      }

      // Restore original performance.now
      performance.now = originalNow;
    });

    // Warning alert should hide again after recovering to level 0
    await expect(perfWarning).toBeHidden();
  });
});
