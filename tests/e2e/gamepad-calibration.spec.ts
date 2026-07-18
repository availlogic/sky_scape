import { test, expect } from '@playwright/test';

test.describe('Gamepad Calibration Wizard E2E', () => {
  test('E2E-04: steps through the 5-step controller calibration wizard and saves', async ({
    page,
  }) => {
    // 1. Visit URL
    await page.goto('/');

    const loadingScreen = page.locator('#loading-screen');
    await expect(loadingScreen).toBeHidden({ timeout: 10000 });

    // Mock gamepad connection globally before opening settings
    await page.evaluate(() => {
      const mockGamepad = {
        index: 0,
        axes: [0.0, 0.0, 0.0, 0.0],
        buttons: [],
        id: 'Mock Gamepad',
        connected: true,
      };

      // Stub navigator.getGamepads
      Object.defineProperty(navigator, 'getGamepads', {
        value: () => [mockGamepad],
        writable: true,
      });

      // Dispatch connected event
      const event = new Event('gamepadconnected') as any;
      event.gamepad = mockGamepad;
      window.dispatchEvent(event);
    });

    // 2. Open Settings
    await page.keyboard.press('Escape');
    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();

    // 3. Switch to Gamepad mode
    const gamepadToggleBtn = page.locator('#gamepad-mode-btn');
    await gamepadToggleBtn.click();
    await expect(gamepadToggleBtn).toHaveClass(/active/);

    // 4. Verify Calibrate button is visible and click it
    const calibrateBtn = page.locator('#btn-calibrate-gamepad');
    await expect(calibrateBtn).toBeVisible();
    await calibrateBtn.click();

    // Calibration modal should open
    const calModal = page.locator('#calibration-modal');
    await expect(calModal).toBeVisible();

    // 5. Welcome Step
    const welcomeStep = page.locator('#calibration-step-welcome');
    await expect(welcomeStep).toBeVisible();
    const startBtn = page.locator('#cal-start-btn');
    await startBtn.click();

    // 6. Step 1: Throttle
    const throttleStep = page.locator('#calibration-step-throttle');
    await expect(throttleStep).toBeVisible();
    const throttleNextBtn = page.locator('#cal-throttle-next');
    await throttleNextBtn.click();

    // 7. Step 2: Yaw
    const yawStep = page.locator('#calibration-step-yaw');
    await expect(yawStep).toBeVisible();
    const yawNextBtn = page.locator('#cal-yaw-next');
    await yawNextBtn.click();

    // 8. Step 3: Pitch
    const pitchStep = page.locator('#calibration-step-pitch');
    await expect(pitchStep).toBeVisible();
    const pitchNextBtn = page.locator('#cal-pitch-next');
    await pitchNextBtn.click();

    // 9. Step 4: Roll
    const rollStep = page.locator('#calibration-step-roll');
    await expect(rollStep).toBeVisible();
    const rollNextBtn = page.locator('#cal-roll-next');
    await rollNextBtn.click();

    // 10. Step 5: Verification
    const verificationStep = page.locator('#calibration-step-verification');
    await expect(verificationStep).toBeVisible();

    // Checkbox toggles inversion
    const throttleCheckbox = page.locator('#inv-throttle');
    await throttleCheckbox.check();
    await expect(throttleCheckbox).toBeChecked();

    const saveCalBtn = page.locator('#cal-save-btn');
    await saveCalBtn.click();

    // Calibration wizard should hide
    await expect(calModal).toBeHidden();
  });
});
