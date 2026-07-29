import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { useNavigation } from '../hooks';
import {
  ChevronLeft, ChevronRight, Check, Users, Calendar, Clock,
  Star, MapPin, Tag, AlertCircle, Info, X, Bell, Loader2,
  Sparkles, Heart, Coffee, Briefcase, Gift, Utensils, Baby,
  Accessibility, ChevronDown, TrendingUp, Flame
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeatCategory {
  type: string;
  icon: string;
  capacity: number;
  total: number;
  booked: number;
  available: number;
  bestFor: string;
  waitTime?: string;
  priceNote?: string;
}

interface TimeSlot {
  time: string;
  display: string;
  available: boolean;
  almostFull: boolean;
  period: 'lunch' | 'evening' | 'dinner';
}

interface BookingState {
  restaurantId: string;
  restaurantName: string;
  selectedCategory: SeatCategory | null;
  date: string;
  timeSlot: string;
  guestCount: number;
  occasion: string;
  specialRequests: string[];
  indoorOutdoor: 'indoor' | 'outdoor' | null;
  highChair: boolean;
  wheelchair: boolean;
  customNote: string;
}

type BookingAction =
  | { type: 'SET_CATEGORY'; payload: SeatCategory }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_TIME'; payload: string }
  | { type: 'SET_GUESTS'; payload: number }
  | { type: 'SET_OCCASION'; payload: string }
  | { type: 'TOGGLE_REQUEST'; payload: string }
  | { type: 'SET_SEATING'; payload: 'indoor' | 'outdoor' | null }
  | { type: 'TOGGLE_HIGH_CHAIR' }
  | { type: 'TOGGLE_WHEELCHAIR' }
  | { type: 'SET_NOTE'; payload: string };

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SEAT_CATEGORIES: SeatCategory[] = [
  { type: '2 Seater', icon: '👫', capacity: 2, total: 10, booked: 7, available: 3, bestFor: 'Perfect for Couples', waitTime: undefined, priceNote: 'Cosy corner tables' },
  { type: '4 Seater', icon: '👨‍👩‍👧‍👦', capacity: 4, total: 20, booked: 12, available: 8, bestFor: 'Ideal for Families', priceNote: 'Indoor & outdoor options' },
  { type: '6 Seater', icon: '🎉', capacity: 6, total: 12, booked: 10, available: 2, bestFor: 'Great for Friend Groups', waitTime: '~10 min', priceNote: 'Extended dining section' },
  { type: '8 Seater', icon: '💼', capacity: 8, total: 5, booked: 4, available: 1, bestFor: 'Corporate Meetings', waitTime: '~25 min', priceNote: 'Private dining available' },
  { type: '10+ Seater', icon: '🎊', capacity: 10, total: 3, booked: 3, available: 0, bestFor: 'Large Events & Parties', waitTime: '~45 min', priceNote: 'Banquet hall section' },
];

const TIME_SLOTS: TimeSlot[] = [
  { time: '11:30', display: '11:30 AM', available: true, almostFull: false, period: 'lunch' },
  { time: '12:00', display: '12:00 PM', available: true, almostFull: false, period: 'lunch' },
  { time: '12:30', display: '12:30 PM', available: true, almostFull: true, period: 'lunch' },
  { time: '13:00', display: '1:00 PM', available: false, almostFull: false, period: 'lunch' },
  { time: '13:30', display: '1:30 PM', available: false, almostFull: false, period: 'lunch' },
  { time: '14:00', display: '2:00 PM', available: true, almostFull: false, period: 'lunch' },
  { time: '19:00', display: '7:00 PM', available: true, almostFull: false, period: 'evening' },
  { time: '19:30', display: '7:30 PM', available: true, almostFull: true, period: 'evening' },
  { time: '20:00', display: '8:00 PM', available: false, almostFull: false, period: 'dinner' },
  { time: '20:30', display: '8:30 PM', available: true, almostFull: false, period: 'dinner' },
  { time: '21:00', display: '9:00 PM', available: true, almostFull: false, period: 'dinner' },
  { time: '21:30', display: '9:30 PM', available: true, almostFull: false, period: 'dinner' },
];

const OCCASIONS = [
  { label: 'Birthday', icon: Gift, color: 'text-pink-500 bg-pink-50 border-pink-200' },
  { label: 'Anniversary', icon: Heart, color: 'text-rose-500 bg-rose-50 border-rose-200' },
  { label: 'Family Dinner', icon: Users, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { label: 'Business Meeting', icon: Briefcase, color: 'text-gray-600 bg-gray-50 border-gray-200' },
  { label: 'Casual Dining', icon: Coffee, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { label: 'Date Night', icon: Sparkles, color: 'text-purple-500 bg-purple-50 border-purple-200' },
];

const SPECIAL_REQUESTS = [
  'Window Seat', 'Quiet Corner', 'Garden View', 'Candlelight Setup',
  'Cake & Decoration', 'Welcome Drink', 'Allergy Aware', 'Extra Napkins',
];

const STEPS = [
  { id: 1, label: 'Seat Type', shortLabel: 'Seat' },
  { id: 2, label: 'Reservation Details', shortLabel: 'Details' },
  { id: 3, label: 'Food Pre-Order', shortLabel: 'Pre-Order', coming: true },
  { id: 4, label: 'Review & Confirm', shortLabel: 'Review', coming: true },
];

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: BookingState = {
  restaurantId: '',
  restaurantName: 'Nazhirya Restaurant',
  selectedCategory: null,
  date: '',
  timeSlot: '',
  guestCount: 2,
  occasion: '',
  specialRequests: [],
  indoorOutdoor: 'indoor',
  highChair: false,
  wheelchair: false,
  customNote: '',
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_CATEGORY': return { ...state, selectedCategory: action.payload, guestCount: Math.min(state.guestCount, action.payload.capacity) };
    case 'SET_DATE': return { ...state, date: action.payload };
    case 'SET_TIME': return { ...state, timeSlot: action.payload };
    case 'SET_GUESTS': return { ...state, guestCount: action.payload };
    case 'SET_OCCASION': return { ...state, occasion: state.occasion === action.payload ? '' : action.payload };
    case 'TOGGLE_REQUEST': return { ...state, specialRequests: state.specialRequests.includes(action.payload) ? state.specialRequests.filter(r => r !== action.payload) : [...state.specialRequests, action.payload] };
    case 'SET_SEATING': return { ...state, indoorOutdoor: action.payload };
    case 'TOGGLE_HIGH_CHAIR': return { ...state, highChair: !state.highChair };
    case 'TOGGLE_WHEELCHAIR': return { ...state, wheelchair: !state.wheelchair };
    case 'SET_NOTE': return { ...state, customNote: action.payload };
    default: return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Booking Progress Stepper
const BookingStepper: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="w-full py-4 px-2">
    <div className="flex items-center justify-between relative">
      {/* Connector line */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
      {STEPS.map((step) => {
        const isDone = currentStep > step.id;
        const isActive = currentStep === step.id;
        return (
          <div key={step.id} className="flex flex-col items-center z-10 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 border-2 ${
              isDone ? 'bg-primary border-primary text-white scale-110' :
              isActive ? 'bg-white border-primary text-primary shadow-glow scale-110' :
              'bg-white border-gray-200 text-gray-300'
            }`}>
              {isDone ? <Check size={14} strokeWidth={3} /> : step.id}
            </div>
            <div className={`mt-1.5 text-center transition-colors duration-300 ${isActive ? 'text-primary font-black' : isDone ? 'text-primary/70 font-bold' : 'text-gray-300 font-semibold'}`}>
              <div className="hidden md:block text-[11px] leading-tight">{step.label}</div>
              <div className="md:hidden text-[10px] leading-tight">{step.shortLabel}</div>
              {step.coming && <div className="text-[9px] text-gray-300 font-normal">Phase {step.id === 3 ? '4' : '5'}</div>}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// Live Availability Badge
const LiveBadge: React.FC<{ count: number; pulsing?: boolean }> = ({ count, pulsing }) => (
  <div className={`flex items-center gap-1.5 text-[11px] font-bold ${count === 0 ? 'text-red-500' : count <= 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
    <span className="relative flex h-2 w-2">
      {pulsing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${count === 0 ? 'bg-red-500' : count <= 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
    </span>
    {count === 0 ? 'Full' : count <= 2 ? `Only ${count} left!` : `${count} available`}
  </div>
);

// Animated Count
const AnimatedCount: React.FC<{ val: number; className?: string }> = ({ val, className = '' }) => {
  const [display, setDisplay] = useState(val);
  const prev = useRef(val);

  useEffect(() => {
    if (val !== prev.current) {
      setDisplay(val);
      prev.current = val;
    }
  }, [val]);

  return <span key={display} className={`inline-block animate-fade-in ${className}`}>{display}</span>;
};

// Guest Counter
const GuestCounter: React.FC<{ value: number; max: number; onChange: (n: number) => void }> = ({ value, max, onChange }) => (
  <div className="flex items-center gap-4">
    <button
      disabled={value <= 1}
      onClick={() => onChange(value - 1)}
      className="w-10 h-10 min-w-0 min-h-0 rounded-full bg-gray-100 hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all font-black text-lg"
    >
      −
    </button>
    <div className="text-center">
      <div className="text-2xl font-black text-gray-900 leading-none">{value}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">of {max} max</div>
    </div>
    <button
      disabled={value >= max}
      onClick={() => onChange(value + 1)}
      className="w-10 h-10 min-w-0 min-h-0 rounded-full bg-gray-100 hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all font-black text-lg"
    >
      +
    </button>
  </div>
);

// Seat Category Card
const SeatCard: React.FC<{
  cat: SeatCategory;
  isSelected: boolean;
  liveAvailable: number;
  onSelect: (cat: SeatCategory) => void;
  onWaitlist: (cat: SeatCategory) => void;
  index: number;
}> = ({ cat, isSelected, liveAvailable, onSelect, onWaitlist, index }) => {
  const isFull = liveAvailable === 0;
  const isAlmostFull = liveAvailable > 0 && liveAvailable <= 2;
  const pct = cat.total > 0 ? ((cat.total - liveAvailable) / cat.total) * 100 : 100;

  return (
    <div
      className={`relative rounded-2xl border-2 p-4 transition-all duration-300 cursor-pointer animate-fade-in group ${
        isFull
          ? 'border-gray-200 bg-gray-50 cursor-default opacity-70'
          : isSelected
          ? 'border-primary bg-primary/5 shadow-glow scale-[1.02]'
          : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-soft hover:-translate-y-0.5'
      }`}
      style={{ animationDelay: `${index * 70}ms` }}
      onClick={() => { if (!isFull) onSelect(cat); }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      )}

      {/* Almost full badge */}
      {isAlmostFull && !isSelected && (
        <div className="absolute top-3 right-3 bg-amber-100 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
          <Flame size={9} /> Almost Full
        </div>
      )}

      {/* Full badge */}
      {isFull && (
        <div className="absolute top-3 right-3 bg-red-50 text-red-500 text-[10px] font-black px-2 py-0.5 rounded-full">
          Full
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{cat.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-black text-base ${isSelected ? 'text-primary' : 'text-gray-800'}`}>{cat.type}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{cat.bestFor}</div>
          {cat.priceNote && <div className="text-[10px] text-gray-400">{cat.priceNote}</div>}
        </div>
      </div>

      {/* Seat stats */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 bg-white rounded-xl p-2 text-center border border-gray-100 shadow-sm">
          <div className="text-[10px] text-gray-400 font-semibold">Total</div>
          <div className="font-black text-gray-700">{cat.total}</div>
        </div>
        <div className="flex-1 bg-rose-50 rounded-xl p-2 text-center border border-rose-100">
          <div className="text-[10px] text-rose-400 font-semibold">Booked</div>
          <div className="font-black text-rose-600">{cat.total - liveAvailable}</div>
        </div>
        <div className={`flex-1 rounded-xl p-2 text-center border ${isFull ? 'bg-gray-50 border-gray-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className={`text-[10px] font-semibold ${isFull ? 'text-gray-400' : 'text-emerald-500'}`}>Free</div>
          <div className={`font-black ${isFull ? 'text-gray-400' : 'text-emerald-600'}`}>
            <AnimatedCount val={liveAvailable} />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isFull ? 'bg-red-400' : isAlmostFull ? 'bg-amber-400' : 'bg-emerald-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Capacity & wait */}
      <div className="flex items-center justify-between text-[11px] mb-3">
        <span className="text-gray-500">Max {cat.capacity} guests</span>
        {cat.waitTime && isFull && (
          <span className="flex items-center gap-1 text-amber-600 font-bold">
            <Clock size={10} /> Wait {cat.waitTime}
          </span>
        )}
        {!isFull && <LiveBadge count={liveAvailable} pulsing={true} />}
      </div>

      {/* CTA */}
      {isFull ? (
        <button
          onClick={(e) => { e.stopPropagation(); onWaitlist(cat); }}
          className="w-full py-2 min-h-0 text-xs font-black border-2 border-amber-400 text-amber-600 rounded-xl hover:bg-amber-50 transition-all"
        >
          ⏳ Join Waitlist
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(cat); }}
          className={`w-full py-2 min-h-0 text-xs font-black rounded-xl transition-all ${
            isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-primary hover:text-white'
          }`}
        >
          {isSelected ? '✓ Selected' : 'Select'}
        </button>
      )}
    </div>
  );
};

// Time Slot Selector
const TimeSlotSelector: React.FC<{ selected: string; onChange: (t: string) => void }> = ({ selected, onChange }) => {
  const periods: { key: TimeSlot['period']; label: string; emoji: string }[] = [
    { key: 'lunch', label: 'Lunch', emoji: '☀️' },
    { key: 'evening', label: 'Evening', emoji: '🌅' },
    { key: 'dinner', label: 'Dinner', emoji: '🌙' },
  ];

  return (
    <div className="space-y-4">
      {periods.map(p => {
        const slots = TIME_SLOTS.filter(s => s.period === p.key);
        return (
          <div key={p.key}>
            <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              {p.emoji} {p.label}
            </div>
            <div className="flex flex-wrap gap-2">
              {slots.map(slot => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => onChange(slot.time)}
                  className={`relative px-3 py-2 rounded-xl text-xs font-bold min-h-0 min-w-0 transition-all ${
                    selected === slot.time
                      ? 'bg-primary text-white shadow-glow scale-105'
                      : slot.available
                      ? slot.almostFull
                        ? 'bg-amber-50 border-2 border-amber-300 text-amber-700 hover:border-amber-500'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
                      : 'bg-gray-50 border-2 border-gray-100 text-gray-300 cursor-not-allowed line-through'
                  }`}
                >
                  {slot.display}
                  {slot.almostFull && slot.available && selected !== slot.time && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white text-[8px] font-black px-1 rounded-full leading-tight">
                      ●
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 text-[10px] text-gray-400 pt-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />Available</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Almost Full</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200" />Unavailable</span>
      </div>
    </div>
  );
};

// Booking Summary Card
const BookingSummaryCard: React.FC<{
  booking: BookingState;
  liveCount: number;
  step: number;
  onBook: () => void;
}> = ({ booking, liveCount, step, onBook }) => {
  const cat = booking.selectedCategory;
  const canBook = !!cat && !!booking.date && !!booking.timeSlot;
  const slot = TIME_SLOTS.find(s => s.time === booking.timeSlot);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary to-primary p-4 text-white">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Booking Summary</div>
        <div className="font-black text-base leading-tight truncate">{booking.restaurantName}</div>
        <div className="flex items-center gap-1 mt-1">
          <Star size={11} className="fill-amber-300 text-amber-300" />
          <span className="text-sm font-bold">4.5</span>
          <span className="text-white/60 text-[11px]">· Chennai</span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Seat type */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
            <Users size={12} className="text-primary" /> Seat Type
          </span>
          <span className="text-xs font-black text-gray-800">
            {cat ? `${cat.icon} ${cat.type}` : <span className="text-gray-300">Not selected</span>}
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
            <Calendar size={12} className="text-primary" /> Date
          </span>
          <span className="text-xs font-black text-gray-800">
            {booking.date ? formatDate(booking.date) : <span className="text-gray-300">Not selected</span>}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
            <Clock size={12} className="text-primary" /> Time
          </span>
          <span className="text-xs font-black text-gray-800">
            {slot ? slot.display : <span className="text-gray-300">Not selected</span>}
          </span>
        </div>

        {/* Guests */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
            <Users size={12} className="text-primary" /> Guests
          </span>
          <span className="text-xs font-black text-gray-800">{booking.guestCount}</span>
        </div>

        {/* Occasion */}
        {booking.occasion && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
              <Sparkles size={12} className="text-primary" /> Occasion
            </span>
            <span className="text-xs font-black text-primary">{booking.occasion}</span>
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-dashed border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-semibold">Est. Duration</span>
            <span className="text-xs font-black text-gray-700">~90 minutes</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold">Reservation Fee</span>
            <span className="text-xs font-black text-emerald-600">FREE</span>
          </div>
        </div>

        {/* Live Availability */}
        {cat && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
            <span className="text-[11px] text-gray-600 font-semibold">Current Availability</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-black text-emerald-600">
                <AnimatedCount val={liveCount} /> seats free
              </span>
            </div>
          </div>
        )}

        {/* Book Button */}
        {step === 2 && (
          <button
            onClick={onBook}
            disabled={!canBook}
            className="w-full py-3 min-h-0 bg-primary text-white font-black rounded-xl hover:bg-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 shadow-glow"
          >
            <Check size={16} /> Confirm Reservation
          </button>
        )}

        {!canBook && step === 2 && (
          <p className="text-center text-[10px] text-gray-400">
            Complete all fields to confirm
          </p>
        )}
      </div>
    </div>
  );
};

// Waitlist Dialog
const WaitlistDialog: React.FC<{
  cat: SeatCategory | null;
  restaurantName: string;
  onClose: () => void;
  onJoin: () => void;
}> = ({ cat, restaurantName, onClose, onJoin }) => {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setJoined(true);
  };

  if (!cat) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md p-6 shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {joined ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">You're on the Waitlist!</h3>
            <p className="text-gray-500 text-sm mb-1">Position: <strong className="text-primary">#3</strong> in queue</p>
            <p className="text-gray-500 text-sm mb-6">We'll notify you when a {cat.type} becomes available.</p>
            <button
              onClick={() => {
                onJoin();
                // Redirect directly to the Waitlist Tracking Page (Phase 7)
                navigate('dineout-waitlist', {
                  restaurantId: '1',
                  restaurantName,
                  seatType: cat.type,
                  guestCount: cat.capacity,
                  initialQueue: 3,
                  initialWait: 18
                });
              }}
              className="w-full py-3 min-h-0 bg-primary text-white font-black rounded-2xl hover:bg-secondary transition"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-900">Join Waitlist</h3>
              <button onClick={onClose} className="w-8 h-8 min-h-0 min-w-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
              <span className="text-2xl">{cat.icon}</span>
              <div>
                <div className="font-black text-gray-800 text-sm">{cat.type} — Fully Booked</div>
                <div className="text-xs text-gray-500 mt-0.5">{restaurantName}</div>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm text-gray-600 font-semibold flex items-center gap-2"><Clock size={14} className="text-primary" /> Est. Wait Time</span>
                <span className="text-sm font-black text-amber-600">{cat.waitTime || '~30 min'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm text-gray-600 font-semibold flex items-center gap-2"><Users size={14} className="text-primary" /> Queue Position</span>
                <span className="text-sm font-black text-gray-800">#3</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm text-gray-600 font-semibold flex items-center gap-2"><Bell size={14} className="text-primary" /> Notify via</span>
                <span className="text-sm font-black text-primary">Push + SMS</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 min-h-0 border-2 border-gray-200 text-gray-600 font-black rounded-2xl hover:border-gray-400 transition text-sm">
                Cancel
              </button>
              <button onClick={handleJoin} disabled={loading} className="flex-1 py-3 min-h-0 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 transition text-sm flex items-center justify-center gap-2 disabled:opacity-70">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Bell size={15} />}
                {loading ? 'Joining...' : 'Notify Me'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Validation helper
function validateStep2(booking: BookingState): string[] {
  const errs: string[] = [];
  if (!booking.date) errs.push('Please select a reservation date.');
  if (!booking.timeSlot) errs.push('Please select a time slot.');
  if (booking.guestCount < 1) errs.push('Guest count must be at least 1.');
  if (booking.selectedCategory && booking.guestCount > booking.selectedCategory.capacity) {
    errs.push(`Guest count cannot exceed ${booking.selectedCategory.capacity} for a ${booking.selectedCategory.type}.`);
  }
  return errs;
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export const DineOutBookingPage: React.FC<{ restaurantId: string; onBack: () => void }> = ({ restaurantId, onBack }) => {
  const { navigate } = useNavigation();
  const [step, setStep] = useState(1);
  const [booking, dispatch] = useReducer(bookingReducer, {
    ...initialState,
    restaurantId,
    restaurantName: restaurantId === '2' ? 'BBQ Nation' : restaurantId === '1' ? 'Nazhirya Restaurant' : 'Restaurant',
  });
  const [liveSeats, setLiveSeats] = useState<Record<string, number>>(
    Object.fromEntries(SEAT_CATEGORIES.map(c => [c.type, c.available]))
  );
  const [waitlistTarget, setWaitlistTarget] = useState<SeatCategory | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummaryMobile, setShowSummaryMobile] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // ── Simulate live seat count updates ────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSeats(prev => {
        const next = { ...prev };
        const categories = SEAT_CATEGORIES.filter(c => prev[c.type] > 0);
        if (categories.length === 0) return prev;
        const pick = categories[Math.floor(Math.random() * categories.length)];
        if (pick && prev[pick.type] > 0) {
          next[pick.type] = Math.max(0, prev[pick.type] - 1);
        }
        return next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const selectedLiveCount = booking.selectedCategory ? (liveSeats[booking.selectedCategory.type] ?? 0) : 0;

  // ── Step 1 → Step 2 ──────────────────────────────────────────────────────────
  const handleNextStep = useCallback(() => {
    if (step === 1) {
      if (!booking.selectedCategory) {
        setErrors(['Please select a seat type to continue.']);
        return;
      }
      setErrors([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep(2);
    } else if (step === 2) {
      const errs = validateStep2(booking);
      if (errs.length) { setErrors(errs); return; }
      setErrors([]);
      handleConfirm();
    }
  }, [step, booking]);

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    // Navigate to Phase 4 — Food Pre-Order
    navigate('dineout-preorder', {
      restaurantId,
      restaurantName: booking.restaurantName,
      seatType: booking.selectedCategory?.type,
      seatIcon: booking.selectedCategory?.icon,
      date: booking.date,
      timeSlot: booking.timeSlot,
      guestCount: booking.guestCount,
      occasion: booking.occasion,
    });
  }, [booking, navigate, restaurantId]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top Bar ── */}
      <div className="sticky top-[56px] md:top-[64px] z-40 bg-white border-b border-gray-100 shadow-soft">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : onBack()}
              className="w-9 h-9 min-h-0 min-w-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition shrink-0"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-black text-gray-900 text-sm truncate">
                {step === 1 ? 'Select Seat Type' : 'Reservation Details'}
              </div>
              <div className="text-[11px] text-gray-500 truncate">{booking.restaurantName}</div>
            </div>
            {/* Mobile summary toggle */}
            <button
              onClick={() => setShowSummaryMobile(p => !p)}
              className="md:hidden flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-black px-3 py-1.5 rounded-full min-h-0 min-w-0"
            >
              Summary <ChevronDown size={12} className={`transition-transform ${showSummaryMobile ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {/* Stepper */}
          <BookingStepper currentStep={step} />
        </div>
      </div>

      {/* ── Mobile Summary (collapsible) ── */}
      {showSummaryMobile && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pb-4">
          <BookingSummaryCard booking={booking} liveCount={selectedLiveCount} step={step} onBook={handleNextStep} />
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-32 md:pb-10">
        <div className="flex flex-col md:flex-row gap-6">

          {/* ── Left: Step Content ── */}
          <div className="flex-1 min-w-0" ref={formRef}>

            {/* ═══════════════════════════════════════
                STEP 1 — SEAT SELECTION
            ═══════════════════════════════════════ */}
            {step === 1 && (
              <div className="animate-fade-in space-y-5">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 mb-1">Select Your Seat Type</h1>
                  <p className="text-gray-500 text-sm">Choose the seating arrangement that suits your group best.</p>
                </div>

                {/* Error */}
                {errors.length > 0 && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-600 font-semibold">{errors[0]}</div>
                  </div>
                )}

                {/* Live update notice */}
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-bold text-emerald-700">Live availability</span>
                  <span className="text-gray-400">— seat counts update in real-time</span>
                </div>

                {/* Seat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SEAT_CATEGORIES.map((cat, i) => (
                    <SeatCard
                      key={cat.type}
                      cat={cat}
                      isSelected={booking.selectedCategory?.type === cat.type}
                      liveAvailable={liveSeats[cat.type] ?? cat.available}
                      onSelect={cat => dispatch({ type: 'SET_CATEGORY', payload: cat })}
                      onWaitlist={cat => setWaitlistTarget(cat)}
                      index={i}
                    />
                  ))}
                </div>

                {/* Next button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNextStep}
                    className="flex items-center gap-2 bg-primary text-white font-black px-8 py-3 rounded-2xl hover:bg-secondary transition-all min-h-0 shadow-glow text-sm"
                  >
                    Next: Reservation Details <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════
                STEP 2 — RESERVATION FORM
            ═══════════════════════════════════════ */}
            {step === 2 && (
              <div className="animate-fade-in space-y-5">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 mb-1">Reservation Details</h1>
                  <p className="text-gray-500 text-sm">Tell us when you'd like to arrive and who's joining.</p>
                </div>

                {/* Selected category reminder */}
                {booking.selectedCategory && (
                  <div className="flex items-center gap-3 bg-primary/5 border-2 border-primary/20 rounded-2xl p-3">
                    <span className="text-2xl">{booking.selectedCategory.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-primary text-sm">{booking.selectedCategory.type} — Selected</div>
                      <div className="text-[11px] text-gray-500">{booking.selectedCategory.bestFor}</div>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-primary font-bold underline min-h-0 min-w-0 hover:text-secondary transition"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Error */}
                {errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                    {errors.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-red-600 font-semibold">
                        <AlertCircle size={14} className="shrink-0" /> {e}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Date ── */}
                <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
                  <label className="block font-black text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <Calendar size={15} className="text-primary" /> Reservation Date *
                  </label>
                  <input
                    type="date"
                    min={getTodayStr()}
                    value={booking.date}
                    onChange={e => dispatch({ type: 'SET_DATE', payload: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                  />
                  {booking.date && (
                    <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                      <Check size={12} /> {formatDate(booking.date)}
                    </p>
                  )}
                </div>

                {/* ── Time Slots ── */}
                <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
                  <label className="block font-black text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <Clock size={15} className="text-primary" /> Choose Time Slot *
                  </label>
                  <TimeSlotSelector
                    selected={booking.timeSlot}
                    onChange={t => dispatch({ type: 'SET_TIME', payload: t })}
                  />
                </div>

                {/* ── Guest Count ── */}
                <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
                  <label className="block font-black text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <Users size={15} className="text-primary" /> Number of Guests *
                  </label>
                  <GuestCounter
                    value={booking.guestCount}
                    max={booking.selectedCategory?.capacity ?? 10}
                    onChange={n => dispatch({ type: 'SET_GUESTS', payload: n })}
                  />
                  {booking.selectedCategory && (
                    <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                      <Info size={11} /> Maximum {booking.selectedCategory.capacity} guests for {booking.selectedCategory.type}
                    </p>
                  )}
                </div>

                {/* ── Occasion ── */}
                <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
                  <label className="block font-black text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <Sparkles size={15} className="text-primary" /> Occasion <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {OCCASIONS.map(o => {
                      const Icon = o.icon;
                      const isSelected = booking.occasion === o.label;
                      return (
                        <button
                          key={o.label}
                          onClick={() => dispatch({ type: 'SET_OCCASION', payload: o.label })}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all min-h-0 min-w-0 ${
                            isSelected
                              ? `${o.color} border-current scale-[1.02]`
                              : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <Icon size={13} />
                          {o.label}
                          {isSelected && <Check size={11} className="ml-auto" strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Special Requests ── */}
                <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
                  <label className="block font-black text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <Utensils size={15} className="text-primary" /> Special Requests <span className="text-gray-400 font-normal">(optional)</span>
                  </label>

                  {/* Seating preference */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Seating Preference</p>
                    <div className="flex gap-2">
                      {(['indoor', 'outdoor', null] as const).map(pref => (
                        <button
                          key={String(pref)}
                          onClick={() => dispatch({ type: 'SET_SEATING', payload: pref })}
                          className={`flex-1 py-2 min-h-0 text-xs font-black rounded-xl border-2 transition-all ${
                            booking.indoorOutdoor === pref
                              ? 'bg-primary border-primary text-white'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-primary/40'
                          }`}
                        >
                          {pref === null ? 'No Pref.' : pref === 'indoor' ? '🏠 Indoor' : '🌿 Outdoor'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accessibility */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Accessibility</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => dispatch({ type: 'TOGGLE_HIGH_CHAIR' })}
                        className={`flex items-center gap-2 px-3 py-2 min-h-0 min-w-0 rounded-xl border-2 text-xs font-bold transition-all ${
                          booking.highChair ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-200'
                        }`}
                      >
                        <Baby size={13} />
                        {booking.highChair && <Check size={10} strokeWidth={3} />}
                        High Chair
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'TOGGLE_WHEELCHAIR' })}
                        className={`flex items-center gap-2 px-3 py-2 min-h-0 min-w-0 rounded-xl border-2 text-xs font-bold transition-all ${
                          booking.wheelchair ? 'bg-orange-50 border-orange-400 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-200'
                        }`}
                      >
                        <Accessibility size={13} />
                        {booking.wheelchair && <Check size={10} strokeWidth={3} />}
                        Wheelchair
                      </button>
                    </div>
                  </div>

                  {/* Quick request chips */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quick Requests</p>
                    <div className="flex flex-wrap gap-2">
                      {SPECIAL_REQUESTS.map(req => {
                        const isSelected = booking.specialRequests.includes(req);
                        return (
                          <button
                            key={req}
                            onClick={() => dispatch({ type: 'TOGGLE_REQUEST', payload: req })}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all min-h-0 min-w-0 ${
                              isSelected
                                ? 'bg-primary border-primary text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-primary/50'
                            }`}
                          >
                            {isSelected && <Check size={9} className="inline mr-1" strokeWidth={3} />}
                            {req}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom note */}
                  <div className="mt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Additional Note</p>
                    <textarea
                      placeholder="Any other special requests or dietary requirements..."
                      value={booking.customNote}
                      onChange={e => dispatch({ type: 'SET_NOTE', payload: e.target.value })}
                      rows={3}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-primary focus:bg-white transition-all resize-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 border-2 border-gray-200 text-gray-600 font-black px-6 py-3 rounded-2xl hover:border-gray-400 transition min-h-0 text-sm"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-black px-8 py-3 rounded-2xl hover:bg-secondary transition-all min-h-0 shadow-glow text-sm disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Confirming...</>
                    ) : (
                      <><Check size={16} /> Confirm Reservation</>
                    )}
                  </button>
                </div>

                {/* Steps coming notice */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Utensils size={18} className="text-purple-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-black text-purple-800 text-sm">Food Pre-Order Coming in Phase 4!</div>
                      <div className="text-xs text-purple-600 mt-0.5">After confirming your seat, you'll be able to browse and pre-order food items for your table.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Sticky Summary (desktop) ── */}
          <div className="hidden md:block w-80 shrink-0">
            <div className="sticky top-[200px]">
              <BookingSummaryCard
                booking={booking}
                liveCount={selectedLiveCount}
                step={step}
                onBook={handleNextStep}
              />
              {/* Updated just now */}
              <div className="mt-3 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Availability updated just now
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-gray-800 truncate">
              {booking.selectedCategory ? `${booking.selectedCategory.icon} ${booking.selectedCategory.type}` : 'No seat selected'}
            </div>
            <div className="text-[10px] text-gray-400">
              {booking.date ? formatDate(booking.date) : 'Pick a date'} · {booking.timeSlot ? TIME_SLOTS.find(s => s.time === booking.timeSlot)?.display : 'Pick a time'}
            </div>
          </div>
          <button
            onClick={handleNextStep}
            disabled={isSubmitting || (step === 1 && !booking.selectedCategory)}
            className="shrink-0 bg-primary text-white font-black px-5 py-2.5 rounded-xl hover:bg-secondary transition min-h-0 text-sm disabled:opacity-40 flex items-center gap-1.5"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {step === 1 ? 'Continue' : 'Confirm'}
            {!isSubmitting && <ChevronRight size={15} />}
          </button>
        </div>
      </div>

      {/* ── Waitlist Dialog ── */}
      {waitlistTarget && (
        <WaitlistDialog
          cat={waitlistTarget}
          restaurantName={booking.restaurantName}
          onClose={() => setWaitlistTarget(null)}
          onJoin={() => setWaitlistTarget(null)}
        />
      )}
    </div>
  );
};

export default DineOutBookingPage;
