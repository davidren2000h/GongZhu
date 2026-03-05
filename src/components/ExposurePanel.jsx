import React, { useState } from 'react';
import Card from './Card';
import { cardId, isSpecialCard, getSpecialLabel } from '../utils/cardUtils';

export default function ExposurePanel({ hand, exposedCards, onExpose, onConfirm, confirmed }) {
  const [selected, setSelected] = useState(new Set(exposedCards || []));

  const exposableCards = hand.filter(c => isSpecialCard(c));

  const toggleCard = (card) => {
    if (confirmed) return;
    const cid = cardId(card);
    const next = new Set(selected);
    if (next.has(cid)) {
      next.delete(cid);
    } else {
      next.add(cid);
    }
    setSelected(next);
    onExpose(Array.from(next));
  };

  return (
    <div className="exposure-panel">
      <h2>🔔 Exposure Phase</h2>
      <p className="exposure-desc">
        Choose cards to expose. Exposed cards have doubled effects but cannot be played the first time their suit is led.
      </p>

      <div className="exposure-cards">
        {exposableCards.length === 0 ? (
          <p className="no-exposable">You have no exposable cards this round.</p>
        ) : (
          exposableCards.map(card => {
            const cid = cardId(card);
            const isSelected = selected.has(cid);
            return (
              <div
                key={cid}
                className={`exposure-card-wrapper ${isSelected ? 'exposure-selected' : ''}`}
                onClick={() => toggleCard(card)}
              >
                <Card card={card} playable={!confirmed} onClick={() => toggleCard(card)} />
                <div className="exposure-label">{getSpecialLabel(card)}</div>
                {isSelected && <div className="exposure-check">✓ Exposed</div>}
              </div>
            );
          })
        )}
      </div>

      <button
        className={`btn btn-primary exposure-confirm ${confirmed ? 'btn-disabled' : ''}`}
        onClick={confirmed ? undefined : onConfirm}
        disabled={confirmed}
        data-testid="exposure-confirm"
      >
        {confirmed ? '✓ Waiting for others...' : 'Confirm'}
      </button>
    </div>
  );
}
