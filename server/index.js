// GongZhu Server — Express + WebSocket
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { RoomManager } = require('./roomManager');
const { cardId } = require('./gameEngine');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 3001;
const roomManager = new RoomManager();
const clients = new Map(); // playerId -> ws

// Serve static files in production
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Send JSON to a specific player
function sendTo(playerId, msg) {
  const ws = clients.get(playerId);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(msg));
  }
}

// Broadcast to all players in a room
function broadcastToRoom(room, msg, excludeId = null) {
  for (const p of room.players) {
    if (p.id !== excludeId && !p.isAI) {
      sendTo(p.id, msg);
    }
  }
}

// Send game state to all human players
function sendGameStateToAll(room) {
  if (!room.game) return;
  for (const p of room.players) {
    if (!p.isAI) {
      const idx = room.game.getPlayerIndex(p.id);
      sendTo(p.id, {
        type: 'gameState',
        state: room.game.getStateForPlayer(idx),
        legalPlays: room.game.getLegalPlays(idx).map(c => cardId(c)),
      });
    }
  }
}

// Process AI turns
function processAITurns(room) {
  if (!room.game || room.game.state !== 'playing') return;

  const game = room.game;
  const currentPlayer = game.currentPlayerTurn;
  const currentPlayerId = game.players[currentPlayer];
  const aiEntry = room.aiPlayers.find(a => a.id === currentPlayerId);

  if (!aiEntry) return; // Not an AI's turn

  // Add delay for natural feel
  setTimeout(() => {
    const legalPlays = game.getLegalPlays(currentPlayer);
    if (legalPlays.length === 0) return;

    const chosenCard = aiEntry.ai.chooseCard(game.getStateForPlayer(currentPlayer), legalPlays);
    if (!chosenCard) return;

    const result = game.playCard(currentPlayer, chosenCard.suit, chosenCard.rank);

    if (result.error) {
      console.error(`AI error: ${result.error}`);
      return;
    }

    // Send updated state to all human players
    sendGameStateToAll(room);

    if (result.trickComplete && result.roundComplete) {
      if (result.gameOver) {
        broadcastToRoom(room, {
          type: 'gameOver',
          rankings: result.rankings,
          scores: result.totalScores,
          playerNames: game.playerNames,
        });
      } else {
        // Send round results then start new round after delay
        broadcastToRoom(room, {
          type: 'roundEnd',
          roundScores: result.roundScores,
          totalScores: result.totalScores,
          playerNames: game.playerNames,
        });
        setTimeout(() => {
          game.startRound();
          // AI exposure
          processAIExposure(room);
          sendGameStateToAll(room);
        }, 3000);
      }
    } else if (result.trickComplete) {
      // Brief pause showing all 4 cards, then advance
      setTimeout(() => {
        game.advanceToNextTrick();
        sendGameStateToAll(room);
        processAITurns(room);
      }, 1200);
    } else {
      // Next turn — may be another AI
      processAITurns(room);
    }
  }, 500 + Math.random() * 500);
}

// Process AI exposure decisions
function processAIExposure(room) {
  if (!room.game || room.game.state !== 'exposing') return;

  for (const aiEntry of room.aiPlayers) {
    const idx = room.game.getPlayerIndex(aiEntry.id);
    if (idx === -1) continue;

    const hand = room.game.hands[idx];
    const exposures = aiEntry.ai.decideExposure(hand, idx);
    if (exposures.length > 0) {
      room.game.exposeCards(idx, exposures);
    }
    room.game.confirmExposure(idx);
  }
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const playerId = uuidv4();
  clients.set(playerId, ws);

  sendTo(playerId, { type: 'connected', playerId });

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    handleMessage(playerId, msg, ws);
  });

  ws.on('close', () => {
    const result = roomManager.leaveRoom(playerId);
    if (result && !result.roomClosed && result.room) {
      broadcastToRoom(result.room, {
        type: 'playerLeft',
        roomState: getRoomLobbyState(result.room),
      });
    }
    clients.delete(playerId);
  });
});

function getRoomLobbyState(room) {
  return {
    id: room.id,
    mode: room.mode,
    players: room.players.map(p => ({
      name: p.name,
      ready: p.ready,
      isAI: p.isAI,
      isHost: p.id === room.host,
    })),
    state: room.state,
  };
}

