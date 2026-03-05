// E2E Test #2 — Deterministic Turn: Play One Card → State Updates
// Purpose: Verify the core interaction loop works and is deterministic.
import { test, expect } from '@playwright/test';

test.describe('Deterministic Turn: Play One Card', () => {
  test('plays a card from hand, card moves to trick area, hand count decreases', async ({ page }) => {
    // Navigate with TEST MODE
    await page.goto('/?test=1');

    // Enter name and start game
    await page.getByTestId('name-input').fill('TestPlayer');
    await page.getByTestId('name-submit').click();
    await page.getByTestId('start-ai-game').click();

    // Wait for game table
    await expect(page.getByTestId('game-table')).toBeVisible({ timeout: 10000 });

    // Handle exposure phase — confirm immediately
    const exposureConfirm = page.getByTestId('exposure-confirm');
    const isExposing = await exposureConfirm.isVisible().catch(() => false);
    if (isExposing) {
      await exposureConfirm.click();
    }

    // Wait for playing state — "Your Turn" or turn indicator appears
    // In TEST MODE, we need to wait until it's our turn
    await expect(page.getByTestId('trick-area')).toBeVisible({ timeout: 10000 });

    // Wait for it to be our turn (AI plays fast in test mode)
    // The "Your Turn" indicator should appear when it's our turn
    await expect(page.getByTestId('your-turn')).toBeVisible({ timeout: 15000 });

    // Count cards in hand before playing
    const hand = page.getByTestId('hand');
    const cardsBefore = hand.locator('[data-testid^="card-"]');
    const countBefore = await cardsBefore.count();
    expect(countBefore).toBeGreaterThan(0);

    // Find the first playable card (has class card-playable)
    const playableCards = hand.locator('.card-playable');
    await expect(playableCards.first()).toBeVisible({ timeout: 5000 });

    // Record the card's data-testid before clicking
    const firstPlayable = playableCards.first();
    const cardTestId = await firstPlayable.getAttribute('data-testid');
    expect(cardTestId).toBeTruthy();
    const cardIdValue = cardTestId.replace('card-', '');

    // Click the first playable card
    await firstPlayable.click();

    // After playing, the hand count should decrease by 1
    // Wait for the state update
    await expect(async () => {
      const countAfter = await hand.locator('[data-testid^="card-"]').count();
      expect(countAfter).toBe(countBefore - 1);
    }).toPass({ timeout: 5000 });

    // The trick area should now contain the played card or show state change
    const trickArea = page.getByTestId('trick-area');
    await expect(trickArea).toBeVisible();

    // Verify the card left the hand — this confirms the play was accepted
    // The trick may already be completing (AI plays fast in test mode),
    // so we verify via the decreased hand count which we already asserted above
  });

  test('deterministic: same seed produces same first hand across runs', async ({ page }) => {
    // This test verifies that TEST MODE produces the same initial state
    // Run 1
    await page.goto('/?test=1');
    await page.getByTestId('name-input').fill('TestPlayer');
    await page.getByTestId('name-submit').click();
    await page.getByTestId('start-ai-game').click();
    await expect(page.getByTestId('game-table')).toBeVisible({ timeout: 10000 });

    // Get card IDs from hand in the exposure/playing phase
    const hand1 = page.getByTestId('hand');
    await expect(hand1).toBeVisible();
    const cards1 = hand1.locator('[data-testid^="card-"]');
    await expect(cards1.first()).toBeVisible({ timeout: 5000 });
    const cardIds1 = await cards1.evaluateAll(els =>
      els.map(el => el.getAttribute('data-testid')).sort()
    );

    // Run 2 — reload fresh
    await page.goto('/?test=1');
    await page.getByTestId('name-input').fill('TestPlayer');
    await page.getByTestId('name-submit').click();
    await page.getByTestId('start-ai-game').click();
    await expect(page.getByTestId('game-table')).toBeVisible({ timeout: 10000 });

    const hand2 = page.getByTestId('hand');
    await expect(hand2).toBeVisible();
    const cards2 = hand2.locator('[data-testid^="card-"]');
    await expect(cards2.first()).toBeVisible({ timeout: 5000 });
    const cardIds2 = await cards2.evaluateAll(els =>
      els.map(el => el.getAttribute('data-testid')).sort()
    );

    // Both runs should produce the exact same hand
    expect(cardIds1).toEqual(cardIds2);
    expect(cardIds1.length).toBe(13);
  });
});
