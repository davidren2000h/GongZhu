// Unit Test #1 — Deterministic Shuffle / Deal
// Purpose: Prove the game's shuffle/deal is deterministic under a seed.
import { describe, it, expect } from 'vitest';
import {
  createDeck,
  shuffleDeck,
  sortHand,
  cardId,
  GongzhuGame,
} from '../../src/game/gameEngine.js';
import { createSeededRng } from '../../src/game/rng.js';

describe('Deterministic Shuffle / Deal', () => {
  it('produces identical deck order with the same seed across repeated calls', () => {
    const deck = createDeck();

    // First shuffle with seed=42
    const rng1 = createSeededRng(42);
    const shuffled1 = shuffleDeck(deck, rng1);

    // Second shuffle with same seed=42
    const rng2 = createSeededRng(42);
    const shuffled2 = shuffleDeck(deck, rng2);

    // Both must be identical
    expect(shuffled1.map(cardId)).toEqual(shuffled2.map(cardId));

    // Sanity: shuffled is different from original ordered deck
    const originalIds = deck.map(cardId);
    const shuffledIds = shuffled1.map(cardId);
    expect(shuffledIds).not.toEqual(originalIds);
  });

  it('produces different deck order with a different seed', () => {
    const deck = createDeck();

    const rng42 = createSeededRng(42);
    const shuffled42 = shuffleDeck(deck, rng42);

    const rng99 = createSeededRng(99);
    const shuffled99 = shuffleDeck(deck, rng99);

    // Different seeds → different output
    expect(shuffled42.map(cardId)).not.toEqual(shuffled99.map(cardId));
  });

  it('deals deterministic hands via GongzhuGame with seeded RNG', () => {
    // First game with seed=42
    const rng1 = createSeededRng(42);
    const game1 = new GongzhuGame('test-1', rng1);
    game1.addPlayer('p0', 'Alice');
    game1.addPlayer('p1', 'Bob');
    game1.addPlayer('p2', 'Carol');
    game1.addPlayer('p3', 'Dave');
    game1.startRound();

    const hands1 = game1.hands.map(h => sortHand(h).map(cardId));

    // Second game with same seed=42
    const rng2 = createSeededRng(42);
    const game2 = new GongzhuGame('test-2', rng2);
    game2.addPlayer('p0', 'Alice');
    game2.addPlayer('p1', 'Bob');
    game2.addPlayer('p2', 'Carol');
    game2.addPlayer('p3', 'Dave');
    game2.startRound();

    const hands2 = game2.hands.map(h => sortHand(h).map(cardId));

    // All four hands must be identical
    expect(hands1).toEqual(hands2);

    // Each hand has 13 cards
    for (const hand of hands1) {
      expect(hand).toHaveLength(13);
    }

    // Total unique cards = 52
    const allCards = hands1.flat();
    expect(new Set(allCards).size).toBe(52);
  });

  it('shuffleDeck produces a full 52-card deck with no duplicates', () => {
    const deck = createDeck();
    const rng = createSeededRng(42);
    const shuffled = shuffleDeck(deck, rng);

    expect(shuffled).toHaveLength(52);
    const ids = shuffled.map(cardId);
    expect(new Set(ids).size).toBe(52);
  });
});
