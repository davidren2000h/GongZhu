// Unit Test #2 — Scoring Rule (Pure Function)
// Purpose: Validate scoring sub-rules using pure logic (no UI).
import { describe, it, expect } from 'vitest';
import {
  getHeartValue,
  calculateRoundScore,
} from '../../src/game/gameEngine.js';

describe('Scoring Rules', () => {
  describe('getHeartValue', () => {
    it('returns correct penalty values for each heart rank', () => {
      expect(getHeartValue(14)).toBe(-50);  // Ace
      expect(getHeartValue(13)).toBe(-40);  // King
      expect(getHeartValue(12)).toBe(-30);  // Queen
      expect(getHeartValue(11)).toBe(-20);  // Jack
      expect(getHeartValue(10)).toBe(-10);  // 10
      expect(getHeartValue(5)).toBe(-10);   // 5
      expect(getHeartValue(4)).toBe(0);     // 4 (no value)
      expect(getHeartValue(3)).toBe(0);     // 3 (no value)
      expect(getHeartValue(2)).toBe(0);     // 2 (no value)
    });
  });

  describe('calculateRoundScore', () => {
    const noExposed = { 0: [], 1: [], 2: [], 3: [] };

    it('scores ♠Q (Pig) as -100 points', () => {
      const captured = [{ suit: 'S', rank: 12 }];
      const score = calculateRoundScore(captured, [], noExposed);
      // SpadeQ = -100, then club10 logic: hasOtherScoring=true? No C10 captured.
      // Just -100 for the pig
      expect(score).toBe(-100);
    });

    it('scores ♦J (Goat) as +100 points', () => {
      const captured = [{ suit: 'D', rank: 11 }];
      const score = calculateRoundScore(captured, [], noExposed);
      expect(score).toBe(100);
    });

    it('scores hearts correctly: H-A, H-K, H-5 = -100', () => {
      const captured = [
        { suit: 'H', rank: 14 }, // -50
        { suit: 'H', rank: 13 }, // -40
        { suit: 'H', rank: 5 },  // -10
      ];
      const score = calculateRoundScore(captured, [], noExposed);
      expect(score).toBe(-100);
    });

    it('scores ♣10 (Transformer) as +50 when captured alone', () => {
      const captured = [{ suit: 'C', rank: 10 }];
      const score = calculateRoundScore(captured, [], noExposed);
      expect(score).toBe(50);
    });

    it('♣10 doubles score when combined with other scoring cards', () => {
      // ♦J (+100) with ♣10 → 100 * 2 = 200
      const captured = [
        { suit: 'D', rank: 11 },
        { suit: 'C', rank: 10 },
      ];
      const score = calculateRoundScore(captured, [], noExposed);
      expect(score).toBe(200);
    });

    it('♣10 doubles negative score with hearts', () => {
      // H-A (-50) with ♣10 → -50 * 2 = -100
      const captured = [
        { suit: 'H', rank: 14 },
        { suit: 'C', rank: 10 },
      ];
      const score = calculateRoundScore(captured, [], noExposed);
      expect(score).toBe(-100);
    });

    it('Shoot the Moon: all 13 hearts without ♠Q = +200', () => {
      const captured = [];
      for (let r = 2; r <= 14; r++) {
        captured.push({ suit: 'H', rank: r });
      }
      const score = calculateRoundScore(captured, [], noExposed);
      expect(score).toBe(200);
    });

    it('Shoot the Moon with ♠Q: all 13 hearts + ♠Q = +300', () => {
      const captured = [{ suit: 'S', rank: 12 }];
      for (let r = 2; r <= 14; r++) {
        captured.push({ suit: 'H', rank: r });
      }
      const score = calculateRoundScore(captured, [], noExposed);
      expect(score).toBe(300);
    });

    it('♠Q + ♦J cancel to 0 (before transformer)', () => {
      const captured = [
        { suit: 'S', rank: 12 },  // -100
        { suit: 'D', rank: 11 },  // +100
      ];
      const score = calculateRoundScore(captured, [], noExposed);
      // -100 + 100 = 0, no C10 so no multiplier
      expect(score).toBe(0);
    });

    it('returns 0 for no scoring cards captured', () => {
      const captured = [
        { suit: 'S', rank: 2 },
        { suit: 'D', rank: 5 },
        { suit: 'C', rank: 7 },
      ];
      const score = calculateRoundScore(captured, [], noExposed);
      expect(score).toBe(0);
    });

    it('handles exposed ♠Q doubling the penalty', () => {
      const captured = [{ suit: 'S', rank: 12 }];
      const allExposed = { 0: ['S12'], 1: [], 2: [], 3: [] };
      const score = calculateRoundScore(captured, [], allExposed);
      // -100 base, then -100 more for exposed S12 = -200, no C10
      expect(score).toBe(-200);
    });

    it('handles exposed ♦J doubling the bonus', () => {
      const captured = [{ suit: 'D', rank: 11 }];
      const allExposed = { 0: [], 1: ['D11'], 2: [], 3: [] };
      const score = calculateRoundScore(captured, [], allExposed);
      // +100 base, then +100 more for exposed D11 = +200
      expect(score).toBe(200);
    });
  });
});
