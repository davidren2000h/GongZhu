import React, { useState } from 'react';

export default function Lobby({ send, playerName, setPlayerName }) {
  const [difficulty, setDifficulty] = useState('normal');
  const [nameInput, setNameInput] = useState(playerName || '');

  const handleSetName = () => {
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
    }
  };

  if (!playerName) {
    return (
      <div className="lobby">
        <div className="lobby-header">
          <h1>🐷 拱猪 GongZhu</h1>
          <p className="subtitle">Chinese Hearts Card Game</p>
        </div>
        <div className="name-entry">
          <h2>Enter Your Name</h2>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetName()}
            placeholder="Your nickname..."
            maxLength={16}
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleSetName}>
            Play →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby">
      <div className="lobby-header">
        <h1>🐷 拱猪 GongZhu</h1>
        <p className="subtitle">Chinese Hearts Card Game</p>
        <p className="welcome">Welcome, <strong>{playerName}</strong></p>
      </div>

      <div className="lobby-content">
        <div className="lobby-ai">
          <h2>🤖 Play vs AI</h2>
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
          >
            🎮 Start Game
          </button>
        </div>
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
