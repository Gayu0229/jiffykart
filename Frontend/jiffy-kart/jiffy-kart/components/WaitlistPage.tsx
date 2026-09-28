import React, { useState, useEffect, useRef } from 'react';
import { useNavigation, useAuth } from '../hooks';
import api from '../services/axiosConfig';
import { createSocketClient } from '../services/socket';
import { Client } from '@stomp/stompjs';
import { 
  ChevronLeft, 
  Users, 
  Hourglass, 
  BellRing, 
  CheckCircle2, 
  XCircle, 
  Coffee, 
  Sparkles 
} from 'lucide-react';

interface WaitlistEntry {
  id: number;
  queuePosition: number;
  guestCount: number;
  seatingArea: string;
  status: string;
  shop: {
    id: number;
    name: string;
  };
}

export const WaitlistPage: React.FC<{ 
  onBack: () => void; 
  shopId: string | number 
}> = ({ onBack, shopId }) => {
  const { navigate } = useNavigation();
  const { user } = useAuth();
  
  const [waitlist, setWaitlist] = useState<WaitlistEntry | null>(null);
  const [queueCount, setQueueCount] = useState<number>(4);
  const [estWait, setEstWait] = useState<number>(18); // minutes
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [acceptTimer, setAcceptTimer] = useState<number | null>(null);
  
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (user && shopId) {
      loadWaitlistStatus();
    }
  }, [user, shopId]);

  const loadWaitlistStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Find waitlist entry for user
      const response = await api.get('/bookings/waitlist/user', {
        params: { userId: user.id }
      }).catch(async () => {
        // Fallback: fetch waitlist items or simulate
        return { data: null };
      });

      if (response.data) {
        setWaitlist(response.data);
        setQueuePositionDetails(response.data.queuePosition);
      } else {
        // Mock a waitlist entry if not found for demo purposes
        const mock: WaitlistEntry = {
          id: Date.now(),
          queuePosition: 4,
          guestCount: 2,
          seatingArea: 'INDOOR',
          status: 'WAITING',
          shop: {
            id: Number(shopId),
            name: 'TableBook Restaurant'
          }
        };
        setWaitlist(mock);
        setQueuePositionDetails(4);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch waitlist status');
    } finally {
      setIsLoading(false);
    }
  };

  const setQueuePositionDetails = (pos: number) => {
    setQueueCount(pos);
    setEstWait(pos * 5); // 5 mins per table estimate
  };

  // Connect WebSocket to hear table availability
  useEffect(() => {
    if (!user) return;
    
    console.log('[Socket] Initializing WebSocket for waitlist updates...');
    const client = createSocketClient((topic, body) => {
      console.log(`[Socket] Waitlist message received:`, body);
      if (body && body.user && body.user.id === user.id) {
        setWaitlist(body);
        setQueuePositionDetails(body.queuePosition);
        if (body.status === 'NOTIFIED') {
          // 5 minutes countdown (300 seconds)
          setAcceptTimer(300);
        }
      }
    });

    stompClientRef.current = client;

    // Subscribe to waitlist notifications
    setTimeout(() => {
      if (client && client.active) {
        client.subscribe(`/topic/waitlist/user/${user.id}`, (message) => {
          const body = JSON.parse(message.body);
          setWaitlist(body);
          setQueuePositionDetails(body.queuePosition);
          if (body.status === 'NOTIFIED') {
            setAcceptTimer(300);
          }
        });
      }
    }, 1500);

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [user]);

  // Countdown timer for table offer accept
  useEffect(() => {
    if (acceptTimer === null) return;
    if (acceptTimer <= 0) {
      handleDecline();
      return;
    }
    const interval = setInterval(() => {
      setAcceptTimer(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [acceptTimer]);

  const handleAccept = async () => {
    if (!user || !waitlist) return;
    try {
      // Create confirmed booking from waitlist details
      const response = await api.post('/bookings/book', {
        shopId: shopId,
        userId: user.id,
        tableId: null, // Let backend auto-assign the table that became free
        date: new Date().toISOString().split('T')[0],
        timeSlot: new Date().toTimeString().substring(0, 5),
        guestCount: waitlist.guestCount,
        seatingArea: waitlist.seatingArea,
        specialRequests: 'Waitlist confirmed booking'
      });
      
      // Navigate to tracking/timeline page
      navigate('live-tracking', { booking: response.data, bookingId: response.data.bookingId });
    } catch (err) {
      console.error(err);
      setError('Could not confirm table booking.');
    }
  };

  const handleDecline = async () => {
    setAcceptTimer(null);
    if (waitlist) {
      setWaitlist(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rSecs = secs % 60;
    return `${mins}:${rSecs < 10 ? '0' : ''}${rSecs}`;
  };

  // Demo tool: trigger free table notify manually
  const triggerDemoAlert = () => {
    if (waitlist) {
      const updated = { ...waitlist, status: 'NOTIFIED' };
      setWaitlist(updated);
      setAcceptTimer(300);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 pb-24 font-sans relative">
      {/* Top Background Design */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-indigo-950/40 to-slate-950 pointer-events-none"></div>

      <div className="max-w-md mx-auto px-4 pt-12 relative z-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center transition active:scale-95 border border-slate-800"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white">Waitlist Queue</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Estimated updates live</p>
          </div>
        </div>

        {/* Notified Alert Popup */}
        {waitlist?.status === 'NOTIFIED' && (
          <div className="bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-bounce">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl text-slate-950">
                <BellRing size={20} className="animate-wiggle" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Table is Available!</h2>
                <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Please accept your reservation invite.</p>
              </div>
            </div>
            
            {acceptTimer !== null && (
              <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-2xl text-xs font-mono font-bold text-emerald-400">
                <span>Hold expires in:</span>
                <span className="text-sm tracking-wide">{formatTimer(acceptTimer)}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 py-3.5 bg-white text-emerald-950 font-black text-xs uppercase tracking-wider rounded-2xl transition hover:bg-emerald-50 active:scale-95 shadow-md shadow-emerald-500/10"
              >
                Accept Table
              </button>
              <button
                onClick={handleDecline}
                className="px-6 py-3.5 bg-slate-900/50 text-slate-300 hover:bg-slate-900 border border-slate-800 font-black text-xs uppercase tracking-wider rounded-2xl transition active:scale-95"
              >
                Pass
              </button>
            </div>
          </div>
        )}

        {/* Main Waitlist Status Box */}
        {waitlist && waitlist.status === 'WAITING' && (
          <div className="bg-slate-900 border border-slate-800/80 rounded-[2.5rem] p-6 shadow-2xl space-y-8 text-center relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl"></div>
            
            <div>
              <div className="inline-block p-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 text-indigo-400">
                <Coffee size={32} />
              </div>
              <h2 className="text-lg font-black text-white mt-4">{waitlist.shop.name}</h2>
              <p className="text-[10px] text-slate-500 font-bold mt-1">Waiting list configuration: {waitlist.guestCount} Guests • {waitlist.seatingArea}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col items-center">
                <Users className="text-slate-500" size={18} />
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mt-2">Queue Position</span>
                <span className="text-2xl font-black text-white mt-1">#{queueCount}</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col items-center">
                <Hourglass className="text-slate-500" size={18} />
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mt-2">Est. Wait</span>
                <span className="text-2xl font-black text-white mt-1">{estWait} mins</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-[10px] text-slate-400 font-bold leading-relaxed">
              We are managing restaurant seatings dynamically. Once tables complete cleaning steps, position alerts will sound instantly.
            </div>

            <button
              onClick={handleDecline}
              className="w-full py-4 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white font-black text-xs uppercase tracking-wider rounded-2xl transition active:scale-95"
            >
              Cancel Request
            </button>
          </div>
        )}

        {/* Cancelled/Declined Screen */}
        {waitlist && waitlist.status === 'CANCELLED' && (
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center space-y-6">
            <div className="inline-block p-4 bg-rose-500/10 rounded-3xl border border-rose-500/20 text-rose-400">
              <XCircle size={32} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Waitlist Cancelled</h2>
              <p className="text-xs text-slate-400 font-bold mt-2">You have exited the waiting list or the table offer expired.</p>
            </div>
            <button
              onClick={() => navigate('home')}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition active:scale-95"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Demo trigger assistant */}
        {waitlist && waitlist.status === 'WAITING' && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-500 uppercase">Waitlist Helper (Demo)</span>
            <button
              onClick={triggerDemoAlert}
              className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-wider flex items-center gap-1"
            >
              <Sparkles size={12} /> Simulate Available Table
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
