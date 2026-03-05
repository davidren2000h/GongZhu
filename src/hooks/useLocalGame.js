// Local (offline) game controller for GongZhu — replaces WebSocket connection
// Runs the full game engine + AI in the browser for GitHub Pages deployment
import { useState, useCallback, useRef } from 'react';
import { GongzhuGame, cardId } from '../game/gameEngine.js';
import { AIPlayer } from '../game/aiPlayer.js';
import { isTestMode, getRng, TEST_AI_NAMES } from '../game/rng.js';

const AI_NAME_POOL = [
  'Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry',
  'Iris', 'Jack', 'Karen', 'Leo', 'Mia', 'Nathan', 'Olivia', 'Paul',
  'Quinn', 'Rachel', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xander',
  'Yara', 'Zane', 'Amber', 'Blake', 'Chloe', 'Dylan', 'Elena', 'Felix',
  'Gina', 'Hugo', 'Ivy', 'Jason', 'Kelly', 'Liam', 'Nina', 'Oscar',
  'Penny', 'Reed', 'Stella', 'Troy', 'Violet', 'Wade', 'Zoe', 'Aria',
];

function pickRandomNames(count, exclude = '') {
  if (isTestMode()) {
    return TEST_AI_NAMES.slice(0, count);
  }
  const available = AI_NAME_POOL.filter(n => n.toLowerCase() !== exclude.toLowerCase());
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function useLocalGame() {
  const [gameState, setGameState] = useState(null);
  const [legalPlays, setLegalPlays] = useState([]);
  const [roundEndData, setRoundEndData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [error, setError] = useState(null);

  const gameRef = useRef(null);
  const aiPlayersRef = useRef([]);
  const playerIndexRef = useRef(0); // human is always seat 0
  const timersRef = useRef([]);

  const clearTimers = () => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  };

  const addTimer = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  };

  const updateState = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    const myIdx = playerIndexRef.current;
    const state = game.getStateForPlayer(myIdx);
    const plays = game.getLegalPlays(myIdx).map(c => cardId(c));
    setGameState(state);
    setLegalPlays(plays);
  }, []);

  // Process AI turns recursively with delays
  const processAITurns = useCallback(() => {
    const game = gameRef.current;
    if (!game || game.state !== 'playing') return;

    const currentPlayer = game.currentPlayerTurn;
    const myIdx = playerIndexRef.current;
    if (currentPlayer === myIdx) {
      // Human's turn — just update state
      updateState();
      return;
    }

    // Find the AI for this seat
    const aiEntry = aiPlayersRef.current.find(a => a.seatIndex === currentPlayer);
    if (!aiEntry) return;

    addTimer(() => {
      const legalPlays = game.getLegalPlays(currentPlayer);
      if (legalPlays.length === 0) return;

      const chosenCard = aiEntry.ai.chooseCard(game.getStateForPlayer(currentPlayer), legalPlays);
      if (!chosenCard) return;

      const result = game.playCard(currentPlayer, chosenCard.suit, chosenCard.rank);
      if (result.error) {
        console.error(`AI error: ${result.error}`);
        return;
      }

      updateState();

      if (result.trickComplete && result.roundComplete) {
        if (result.gameOver) {
          const rankings = [0, 1, 2, 3].sort((a, b) => game.scores[b] - game.scores[a]);
          setGameOverData({
            rankings,
            scores: [...game.scores],
            playerNames: [...game.playerNames],
          });
        } else {
          setRoundEndData({
            roundScores: result.roundScores,
            totalScores: result.totalScores,
            playerNames: [...game.playerNames],
          });
          addTimer(() => {
            game.startRound();
            processAIExposure();
            updateState();
          }, isTestMode() ? 10 : 3000);
        }
      } else if (result.trickComplete) {
        // Show the completed trick briefly
        addTimer(() => {
          game.advanceToNextTrick();
          updateState();
          processAITurns();
        }, isTestMode() ? 10 : 1200);
      } else {
        processAITurns();
      }
    }, isTestMode() ? 10 : (400 + Math.random() * 400));
  }, [updateState]);

  const processAIExposure = useCallback(() => {
    const game = gameRef.current;
    if (!game || game.state !== 'exposing') return;

    for (const aiEntry of aiPlayersRef.current) {
      const idx = aiEntry.seatIndex;
      const hand = game.hands[idx];
      const exposures = aiEntry.ai.decideExposure(hand, idx);
      if (exposures.length > 0) {
        game.exposeCards(idx, exposures);
      }
      game.confirmExposure(idx);
    }
  }, []);

  // The send function mimics the WebSocket send interface
  const send = useCallback((msg) => {
    const game = gameRef.current;
    const myIdx = playerIndexRef.current;

    switch (msg.type) {
      case 'createAIGame': {
        clearTimers();
        const difficulty = msg.difficulty || 'normal';
        const playerName = msg.playerName || 'Player';
        const aiNames = pickRandomNames(3, playerName);
        const rng = isTestMode() ? getRng() : null;

        const newGame = new GongzhuGame('local', rng);
        newGame.addPlayer('human', playerName);
        for (let i = 0; i < 3; i++) {
          newGame.addPlayer(`ai-${i}`, aiNames[i]);
        }

        gameRef.current = newGame;
        playerIndexRef.current = 0;
        aiPlayersRef.current = [
          { seatIndex: 1, ai: new AIPlayer(difficulty) },
          { seatIndex: 2, ai: new AIPlayer(difficulty) },
          { seatIndex: 3, ai: new AIPlayer(difficulty) },
        ];

        newGame.startRound();
        processAIExposure();
        updateState();
        setRoundEndData(null);
        setGameOverData(null);
        break;
      }

      case 'expose': {
        if (!game) break;
        const result = game.exposeCards(myIdx, msg.cards || []);
        if (result.error) {
          setError(result.error);
          addTimer(() => setError(null), 3000);
        }
        break;
      }

      case 'confirmExposure': {
        if (!game) break;
        const result = game.confirmExposure(myIdx);
        if (result.error) {
          setError(result.error);
          addTimer(() => setError(null), 3000);
          break;
        }
        updateState();

        if (result.allConfirmed && game.state === 'playing') {
          processAITurns();
        }
        break;
      }

      case 'playCard': {
        if (!game) break;
        const result = game.playCard(myIdx, msg.suit, msg.rank);
        if (result.error) {
          setError(result.error);
          addTimer(() => setError(null), 3000);
          break;
        }

        updateState();

        if (result.trickComplete && result.roundComplete) {
          if (result.gameOver) {
            const rankings = [0, 1, 2, 3].sort((a, b) => game.scores[b] - game.scores[a]);
            setGameOverData({
              rankings,
              scores: [...game.scores],
              playerNames: [...game.playerNames],
            });
          } else {
            setRoundEndData({
              roundScores: result.roundScores,
              totalScores: result.totalScores,
              playerNames: [...game.playerNames],
            });
            addTimer(() => {
              game.startRound();
              processAIExposure();
              updateState();
            }, isTestMode() ? 10 : 3000);
          }
        } else if (result.trickComplete) {
          addTimer(() => {
            game.advanceToNextTrick();
            updateState();
            processAITurns();
          }, isTestMode() ? 10 : 1200);
        } else {
          processAITurns();
        }
        break;
      }

      case 'newGame': {
        // Restart with same settings
        if (game) {
          clearTimers();
          const playerName = game.playerNames[0];
          const difficulty = aiPlayersRef.current[0]?.ai.difficulty || 'normal';
          send({ type: 'createAIGame', playerName, difficulty });
        }
        break;
      }

      default:
        break;
    }
  }, [updateState, processAITurns, processAIExposure]);

  return {
    connected: true, // always "connected" in local mode
    playerId: 'human',
    gameState,
    legalPlays,
    roomState: null,
    roomList: [],
    error,
    roundEndData,
    gameOverData,
    send,
    setRoundEndData,
    setGameOverData,
  };
}
