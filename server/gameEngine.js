// GongZhu Game Engine — authoritative game logic
// Suits: S=spades, H=hearts, D=diamonds, C=clubs
// Ranks: 2-14 (14=Ace)

const SUITS = ['S', 'H', 'D', 'C'];
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const RANK_NAMES = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const SUIT_SYMBOLS = { S: '♠', H: '♥', D: '♦', C: '♣' };

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function cardId(card) {
  return `${card.suit}${card.rank}`;
}

function cardName(card) {
  const r = RANK_NAMES[card.rank] || card.rank.toString();
  return `${SUIT_SYMBOLS[card.suit]}${r}`;
}

function sortHand(hand) {
  const suitOrder = { S: 0, H: 1, D: 2, C: 3 };
  return [...hand].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
    return b.rank - a.rank;
  });
}

// Check if a card is one of the exposable special cards
function isExposable(card) {
  return (
    (card.suit === 'S' && card.rank === 12) || // ♠Q (Pig)
    (card.suit === 'D' && card.rank === 11) || // ♦J (Goat)
    (card.suit === 'C' && card.rank === 10) || // ♣10 (Transformer)
    (card.suit === 'H' && card.rank === 14)    // ♥A
  );
}

// Check if playing a card is legal
function isLegalPlay(hand, card, leadSuit, trickCards, exposedCards, playerIndex) {
  // Must follow suit if possible
  if (leadSuit) {
    const hasSuit = hand.some(c => c.suit === leadSuit);
    if (hasSuit && card.suit !== leadSuit) return false;
  }

  // Exposed card restriction: cannot be played when its suit is first led
  // unless it's the player's only card of that suit (singleton)
  const cid = cardId(card);
  const exposedByPlayer = exposedCards[playerIndex] || [];
  if (exposedByPlayer.includes(cid)) {
    // Check if this suit is being led for the first time
    // This is tracked externally — we pass in a flag
    // Actually, we handle this via `suitFirstLed` check
    const suitCards = hand.filter(c => c.suit === card.suit);
    if (suitCards.length > 1 && leadSuit === card.suit) {
      // Check if this is the first time this suit is led — handled by caller
      return true; // Will be validated by caller with first-led tracking
    }
  }

  return true;
}

// Calculate score for captured cards in a round
function calculateRoundScore(capturedCards, exposedCards, allExposedCards) {
  let heartPoints = 0;
  let hasSpadeQ = false;
  let hasDiamondJ = false;
  let hasClub10 = false;
  let heartCount = 0;

  for (const card of capturedCards) {
    if (card.suit === 'H') {
      heartCount++;
      heartPoints += getHeartValue(card.rank);
    }
    if (card.suit === 'S' && card.rank === 12) hasSpadeQ = true;
    if (card.suit === 'D' && card.rank === 11) hasDiamondJ = true;
    if (card.suit === 'C' && card.rank === 10) hasClub10 = true;
  }

  // Shooting the moon check
  let score = 0;
  if (heartCount === 13 && hasSpadeQ) {
    // All hearts + ♠Q => +300
    score = 300;
  } else if (heartCount === 13) {
    // All hearts => +200
    score = 200;
  } else {
    // Normal scoring
    score += heartPoints; // negative
    if (hasSpadeQ) score -= 100;
    if (hasDiamondJ) score += 100;
    if (hasClub10 && !hasSpadeQ && heartCount === 0 && !hasDiamondJ) {
      // Club 10 captured alone (no other scoring cards)
      score += 50;
    }
  }

  // Apply exposure multipliers
  const allExposed = [].concat(...Object.values(allExposedCards));

  if (hasSpadeQ && allExposed.includes('S12')) {
    // ♠Q was exposed — double its effect
    if (heartCount === 13 && hasSpadeQ) {
      // Moon shot with exposed ♠Q: the +300 already includes it, double the ♠Q portion
      score += 100; // extra −100 becomes +100 in moon context... 
      // Actually for moon: base is +300, exposed ♠Q doubles the pig part
      // Let me reconsider: exposure doubles the card's scoring effect
    } else {
      score -= 100; // additional −100 (total −200 for pig)
    }
  }

  if (hasDiamondJ && allExposed.includes('D11')) {
    score += 100; // additional +100 (total +200 for goat)
  }

  if (allExposed.includes('H14')) {
    // ♥A was exposed — double ALL heart values
    if (heartCount === 13 && hasSpadeQ) {
      // Moon shot — the positive flip is also doubled for hearts portion
      // Hearts portion of moon is +200, doubled = extra +200
    } else if (heartCount === 13) {
      // Hearts moon +200, hearts portion doubled
    } else {
      // Double the heart penalty
      score += heartPoints; // heartPoints is negative, so this doubles it
    }
  }

  // Transformer (♣10) — doubles total round score if captured with other scoring cards
  if (hasClub10) {
    const hasOtherScoring = hasSpadeQ || hasDiamondJ || heartCount > 0;
    if (hasOtherScoring) {
      // Also check if ♣10 itself was exposed
      const club10Multiplier = allExposed.includes('C10') ? 4 : 2;
      score = score * club10Multiplier;
    } else {
      // Captured alone
      const club10Bonus = allExposed.includes('C10') ? 100 : 50;
      score = club10Bonus;
    }
  }

  return score;
}

