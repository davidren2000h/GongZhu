// GongZhu Game Engine — client-side ES module version
// Suits: S=spades, H=hearts, D=diamonds, C=clubs
// Ranks: 2-14 (14=Ace)

export const SUITS = ['S', 'H', 'D', 'C'];
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const RANK_NAMES = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
export const SUIT_SYMBOLS = { S: '♠', H: '♥', D: '♦', C: '♣' };

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function cardId(card) {
  return `${card.suit}${card.rank}`;
}

export function cardName(card) {
  const r = RANK_NAMES[card.rank] || card.rank.toString();
  return `${SUIT_SYMBOLS[card.suit]}${r}`;
}

export function sortHand(hand) {
  const suitOrder = { S: 0, H: 1, D: 2, C: 3 };
  return [...hand].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
    return b.rank - a.rank;
  });
}

export function isExposable(card) {
  return (
    (card.suit === 'S' && card.rank === 12) ||
    (card.suit === 'D' && card.rank === 11) ||
    (card.suit === 'C' && card.rank === 10) ||
    (card.suit === 'H' && card.rank === 14)
  );
}

export function getHeartValue(rank) {
  if (rank === 14) return -50;
  if (rank === 13) return -40;
  if (rank === 12) return -30;
  if (rank === 11) return -20;
  if (rank >= 5 && rank <= 10) return -10;
  return 0;
}

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

  let score = 0;
  if (heartCount === 13 && hasSpadeQ) {
    score = 300;
  } else if (heartCount === 13) {
    score = 200;
  } else {
    score += heartPoints;
    if (hasSpadeQ) score -= 100;
    if (hasDiamondJ) score += 100;
    if (hasClub10 && !hasSpadeQ && heartCount === 0 && !hasDiamondJ) {
      score += 50;
    }
  }

  const allExposed = [].concat(...Object.values(allExposedCards));

  if (hasSpadeQ && allExposed.includes('S12')) {
    if (heartCount === 13 && hasSpadeQ) {
      score += 100;
    } else {
      score -= 100;
    }
  }

  if (hasDiamondJ && allExposed.includes('D11')) {
    score += 100;
  }

  if (allExposed.includes('H14')) {
    if (heartCount === 13 && hasSpadeQ) {
      // Moon shot with exposed hearts
    } else if (heartCount === 13) {
      // Hearts moon
    } else {
      score += heartPoints;
    }
  }

  if (hasClub10) {
    const hasOtherScoring = hasSpadeQ || hasDiamondJ || heartCount > 0;
    if (hasOtherScoring) {
      const club10Multiplier = allExposed.includes('C10') ? 4 : 2;
      score = score * club10Multiplier;
    } else {
      const club10Bonus = allExposed.includes('C10') ? 100 : 50;
      score = club10Bonus;
    }
  }

  return score;
}

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

  return (leadPlayerIndex + winnerIdx) % 4;
}

export class GongzhuGame {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = [null, null, null, null];
    this.playerNames = ['', '', '', ''];
    this.hands = [[], [], [], []];
    this.scores = [0, 0, 0, 0];
    this.roundScores = [0, 0, 0, 0];
    this.capturedCards = [[], [], [], []];
    this.exposedCards = { 0: [], 1: [], 2: [], 3: [] };
    this.currentTrick = [];
    this.completedTrick = null;
    this.completedTrickWinner = null;
    this.currentLeader = -1;
    this.currentPlayerTurn = -1;
    this.trickNumber = 0;
    this.roundNumber = 0;
    this.state = 'waiting';
    this.suitsFirstLed = new Set();
    this.trickLeadPlayer = -1;
    this.lastTrickWinner = -1;
    this.lastTrick = null;
    this.gameOverReason = '';
    this.exposureConfirmed = [false, false, false, false];
  }

  addPlayer(playerId, name) {
    const idx = this.players.indexOf(null);
    if (idx === -1) return -1;
    this.players[idx] = playerId;
    this.playerNames[idx] = name || `Player ${idx + 1}`;
    return idx;
  }

  getPlayerIndex(playerId) {
    return this.players.indexOf(playerId);
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

  playCard(playerIndex, cardSuit, cardRank) {
    if (this.state !== 'playing') return { error: 'Not in playing phase' };
    if (playerIndex !== this.currentPlayerTurn) return { error: 'Not your turn' };

    const hand = this.hands[playerIndex];
    const cardIndex = hand.findIndex(c => c.suit === cardSuit && c.rank === cardRank);
    if (cardIndex === -1) return { error: 'Card not in hand' };

    const card = hand[cardIndex];
    const leadSuit = this.currentTrick.length > 0 ? this.currentTrick[0].card.suit : null;

    if (leadSuit) {
      const hasSuit = hand.some(c => c.suit === leadSuit);
      if (hasSuit && card.suit !== leadSuit) {
        return { error: 'Must follow suit' };
      }
    }

    const cid = cardId(card);
    const exposedByPlayer = this.exposedCards[playerIndex] || [];
    if (exposedByPlayer.includes(cid) && leadSuit === card.suit) {
      if (!this.suitsFirstLed.has(card.suit)) {
        const suitCards = hand.filter(c => c.suit === card.suit);
        if (suitCards.length > 1) {
          return { error: 'Exposed card cannot be played first time its suit is led (unless singleton)' };
        }
      }
    }

    if (!leadSuit && exposedByPlayer.includes(cid)) {
      if (!this.suitsFirstLed.has(card.suit)) {
        const suitCards = hand.filter(c => c.suit === card.suit);
        if (suitCards.length > 1) {
          return { error: 'Cannot lead with exposed card on first lead of that suit (unless singleton)' };
        }
      }
    }

    hand.splice(cardIndex, 1);
    this.currentTrick.push({ playerIndex, card });

    if (this.currentTrick.length === 1) {
      this.suitsFirstLed.add(card.suit);
    }

    if (this.currentTrick.length === 4) {
      return this.completeTrick();
    }

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

    for (const t of this.currentTrick) {
      this.capturedCards[winnerIndex].push(t.card);
    }

    this.lastTrick = [...this.currentTrick];
    this.lastTrickWinner = winnerIndex;
    this.completedTrick = [...this.currentTrick];
    this.completedTrickWinner = winnerIndex;

    if (this.trickNumber >= 13) {
      return this.completeRound();
    }

    return {
      success: true,
      trickComplete: true,
      trickWinner: winnerIndex,
      lastTrick: this.lastTrick,
      roundComplete: false,
    };
  }

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
    this.roundScores = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      this.roundScores[i] = calculateRoundScore(
        this.capturedCards[i],
        this.exposedCards[i],
        this.exposedCards
      );
      this.scores[i] += this.roundScores[i];
    }

    let gameOver = false;
    for (let i = 0; i < 4; i++) {
      if (this.scores[i] <= -1000) {
        gameOver = true;
        break;
      }
    }

    if (gameOver) {
      this.state = 'gameOver';
      const rankings = [0, 1, 2, 3].sort((a, b) => this.scores[b] - this.scores[a]);

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

  getLegalPlays(playerIndex) {
    if (this.state !== 'playing' || playerIndex !== this.currentPlayerTurn) return [];

    const hand = this.hands[playerIndex];
    const leadSuit = this.currentTrick.length > 0 ? this.currentTrick[0].card.suit : null;

    return hand.filter(card => {
      if (leadSuit) {
        const hasSuit = hand.some(c => c.suit === leadSuit);
        if (hasSuit && card.suit !== leadSuit) return false;
      }

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
