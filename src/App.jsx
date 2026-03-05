import React, { useState } from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';
import { useGameSocket } from './hooks/useGameSocket';
import { useLocalGame } from './hooks/useLocalGame';
import { isTestMode } from './game/rng';
import './App.css';

function useGameHook() {
  // In test mode or when running locally without server, use local game
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const forceLocal = isTestMode() || (params && params.get('local') === '1');
  const local = useLocalGame();
  const socket = useGameSocket();
  return forceLocal ? local : socket;
}

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
  } = useGameHook();

  const [playerName, setPlayerName] = useState('');

  const isInGame = gameState && (gameState.state === 'playing' || gameState.state === 'exposing');

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
