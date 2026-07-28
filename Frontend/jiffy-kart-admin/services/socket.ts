/// <reference types="vite/client" />
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const createSocketClient = (onMessageReceived: (topic: string, body: any) => void) => {
    let wsUrl = (import.meta as any).env?.VITE_WS_URL || 'http://localhost:8080/ws';
    
    // Rewrite protocol to secure if page is HTTPS
    // if (window.location.protocol === 'https:') {
    //     wsUrl = wsUrl.replace(/^http:/i, 'https:');
    // }
    
    // const socket = new SockJS(wsUrl, null, {
    //     insecureAllowed: true
    // });
        const socketUrl = wsUrl.replace(/^http/i, 'ws');

    const client = new Client({
        brokerURL: socketUrl,
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
