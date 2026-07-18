import { test, expect } from '@playwright/test';

test.describe('PWA Offline Cache E2E', () => {
  test('E2E-07: registers service worker and loads application successfully when offline', async ({
    page,
    context,
  }) => {
    // Enable browser log output for tracing
    page.on('console', (msg) => console.log('PWA BROWSER LOG:', msg.text()));
    page.on('pageerror', (err) =>
      console.error('PWA BROWSER EXCEPTION:', err.stack || err.message),
    );

    // 1. Visit URL
    await page.goto('/');

    const loadingScreen = page.locator('#loading-screen');
    await expect(loadingScreen).toBeHidden({ timeout: 10000 });

    // 2. Wait for Service Worker registration to settle
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registration = await navigator.serviceWorker.ready;
      return registration.active !== null;
    });
    expect(swRegistered).toBe(true);

    // 3. Navigate page once online so the SW catches and caches all JS/ESM modules
    await page.goto('/');
    await expect(loadingScreen).toBeHidden({ timeout: 10000 });

    // 4. Wait 3 seconds online for background caching to settle
    await page.waitForTimeout(3000);

    // 5. Set the browser context to offline mode
    await context.setOffline(true);

    // 6. Navigate again while offline
    await page.goto('/');

    // 7. Assert loading screen fades and flight HUD becomes visible from cache
    await expect(loadingScreen).toBeHidden({ timeout: 10000 });
    const flightHud = page.locator('#flight-hud');
    await expect(flightHud).toBeVisible();

    // 8. Restore online state
    await context.setOffline(false);
  });
});
