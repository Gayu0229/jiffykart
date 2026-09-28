import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigation } from '../hooks';
import {
  Check, Star, MapPin, Clock, Users, Calendar, ChevronRight,
  Download, Share2, Phone, MessageSquare, Navigation2, Copy,
  QrCode, Gift, Award, Sparkles, Timer, CheckCircle, ArrowRight,
  Utensils, CreditCard, Shield, ChevronDown, X, ExternalLink,
  Bell, Car, Coffee, Heart, TrendingUp, Ticket, Smartphone,
  Mail, Send, Link2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelineStep {
  id: string;
  label: string;
  emoji: string;
  time?: string;
  status: 'done' | 'active' | 'upcoming';
  description?: string;
}

// ─── QR Code Generator ───────────────────────────────────────────────────────

function generateQRMatrix(data: string, size: number = 29): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  let hash = 0;
  for (let i = 0; i < data.length; i++) hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  const seed = Math.abs(hash);
  const drawFinder = (r: number, c: number) => {
    for (let dr = 0; dr < 7; dr++) for (let dc = 0; dc < 7; dc++) {
      if (r + dr < size && c + dc < size) {
        matrix[r + dr][c + dc] = dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
      }
    }
  };
  drawFinder(0, 0); drawFinder(0, size - 7); drawFinder(size - 7, 0);
  // Alignment pattern
  const ap = size - 9;
  for (let dr = 0; dr < 5; dr++) for (let dc = 0; dc < 5; dc++) {
    matrix[ap + dr][ap + dc] = dr === 0 || dr === 4 || dc === 0 || dc === 4 || (dr === 2 && dc === 2);
  }
  let s = seed;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (matrix[r][c]) continue;
    if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) continue;
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    matrix[r][c] = (s % 3) < 1;
  }
  return matrix;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDateFull = (d: string) => {
  if (!d) return 'Today';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatDateShort = (d: string) => {
  if (!d) return 'Today';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const timeDisplay = (t: string) => {
  if (!t) return '7:30 PM';
  const [h, m] = t.split(':').map(Number);
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// ─── Confetti Component ──────────────────────────────────────────────────────

const Confetti: React.FC = () => {
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 2,
      color: ['#505081', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6', '#34D399', '#60A5FA'][i % 8],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    })),
  []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: '2px',
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti linear forwards; }
      `}</style>
    </div>
  );
};

// ─── Success Checkmark Animation ─────────────────────────────────────────────

const SuccessCheck: React.FC = () => (
  <div className="relative w-24 h-24 mx-auto">
    <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" style={{ animationDuration: '1.5s' }} />
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-xl animate-success-pop">
      <Check size={40} className="text-white animate-success-check" strokeWidth={3} />
    </div>
    <style>{`
      @keyframes success-pop { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
      @keyframes success-check { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 0; } 100% { opacity: 1; transform: scale(1); } }
      .animate-success-pop { animation: success-pop 0.6s ease-out forwards; }
      .animate-success-check { animation: success-check 0.8s ease-out 0.3s forwards; opacity: 0; }
    `}</style>
  </div>
);

// ─── Booking QR Card ─────────────────────────────────────────────────────────

const BookingQR: React.FC<{ bookingId: string; restaurantName: string }> = ({ bookingId, restaurantName }) => {
  const matrix = useMemo(() => generateQRMatrix(`JIFFYKART:DINEOUT:${bookingId}:${restaurantName}`), [bookingId, restaurantName]);
  const size = matrix.length;
  const cellSize = 5;
  const svgSize = size * cellSize;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(bookingId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DineOut Booking - ${restaurantName}`,
          text: `🍽️ My reservation at ${restaurantName}\nBooking ID: ${bookingId}\nPowered by JiffyKart DineOut`,
          url: window.location.href,
        });
      } catch {}
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 animate-fade-in">
      <div className="text-center mb-4">
        <h3 className="font-black text-gray-900 text-sm flex items-center justify-center gap-2">
          <QrCode size={16} className="text-primary" /> Check-In QR Code
        </h3>
        <p className="text-[11px] text-gray-400 mt-1">Show this QR when you arrive at the restaurant</p>
      </div>

      {/* QR */}
      <div className="flex justify-center mb-4">
        <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 shadow-inner">
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            {matrix.map((row, r) => row.map((cell, c) => cell ? (
              <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#1a1a2e" rx={0.8} />
            ) : null))}
          </svg>
        </div>
      </div>

      {/* Booking ID */}
      <div className="bg-primary/5 border-2 border-primary/15 rounded-2xl p-3 text-center mb-4">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Booking ID</div>
        <div className="font-black text-primary text-lg tracking-widest mt-0.5 flex items-center justify-center gap-2">
          {bookingId}
          <button onClick={handleCopy} className="min-h-0 min-w-0 hover:text-secondary transition">
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold text-emerald-600">Confirmed</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Download, label: 'Download', onClick: () => alert('QR Downloaded! (Demo)') },
          { icon: Share2, label: 'Share', onClick: handleShare },
          { icon: Wallet, label: 'Save to Wallet', onClick: () => alert('Saved to Wallet! (Demo)') },
        ].map(a => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="flex flex-col items-center gap-1.5 py-2.5 px-2 bg-gray-50 rounded-xl border border-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all min-h-0 min-w-0"
          >
            <a.icon size={16} />
            <span className="text-[10px] font-bold">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Import Wallet icon separately since it's used above
const Wallet = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
);

