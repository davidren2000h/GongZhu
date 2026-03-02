import React from 'react';
import Card from './Card';
import { getPlayerPosition } from '../utils/cardUtils';

const POSITION_CLASSES = {
  bottom: 'trick-card-bottom',
  right: 'trick-card-right',
  top: 'trick-card-top',
  left: 'trick-card-left',
};

export default function TrickArea({ currentTrick, trickLeadPlayer, myIndex, lastTrick, lastTrickWinner, playerNames }) {
  const trick = currentTrick && currentTrick.length > 0 ? currentTrick : null;

  return (
    <div className="trick-area">
      <div className="trick-cards">
        {trick && trick.map((play, i) => {
          const pos = getPlayerPosition(play.playerIndex, myIndex);
          return (
            <div key={i} className={`trick-card ${POSITION_CLASSES[pos]}`}>
              <Card card={play.card} played small />
              <div className="trick-player-label">{playerNames[play.playerIndex]}</div>
            </div>
          );
        })}
        {!trick && lastTrick && (
          <div className="last-trick-info">
            <div className="last-trick-label">Last trick won by</div>
            <div className="last-trick-winner">{playerNames[lastTrickWinner]}</div>
          </div>
        )}
      </div>
    </div>
  );
}
