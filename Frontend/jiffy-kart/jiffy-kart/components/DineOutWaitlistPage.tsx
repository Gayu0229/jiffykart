import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigation } from '../hooks';
import {
  ChevronLeft, Users, Calendar, Clock, Bell, Trash2, ArrowRight,
  TrendingUp, Star, MapPin, Award, CheckCircle, AlertCircle,
  Timer, Sparkles, RefreshCw, X, Shield, ChevronDown
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface WaitlistRecord {
  restaurantId: string;
  restaurantName: string;
  seatType: string;
  guestCount: number;
  date: string;
  timeSlot: string;
  queuePosition: number;
  estimatedWait: number; // minutes
  joinedTime: string;
  status: 'waiting' | 'ready' | 'booked' | 'expired' | 'cancelled';
}

export interface WaitlistNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'seat_available' | 'queue_updated' | 'timer_expiring' | 'cancelled';
  read: boolean;
}

// ─── MOCK DATA & CONSTANTS ────────────────────────────────────────────────────

const INITIAL_NOTIFICATIONS: WaitlistNotification[] = [
  {
    id: 'n1',
    title: 'Joined Waitlist',
    message: 'You have joined the waitlist for a 6 Seater at Nazhirya Restaurant.',
    time: '5 mins ago',
    type: 'queue_updated',
    read: true
  }
];

const SEAT_AVAILABILITY = [
  { type: '2 Seater', status: 'Available', count: 6, color: 'text-green-600 bg-green-50' },
  { type: '4 Seater', status: 'Available', count: 1, color: 'text-green-600 bg-green-50' },
  { type: '6 Seater', status: 'Reserved For You', count: 1, color: 'text-primary bg-primary/5 animate-pulse border-2 border-primary/20' },
  { type: '8 Seater', status: 'Available', count: 3, color: 'text-green-600 bg-green-50' }
];

const TIMELINE_STEPS = [
  { key: 'waiting', label: 'Waiting in Queue', desc: 'Monitoring seat releases' },
  { key: 'available', label: 'Seat Becoming Available', desc: 'Dining group checking out' },
  { key: 'prebook', label: 'Pre-Booking Activated', desc: 'Seat reserved for you' },
  { key: 'timer', label: 'Reservation Timer Started', desc: '10 minutes to complete booking' },
  { key: 'confirmed', label: 'Booking Confirmed', desc: 'Table reserved successfully' }
];