// ─── Live Timeline ───────────────────────────────────────────────────────────

const LiveTimeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => (
  <div className="relative">
    {steps.map((step, i) => {
      const isLast = i === steps.length - 1;
      return (
        <div key={step.id} className="flex gap-3 animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
          {/* Connector */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border-2 transition-all ${
              step.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' :
              step.status === 'active' ? 'bg-primary border-primary text-white shadow-glow animate-pulse' :
              'bg-gray-100 border-gray-200 text-gray-400'
            }`}>
              {step.status === 'done' ? <Check size={16} strokeWidth={3} /> : step.emoji}
            </div>
            {!isLast && (
              <div className={`w-0.5 h-10 my-1 ${step.status === 'done' ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
          {/* Content */}
          <div className="flex-1 pb-4 min-w-0">
            <div className={`font-black text-sm ${step.status === 'active' ? 'text-primary' : step.status === 'done' ? 'text-gray-800' : 'text-gray-400'}`}>
              {step.label}
            </div>
            {step.time && <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{step.time}</div>}
            {step.description && <div className="text-[11px] text-gray-500 mt-0.5">{step.description}</div>}
          </div>
        </div>
      );
    })}
  </div>
);

// ─── Countdown Timer ─────────────────────────────────────────────────────────

const CountdownTimer: React.FC<{ targetTime: string; targetDate: string }> = ({ targetTime, targetDate }) => {
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      let target: Date;
      if (targetDate && targetTime) {
        const [h, m] = targetTime.split(':').map(Number);
        target = new Date(targetDate + 'T00:00:00');
        target.setHours(h, m, 0, 0);
      } else {
        target = new Date(now.getTime() + 5400000); // 1.5hr fallback
      }
      const diff = Math.max(0, target.getTime() - now.getTime());
      setRemaining({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [targetTime, targetDate]);

  const cells = [
    { val: remaining.hours, label: 'Hours' },
    { val: remaining.minutes, label: 'Minutes' },
    { val: remaining.seconds, label: 'Seconds' },
  ];

  return (
    <div className="text-center">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
        <Timer size={13} className="text-primary" /> Reservation Starts In
      </div>
      <div className="flex items-center justify-center gap-2">
        {cells.map((c, i) => (
          <React.Fragment key={c.label}>
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 text-white rounded-xl w-16 py-3 text-center shadow-lg">
              <div className="text-2xl font-black tabular-nums leading-none">{String(c.val).padStart(2, '0')}</div>
              <div className="text-[8px] text-gray-400 uppercase tracking-wider mt-1">{c.label}</div>
            </div>
            {i < cells.length - 1 && <span className="text-xl font-black text-gray-300">:</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ─── Check-In Steps ──────────────────────────────────────────────────────────

const CHECK_IN_STEPS = [
  { step: 1, emoji: '📍', label: 'Reach Restaurant', desc: 'Navigate using the map below' },
  { step: 2, emoji: '📱', label: 'Open Booking', desc: 'Open this page on your phone' },
  { step: 3, emoji: '🔳', label: 'Show QR Code', desc: 'Present QR to the host' },
  { step: 4, emoji: '✅', label: 'Staff Scans QR', desc: 'Instant digital check-in' },
  { step: 5, emoji: '🍽️', label: 'Enjoy Dining!', desc: 'Your table is ready' },
];

// ─── Similar Restaurants ─────────────────────────────────────────────────────

const SIMILAR = [
  { id: '2', name: 'BBQ Nation', cuisine: 'BBQ • Continental', rating: 4.7, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80', available: 23, distance: '2.4 km' },
  { id: '3', name: 'The Spice House', cuisine: 'Mughlai • Biryani', rating: 4.3, image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80', available: 42, distance: '0.8 km' },
  { id: '4', name: 'A2B Adyar Ananda Bhavan', cuisine: 'South Indian', rating: 4.4, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', available: 28, distance: '1.8 km' },
];

// ─── Section Card ────────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon?: string; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-5 shadow-soft border border-gray-100 animate-fade-in ${className}`}>
    <h3 className="font-black text-gray-900 text-sm flex items-center gap-2 mb-4">{icon} {title}</h3>
    {children}
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export const DineOutSuccessPage: React.FC<{
  restaurantId?: string;
  restaurantName?: string;
  seatType?: string;
  date?: string;
  timeSlot?: string;
  guestCount?: number;
  grandTotal?: number;
  bookingId?: string;
  onBack: () => void;
}> = ({
  restaurantId = '1',
  restaurantName = 'Nazhirya Restaurant',
  seatType = '6 Seater',
  date = '',
  timeSlot = '19:30',
  guestCount = 6,
  grandTotal = 2450,
  bookingId = 'JKD240701',
  onBack,
}) => {
  const { navigate } = useNavigation();
  const [showConfetti, setShowConfetti] = useState(true);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [activeTimeline, setActiveTimeline] = useState(2); // index of active step
  const [copied, setCopied] = useState(false);

  // Hide confetti after 4s
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4500);
    return () => clearTimeout(t);
  }, []);

  // Simulate timeline progress
  useEffect(() => {
    const t = setInterval(() => {
      setActiveTimeline(prev => prev < 2 ? prev + 1 : prev);
    }, 10000);
    return () => clearInterval(t);
  }, []);

  const timelineSteps: TimelineStep[] = [
    { id: 't1', label: 'Reservation Confirmed', emoji: '📋', time: 'Just now', status: 'done', description: `Booking ${bookingId} created` },
    { id: 't2', label: 'Restaurant Accepted', emoji: '✅', time: '1 min ago', status: 'done', description: `${restaurantName} confirmed your table` },
    { id: 't3', label: 'Customer On The Way', emoji: '🚗', status: activeTimeline >= 2 ? 'active' : 'upcoming', description: 'Share your live ETA' },
    { id: 't4', label: 'Customer Arrived', emoji: '📍', status: 'upcoming', description: 'Check in at the host desk' },
    { id: 't5', label: 'QR Check-In', emoji: '📱', status: 'upcoming', description: 'Scan QR for instant seating' },
    { id: 't6', label: 'Dining Started', emoji: '🍽️', status: 'upcoming', description: 'Enjoy your meal!' },
    { id: 't7', label: 'Dining Completed', emoji: '🎉', status: 'upcoming', description: 'Thank you for dining with us' },
  ];

  const handleCopyAddress = () => {
    navigator.clipboard?.writeText('15/6, Kanagasabi Street, Nesapakkam, Chennai - 600092').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-background to-background">

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('dineout')} className="w-9 h-9 min-h-0 min-w-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition shrink-0">
            <X size={16} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-black text-emerald-600 text-sm flex items-center gap-1.5">
              <CheckCircle size={14} /> Booking Confirmed
            </div>
            <div className="text-[11px] text-gray-500 truncate">{bookingId} · {restaurantName}</div>
          </div>
          <button
            onClick={() => setShowShareSheet(true)}
            className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-black px-3 py-1.5 rounded-full min-h-0 min-w-0 hover:bg-primary/20 transition"
          >
            <Share2 size={12} /> Share
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 pb-10 space-y-5">

        {/* ════════════════════════════════
            SUCCESS HERO
        ════════════════════════════════ */}
        <div className="text-center py-6 animate-fade-in">
          <SuccessCheck />
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-6 mb-2">
            Your Table is Reserved! 🎉
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            We look forward to serving you at <strong className="text-gray-700">{restaurantName}</strong>.
            Your booking details are below.
          </p>
        </div>

        {/* ════════════════════════════════
            DIGITAL RESERVATION TICKET
        ════════════════════════════════ */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl p-1 shadow-2xl animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-[20px] overflow-hidden">
            {/* Ticket Header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&q=80"
                    alt={restaurantName}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white/20"
                  />
                  <div>
                    <div className="text-white font-black text-base">{restaurantName}</div>
                    <div className="text-gray-400 text-[11px]">South Indian • North Indian</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span className="text-amber-400 text-[11px] font-bold">4.5</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" /></span>
                    Confirmed
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Body */}
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'DATE', value: formatDateShort(date), icon: '📅' },
                  { label: 'TIME', value: timeDisplay(timeSlot), icon: '⏰' },
                  { label: 'SEAT TYPE', value: seatType, icon: '🪑' },
                  { label: 'GUESTS', value: `${guestCount} People`, icon: '👥' },
                  { label: 'DURATION', value: '~90 min', icon: '⏱️' },
                  { label: 'AMOUNT PAID', value: `₹${grandTotal.toLocaleString('en-IN')}`, icon: '💰' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">{item.label}</div>
                    <div className="text-white font-black text-sm flex items-center gap-1.5">
                      <span className="text-base">{item.icon}</span> {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tear line */}
            <div className="relative h-6">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full" />
              <div className="absolute inset-x-6 top-1/2 border-t-2 border-dashed border-white/10" />
            </div>

            {/* Ticket Footer */}
            <div className="px-5 pb-5 pt-1 flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">BOOKING ID</div>
                <div className="text-white font-black text-sm tracking-widest">{bookingId}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">PAYMENT</div>
                <div className="text-emerald-400 font-black text-sm flex items-center gap-1">
                  <Shield size={11} /> Paid
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════
            TWO-COLUMN LAYOUT
        ════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: 3 cols */}
          <div className="lg:col-span-3 space-y-5">

            {/* Countdown */}
            <Section title="Reservation Countdown" icon="⏳">
              <CountdownTimer targetTime={timeSlot} targetDate={date} />
            </Section>

            {/* QR Code */}
            <BookingQR bookingId={bookingId} restaurantName={restaurantName} />

            {/* Live Timeline */}
            <Section title="Live Reservation Status" icon="📡">
              <LiveTimeline steps={timelineSteps} />
            </Section>

            {/* Check-In Steps */}
            <Section title="How Check-In Works" icon="📱">
              <div className="grid grid-cols-5 gap-2">
                {CHECK_IN_STEPS.map((s, i) => (
                  <div key={s.step} className="text-center animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-lg mb-1.5">
                      {s.emoji}
                    </div>
                    <div className="text-[10px] font-black text-gray-700 leading-tight">{s.label}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">{s.desc}</div>
                    {i < CHECK_IN_STEPS.length - 1 && (
                      <div className="hidden md:block absolute right-0 top-5"><ChevronRight size={10} className="text-gray-200" /></div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Map / Location */}
            <Section title="Restaurant Location" icon="📍">
              <div className="relative h-44 md:h-56 rounded-2xl overflow-hidden bg-gray-100 mb-3 border border-gray-200">
                <iframe
                  title="Restaurant Location"
                  src="https://maps.google.com/maps?q=13.0220,80.1925&z=16&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Address</div>
                  <div className="text-xs text-gray-700 font-semibold leading-snug">15/6, Kanagasabi Street, Nesapakkam, Chennai - 600092</div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                    <span className="flex items-center gap-0.5"><MapPin size={10} /> 1.2 km</span>
                    <span className="flex items-center gap-0.5"><Clock size={10} /> 8 min drive</span>
                    <span className="flex items-center gap-0.5"><Car size={10} /> Parking available</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:w-36">
                  <a href="https://www.google.com/maps/dir/?api=1&destination=13.0220,80.1925" target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-black py-2.5 rounded-xl hover:bg-secondary transition min-h-0">
                    <Navigation2 size={13} /> Navigate
                  </a>
                  <button onClick={handleCopyAddress}
                    className="flex items-center justify-center gap-1.5 border-2 border-gray-200 text-gray-600 text-xs font-black py-2.5 rounded-xl hover:border-gray-400 transition min-h-0">
                    {copied ? <CheckCircle size={13} /> : <Copy size={13} />} {copied ? 'Copied!' : 'Copy Address'}
                  </button>
                </div>
              </div>
            </Section>
          </div>

          {/* Right: 2 cols */}
          <div className="lg:col-span-2 space-y-5">

            {/* Contact Restaurant */}
            <Section title="Contact Restaurant" icon="📞">
              <div className="space-y-2">
                {[
                  { icon: Phone, label: 'Call Restaurant', sub: '+91 98765 43210', color: 'bg-blue-50 text-blue-600 border-blue-200', href: 'tel:+919876543210' },
                  { icon: MessageSquare, label: 'WhatsApp', sub: 'Send a message', color: 'bg-green-50 text-green-600 border-green-200', href: 'https://wa.me/919876543210' },
                  { icon: Smartphone, label: 'Chat Support', sub: 'JiffyKart Help', color: 'bg-purple-50 text-purple-600 border-purple-200', href: '#' },
                ].map(c => (
                  <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl border ${c.color} hover:shadow-soft transition-all`}>
                    <c.icon size={16} />
                    <div className="flex-1">
                      <div className="text-xs font-black">{c.label}</div>
                      <div className="text-[10px] opacity-70">{c.sub}</div>
                    </div>
                    <ExternalLink size={12} className="opacity-40" />
                  </a>
                ))}
              </div>
            </Section>

            {/* Booking Summary */}
            <Section title="Booking Summary" icon="🧾">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Restaurant</span><span className="font-bold text-gray-800 truncate max-w-[150px]">{restaurantName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Seat Type</span><span className="font-bold text-gray-800">{seatType}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Guests</span><span className="font-bold text-gray-800">{guestCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-bold text-gray-800">{formatDateShort(date)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-bold text-gray-800">{timeDisplay(timeSlot)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Food Pre-Order</span><span className="font-bold text-primary">4 Items</span></div>
                <div className="border-t border-dashed border-gray-200 my-2" />
                <div className="flex justify-between"><span className="text-gray-500">Reservation Fee</span><span className="font-bold text-emerald-600">FREE</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Food Total</span><span className="font-bold text-gray-700">₹{(grandTotal * 0.85).toFixed(0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Taxes & Charges</span><span className="font-bold text-gray-700">₹{(grandTotal * 0.15).toFixed(0)}</span></div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-black text-gray-800">Grand Total</span>
                  <span className="font-black text-primary text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-2 mt-2">
                  <CreditCard size={12} />
                  <span className="font-bold text-[11px]">Payment Successful</span>
                </div>
              </div>
            </Section>

            {/* Pre-Order Status */}
            <Section title="Pre-Order Status" icon="🍳">
              <div className="space-y-2">
                {[
                  { label: 'Food Order Confirmed', status: 'done' },
                  { label: 'Kitchen Preparation', status: 'active' },
                  { label: 'Food Ready', status: 'upcoming' },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      s.status === 'done' ? 'bg-emerald-500 text-white' :
                      s.status === 'active' ? 'bg-primary text-white animate-pulse' :
                      'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}>
                      {s.status === 'done' ? <Check size={10} strokeWidth={3} /> : i + 1}
                    </div>
                    <span className={`text-xs font-bold ${s.status === 'active' ? 'text-primary' : s.status === 'done' ? 'text-gray-700' : 'text-gray-400'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 flex items-center gap-2 mt-2">
                  <Clock size={13} className="text-amber-500 shrink-0" />
                  <span className="text-[11px] text-amber-700 font-bold">Estimated ready time: 35 min before your arrival</span>
                </div>
              </div>
            </Section>

            {/* Add to Calendar */}
            <Section title="Add to Calendar" icon="📆">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Google', color: 'bg-blue-50 text-blue-600 border-blue-200', letter: 'G' },
                  { label: 'Apple', color: 'bg-gray-50 text-gray-700 border-gray-200', letter: '🍎' },
                  { label: 'Outlook', color: 'bg-sky-50 text-sky-600 border-sky-200', letter: 'O' },
                ].map(c => (
                  <button key={c.label} onClick={() => alert(`Added to ${c.label} Calendar! (Demo)`)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border ${c.color} hover:shadow-soft transition-all min-h-0 min-w-0`}>
                    <span className="text-lg font-black">{c.letter}</span>
                    <span className="text-[10px] font-bold">{c.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Loyalty Section */}
            <Section title="Rewards Earned" icon="🏆">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                    <Award size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-amber-800 text-sm">+{Math.round(grandTotal * 0.1)} JiffyCoins Earned!</div>
                    <div className="text-[10px] text-amber-600 mt-0.5">Use coins on your next DineOut booking</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1 bg-white rounded-xl p-2 text-center border border-amber-100">
                    <div className="text-lg font-black text-amber-600">Gold</div>
                    <div className="text-[9px] text-gray-400 font-bold">Member Status</div>
                  </div>
                  <div className="flex-1 bg-white rounded-xl p-2 text-center border border-amber-100">
                    <div className="text-lg font-black text-primary">2</div>
                    <div className="text-[9px] text-gray-400 font-bold">Coupons Unlocked</div>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>

        {/* ════════════════════════════════
            BOOKING ACTIONS
        ════════════════════════════════ */}
        <Section title="Booking Actions" icon="⚙️">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { icon: Utensils, label: 'View Menu', color: 'text-primary bg-primary/10', onClick: () => navigate('dineout-restaurant', { restaurantId }) },
              { icon: Users, label: 'Modify Booking', color: 'text-amber-600 bg-amber-50', onClick: () => alert('Modify Booking (Demo)') },
              { icon: X, label: 'Cancel Booking', color: 'text-red-500 bg-red-50', onClick: () => alert('Cancel Booking (Demo)') },
              { icon: Phone, label: 'Contact', color: 'text-blue-600 bg-blue-50', onClick: () => {} },
              { icon: Ticket, label: 'Book Another', color: 'text-emerald-600 bg-emerald-50', onClick: () => navigate('dineout') },
            ].map(a => (
              <button key={a.label} onClick={a.onClick}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl ${a.color} hover:shadow-soft transition-all min-h-0 min-w-0 border border-transparent hover:border-current/20`}>
                <a.icon size={18} />
                <span className="text-[10px] font-black">{a.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ════════════════════════════════
            SIMILAR RESTAURANTS
        ════════════════════════════════ */}
        <Section title="You May Also Like" icon="🍴">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {SIMILAR.map(s => (
              <div key={s.id} className="shrink-0 w-52 cursor-pointer group" onClick={() => navigate('dineout-restaurant', { restaurantId: s.id })}>
                <div className="relative h-28 rounded-2xl overflow-hidden mb-2">
                  <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-full">
                    <Star size={9} className="fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-black">{s.rating}</span>
                  </div>
                </div>
                <div className="font-black text-gray-800 text-xs truncate">{s.name}</div>
                <div className="text-[10px] text-gray-400 truncate">{s.cuisine}</div>
                <div className="flex items-center justify-between mt-0.5 text-[10px]">
                  <span className="text-emerald-600 font-bold">{s.available} seats free</span>
                  <span className="text-gray-400">{s.distance}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Notifications info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
          <Bell size={18} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <div className="font-black text-blue-800 text-sm mb-1">Notifications Enabled</div>
            <div className="text-xs text-blue-600 leading-relaxed space-y-0.5">
              <div>✓ Booking confirmed notification sent</div>
              <div>✓ 1-hour reminder will be sent before reservation</div>
              <div>✓ Restaurant acceptance updates enabled</div>
              <div>✓ Table-ready notification enabled</div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Share Sheet ── */}
      {showShareSheet && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowShareSheet(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-sm p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">Share Booking</h3>
              <button onClick={() => setShowShareSheet(false)} className="w-8 h-8 min-h-0 min-w-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <X size={16} className="text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'WhatsApp', color: 'bg-green-500', letter: 'W', href: `https://wa.me/?text=${encodeURIComponent(`🍽️ My DineOut Booking\n${restaurantName}\n📅 ${formatDateShort(date)} at ${timeDisplay(timeSlot)}\n👥 ${guestCount} guests\nBooking: ${bookingId}`)}` },
                { label: 'Telegram', color: 'bg-blue-500', letter: 'T', href: '#' },
                { label: 'Email', color: 'bg-gray-600', letter: '✉', href: `mailto:?subject=DineOut Booking - ${restaurantName}&body=Booking ID: ${bookingId}` },
                { label: 'Copy Link', color: 'bg-gray-800', letter: '🔗', href: '#' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                  className="flex flex-col items-center gap-1.5 min-h-0 min-w-0 group"
                  onClick={(e) => {
                    if (s.label === 'Copy Link') {
                      e.preventDefault();
                      navigator.clipboard?.writeText(`DineOut Booking: ${bookingId} at ${restaurantName}`).catch(() => {});
                      setShowShareSheet(false);
                    }
                  }}
                >
                  <div className={`w-12 h-12 rounded-2xl ${s.color} text-white flex items-center justify-center text-lg font-black group-hover:scale-110 transition-transform shadow-sm`}>
                    {s.letter}
                  </div>
                  <span className="text-[10px] text-gray-600 font-bold">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DineOutSuccessPage;
