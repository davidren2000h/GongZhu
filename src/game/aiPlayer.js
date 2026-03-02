// AI Player for GongZhu — client-side ES module version
import { cardId, getHeartValue } from './gameEngine.js';

export class AIPlayer {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty;
  }

  decideExposure(hand, playerIndex) {
    const exposable = hand.filter(c =>
      (c.suit === 'S' && c.rank === 12) ||
      (c.suit === 'D' && c.rank === 11) ||
      (c.suit === 'C' && c.rank === 10) ||
      (c.suit === 'H' && c.rank === 14)
    );

    if (this.difficulty === 'easy') return [];

    const exposed = [];

    for (const card of exposable) {
      if (this.difficulty === 'normal') {
        if (card.suit === 'D' && card.rank === 11) {
          const diamonds = hand.filter(c => c.suit === 'D');
          if (diamonds.length >= 5 && diamonds.some(c => c.rank >= 13)) {
            exposed.push(cardId(card));
          }
        }
        if (card.suit === 'H' && card.rank === 14) {
          const hearts = hand.filter(c => c.suit === 'H');
          if (hearts.length >= 8) {
            exposed.push(cardId(card));
          }
        }
      } else if (this.difficulty === 'hard') {
        if (card.suit === 'D' && card.rank === 11) {
          const diamonds = hand.filter(c => c.suit === 'D');
          if (diamonds.length >= 4 && diamonds.filter(c => c.rank >= 12).length >= 2) {
            exposed.push(cardId(card));
          }
        }
        if (card.suit === 'S' && card.rank === 12) {
          const spades = hand.filter(c => c.suit === 'S');
          if (spades.length <= 3 && !spades.some(c => c.rank >= 13)) {
            if (Math.random() < 0.3) exposed.push(cardId(card));
          }
        }
        if (card.suit === 'H' && card.rank === 14) {
          const hearts = hand.filter(c => c.suit === 'H');
          if (hearts.length >= 7) {
            exposed.push(cardId(card));
          }
        }
        if (card.suit === 'C' && card.rank === 10) {
          const clubs = hand.filter(c => c.suit === 'C');
          if (clubs.length >= 5) {
            exposed.push(cardId(card));
          }
        }
      }
    }

    return exposed;
  }

  chooseCard(gameState, legalPlays) {
    if (legalPlays.length === 0) return null;
    if (legalPlays.length === 1) return legalPlays[0];

    if (this.difficulty === 'easy') {
      return this.chooseCardEasy(gameState, legalPlays);
    } else if (this.difficulty === 'normal') {
      return this.chooseCardNormal(gameState, legalPlays);
    } else {
      return this.chooseCardHard(gameState, legalPlays);
    }
  }

  chooseCardEasy(gameState, legalPlays) {
    const safe = legalPlays.filter(c => !(c.suit === 'S' && c.rank === 12));
    const pool = safe.length > 0 ? safe : legalPlays;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  chooseCardNormal(gameState, legalPlays) {
    const trick = gameState.currentTrick;
    const isLeading = trick.length === 0;

    if (isLeading) {
      return this.chooseLead(gameState, legalPlays);
    }

    const leadSuit = trick[0].card.suit;
    const followingSuit = legalPlays.some(c => c.suit === leadSuit);

    if (followingSuit) {
      return this.chooseFollowSuit(gameState, legalPlays, leadSuit, trick);
    } else {
      return this.chooseDiscard(gameState, legalPlays);
    }
  }

  chooseCardHard(gameState, legalPlays) {
    return this.chooseCardNormal(gameState, legalPlays);
  }

  chooseLead(gameState, legalPlays) {
    const nonHearts = legalPlays.filter(c => c.suit !== 'H');
    const nonScoring = (nonHearts.length > 0 ? nonHearts : legalPlays).filter(c => !this.isScoringCard(c));
    const pool = nonScoring.length > 0 ? nonScoring : (nonHearts.length > 0 ? nonHearts : legalPlays);

    pool.sort((a, b) => a.rank - b.rank);
    return pool[0];
  }

  chooseFollowSuit(gameState, legalPlays, leadSuit, trick) {
    const suitCards = legalPlays.filter(c => c.suit === leadSuit);
    suitCards.sort((a, b) => a.rank - b.rank);

    const trickCards = trick.map(t => t.card);
    let highestInLead = 0;
    for (const c of trickCards) {
      if (c.suit === leadSuit && c.rank > highestInLead) highestInLead = c.rank;
    }

    const hasPig = trickCards.some(c => c.suit === 'S' && c.rank === 12);
    const hasHearts = trickCards.some(c => c.suit === 'H');
    const hasGoat = trickCards.some(c => c.suit === 'D' && c.rank === 11);
    const hasTrans = trickCards.some(c => c.suit === 'C' && c.rank === 10);

    if (hasGoat) {
      const winners = suitCards.filter(c => c.rank > highestInLead);
      if (winners.length > 0) return winners[winners.length - 1];
    }

    if (hasPig || hasHearts) {
      return suitCards[0];
    }

    if (trick.length === 3) {
      const trickIsSafe = !hasPig && !hasHearts && !hasTrans;
      if (trickIsSafe) {
        const winners = suitCards.filter(c => c.rank > highestInLead);
        if (winners.length > 0) return winners[0];
      }
      return suitCards[0];
    }

    return suitCards[0];
  }

  chooseDiscard(gameState, legalPlays) {
    const pig = legalPlays.find(c => c.suit === 'S' && c.rank === 12);
    if (pig) return pig;

    const highHearts = legalPlays
      .filter(c => c.suit === 'H')
      .sort((a, b) => b.rank - a.rank);
    if (highHearts.length > 0) return highHearts[0];

    const sorted = [...legalPlays].sort((a, b) => b.rank - a.rank);
    return sorted[0];
  }

  isScoringCard(card) {
    if (card.suit === 'S' && card.rank === 12) return true;
    if (card.suit === 'D' && card.rank === 11) return true;
    if (card.suit === 'C' && card.rank === 10) return true;
    if (card.suit === 'H') return true;
    return false;
  }
}
