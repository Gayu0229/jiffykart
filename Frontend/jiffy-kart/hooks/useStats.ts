import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

export interface Stats {
  verifiedSellers: number;
  avgDeliveryMins: number;
  citiesLive: number;
  userRating: number;
}

export const useStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/public/stats`);
      setStats(response.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      // Don't set loading to false if we haven't succeeded yet, 
      // unless we want to show last known values which are null initially.
      if (!stats) {
        setError('Failed to load stats');
        setLoading(false);
      }
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    console.log('Starting stats polling fallback...');
    pollingIntervalRef.current = window.setInterval(fetchStats, 30000); // 30 seconds
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    fetchStats();

    const socket = new SockJS(WS_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('Connected to Stats WebSocket');
      stopPolling(); // WebSocket connected, stop polling
      client.subscribe('/topic/public-stats', (message) => {
        const newStats = JSON.parse(message.body);
        setStats(newStats);
      });
    };

    client.onWebSocketError = (error) => {
      console.error('Stats WebSocket error:', error);
      startPolling(); // WebSocket error, start polling fallback
    };

    client.onStompError = (frame) => {
      console.error('Stats STOMP error:', frame.headers['message']);
      startPolling();
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
      stopPolling();
    };
  }, []);

  return { stats, loading, error };
};
