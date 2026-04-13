import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { WSEvents } from '../types';

export function useWebSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const newSocket = io('https://smart-parking-backend-1p4n.onrender.com', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('WebSocket connected');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const subscribe = useCallback(
        <K extends keyof WSEvents>(event: K, callback: (data: WSEvents[K]) => void) => {
            if (socket) {
                socket.on(event, callback as any);
            }
            return () => {
                if (socket) {
                    socket.off(event, callback as any);
                }
            };
        },
        [socket]
    );

    const emit = useCallback(
        (event: string, data?: any) => {
            if (socket && connected) {
                socket.emit(event, data);
            }
        },
        [socket, connected]
    );

    return { socket, connected, subscribe, emit };
}
