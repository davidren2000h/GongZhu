import React, { useState } from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';
import { useGameSocket } from './hooks/useGameSocket';
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
  } = useGameSocket();

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
      {/* Connection status */}
      {!connected && (
        <div className="connection-banner">
          Connecting to server...
        </div>
      )}

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
          roomState={roomState}
          roomList={roomList}
          playerName={playerName}
          setPlayerName={setPlayerName}
        />
      )}
    </div>
  );
}
