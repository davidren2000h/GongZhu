// WebSocket hook for GongZhu
import { useState, useEffect, useRef, useCallback } from 'react';

export function useGameSocket() {
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [legalPlays, setLegalPlays] = useState([]);
  const [roomState, setRoomState] = useState(null);
  const [roomList, setRoomList] = useState([]);
  const [error, setError] = useState(null);
  const [roundEndData, setRoundEndData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const connect = useCallback(() => {
    let wsUrl;
    if (import.meta.env.DEV) {
      // In dev mode, connect directly to the backend server
      wsUrl = `ws://${window.location.hostname}:3001/ws`;
    } else {
      // In production, connect to the same host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after delay
      reconnectTimerRef.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      setError('Connection error');
    };
  }, []);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'connected':
        setPlayerId(msg.playerId);
        break;
      case 'roomJoined':
      case 'roomUpdate':
        setRoomState(msg.roomState);
        setRoundEndData(null);
        setGameOverData(null);
        break;
      case 'roomLeft':
        setRoomState(null);
        setGameState(null);
        setLegalPlays([]);
        setRoundEndData(null);
        setGameOverData(null);
        break;
      case 'gameState':
        setGameState(msg.state);
        setLegalPlays(msg.legalPlays || []);
        break;
      case 'roundEnd':
        setRoundEndData(msg);
        break;
      case 'gameOver':
        setGameOverData(msg);
        break;
      case 'roomList':
        setRoomList(msg.rooms);
        break;
      case 'error':
        setError(msg.message);
        setTimeout(() => setError(null), 3000);
        break;
      case 'playerLeft':
        setRoomState(msg.roomState);
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connect]);

  const send = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return {
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
  };
}
