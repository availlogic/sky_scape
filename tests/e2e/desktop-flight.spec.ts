import { test, expect } from '@playwright/test';

test.describe('Desktop Flight & Biome Shift E2E', () => {
  test('E2E-01: loads landing page, boots flight HUD, and handles settings biome change', async ({
    page,
  }) => {
    page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', (err) => console.error('BROWSER EXCEPTION:', err.stack || err.message));

    // 1. Visit URL
    await page.goto('/');

    // 2. Assert loading screen fades and flight HUD mounts in <10000ms
    const loadingScreen = page.locator('#loading-screen');
    await expect(loadingScreen).toBeHidden({ timeout: 10000 });

    const flightHud = page.locator('#flight-hud');
    await expect(flightHud).toBeVisible();

    // 3. Assert default values
    const speedText = page.locator('#hud-speed');
    await expect(speedText).toContainText('m/s');

    const biomeBadge = page.locator('#biome-badge');
    await expect(biomeBadge).toContainText('Forest');

    // 4. Press Escape to trigger Settings modal (pauses physics)
    await page.keyboard.press('Escape');

    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();

    // 5. Select Desert biome from grid
    const desertCard = page.locator('.biome-card[data-biome="desert"]');
    await desertCard.click();

    // Card gets active class (blue border)
    await expect(desertCard).toHaveClass(/active/);

    // 6. Click Close & Apply
    const saveBtn = page.locator('#settings-save-btn');
    await saveBtn.click();

    // Modal hides and badge updates
    await expect(settingsModal).toBeHidden();
    await expect(biomeBadge).toContainText('Desert');
  });
});
