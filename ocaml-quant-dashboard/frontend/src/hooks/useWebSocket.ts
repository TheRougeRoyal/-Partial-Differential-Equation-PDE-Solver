// WebSocket hook for live updates

import { useState, useEffect, useCallback, useRef } from 'react';
import type { LiveUpdate } from '../types';

interface UseWebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  connected: boolean;
  lastMessage: LiveUpdate | null;
  messages: LiveUpdate[];
  error: string | null;
  reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = `ws://${window.location.hostname}:3001/ws/live`,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options;

  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<LiveUpdate | null>(null);
  const [messages, setMessages] = useState<LiveUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as LiveUpdate;
          if (data.type === 'prediction_update' || data.type === 'greek_update') {
            setLastMessage(data);
            setMessages((prev: LiveUpdate[]) => [...prev.slice(-99), data]); // Keep last 100 messages
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(() => {
            console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
            connect();
          }, reconnectInterval);
        } else {
          setError('Max reconnection attempts reached');
        }
      };

      wsRef.current.onerror = (event: Event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      setError((e as Error).message);
    }
  }, [url, reconnectInterval, maxReconnectAttempts]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = 0;
    wsRef.current?.close();
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    connected,
    lastMessage,
    messages,
    error,
    reconnect,
  };
}
