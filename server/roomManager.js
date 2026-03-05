// Room Manager for GongZhu
const { v4: uuidv4 } = require('uuid');
const { GongzhuGame } = require('./gameEngine');
const { AIPlayer } = require('./aiPlayer');

class RoomManager {
  constructor() {
    this.rooms = new Map();    // roomId -> Room
    this.playerRooms = new Map(); // playerId -> roomId
  }

  createRoom(hostId, hostName, options = {}) {
    const roomId = uuidv4().slice(0, 8).toUpperCase();
    const room = {
      id: roomId,
      host: hostId,
      mode: options.mode || 'casual', // casual, ranked, ai
      aiDifficulty: options.aiDifficulty || 'normal',
      players: [{ id: hostId, name: hostName, ready: false, isAI: false }],
      game: null,
      aiPlayers: [],
      state: 'lobby', // lobby, playing
    };
    this.rooms.set(roomId, room);
    this.playerRooms.set(hostId, roomId);
    return room;
  }

  joinRoom(roomId, playerId, playerName) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.state !== 'lobby') return { error: 'Game already in progress' };
    if (room.players.length >= 4) return { error: 'Room is full' };
    if (room.players.some(p => p.id === playerId)) return { error: 'Already in room' };

    room.players.push({ id: playerId, name: playerName, ready: false, isAI: false });
    this.playerRooms.set(playerId, roomId);
    return { success: true, room };
  }

  leaveRoom(playerId) {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) {
      this.playerRooms.delete(playerId);
      return null;
    }

    room.players = room.players.filter(p => p.id !== playerId);
    this.playerRooms.delete(playerId);

    // If room is empty or host left, close room
    if (room.players.length === 0 || room.host === playerId) {
      // Clean up all remaining players
      for (const p of room.players) {
        this.playerRooms.delete(p.id);
      }
      this.rooms.delete(roomId);
      return { roomClosed: true, roomId };
    }

    return { roomClosed: false, room };
  }

  createAIRoom(playerId, playerName, difficulty = 'normal') {
    const room = this.createRoom(playerId, playerName, { mode: 'ai', aiDifficulty: difficulty });
    const aiNames = ['AI Alice', 'AI Bob', 'AI Carol'];
    const aiIds = [];

    for (let i = 0; i < 3; i++) {
      const aiId = `ai-${uuidv4().slice(0, 6)}`;
      aiIds.push(aiId);
      room.players.push({ id: aiId, name: aiNames[i], ready: true, isAI: true });
    }

    room.aiPlayers = aiIds.map(id => ({
      id,
      ai: new AIPlayer(difficulty),
    }));

    return room;
  }

  setReady(playerId, ready) {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return { error: 'Not in a room' };
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };

    const player = room.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found in room' };
    player.ready = ready;

    return { success: true, allReady: room.players.length === 4 && room.players.every(p => p.ready) };
  }

  startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.players.length !== 4) return { error: 'Need 4 players' };

    const game = new GongzhuGame(roomId);
    for (let i = 0; i < 4; i++) {
      game.addPlayer(room.players[i].id, room.players[i].name);
    }

    room.game = game;
    room.state = 'playing';
    game.startRound();

    return { success: true, game };
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getRoomByPlayer(playerId) {
    const roomId = this.playerRooms.get(playerId);
    return roomId ? this.rooms.get(roomId) : null;
  }

  listRooms() {
    const rooms = [];
    for (const [id, room] of this.rooms) {
      if (room.mode !== 'ai' && room.state === 'lobby') {
        rooms.push({
          id,
          host: room.players[0]?.name || 'Unknown',
          playerCount: room.players.filter(p => !p.isAI).length,
          mode: room.mode,
        });
      }
    }
    return rooms;
  }
}

module.exports = { RoomManager };
