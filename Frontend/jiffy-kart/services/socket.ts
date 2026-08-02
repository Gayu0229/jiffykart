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

    let wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
    console.log('[Socket] Connecting to:', wsUrl);

    if (window.location.protocol === 'https:' && wsUrl.startsWith('http://')) {
        if (window.location.hostname.includes('jiffykart.in')) {
            wsUrl = 'https://api.jiffykart.in/ws';
        } else {
            wsUrl = wsUrl.replace('http://', 'https://');
        }
        console.log('[Socket] Upgraded WS URL to secure protocol:', wsUrl);
    }

    let socket;
    try {
        socket = new SockJS(wsUrl);
    } catch (e) {
        console.error('[Socket] Failed to initialize SockJS:', e);
        return {
            deactivate: () => Promise.resolve(),
            activate: () => {},
            active: false,
        } as unknown as Client;
    }
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
