import React from 'react';
import { SUIT_SYMBOLS, SUIT_COLORS, RANK_DISPLAY, isSpecialCard, cardId } from '../utils/cardUtils';

export default function Card({ card, playable, onClick, small, faceDown, exposed, played, highlighted }) {
  if (faceDown) {
    return (
      <div className={`card card-back ${small ? 'card-small' : ''}`}>
        <div className="card-back-pattern">🐷</div>
      </div>
    );
  }

  const color = SUIT_COLORS[card.suit];
  const special = isSpecialCard(card);
  const cid = cardId(card);

  const classes = [
    'card',
    small ? 'card-small' : '',
    playable ? 'card-playable' : '',
    !playable && !small && !played ? 'card-disabled' : '',
    special ? `card-special card-${special}` : '',
    exposed ? 'card-exposed' : '',
    played ? 'card-played' : '',
    highlighted ? 'card-highlighted' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={playable ? () => onClick(card) : undefined}
      style={{ '--card-color': color }}
      data-card-id={cid}
      data-testid={`card-${cid}`}
    >
      <div className="card-corner card-corner-top">
        <span className="card-rank">{RANK_DISPLAY[card.rank]}</span>
        <span className="card-suit">{SUIT_SYMBOLS[card.suit]}</span>
      </div>
      <div className="card-center">
        <span className="card-suit-large">{SUIT_SYMBOLS[card.suit]}</span>
        {special && <span className="card-special-icon">
          {special === 'pig' ? '🐷' : special === 'goat' ? '🐐' : special === 'transformer' ? '⚡' : '💔'}
        </span>}
      </div>
      <div className="card-corner card-corner-bottom">
        <span className="card-rank">{RANK_DISPLAY[card.rank]}</span>
        <span className="card-suit">{SUIT_SYMBOLS[card.suit]}</span>
      </div>
      {exposed && <div className="card-exposed-badge">EXPOSED</div>}
    </div>
  );
}
