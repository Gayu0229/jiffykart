/// <reference types="vite/client" />
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const createSocketClient = (onMessageReceived: (topic: string, body: any) => void) => {
    const token = localStorage.getItem('jiffykart_token');

    // Don't attempt WebSocket connection without authentication
    if (!token) {
        console.warn('[Socket] No auth token found. Skipping WebSocket connection.');
        // Return a no-op client that can be safely deactivated
        return {
            deactivate: () => Promise.resolve(),
            activate: () => {},
            active: false,
        } as unknown as Client;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
    console.log('[Socket] Connecting to:', wsUrl);

    const socket = new SockJS(wsUrl);
    const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },
        onConnect: () => {
            console.log('Connected to WebSocket (User Website)');

            // Shared notifications
            client.subscribe('/topic/notifications', (message) => {
                onMessageReceived('/topic/notifications', JSON.parse(message.body));
            });

            // User-specific notifications
            client.subscribe('/user/queue/notifications', (message) => {
                onMessageReceived('/user/queue/notifications', JSON.parse(message.body));
            });
        },
        onStompError: (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        },
    });

    client.activate();
    return client;
};
