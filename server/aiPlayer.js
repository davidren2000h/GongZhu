// AI Player for GongZhu
const { cardId, getHeartValue } = require('./gameEngine');

class AIPlayer {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty; // 'easy', 'normal', 'hard'
  }

  // Decide which cards to expose
  decideExposure(hand, playerIndex) {
    const exposable = hand.filter(c =>
      (c.suit === 'S' && c.rank === 12) ||
      (c.suit === 'D' && c.rank === 11) ||
      (c.suit === 'C' && c.rank === 10) ||
      (c.suit === 'H' && c.rank === 14)
    );

    if (this.difficulty === 'easy') {
      // Easy AI never exposes
      return [];
    }

    const exposed = [];

    for (const card of exposable) {
      if (this.difficulty === 'normal') {
        // Normal AI: expose with some probability based on hand strength
        if (card.suit === 'D' && card.rank === 11) {
          // Expose ♦J if we have strong diamonds to protect it
          const diamonds = hand.filter(c => c.suit === 'D');
          if (diamonds.length >= 5 && diamonds.some(c => c.rank >= 13)) {
            exposed.push(cardId(card));
          }
        }
        if (card.suit === 'H' && card.rank === 14) {
          // Expose ♥A if we have many hearts (shooting moon attempt)
          const hearts = hand.filter(c => c.suit === 'H');
          if (hearts.length >= 8) {
            exposed.push(cardId(card));
          }
        }
      } else if (this.difficulty === 'hard') {
        // Hard AI: more aggressive exposure strategy
        if (card.suit === 'D' && card.rank === 11) {
          const diamonds = hand.filter(c => c.suit === 'D');
          if (diamonds.length >= 4 && diamonds.filter(c => c.rank >= 12).length >= 2) {
            exposed.push(cardId(card));
          }
        }
        if (card.suit === 'S' && card.rank === 12) {
          // Expose ♠Q if we can dump it — few spades
          const spades = hand.filter(c => c.suit === 'S');
          if (spades.length <= 3 && !spades.some(c => c.rank >= 13)) {
            // Risky expose — bluff
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

  // Choose which card to play
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
    // Easy: mostly random but avoids taking ♠Q if possible
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
    // Hard AI uses the same logic as normal but with more refined heuristics
    return this.chooseCardNormal(gameState, legalPlays);
  }

  chooseLead(gameState, legalPlays) {
    // Prefer leading with low non-scoring cards
    // Avoid leading hearts early
    const nonHearts = legalPlays.filter(c => c.suit !== 'H');
    const nonScoring = (nonHearts.length > 0 ? nonHearts : legalPlays).filter(c => !this.isScoringCard(c));
    const pool = nonScoring.length > 0 ? nonScoring : (nonHearts.length > 0 ? nonHearts : legalPlays);

    // Lead lowest card
    pool.sort((a, b) => a.rank - b.rank);
    return pool[0];
  }

  chooseFollowSuit(gameState, legalPlays, leadSuit, trick) {
    const suitCards = legalPlays.filter(c => c.suit === leadSuit);
    suitCards.sort((a, b) => a.rank - b.rank);

    // Find current winning card in trick
    const trickCards = trick.map(t => t.card);
    let highestInLead = 0;
    for (const c of trickCards) {
      if (c.suit === leadSuit && c.rank > highestInLead) highestInLead = c.rank;
    }

    // Check if trick has dangerous scoring cards
    const hasPig = trickCards.some(c => c.suit === 'S' && c.rank === 12);
    const hasHearts = trickCards.some(c => c.suit === 'H');
    const hasGoat = trickCards.some(c => c.suit === 'D' && c.rank === 11);
    const hasTrans = trickCards.some(c => c.suit === 'C' && c.rank === 10);

    // If goat is in the trick, try to win it
    if (hasGoat) {
      const winners = suitCards.filter(c => c.rank > highestInLead);
      if (winners.length > 0) return winners[winners.length - 1]; // play highest to win
    }

    // If pig or hearts in trick, try to duck
    if (hasPig || hasHearts) {
      // Play lowest card to avoid winning
      return suitCards[0];
    }

    // If last to play and trick is safe, can win for lead control
    if (trick.length === 3) {
      const trickIsSafe = !hasPig && !hasHearts && !hasTrans;
      if (trickIsSafe) {
        // Win it if cheap
        const winners = suitCards.filter(c => c.rank > highestInLead);
        if (winners.length > 0) return winners[0]; // cheapest winner
      }
      return suitCards[0]; // duck
    }

    // Generally play low
    return suitCards[0];
  }

  chooseDiscard(gameState, legalPlays) {
    // Can't follow suit — discard the most dangerous card
    // Priority: ♠Q > high hearts > ♣10 > other
    const pig = legalPlays.find(c => c.suit === 'S' && c.rank === 12);
    if (pig) return pig;

    const highHearts = legalPlays
      .filter(c => c.suit === 'H')
      .sort((a, b) => b.rank - a.rank);
    if (highHearts.length > 0) return highHearts[0];

    // Discard highest cards
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

module.exports = { AIPlayer };
