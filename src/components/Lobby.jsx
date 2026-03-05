import React, { useState } from 'react';

export default function Lobby({ send, roomState, roomList, playerName, setPlayerName }) {
  const [tab, setTab] = useState('ai'); // 'ai', 'casual', 'join'
  const [joinCode, setJoinCode] = useState('');
  const [difficulty, setDifficulty] = useState('normal');
  const [nameInput, setNameInput] = useState(playerName || '');

  const handleSetName = () => {
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
    }
  };

  if (!playerName) {
    return (
      <div className="lobby" data-testid="lobby">
        <div className="lobby-header">
          <h1>🐷 拱猪 GongZhu Online</h1>
          <p className="subtitle">Chinese Hearts Card Game</p>
        </div>
        <div className="name-entry" data-testid="name-entry">
          <h2>Enter Your Name</h2>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetName()}
            placeholder="Your nickname..."
            maxLength={16}
            autoFocus
            data-testid="name-input"
          />
          <button className="btn btn-primary" onClick={handleSetName} data-testid="name-submit">
            Play →
          </button>
        </div>
      </div>
    );
  }

  // In a room lobby
  if (roomState) {
    return (
      <div className="lobby">
        <div className="lobby-header">
          <h1>🐷 拱猪 GongZhu</h1>
        </div>
        <div className="room-lobby">
          <h2>Room: {roomState.id}</h2>
          <div className="room-mode">Mode: {roomState.mode === 'ai' ? '🤖 AI Practice' : '🎮 ' + roomState.mode}</div>

          <div className="room-players">
            {roomState.players.map((p, i) => (
              <div key={i} className={`room-player ${p.ready ? 'player-ready' : ''}`}>
                <span className="player-seat">Seat {i + 1}</span>
                <span className="player-name-lobby">
                  {p.isAI ? '🤖 ' : ''}{p.name}
                  {p.isHost ? ' 👑' : ''}
                </span>
                <span className={`player-status ${p.ready ? 'ready' : 'waiting'}`}>
                  {p.ready ? '✓ Ready' : '⏳ Waiting'}
                </span>
              </div>
            ))}
            {Array.from({ length: 4 - roomState.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="room-player room-player-empty">
                <span className="player-seat">Seat {roomState.players.length + i + 1}</span>
                <span className="player-name-lobby">Empty</span>
              </div>
            ))}
          </div>

          <div className="room-actions">
            {roomState.mode === 'ai' ? (
              <button className="btn btn-primary btn-large" onClick={() => send({ type: 'startGame' })}>
                🎮 Start Game
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => send({ type: 'setReady', ready: true })}
              >
                ✓ Ready
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => send({ type: 'leaveRoom' })}>
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main lobby
  return (
    <div className="lobby">
      <div className="lobby-header">
        <h1>🐷 拱猪 GongZhu Online</h1>
        <p className="subtitle">Chinese Hearts Card Game</p>
        <p className="welcome">Welcome, <strong>{playerName}</strong></p>
      </div>

      <div className="lobby-tabs">
        <button
          className={`tab ${tab === 'ai' ? 'tab-active' : ''}`}
          onClick={() => setTab('ai')}
        >
          🤖 AI Practice
        </button>
        <button
          className={`tab ${tab === 'casual' ? 'tab-active' : ''}`}
          onClick={() => setTab('casual')}
        >
          🎮 Casual
        </button>
        <button
          className={`tab ${tab === 'join' ? 'tab-active' : ''}`}
          onClick={() => { setTab('join'); send({ type: 'listRooms' }); }}
        >
          🚪 Join Room
        </button>
      </div>

      <div className="lobby-content">
        {tab === 'ai' && (
          <div className="lobby-ai">
            <h2>Play vs AI</h2>
            <p>Practice against computer opponents.</p>
            <div className="difficulty-select">
              <label>Difficulty:</label>
              <div className="difficulty-options">
                {['easy', 'normal', 'hard'].map(d => (
                  <button
                    key={d}
                    className={`btn btn-difficulty ${difficulty === d ? 'btn-active' : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d === 'easy' ? '🟢 Easy' : d === 'normal' ? '🟡 Normal' : '🔴 Hard'}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn btn-primary btn-large"
              onClick={() => send({ type: 'createAIGame', playerName, difficulty })}
              data-testid="start-ai-game"
            >
              🎮 Start AI Game
            </button>
          </div>
        )}

        {tab === 'casual' && (
          <div className="lobby-casual">
            <h2>Create Room</h2>
            <p>Create a room and invite friends by sharing the room code.</p>
            <button
              className="btn btn-primary btn-large"
              onClick={() => send({ type: 'createRoom', playerName, mode: 'casual' })}
            >
              ✨ Create Room
            </button>
          </div>
        )}

        {tab === 'join' && (
          <div className="lobby-join">
            <h2>Join Room</h2>
            <div className="join-code">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Room code..."
                maxLength={8}
              />
              <button
                className="btn btn-primary"
                onClick={() => joinCode && send({ type: 'joinRoom', roomId: joinCode, playerName })}
              >
                Join
              </button>
            </div>

            <h3>Open Rooms</h3>
            <div className="room-list">
              {roomList.length === 0 ? (
                <p className="no-rooms">No open rooms. Create one!</p>
              ) : (
                roomList.map(room => (
                  <div key={room.id} className="room-list-item">
                    <span className="room-id">{room.id}</span>
                    <span className="room-host">Host: {room.host}</span>
                    <span className="room-count">{room.playerCount}/4</span>
                    <button
                      className="btn btn-small"
                      onClick={() => send({ type: 'joinRoom', roomId: room.id, playerName })}
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="lobby-footer">
        <div className="rules-summary">
          <h3>📜 Quick Rules</h3>
          <ul>
            <li><strong>♠Q (Pig)</strong>: −100 points</li>
            <li><strong>♦J (Goat)</strong>: +100 points</li>
            <li><strong>♣10 (Transformer)</strong>: doubles score or +50 alone</li>
            <li><strong>♥ Hearts</strong>: −200 total (A=−50, K=−40, Q=−30, J=−20, 10–5=−10)</li>
            <li><strong>Shoot the Moon</strong>: All 13 hearts = +200, with ♠Q = +300</li>
            <li><strong>Expose</strong>: Double a card's effect (♠Q, ♦J, ♣10, ♥A)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
