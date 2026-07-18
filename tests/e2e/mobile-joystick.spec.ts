import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['iPhone 13 landscape'],
  hasTouch: true,
});

test.describe('Mobile Virtual Touch Controls E2E', () => {
  test('E2E-03: renders touch joysticks on mobile and fades them to 20% opacity when idle', async ({
    page,
  }) => {
    // 1. Visit URL
    await page.goto('/');

    // 2. Wait for loading screen to hide
    const loadingScreen = page.locator('#loading-screen');
    await expect(loadingScreen).toBeHidden({ timeout: 10000 });

    // 3. Verify touch-controls container is visible
    const touchControls = page.locator('#touch-controls');
    await expect(touchControls).toBeVisible();

    // Verify left/right joysticks and height slider exist
    const leftJoystick = page.locator('#left-joystick');
    const rightJoystick = page.locator('#right-joystick');
    const heightSlider = page.locator('#height-slider');
    await expect(leftJoystick).toBeVisible();
    await expect(rightJoystick).toBeVisible();
    await expect(heightSlider).toBeVisible();

    // 4. Wait for idle timeout (2.5s idle + 0.5s transition = 3s total)
    await page.waitForTimeout(3500);

    // Verify opacity of joystick elements faded to 0.2 (20%)
    const opacity = await leftJoystick.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeCloseTo(0.2, 1);
  });
});
