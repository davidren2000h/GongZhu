import React from 'react';
import { getPlayerPosition, SUIT_SYMBOLS, RANK_DISPLAY, getHeartValue } from '../utils/cardUtils';

export default function PlayerInfo({ playerNames, scores, myIndex, currentPlayerTurn, handSizes, capturedCards, exposedCards }) {
  const positions = ['bottom', 'right', 'top', 'left'];

  const getScoringCardsDetail = (cards) => {
    const details = [];
    const hearts = [];
    for (const c of cards) {
      if (c.suit === 'S' && c.rank === 12) details.push({ label: '♠Q', emoji: '🐷', value: -100, className: 'card-pig' });
      if (c.suit === 'D' && c.rank === 11) details.push({ label: '♦J', emoji: '🐐', value: +100, className: 'card-goat' });
      if (c.suit === 'C' && c.rank === 10) details.push({ label: '♣10', emoji: '⚡', value: '×2', className: 'card-transformer' });
      if (c.suit === 'H') {
        const val = getHeartValue(c.rank);
        if (val !== 0) hearts.push({ label: `♥${RANK_DISPLAY[c.rank]}`, value: val });
      }
    }
    return { details, hearts };
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
        const { details, hearts } = getScoringCardsDetail(captured);
        const exposedSummary = getExposedSummary(i);
        const totalHeartValue = hearts.reduce((sum, h) => sum + h.value, 0);

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
            {(details.length > 0 || hearts.length > 0) && (
              <div className="player-captured-details">
                {details.map((d, idx) => (
                  <span key={idx} className={`captured-card ${d.className}`} title={`${d.label}: ${d.value}`}>
                    {d.emoji}{d.label}({d.value})
                  </span>
                ))}
                {hearts.length > 0 && (
                  <span className="captured-card card-hearts" title={hearts.map(h => `${h.label}: ${h.value}`).join(', ')}>
                    ♥×{hearts.length}({totalHeartValue})
                  </span>
                )}
              </div>
            )}
            {isActive && <div className="player-turn-indicator">▶</div>}
          </div>
        );
      })}
    </>
  );
}
