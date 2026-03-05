import React, { useState } from 'react';
import Hand from './Hand';
import TrickArea from './TrickArea';
import PlayerInfo from './PlayerInfo';
import ExposurePanel from './ExposurePanel';
import ScoreBoard from './ScoreBoard';
import { cardId } from '../utils/cardUtils';

export default function Game({ gameState, legalPlays, send, roundEndData, gameOverData, onDismissRoundEnd, onDismissGameOver }) {
  const [exposureCards, setExposureCards] = useState([]);

  if (!gameState) return null;

  const {
    state,
    playerIndex: myIndex,
    playerNames,
    hand,
    scores,
    roundScores,
    roundNumber,
    trickNumber,
    currentTrick,
    currentPlayerTurn,
    trickLeadPlayer,
    exposedCards,
    capturedCards,
    lastTrick,
    lastTrickWinner,
    handSizes,
    exposureConfirmed,
  } = gameState;

  const isMyTurn = currentPlayerTurn === myIndex && state === 'playing';

  const handlePlayCard = (card) => {
    send({ type: 'playCard', suit: card.suit, rank: card.rank });
  };

  const handleExpose = (cards) => {
    setExposureCards(cards);
    send({ type: 'expose', cards });
  };

  const handleConfirmExposure = () => {
    send({ type: 'confirmExposure' });
  };

  // All exposed cards for display
  const allExposed = [];
  for (const [pidx, cards] of Object.entries(exposedCards)) {
    for (const cid of cards) {
      allExposed.push(cid);
    }
  }

  const myExposed = exposedCards[myIndex] || [];

  return (
    <div className="game-table" data-testid="game-table">
      {/* Game info bar */}
      <div className="game-info-bar" data-testid="game-info-bar">
        <div className="info-round" data-testid="info-round">Round {roundNumber}</div>
        <div className="info-trick" data-testid="info-trick">Trick {trickNumber}/13</div>
        <div className="info-turn" data-testid="info-turn">
          {isMyTurn ? (
            <span className="your-turn" data-testid="your-turn">🎯 Your Turn!</span>
          ) : state === 'playing' ? (
            <span>{playerNames[currentPlayerTurn]}'s turn</span>
          ) : state === 'exposing' ? (
            <span>Exposure Phase</span>
          ) : null}
        </div>
      </div>

      {/* Player info panels */}
      <PlayerInfo
        playerNames={playerNames}
        scores={scores}
        myIndex={myIndex}
        currentPlayerTurn={currentPlayerTurn}
        handSizes={handSizes}
        capturedCards={capturedCards}
        exposedCards={exposedCards}
      />

      {/* Center trick area */}
      <TrickArea
        currentTrick={currentTrick}
        trickLeadPlayer={trickLeadPlayer}
        myIndex={myIndex}
        lastTrick={lastTrick}
        lastTrickWinner={lastTrickWinner}
        playerNames={playerNames}
      />

      {/* Exposure phase */}
      {state === 'exposing' && (
        <div className="exposure-overlay">
          <ExposurePanel
            hand={hand}
            exposedCards={myExposed}
            onExpose={handleExpose}
            onConfirm={handleConfirmExposure}
            confirmed={exposureConfirmed[myIndex]}
          />
        </div>
      )}

      {/* My hand */}
      {(state === 'playing' || state === 'exposing') && (
        <Hand
          cards={hand}
          legalPlays={state === 'playing' ? legalPlays : []}
          onPlayCard={handlePlayCard}
          isMyTurn={state === 'playing' && isMyTurn}
          exposedCards={myExposed}
        />
      )}

      {/* Scoreboard (collapsible) */}
      <div className="scoreboard-container">
        <ScoreBoard
          playerNames={playerNames}
          scores={scores}
          roundScores={roundScores}
          roundNumber={roundNumber}
        />
      </div>

      {/* Round end overlay */}
      {roundEndData && (
        <div className="overlay" onClick={onDismissRoundEnd}>
          <div className="overlay-content round-end-overlay" onClick={e => e.stopPropagation()}>
            <h2>📊 Round Complete!</h2>
            <table className="round-result-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Round Score</th>
                  <th>Total Score</th>
                </tr>
              </thead>
              <tbody>
                {roundEndData.playerNames.map((name, i) => (
                  <tr key={i}>
                    <td>{name}</td>
                    <td className={roundEndData.roundScores[i] >= 0 ? 'score-positive' : 'score-negative'}>
                      {roundEndData.roundScores[i] >= 0 ? '+' : ''}{roundEndData.roundScores[i]}
                    </td>
                    <td className={roundEndData.totalScores[i] >= 0 ? 'score-positive' : 'score-negative'}>
                      {roundEndData.totalScores[i]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="round-end-hint">Next round starting soon...</p>
            <button className="btn btn-primary" onClick={onDismissRoundEnd}>OK</button>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {gameOverData && (
        <div className="overlay">
          <div className="overlay-content game-over-overlay">
            <h2>🏆 Game Over!</h2>
            <div className="rankings">
              {gameOverData.rankings.map((playerIdx, rank) => (
                <div key={playerIdx} className={`ranking-row ranking-${rank + 1}`}>
                  <span className="rank-badge">
                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : '4th'}
                  </span>
                  <span className="rank-name">{gameOverData.playerNames[playerIdx]}</span>
                  <span className="rank-score">{gameOverData.scores[playerIdx]} pts</span>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-large" onClick={onDismissGameOver}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
