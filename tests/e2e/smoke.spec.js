// E2E Test #1 — Smoke: Launch → Start Game → Visible Game State
// Purpose: Ensure the app is usable from a player's perspective.
import { test, expect } from '@playwright/test';

test.describe('Smoke: Launch and Start Game', () => {
  test('renders lobby, enters name, starts AI game, and shows game table', async ({ page }) => {
    // Navigate to the app with TEST MODE enabled
    await page.goto('/?test=1');

    // Confirm homepage renders — lobby should be visible
    await expect(page.getByTestId('lobby')).toBeVisible();
    await expect(page.getByText('GongZhu Online')).toBeVisible();

    // Enter player name
    const nameInput = page.getByTestId('name-input');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('TestPlayer');

    // Click "Play →"
    await page.getByTestId('name-submit').click();

    // Should see AI Practice tab with Start AI Game button
    await expect(page.getByTestId('start-ai-game')).toBeVisible();

    // Click "Start AI Game"
    await page.getByTestId('start-ai-game').click();

    // Wait for game table to appear (exposure phase or playing)
    await expect(page.getByTestId('game-table')).toBeVisible({ timeout: 10000 });

    // Verify game info bar shows Round 1
    await expect(page.getByTestId('info-round')).toHaveText('Round 1');

    // Verify trick counter is visible
    await expect(page.getByTestId('info-trick')).toBeVisible();

    // Verify the hand container is rendered with cards
    await expect(page.getByTestId('hand-container')).toBeVisible();

    // In TEST MODE, AI names should be deterministic
    // After exposure auto-confirms, we should eventually be in playing state
    // Wait for the game to reach playing state (exposure is auto-confirmed for AI)

    // Check exposure confirm button appears (we're in exposing phase first)
    const exposureConfirm = page.getByTestId('exposure-confirm');
    const isExposing = await exposureConfirm.isVisible().catch(() => false);

    if (isExposing) {
      // Confirm exposure to proceed to playing
      await exposureConfirm.click();
    }

    // Wait for playing phase — trick area should appear
    await expect(page.getByTestId('trick-area')).toBeVisible({ timeout: 10000 });

    // Verify hand has cards (13 cards in TEST MODE)
    const hand = page.getByTestId('hand');
    await expect(hand).toBeVisible();
    const cards = hand.locator('[data-testid^="card-"]');
    const cardCount = await cards.count();
    expect(cardCount).toBe(13);

    // Verify player names include the deterministic AI names
    await expect(page.getByText('AI_1').first()).toBeVisible();
    await expect(page.getByText('AI_2').first()).toBeVisible();
    await expect(page.getByText('AI_3').first()).toBeVisible();

    // No console errors — Playwright captures these; just check page didn't crash
    await expect(page.getByTestId('game-table')).toBeVisible();
  });
});
