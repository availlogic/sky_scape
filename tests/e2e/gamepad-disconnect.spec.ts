import { test, expect } from '@playwright/test';

test.describe('Gamepad Disconnection Interrupt E2E', () => {
  test('E2E-05: handles controller disconnection overlay and Escape key fallback', async ({
    page,
  }) => {
    // 1. Visit URL
    await page.goto('/');

    const loadingScreen = page.locator('#loading-screen');
    await expect(loadingScreen).toBeHidden({ timeout: 10000 });

    // 2. Open Settings
    await page.keyboard.press('Escape');
    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();

    // 3. Switch to Gamepad mode
    const gamepadToggleBtn = page.locator('#gamepad-mode-btn');
    await gamepadToggleBtn.click();

    // 4. Verify controller disconnected modal is displayed (since no gamepad is mocked)
    const disconnectModal = page.locator('#controller-disconnected-modal');
    await expect(disconnectModal).toBeVisible();

    // 5. Press Escape to trigger keyboard fallback
    await page.keyboard.press('Escape');

    // Disconnect warning modal should hide
    await expect(disconnectModal).toBeHidden();

    // 6. Verify input mode reverted to keyboard
    await page.keyboard.press('Escape');
    await expect(settingsModal).toBeVisible();
    const keyboardToggleBtn = page.locator('.mode-btn[data-mode="keyboard"]');
    await expect(keyboardToggleBtn).toHaveClass(/active/);
  });
});
