/// <reference types="vite/client" />
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const createSocketClient = (onMessageReceived: (topic: string, body: any) => void) => {
    const socket = new SockJS((import.meta as any).env?.VITE_WS_URL || 'http://localhost:8080/ws');
    const client = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
            console.log('Connected to WebSocket (Admin)');

            // Shared notifications
            client.subscribe('/topic/notifications', (message) => {
                onMessageReceived('/topic/notifications', JSON.parse(message.body));
            });

            // User-specific notifications
            client.subscribe('/user/queue/notifications', (message) => {
                onMessageReceived('/user/queue/notifications', JSON.parse(message.body));
            });

            // Admin alerts
            client.subscribe('/topic/admin', (message) => {
                onMessageReceived('/topic/admin', JSON.parse(message.body));
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
