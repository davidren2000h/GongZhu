import React from 'react';
import Card from './Card';
import { cardId } from '../utils/cardUtils';

export default function Hand({ cards, legalPlays, onPlayCard, isMyTurn, exposedCards }) {
  const exposedSet = new Set(exposedCards || []);

  return (
    <div className="hand-container">
      <div className="hand">
        {cards.map((card, index) => {
          const cid = cardId(card);
          const isPlayable = isMyTurn && legalPlays.includes(cid);
          const isExposed = exposedSet.has(cid);

          return (
            <div
              key={cid}
              className="hand-card-wrapper"
              style={{
                '--card-index': index,
                '--card-total': cards.length,
              }}
            >
              <Card
                card={card}
                playable={isPlayable}
                onClick={onPlayCard}
                exposed={isExposed}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
