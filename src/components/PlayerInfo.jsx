import React from 'react';
import { getPlayerPosition, SUIT_SYMBOLS } from '../utils/cardUtils';

export default function PlayerInfo({ playerNames, scores, myIndex, currentPlayerTurn, handSizes, capturedCards, exposedCards }) {
  const positions = ['bottom', 'right', 'top', 'left'];

  const getScoringCardsSummary = (cards) => {
    const scoring = [];
    let heartCount = 0;
    for (const c of cards) {
      if (c.suit === 'S' && c.rank === 12) scoring.push('🐷');
      if (c.suit === 'D' && c.rank === 11) scoring.push('🐐');
      if (c.suit === 'C' && c.rank === 10) scoring.push('⚡');
      if (c.suit === 'H') heartCount++;
    }
    if (heartCount > 0) scoring.push(`♥×${heartCount}`);
    return scoring.join(' ');
  };

  const getExposedSummary = (playerIdx) => {
    const exposed = exposedCards[playerIdx] || [];
    return exposed.map(cid => {
      const suit = cid[0];
      const rank = parseInt(cid.slice(1));
      if (suit === 'S' && rank === 12) return '🐷';
      if (suit === 'D' && rank === 11) return '🐐';
      if (suit === 'C' && rank === 10) return '⚡';
      if (suit === 'H' && rank === 14) return '💔';
      return '';
    }).filter(Boolean).join(' ');
  };

  return (
    <>
      {[0, 1, 2, 3].map(i => {
        const pos = getPlayerPosition(i, myIndex);
        const isActive = currentPlayerTurn === i;
        const captured = capturedCards[i] || [];
        const scoringSummary = getScoringCardsSummary(captured);
        const exposedSummary = getExposedSummary(i);

        return (
          <div key={i} className={`player-info player-info-${pos} ${isActive ? 'player-active' : ''}`}>
            <div className="player-name">
              {playerNames[i]}
              {i === myIndex && ' (You)'}
            </div>
            <div className="player-score">{scores[i]} pts</div>
            {pos !== 'bottom' && (
              <div className="player-cards-count">{handSizes[i]} cards</div>
            )}
            {exposedSummary && (
              <div className="player-exposed" title="Exposed cards">
                📢 {exposedSummary}
              </div>
            )}
            {scoringSummary && (
              <div className="player-captured" title="Captured scoring cards">
                {scoringSummary}
              </div>
            )}
            {isActive && <div className="player-turn-indicator">▶</div>}
          </div>
        );
      })}
    </>
  );
}
