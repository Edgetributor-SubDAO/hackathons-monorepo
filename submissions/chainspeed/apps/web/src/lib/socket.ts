// Socket.io client for real-time test updates
import { io, Socket } from 'socket.io-client';
import {
    TestProgressEvent,
    TestResultEvent,
    TestCompleteEvent,
    TestErrorEvent,
} from '@chainspeed/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(API_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket?.id);
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error);
        });
    }

    return socket;
}

export function getSocketId(): string | undefined {
    return socket?.id;
}

export function joinTestRoom(testId: string): void {
    if (socket) {
        socket.emit('join:test', testId);
    }
}

export function onProgress(callback: (event: TestProgressEvent) => void): () => void {
    const socket = getSocket();
    socket.on('test:progress', callback);
    return () => socket.off('test:progress', callback);
}

export function onResult(callback: (event: TestResultEvent) => void): () => void {
    const socket = getSocket();
    socket.on('test:result', callback);
    return () => socket.off('test:result', callback);
}

export function onComplete(callback: (event: TestCompleteEvent) => void): () => void {
    const socket = getSocket();
    socket.on('test:complete', callback);
    return () => socket.off('test:complete', callback);
}

export function onError(callback: (event: TestErrorEvent) => void): () => void {
    const socket = getSocket();
    socket.on('test:error', callback);
    return () => socket.off('test:error', callback);
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