const PAST_WAITLISTS = [
  { restaurantName: 'BBQ Nation', seatType: '4 Seater', joinedTime: '3 Jul 2026, 8:15 PM', status: 'booked' },
  { restaurantName: 'The Spice House', seatType: '6 Seater', joinedTime: '1 Jul 2026, 7:30 PM', status: 'expired' },
  { restaurantName: 'A2B Adyar Ananda Bhavan', seatType: '2 Seater', joinedTime: '28 Jun 2026, 1:15 PM', status: 'cancelled' }
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const DineOutWaitlistPage: React.FC<{
  restaurantId?: string;
  restaurantName?: string;
  seatType?: string;
  guestCount?: number;
  date?: string;
  timeSlot?: string;
  initialQueue?: number;
  initialWait?: number;
  onBack: () => void;
}> = ({
  restaurantId = '1',
  restaurantName = 'Nazhirya Restaurant',
  seatType = '6 Seater',
  guestCount = 6,
  date = '',
  timeSlot = '',
  initialQueue = 3,
  initialWait = 18,
  onBack
}) => {
  const { navigate } = useNavigation();

  // Primary states
  const [queuePos, setQueuePos] = useState(initialQueue);
  const [estimatedWait, setEstimatedWait] = useState(initialWait);
  const [isPrebooked, setIsPrebooked] = useState(false);
  const [timerSecs, setTimerSecs] = useState(600); // 10 minutes
  const [notifications, setNotifications] = useState<WaitlistNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'unread' | 'read' | 'all'>('unread');
  const [showToast, setShowToast] = useState<string | null>(null);

  // Time formatting helper
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Trigger simulated queue progression & pre-booking
  useEffect(() => {
    // Stage 1: Queue moves from 3 -> 2
    const timer1 = setTimeout(() => {
      setQueuePos(2);
      setEstimatedWait(12);
      addNotification('Queue Updated', 'You moved from Position 3 to Position 2.', 'queue_updated');
      triggerToast('Queue Position Updated! Position 2 now.');
    }, 8000);

    // Stage 2: Queue moves from 2 -> 1
    const timer2 = setTimeout(() => {
      setQueuePos(1);
      setEstimatedWait(5);
      addNotification('Queue Updated', 'You moved from Position 2 to Position 1. Prepare to pre-book.', 'queue_updated');
      triggerToast('You are now #1 on the Waitlist!');
    }, 16000);

    // Stage 3: Auto Pre-booking Activates
    const timer3 = setTimeout(() => {
      setIsPrebooked(true);
      setQueuePos(0);
      addNotification('Seat Available 🎉', 'Your requested 6 Seater is now available and reserved for you.', 'seat_available');
      triggerToast('🎉 A 6 Seater is available! Pre-booked for you.');
    }, 24000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Pre-booking Countdown Timer
  useEffect(() => {
    if (!isPrebooked) return;
    if (timerSecs <= 0) {
      setIsPrebooked(false);
      addNotification('Reservation Cancelled', 'Your reserved seat has been released due to inactivity.', 'cancelled');
      triggerToast('Reservation expired and released.');
      return;
    }

    const interval = setInterval(() => {
      setTimerSecs(prev => {
        if (prev === 121) {
          addNotification('Reservation Expiring ⏳', 'Complete your booking within 2 minutes.', 'timer_expiring');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPrebooked, timerSecs]);

  // Actions
  const addNotification = (title: string, message: string, type: WaitlistNotification['type']) => {
    const newNotif: WaitlistNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      time: 'Just now',
      type,
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleCancelWaitlist = () => {
    if (window.confirm('Are you sure you want to leave the waitlist?')) {
      onBack();
    }
  };

  const handleCompleteBooking = () => {
    // Directly go to Review Booking Page with waitlist/pre-booked details
    navigate('dineout-review', {
      restaurantId,
      restaurantName,
      seatType,
      seatIcon: '🪑',
      date: date || new Date().toISOString().split('T')[0],
      timeSlot: timeSlot || '19:30',
      guestCount,
      occasion: 'Priority Booking',
      cartItems: 0,
      cartTotal: 0
    });
  };

  // Notification Filtering
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'read') return n.read;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Confetti simulation when pre-booking unlocks */}
      {isPrebooked && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
          <div className="absolute top-10 left-1/4 animate-bounce text-4xl">🎉</div>
          <div className="absolute top-20 right-1/4 animate-bounce text-4xl" style={{ animationDelay: '0.5s' }}>⚡</div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-[56px] md:top-[64px] z-40 bg-white border-b border-gray-100 shadow-soft">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 min-h-0 min-w-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition shrink-0">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="font-black text-gray-900 text-sm md:text-base">Antony's Smart Waitlist</h1>
              <p className="text-[11px] text-gray-500 truncate">{restaurantName}</p>
            </div>
          </div>
          {isPrebooked && (
            <div className="bg-red-50 border border-red-200 text-red-600 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs animate-pulse">
              <Timer size={14} /> Expires: {formatTimer(timerSecs)}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Waitlist Cards & Auto Pre-booking Card */}
          <div className="lg:col-span-2 space-y-6">

            {/* Smart Auto Pre-booking Alert Card */}
            {isPrebooked ? (
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border-2 border-primary/30 rounded-3xl p-6 shadow-glow animate-success-pop">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl shrink-0">
                    🎉
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-black text-gray-900 leading-tight">Great News!</h2>
                    <p className="text-sm text-gray-700 mt-1">A {seatType} table has become available at Nazhirya Restaurant.</p>
                    <p className="text-xs text-primary font-black mt-1">Reserved exclusively for you.</p>

                    <div className="mt-5 flex items-center gap-3">
                      <button
                        onClick={handleCompleteBooking}
                        className="bg-primary hover:bg-secondary text-white font-black text-xs px-5 py-3 rounded-xl transition shadow-glow min-h-0"
                      >
                        Complete Booking
                      </button>
                      <button
                        onClick={onBack}
                        className="border border-gray-300 hover:bg-gray-50 text-gray-600 font-bold text-xs px-4 py-3 rounded-xl transition min-h-0"
                      >
                        Release Seat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Waiting Status Summary Card */
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-8 -mt-8 pointer-events-none" />

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl shrink-0 animate-pulse">
                    ⏳
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block">
                      Waiting in queue...
                    </div>
                    <h2 className="text-xl font-black text-gray-950 mt-2">Position #{queuePos}</h2>
                    <p className="text-xs text-gray-500 mt-1">Estimated wait: {estimatedWait} mins</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Updated just now</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6 border-t border-gray-100 pt-5">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <div className="text-[10px] text-gray-400 font-bold">REQUESTED SEAT</div>
                    <div className="font-black text-sm text-gray-800 mt-1">{seatType}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <div className="text-[10px] text-gray-400 font-bold">PEOPLE AHEAD</div>
                    <div className="font-black text-sm text-gray-800 mt-1">{queuePos - 1 > 0 ? queuePos - 1 : '0'}</div>
                  </div>
                </div>

                <button
                  onClick={handleCancelWaitlist}
                  className="w-full mt-4 py-3 border border-red-200 hover:bg-red-50 text-red-500 text-xs font-black rounded-xl transition min-h-0"
                >
                  Leave Waitlist
                </button>
              </div>
            )}

            {/* Timeline Progress */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <h3 className="font-black text-gray-900 text-sm mb-4">Waitlist Status Tracker</h3>
              <div className="relative pl-6 space-y-5">
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-100" />
                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = isPrebooked ? idx < 4 : idx === 0;
                  const isActive = isPrebooked ? idx === 3 : idx === 0;
                  return (
                    <div key={step.key} className="relative flex gap-3 items-start">
                      <div className={`absolute -left-5 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 transition-all ${
                        isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                        isActive ? 'bg-primary border-primary animate-pulse' :
                        'bg-white border-gray-200'
                      }`}>
                        {isDone && <CheckCircle size={10} className="text-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-black ${isDone ? 'text-gray-800' : 'text-gray-400'}`}>
                          {step.label}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Availability Widgets */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <h3 className="font-black text-gray-900 text-sm mb-4">Live Seat Availability</h3>
              <div className="grid grid-cols-2 gap-3">
                {SEAT_AVAILABILITY.map(seat => (
                  <div key={seat.type} className={`p-3.5 rounded-2xl border border-gray-100 text-center ${seat.color}`}>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{seat.type}</div>
                    <div className="font-black text-sm mt-1">{seat.status}</div>
                    {seat.count > 0 && seat.status !== 'Reserved For You' && (
                      <div className="text-[10px] opacity-75 mt-0.5">{seat.count} tables free</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Notifications Tray & History */}
          <div className="space-y-6">

            {/* Notification Center */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col max-h-[480px]">
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                  <Bell size={16} className="text-primary" /> Notifications
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={markAllRead} className="text-[10px] text-primary font-bold hover:underline min-h-0 min-w-0">
                    Mark Read
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1.5 bg-gray-50 p-1 rounded-xl mb-3">
                {['unread', 'read', 'all'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg capitalize transition min-h-0 min-w-0 ${
                      activeTab === t ? 'bg-white text-primary shadow-soft' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No notifications in this tab
                  </div>
                ) : (
                  filteredNotifications.map(n => (
                    <div key={n.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 relative group">
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="absolute top-2.5 right-2.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition min-h-0 min-w-0"
                      >
                        <X size={12} />
                      </button>
                      <div className="flex items-start gap-2.5 pr-4">
                        <span className="text-sm mt-0.5">🔔</span>
                        <div>
                          <h4 className="text-xs font-black text-gray-800 leading-tight">{n.title}</h4>
                          <p className="text-[10px] text-gray-500 mt-1 leading-snug">{n.message}</p>
                          <span className="text-[9px] text-gray-400 mt-1.5 block">{n.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Waitlist History */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <h3 className="font-black text-gray-900 text-sm mb-4">Previous Waitlists</h3>
              <div className="space-y-3">
                {PAST_WAITLISTS.map((h, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                    <div>
                      <div className="font-black text-gray-800">{h.restaurantName}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{h.seatType} · {h.joinedTime}</div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full capitalize ${
                      h.status === 'booked' ? 'text-green-600 bg-green-50' :
                      h.status === 'expired' ? 'text-red-600 bg-red-50' :
                      'text-gray-500 bg-gray-100'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Floating Action/Toast Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-gray-950/95 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-slide-up">
          <Sparkles size={14} className="text-primary animate-pulse" />
          {showToast}
        </div>
      )}
    </div>
  );
};

export default DineOutWaitlistPage;
