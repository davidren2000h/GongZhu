import React, { useState } from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';
import { useLocalGame } from './hooks/useLocalGame';
import './App.css';

export default function App() {
  const {
    connected,
    playerId,
    gameState,
    legalPlays,
    roomState,
    roomList,
    error,
    roundEndData,
    gameOverData,
    send,
    setRoundEndData,
    setGameOverData,
  } = useLocalGame();

  const [playerName, setPlayerName] = useState('');

  const isInGame = gameState && (gameState.state === 'playing' || gameState.state === 'exposing' || gameState.state === 'roundEnd');

  const handleDismissRoundEnd = () => {
    setRoundEndData(null);
  };

  const handleDismissGameOver = () => {
    setGameOverData(null);
    send({ type: 'newGame' });
  };

  return (
    <div className="app">
      {/* Error toast */}
      {error && (
        <div className="error-toast">
          ⚠️ {error}
        </div>
      )}

      {/* Main content */}
      {isInGame ? (
        <Game
          gameState={gameState}
          legalPlays={legalPlays}
          send={send}
          roundEndData={roundEndData}
          gameOverData={gameOverData}
          onDismissRoundEnd={handleDismissRoundEnd}
          onDismissGameOver={handleDismissGameOver}
        />
      ) : (
        <Lobby
          send={send}
          playerName={playerName}
          setPlayerName={setPlayerName}
        />
      )}
    </div>
  );
}