function handleMessage(playerId, msg, ws) {
  switch (msg.type) {
    case 'setName': {
      // Just acknowledge — name is provided on join
      sendTo(playerId, { type: 'nameSet', name: msg.name });
      break;
    }

    case 'listRooms': {
      sendTo(playerId, { type: 'roomList', rooms: roomManager.listRooms() });
      break;
    }

    case 'createRoom': {
      const room = roomManager.createRoom(playerId, msg.playerName || 'Player', { mode: msg.mode || 'casual' });
      sendTo(playerId, {
        type: 'roomJoined',
        roomState: getRoomLobbyState(room),
      });
      break;
    }

    case 'joinRoom': {
      const result = roomManager.joinRoom(msg.roomId, playerId, msg.playerName || 'Player');
      if (result.error) {
        sendTo(playerId, { type: 'error', message: result.error });
      } else {
        broadcastToRoom(result.room, {
          type: 'roomUpdate',
          roomState: getRoomLobbyState(result.room),
        });
      }
      break;
    }

    case 'leaveRoom': {
      const result = roomManager.leaveRoom(playerId);
      sendTo(playerId, { type: 'roomLeft' });
      if (result && !result.roomClosed && result.room) {
        broadcastToRoom(result.room, {
          type: 'roomUpdate',
          roomState: getRoomLobbyState(result.room),
        });
      }
      break;
    }

    case 'createAIGame': {
      const room = roomManager.createAIRoom(playerId, msg.playerName || 'Player', msg.difficulty || 'normal');
      sendTo(playerId, {
        type: 'roomJoined',
        roomState: getRoomLobbyState(room),
      });
      break;
    }

    case 'setReady': {
      const result = roomManager.setReady(playerId, msg.ready !== false);
      if (result.error) {
        sendTo(playerId, { type: 'error', message: result.error });
        break;
      }
      const room = roomManager.getRoomByPlayer(playerId);
      if (room) {
        broadcastToRoom(room, {
          type: 'roomUpdate',
          roomState: getRoomLobbyState(room),
        });

        if (result.allReady) {
          const startResult = roomManager.startGame(room.id);
          if (startResult.success) {
            processAIExposure(room);
            sendGameStateToAll(room);
          }
        }
      }
      break;
    }

    case 'startGame': {
      const room = roomManager.getRoomByPlayer(playerId);
      if (!room) {
        sendTo(playerId, { type: 'error', message: 'Not in a room' });
        break;
      }
      if (room.host !== playerId) {
        sendTo(playerId, { type: 'error', message: 'Only host can start' });
        break;
      }
      // For AI games, auto-start
      if (room.mode === 'ai') {
        const result = roomManager.startGame(room.id);
        if (result.error) {
          sendTo(playerId, { type: 'error', message: result.error });
        } else {
          processAIExposure(room);
          sendGameStateToAll(room);
        }
      }
      break;
    }

    case 'expose': {
      const room = roomManager.getRoomByPlayer(playerId);
      if (!room || !room.game) break;
      const idx = room.game.getPlayerIndex(playerId);
      if (idx === -1) break;

      const result = room.game.exposeCards(idx, msg.cards || []);
      if (result.error) {
        sendTo(playerId, { type: 'error', message: result.error });
      }
      break;
    }

    case 'confirmExposure': {
      const room = roomManager.getRoomByPlayer(playerId);
      if (!room || !room.game) break;
      const idx = room.game.getPlayerIndex(playerId);
      if (idx === -1) break;

      const result = room.game.confirmExposure(idx);
      if (result.error) {
        sendTo(playerId, { type: 'error', message: result.error });
        break;
      }

      sendGameStateToAll(room);

      // If all confirmed and now playing, start AI turns if needed
      if (result.allConfirmed && room.game.state === 'playing') {
        processAITurns(room);
      }
      break;
    }

    case 'playCard': {
      const room = roomManager.getRoomByPlayer(playerId);
      if (!room || !room.game) break;
      const idx = room.game.getPlayerIndex(playerId);
      if (idx === -1) break;

      const result = room.game.playCard(idx, msg.suit, msg.rank);
      if (result.error) {
        sendTo(playerId, { type: 'error', message: result.error });
        break;
      }

      sendGameStateToAll(room);

      if (result.trickComplete && result.roundComplete) {
        if (result.gameOver) {
          broadcastToRoom(room, {
            type: 'gameOver',
            rankings: result.rankings,
            scores: result.totalScores,
            playerNames: room.game.playerNames,
          });
        } else {
          broadcastToRoom(room, {
            type: 'roundEnd',
            roundScores: result.roundScores,
            totalScores: result.totalScores,
            playerNames: room.game.playerNames,
          });
          // Auto-start next round after delay
          setTimeout(() => {
            room.game.startRound();
            processAIExposure(room);
            sendGameStateToAll(room);
          }, 3000);
        }
      } else if (result.trickComplete) {
        // Show all 4 cards for a moment, then advance
        setTimeout(() => {
          room.game.advanceToNextTrick();
          sendGameStateToAll(room);
          processAITurns(room);
        }, 1200);
      } else {
        // Process AI turns if next is AI
        processAITurns(room);
      }
      break;
    }

    case 'newGame': {
      const room = roomManager.getRoomByPlayer(playerId);
      if (!room) break;
      room.state = 'lobby';
      room.game = null;
      for (const p of room.players) {
        if (!p.isAI) p.ready = false;
        else p.ready = true;
      }
      broadcastToRoom(room, {
        type: 'roomUpdate',
        roomState: getRoomLobbyState(room),
      });
      break;
    }

    default:
      sendTo(playerId, { type: 'error', message: 'Unknown message type' });
  }
}

server.listen(PORT, () => {
  console.log(`GongZhu server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
