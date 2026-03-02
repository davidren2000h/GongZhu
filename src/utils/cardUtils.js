// Card utility functions for the frontend

export const SUIT_SYMBOLS = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const SUIT_NAMES = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
export const SUIT_COLORS = { S: '#1a1a2e', H: '#e74c3c', D: '#e74c3c', C: '#1a1a2e' };
export const RANK_DISPLAY = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
  9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

export function cardId(card) {
  return `${card.suit}${card.rank}`;
}

export function cardDisplay(card) {
  return `${SUIT_SYMBOLS[card.suit]}${RANK_DISPLAY[card.rank]}`;
}

export function isSpecialCard(card) {
  if (card.suit === 'S' && card.rank === 12) return 'pig';       // ♠Q
  if (card.suit === 'D' && card.rank === 11) return 'goat';      // ♦J
  if (card.suit === 'C' && card.rank === 10) return 'transformer'; // ♣10
  if (card.suit === 'H' && card.rank === 14) return 'heartAce';  // ♥A
  return null;
}

export function getSpecialLabel(card) {
  const type = isSpecialCard(card);
  switch (type) {
    case 'pig': return '🐷 Pig (-100)';
    case 'goat': return '🐐 Goat (+100)';
    case 'transformer': return '⚡ Transformer (×2)';
    case 'heartAce': return '💔 Heart Ace (-50)';
    default: return null;
  }
}

export function getHeartValue(rank) {
  if (rank === 14) return -50;
  if (rank === 13) return -40;
  if (rank === 12) return -30;
  if (rank === 11) return -20;
  if (rank >= 5 && rank <= 10) return -10;
  return 0;
}

// Position helpers for 4-player layout
export function getPlayerPosition(playerIndex, myIndex) {
  // Returns position relative to current player (bottom)
  const relative = (playerIndex - myIndex + 4) % 4;
  switch (relative) {
    case 0: return 'bottom';  // me
    case 1: return 'right';
    case 2: return 'top';
    case 3: return 'left';
    default: return 'bottom';
  }
}
