import { test, expect } from '@playwright/test';

test.describe('Settings Panel Controls E2E', () => {
  test('E2E-02: adjusts settings sliders, saves them, and restores default values', async ({
    page,
  }) => {
    // 1. Visit URL
    await page.goto('/');

    // 2. Wait for loading screen to hide
    const loadingScreen = page.locator('#loading-screen');
    await expect(loadingScreen).toBeHidden({ timeout: 10000 });

    // 3. Press Escape to open settings modal
    await page.keyboard.press('Escape');
    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();

    // 4. Locate sliders
    const dampingSlider = page.locator('#damping-slider');
    const dampingValue = page.locator('#damping-value');
    const expoSlider = page.locator('#expo-slider');
    const expoValue = page.locator('#expo-value');
    const cruiseSlider = page.locator('#cruise-speed-slider');
    const cruiseValue = page.locator('#cruise-speed-value');

    // 5. Modify slider values using evaluate (since slider is range input)
    await dampingSlider.evaluate((el: HTMLInputElement) => {
      el.value = '0.85';
      el.dispatchEvent(new Event('input'));
    });
    await expect(dampingValue).toHaveText('0.85');

    await expoSlider.evaluate((el: HTMLInputElement) => {
      el.value = '0.70';
      el.dispatchEvent(new Event('input'));
    });
    await expect(expoValue).toHaveText('0.70');

    await cruiseSlider.evaluate((el: HTMLInputElement) => {
      el.value = '25';
      el.dispatchEvent(new Event('input'));
    });
    await expect(cruiseValue).toHaveText('25 m/s');

    // 6. Click Close & Apply
    const saveBtn = page.locator('#settings-save-btn');
    await saveBtn.click();
    await expect(settingsModal).toBeHidden();

    // 7. Verify settings are persisted by reopening modal
    await page.keyboard.press('Escape');
    await expect(settingsModal).toBeVisible();
    await expect(dampingSlider).toHaveValue('0.85');
    await expect(expoSlider).toHaveValue('0.7');
    await expect(cruiseSlider).toHaveValue('25');

    // 8. Click Restore Defaults
    const resetBtn = page.locator('#settings-reset-btn');
    await resetBtn.click();

    // Verify sliders reset to default values
    await expect(dampingSlider).toHaveValue('0.15');
    await expect(expoSlider).toHaveValue('0.4');
    await expect(cruiseSlider).toHaveValue('15');

    // 9. Close Settings
    await saveBtn.click();
    await expect(settingsModal).toBeHidden();
  });
});