function getHeartValue(rank) {
  if (rank === 14) return -50;
  if (rank === 13) return -40;
  if (rank === 12) return -30;
  if (rank === 11) return -20;
  if (rank >= 5 && rank <= 10) return -10;
  // 2, 3, 4
  return 0;
}

// Determine trick winner (highest card of the led suit)
function getTrickWinner(trick, leadPlayerIndex) {
  const leadSuit = trick[0].suit;
  let winnerIdx = 0;
  let highestRank = trick[0].rank;

  for (let i = 1; i < trick.length; i++) {
    if (trick[i].suit === leadSuit && trick[i].rank > highestRank) {
      highestRank = trick[i].rank;
      winnerIdx = i;
    }
  }

  // Convert relative index to absolute player index
  return (leadPlayerIndex + winnerIdx) % 4;
}

class GongzhuGame {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = [null, null, null, null]; // player IDs
    this.playerNames = ['', '', '', ''];
    this.hands = [[], [], [], []];
    this.scores = [0, 0, 0, 0]; // cumulative
    this.roundScores = [0, 0, 0, 0];
    this.capturedCards = [[], [], [], []];
    this.exposedCards = { 0: [], 1: [], 2: [], 3: [] };
    this.currentTrick = [];
    this.completedTrick = null; // holds the just-completed 4-card trick for display
    this.currentLeader = -1;
    this.currentPlayerTurn = -1;
    this.trickNumber = 0;
    this.roundNumber = 0;
    this.state = 'waiting'; // waiting, exposing, playing, roundEnd, gameOver
    this.suitsFirstLed = new Set();
    this.trickLeadPlayer = -1;
    this.lastTrickWinner = -1;
    this.lastTrick = null;
    this.gameOverReason = '';
  }

  addPlayer(playerId, name) {
    const idx = this.players.indexOf(null);
    if (idx === -1) return -1;
    this.players[idx] = playerId;
    this.playerNames[idx] = name || `Player ${idx + 1}`;
    return idx;
  }

  removePlayer(playerId) {
    const idx = this.players.indexOf(playerId);
    if (idx !== -1) {
      this.players[idx] = null;
      this.playerNames[idx] = '';
    }
    return idx;
  }

  getPlayerIndex(playerId) {
    return this.players.indexOf(playerId);
  }

  isFull() {
    return this.players.every(p => p !== null);
  }

  startRound() {
    const deck = shuffleDeck(createDeck());
    this.hands = [
      sortHand(deck.slice(0, 13)),
      sortHand(deck.slice(13, 26)),
      sortHand(deck.slice(26, 39)),
      sortHand(deck.slice(39, 52)),
    ];
    this.capturedCards = [[], [], [], []];
    this.exposedCards = { 0: [], 1: [], 2: [], 3: [] };
    this.currentTrick = [];
    this.completedTrick = null;
    this.completedTrickWinner = null;
    this.trickNumber = 0;
    this.suitsFirstLed = new Set();
    this.roundNumber++;
    this.state = 'exposing';
    this.exposureConfirmed = [false, false, false, false];
    this.lastTrick = null;
    this.lastTrickWinner = -1;
  }

  // Player exposes cards (array of card IDs like ['S12', 'H14'])
  exposeCards(playerIndex, cardIds) {
    if (this.state !== 'exposing') return { error: 'Not in exposure phase' };

    const validExposures = [];
    for (const cid of cardIds) {
      const card = this.hands[playerIndex].find(c => cardId(c) === cid);
      if (!card) return { error: `Card ${cid} not in hand` };
      if (!isExposable(card)) return { error: `Card ${cid} cannot be exposed` };
      validExposures.push(cid);
    }

    this.exposedCards[playerIndex] = validExposures;
    return { success: true };
  }

  confirmExposure(playerIndex) {
    if (this.state !== 'exposing') return { error: 'Not in exposure phase' };
    this.exposureConfirmed[playerIndex] = true;

    if (this.exposureConfirmed.every(c => c)) {
      this.startTrickPlay();
    }
    return { success: true, allConfirmed: this.exposureConfirmed.every(c => c) };
  }

  startTrickPlay() {
    this.state = 'playing';
    this.trickNumber = 1;

    // First leader: player with ♣2 or random if not found
    let firstLeader = 0;
    for (let i = 0; i < 4; i++) {
      if (this.hands[i].some(c => c.suit === 'C' && c.rank === 2)) {
        firstLeader = i;
        break;
      }
    }

    this.currentLeader = firstLeader;
    this.currentPlayerTurn = firstLeader;
    this.trickLeadPlayer = firstLeader;
    this.currentTrick = [];
  }

  // Play a card
  playCard(playerIndex, cardSuit, cardRank) {
    if (this.state !== 'playing') return { error: 'Not in playing phase' };
    if (playerIndex !== this.currentPlayerTurn) return { error: 'Not your turn' };

    const hand = this.hands[playerIndex];
    const cardIndex = hand.findIndex(c => c.suit === cardSuit && c.rank === cardRank);
    if (cardIndex === -1) return { error: 'Card not in hand' };

    const card = hand[cardIndex];
    const leadSuit = this.currentTrick.length > 0 ? this.currentTrick[0].card.suit : null;

    // Follow suit check
    if (leadSuit) {
      const hasSuit = hand.some(c => c.suit === leadSuit);
      if (hasSuit && card.suit !== leadSuit) {
        return { error: 'Must follow suit' };
      }
    }

    // Exposed card restriction
    const cid = cardId(card);
    const exposedByPlayer = this.exposedCards[playerIndex] || [];
    if (exposedByPlayer.includes(cid) && leadSuit === card.suit) {
      // Check if this suit has been led before
      if (!this.suitsFirstLed.has(card.suit)) {
        // First time this suit is led — can only play exposed card if singleton
        const suitCards = hand.filter(c => c.suit === card.suit);
        if (suitCards.length > 1) {
          return { error: 'Exposed card cannot be played first time its suit is led (unless singleton)' };
        }
      }
    }

    // Also: if this is leading, check exposed restriction for the lead card
    if (!leadSuit && exposedByPlayer.includes(cid)) {
      if (!this.suitsFirstLed.has(card.suit)) {
        const suitCards = hand.filter(c => c.suit === card.suit);
        if (suitCards.length > 1) {
          return { error: 'Cannot lead with exposed card on first lead of that suit (unless singleton)' };
        }
      }
    }

    // Remove from hand
    hand.splice(cardIndex, 1);

    // Track this play
    this.currentTrick.push({ playerIndex, card });

    // Track suit first led
    if (this.currentTrick.length === 1) {
      this.suitsFirstLed.add(card.suit);
    }

    // Check if trick is complete
    if (this.currentTrick.length === 4) {
      return this.completeTrick();
    }

    // Next player (counter-clockwise: +1 in array, which represents CCW seating)
    this.currentPlayerTurn = (this.currentPlayerTurn + 1) % 4;

    return {
      success: true,
      card: card,
      nextPlayer: this.currentPlayerTurn,
      trickComplete: false,
    };
  }

  completeTrick() {
    const trickCards = this.currentTrick.map(t => t.card);
    const winnerIndex = getTrickWinner(trickCards, this.trickLeadPlayer);

    // Winner captures all cards
    for (const t of this.currentTrick) {
      this.capturedCards[winnerIndex].push(t.card);
    }

    this.lastTrick = [...this.currentTrick];
    this.lastTrickWinner = winnerIndex;

    // Keep the completed trick visible for clients before clearing
    this.completedTrick = [...this.currentTrick];
    this.completedTrickWinner = winnerIndex;

    // Check if round is over (13 tricks played)
    if (this.trickNumber >= 13) {
      return this.completeRound();
    }

    // DON'T clear currentTrick yet — advanceToNextTrick() will do that
    return {
      success: true,
      trickComplete: true,
      trickWinner: winnerIndex,
      lastTrick: this.lastTrick,
      roundComplete: false,
    };
  }

  // Call this after showing the completed trick to clients
  advanceToNextTrick() {
    if (!this.completedTrick) return;
    const winnerIndex = this.completedTrickWinner;
    this.trickNumber++;
    this.currentTrick = [];
    this.completedTrick = null;
    this.completedTrickWinner = null;
    this.currentLeader = winnerIndex;
    this.currentPlayerTurn = winnerIndex;
    this.trickLeadPlayer = winnerIndex;
  }

  completeRound() {
    // Calculate scores
    this.roundScores = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      this.roundScores[i] = calculateRoundScore(
        this.capturedCards[i],
        this.exposedCards[i],
        this.exposedCards
      );
      this.scores[i] += this.roundScores[i];
    }

    // Check game over (first to −1000 loses)
    let gameOver = false;
    for (let i = 0; i < 4; i++) {
      if (this.scores[i] <= -1000) {
        gameOver = true;
        break;
      }
    }

    if (gameOver) {
      this.state = 'gameOver';
      // Rank players by score (highest first)
      const rankings = [0, 1, 2, 3].sort((a, b) => this.scores[b] - this.scores[a]);
      this.gameOverReason = `Player ${this.playerNames[rankings[3]]} reached below -1000!`;

      return {
        success: true,
        trickComplete: true,
        trickWinner: this.lastTrickWinner,
        lastTrick: this.lastTrick,
        roundComplete: true,
        roundScores: [...this.roundScores],
        totalScores: [...this.scores],
        gameOver: true,
        rankings,
      };
    }

    this.state = 'roundEnd';
    return {
      success: true,
      trickComplete: true,
      trickWinner: this.lastTrickWinner,
      lastTrick: this.lastTrick,
      roundComplete: true,
      roundScores: [...this.roundScores],
      totalScores: [...this.scores],
      gameOver: false,
    };
  }

  // Get game state for a specific player (hides other hands)
  getStateForPlayer(playerIndex) {
    return {
      gameId: this.gameId,
      state: this.state,
      playerIndex,
      playerNames: [...this.playerNames],
      hand: this.hands[playerIndex] ? sortHand(this.hands[playerIndex]) : [],
      scores: [...this.scores],
      roundScores: [...this.roundScores],
      roundNumber: this.roundNumber,
      trickNumber: this.trickNumber,
      currentTrick: (this.completedTrick || this.currentTrick).map(t => ({
        playerIndex: t.playerIndex,
        card: t.card,
      })),
      completedTrick: !!this.completedTrick,
      currentPlayerTurn: this.currentPlayerTurn,
      trickLeadPlayer: this.trickLeadPlayer,
      exposedCards: { ...this.exposedCards },
      capturedCards: this.capturedCards.map(cards => [...cards]),
      lastTrick: this.lastTrick,
      lastTrickWinner: this.lastTrickWinner,
      handSizes: this.hands.map(h => h.length),
      exposureConfirmed: this.exposureConfirmed ? [...this.exposureConfirmed] : [false, false, false, false],
    };
  }

  // Get legal plays for a player
  getLegalPlays(playerIndex) {
    if (this.state !== 'playing' || playerIndex !== this.currentPlayerTurn) return [];

    const hand = this.hands[playerIndex];
    const leadSuit = this.currentTrick.length > 0 ? this.currentTrick[0].card.suit : null;

    return hand.filter(card => {
      // Follow suit
      if (leadSuit) {
        const hasSuit = hand.some(c => c.suit === leadSuit);
        if (hasSuit && card.suit !== leadSuit) return false;
      }

      // Exposed restriction
      const cid = cardId(card);
      const exposedByPlayer = this.exposedCards[playerIndex] || [];
      if (exposedByPlayer.includes(cid)) {
        const isLead = this.currentTrick.length === 0;
        const relevantSuit = isLead ? card.suit : leadSuit;
        if (relevantSuit === card.suit && !this.suitsFirstLed.has(card.suit)) {
          const suitCards = hand.filter(c => c.suit === card.suit);
          if (suitCards.length > 1) return false;
        }
      }

      return true;
    });
  }
}

module.exports = {
  GongzhuGame,
  cardId,
  cardName,
  sortHand,
  createDeck,
  shuffleDeck,
  SUITS,
  RANKS,
  SUIT_SYMBOLS,
  RANK_NAMES,
  getHeartValue,
};
