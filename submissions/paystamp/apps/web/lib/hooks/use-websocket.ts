import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWalletStore } from '@/stores/wallet-store';

// Use HTTP URL for Socket.IO (it handles protocol upgrade internally)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { stellarAddress } = useWalletStore();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Only connect if we have a wallet address
    if (!stellarAddress) {
      // Disconnect if wallet is disconnected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Don't reconnect if already connected
    if (socketRef.current?.connected) {
      return;
    }

    console.log('🔌 Connecting to WebSocket server...', API_URL);

    // Connect to Socket.IO server (use HTTP, not WS)
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket connected', socket.id);
      setIsConnected(true);
      setConnectionError(null);
      
      // Join user room after connection
      socket.emit('join:user', { userAddress: stellarAddress });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
      
      // In development, don't show errors if server isn't running
      if (process.env.NODE_ENV === 'development') {
        console.warn('WebSocket server may not be running. This is OK in development.');
      }
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionError(error.message || 'Unknown error');
    });

    // Cleanup on unmount or when wallet address changes
    return () => {
      if (socketRef.current) {
        console.log('🧹 Cleaning up WebSocket connection');
        socketRef.current.emit('leave:user', { userAddress: stellarAddress });
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [stellarAddress]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
  };
}
