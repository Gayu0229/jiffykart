import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigation } from '../hooks';
import {
  ChevronLeft, Check, Star, MapPin, Clock, Users, Calendar,
  Sparkles, Tag, Utensils, CreditCard, Smartphone, Building2,
  Wallet, QrCode, Copy, CheckCircle, AlertCircle, Loader2,
  ChevronDown, X, Shield, Info, Gift, Percent, Timer,
  Phone, Navigation2, Baby, Accessibility, PartyPopper,
  ArrowRight, RefreshCw, Banknote
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FoodOrderItem {
  name: string;
  qty: number;
  price: number;
  isVeg: boolean;
  note?: string;
}

interface CouponData {
  code: string;
  label: string;
  discount: number;
  type: 'flat' | 'percent';
  maxDiscount?: number;
  minOrder: number;
  description: string;
  color: string;
}

type PaymentMethod = 'upi' | 'credit' | 'debit' | 'netbanking' | 'wallet' | 'payatrestaurant';
type PaymentState = 'idle' | 'processing' | 'success' | 'failed';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_FOOD: FoodOrderItem[] = [
  { name: 'Hyderabadi Chicken Biryani', qty: 2, price: 380, isVeg: false, note: 'Extra spicy' },
  { name: 'Paneer Butter Masala', qty: 1, price: 280, isVeg: true },
  { name: 'Garlic Naan', qty: 4, price: 60, isVeg: true },
  { name: 'Gulab Jamun', qty: 2, price: 120, isVeg: true },
];

const COUPONS: CouponData[] = [
  { code: 'DINEOUT20', label: 'Flat 20% OFF', discount: 20, type: 'percent', maxDiscount: 200, minOrder: 500, description: 'Get 20% off up to ₹200 on your first dineout booking', color: 'from-primary to-secondary' },
  { code: 'WEEKEND50', label: '₹50 OFF', discount: 50, type: 'flat', minOrder: 300, description: 'Weekend special — Flat ₹50 off on food pre-orders', color: 'from-amber-500 to-orange-500' },
  { code: 'JIFFYPRIME', label: 'Prime ₹100 OFF', discount: 100, type: 'flat', minOrder: 800, description: 'Exclusive for JiffyKart Prime members', color: 'from-purple-500 to-violet-600' },
];

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: React.ElementType; sub: string }[] = [
  { key: 'upi', label: 'UPI', icon: QrCode, sub: 'Google Pay, PhonePe, Paytm' },
  { key: 'credit', label: 'Credit Card', icon: CreditCard, sub: 'Visa, Mastercard, RuPay' },
  { key: 'debit', label: 'Debit Card', icon: CreditCard, sub: 'All bank debit cards' },
  { key: 'netbanking', label: 'Net Banking', icon: Building2, sub: 'SBI, HDFC, ICICI & more' },
  { key: 'wallet', label: 'JiffyKart Wallet', icon: Wallet, sub: 'Balance: ₹1,250' },
  { key: 'payatrestaurant', label: 'Pay at Restaurant', icon: Banknote, sub: 'Cash / Card on arrival' },
];

const UPI_APPS = [
  { name: 'Google Pay', color: '#4285F4', letter: 'G' },
  { name: 'PhonePe', color: '#5F259F', letter: 'P' },
  { name: 'Paytm', color: '#00BAF2', letter: '₱' },
  { name: 'BHIM', color: '#00BFA5', letter: 'B' },
];

const POLICIES = [
  { title: 'Cancellation', desc: 'Free cancellation up to 1 hour before reservation. 50% charge within 30 minutes.', icon: '❌' },
  { title: 'Late Arrival', desc: 'Tables are held for 15 minutes past reservation time. Please inform for delays.', icon: '⏰' },
  { title: 'No-Show', desc: 'Full reservation fee will be charged for no-shows without prior cancellation.', icon: '🚫' },
  { title: 'Refund', desc: 'Refunds processed within 3-5 business days to original payment method.', icon: '💰' },
  { title: 'Outside Food', desc: 'Outside food not allowed. Birthday cakes permitted with prior arrangement.', icon: '🎂' },
  { title: 'Terms', desc: 'By confirming, you agree to restaurant and JiffyKart DineOut policies.', icon: '📋' },
];

const STEPPER = [
  { id: 1, label: 'Reservation', short: 'Seat' },
  { id: 2, label: 'Food Pre-Order', short: 'Food' },
  { id: 3, label: 'Review & Pay', short: 'Pay' },
  { id: 4, label: 'Booking Success', short: 'Done' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d: string) => {
  if (!d) return 'Today';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};
const timeDisplay = (t: string) => {
  if (!t) return '7:30 PM';
  const [h, m] = t.split(':').map(Number);
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// ─── Dynamic QR Generator (SVG-based) ────────────────────────────────────────
// Generates a deterministic pattern from the amount string to simulate a UPI QR.

function generateQRMatrix(data: string, size: number = 25): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  // Simple hash-based pseudo-random fill
  let hash = 0;
  for (let i = 0; i < data.length; i++) { hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0; }
  const seed = Math.abs(hash);
  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (r: number, c: number) => {
    for (let dr = 0; dr < 7; dr++) for (let dc = 0; dc < 7; dc++) {
      if (r + dr < size && c + dc < size) {
        matrix[r + dr][c + dc] = dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
      }
    }
  };
  drawFinder(0, 0); drawFinder(0, size - 7); drawFinder(size - 7, 0);
  // Fill data area
  let s = seed;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (matrix[r][c]) continue;
    if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) continue;
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    matrix[r][c] = (s % 3) < 1;
  }
  return matrix;
}

const DynamicQR: React.FC<{ amount: number; upiId: string }> = ({ amount, upiId }) => {
  const data = `upi://pay?pa=${upiId}&pn=JiffyKart DineOut&am=${amount}&cu=INR`;
  const matrix = useMemo(() => generateQRMatrix(data), [data]);
  const size = matrix.length;
  const cellSize = 6;
  const svgSize = size * cellSize;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(upiId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-soft inline-block">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {matrix.map((row, r) => row.map((cell, c) => cell ? (
            <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#1a1a2e" rx={1} />
          ) : null))}
        </svg>
      </div>
      <div className="mt-3 text-center">
        <div className="text-xs text-gray-400 font-semibold">Scan with any UPI app</div>
        <div className="flex items-center gap-1.5 justify-center mt-1">
          <span className="text-[11px] text-gray-500 font-bold">{upiId}</span>
          <button onClick={handleCopy} className="min-h-0 min-w-0 text-primary hover:text-secondary transition">
            {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
          </button>
        </div>
        <div className="font-black text-2xl text-gray-900 mt-2">₹{amount.toLocaleString('en-IN')}</div>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Stepper
const ReviewStepper: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex items-center justify-between relative py-3">
    <div className="absolute top-[22px] left-0 right-0 h-0.5 bg-gray-200 z-0">
      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((step - 1) / (STEPPER.length - 1)) * 100}%` }} />
    </div>
    {STEPPER.map(s => {
      const isDone = step > s.id;
      const isActive = step === s.id;
      return (
        <div key={s.id} className="flex flex-col items-center z-10 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all duration-300 ${isDone ? 'bg-primary border-primary text-white' : isActive ? 'bg-white border-primary text-primary shadow-glow' : 'bg-white border-gray-200 text-gray-300'}`}>
            {isDone ? <Check size={12} strokeWidth={3} /> : s.id}
          </div>
          <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-primary' : isDone ? 'text-primary/70' : 'text-gray-300'}`}>
            <span className="hidden md:inline">{s.label}</span>
            <span className="md:hidden">{s.short}</span>
          </span>
        </div>
      );
    })}
  </div>
);

// Veg Badge
const VBadge: React.FC<{ isVeg: boolean }> = ({ isVeg }) => (
  <span className={`inline-flex w-3.5 h-3.5 rounded-sm border-2 items-center justify-center shrink-0 ${isVeg ? 'border-green-500' : 'border-red-500'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
  </span>
);

// Section Card
const SectionCard: React.FC<{ title: string; icon?: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, icon, children, action }) => (
  <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100 animate-fade-in">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">{icon} {title}</h3>
      {action}
    </div>
    {children}
  </div>
);

// Payment Timer
const PaymentTimer: React.FC<{ onExpire: () => void }> = ({ onExpire }) => {
  const [secs, setSecs] = useState(600); // 10 minutes
  useEffect(() => {
    if (secs <= 0) { onExpire(); return; }
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, onExpire]);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  const urgent = secs < 120;
  return (
    <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border ${urgent ? 'bg-red-50 border-red-200 text-red-600' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
      <Timer size={14} className={urgent ? 'text-red-500' : 'text-amber-500'} />
      Reservation expires in <span className="font-black tabular-nums">{String(mins).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
    </div>
  );
};

// Payment Processing Overlay
const ProcessingOverlay: React.FC<{ state: PaymentState; onRetry: () => void; onCancel: () => void }> = ({ state, onRetry, onCancel }) => {
  const [step, setStep] = useState(0);
  const steps = ['Verifying Payment...', 'Securing Reservation...', 'Generating Booking ID...', 'Almost Done...'];

  useEffect(() => {
    if (state !== 'processing') return;
    const t = setInterval(() => setStep(s => s < steps.length - 1 ? s + 1 : s), 1200);
    return () => clearInterval(t);
  }, [state]);

  if (state === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center animate-slide-up">
        {state === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 size={32} className="text-primary animate-spin" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Processing Payment</h3>
            <div className="space-y-2 mb-4">
              {steps.map((s, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm transition-all duration-300 ${i < step ? 'text-emerald-600' : i === step ? 'text-primary font-bold' : 'text-gray-300'}`}>
                  {i < step ? <CheckCircle size={14} /> : i === step ? <Loader2 size={14} className="animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200" />}
                  {s}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">Please do not close or refresh this page</p>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Payment Failed</h3>
            <p className="text-sm text-gray-500 mb-6">Your payment could not be processed. No amount has been charged.</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 min-h-0 border-2 border-gray-200 text-gray-600 font-black rounded-2xl hover:border-gray-400 transition text-sm">
                Cancel
              </button>
              <button onClick={onRetry} className="flex-1 py-3 min-h-0 bg-primary text-white font-black rounded-2xl hover:bg-secondary transition text-sm flex items-center justify-center gap-2">
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Coupon Section
const CouponSection: React.FC<{
  applied: CouponData | null;
  subtotal: number;
  onApply: (c: CouponData) => void;
  onRemove: () => void;
}> = ({ applied, subtotal, onApply, onRemove }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  const handleApply = () => {
    const coupon = COUPONS.find(c => c.code.toLowerCase() === input.toLowerCase());
    if (!coupon) { setError('Invalid coupon code'); return; }
    if (subtotal < coupon.minOrder) { setError(`Minimum order ₹${coupon.minOrder} required`); return; }
    setError('');
    onApply(coupon);
    setInput('');
  };

  return (
    <div>
      {applied ? (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-emerald-600" />
            <div>
              <div className="text-xs font-black text-emerald-700">{applied.code} applied</div>
              <div className="text-[10px] text-emerald-600">{applied.label}</div>
            </div>
          </div>
          <button onClick={onRemove} className="text-xs text-red-500 font-bold min-h-0 min-w-0 hover:text-red-700">Remove</button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => { setInput(e.target.value.toUpperCase()); setError(''); }}
              placeholder="Enter coupon code"
              className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-primary transition placeholder:text-gray-400"
            />
            <button onClick={handleApply} className="bg-primary text-white px-4 py-2.5 rounded-xl font-black text-xs min-h-0 hover:bg-secondary transition">
              Apply
            </button>
          </div>
          {error && <p className="text-red-500 text-[11px] font-bold mt-1.5">{error}</p>}

          <button onClick={() => setShowAll(!showAll)} className="flex items-center gap-1 text-primary font-bold text-xs mt-3 min-h-0 min-w-0 hover:text-secondary transition">
            <Percent size={12} /> View available coupons
            <ChevronDown size={12} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
          </button>

          {showAll && (
            <div className="mt-3 space-y-2">
              {COUPONS.map(c => (
                <div key={c.code} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3 hover:border-primary/40 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black text-white bg-gradient-to-r ${c.color} px-2 py-0.5 rounded-full`}>{c.label}</span>
                      <span className="text-xs font-black text-gray-700">{c.code}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{c.description}</p>
                    <p className="text-[10px] text-gray-300">Min. order ₹{c.minOrder}</p>
                  </div>
                  <button
                    onClick={() => { if (subtotal >= c.minOrder) onApply(c); else setError(`Min ₹${c.minOrder} for ${c.code}`); }}
                    className="text-xs text-primary font-black min-h-0 min-w-0 hover:text-secondary transition"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export const DineOutReviewPage: React.FC<{
  restaurantId?: string;
  restaurantName?: string;
  seatType?: string;
  seatIcon?: string;
  date?: string;
  timeSlot?: string;
  guestCount?: number;
  occasion?: string;
  cartItems?: number;
  cartTotal?: number;
  onBack: () => void;
}> = ({
  restaurantId = '1',
  restaurantName = 'Nazhirya Restaurant',
  seatType = '6 Seater',
  seatIcon = '🎉',
  date = '',
  timeSlot = '',
  guestCount = 6,
  occasion = '',
  cartItems = 0,
  cartTotal = 0,
  onBack,
}) => {
  const { navigate } = useNavigation();

  // Use mock food if cartItems > 0 or default
  const foodItems: FoodOrderItem[] = useMemo(() => {
    if (cartItems > 0 || cartTotal > 0) return MOCK_FOOD;
    return [];
  }, [cartItems, cartTotal]);

  const hasFoodOrder = foodItems.length > 0;

  // Calculations
  const foodSubtotal = foodItems.reduce((s, f) => s + f.price * f.qty, 0);
  const reservationFee = 0;
  const gstRate = 0.05;
  const serviceCharge = hasFoodOrder ? 49 : 0;
  const gst = Math.round(foodSubtotal * gstRate);
  const subtotalBeforeCoupon = foodSubtotal + gst + serviceCharge + reservationFee;

  // State
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [showAllPolicies, setShowAllPolicies] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [timerExpired, setTimerExpired] = useState(false);

  // Coupon discount
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'flat') return appliedCoupon.discount;
    const d = Math.round(subtotalBeforeCoupon * appliedCoupon.discount / 100);
    return appliedCoupon.maxDiscount ? Math.min(d, appliedCoupon.maxDiscount) : d;
  }, [appliedCoupon, subtotalBeforeCoupon]);

  const grandTotal = Math.max(0, subtotalBeforeCoupon - couponDiscount);

  const canPay = agreedToPolicy && paymentMethod !== null && !timerExpired;

  // Payment flow
  const handlePay = useCallback(async () => {
    if (!canPay) return;
    setPaymentState('processing');
    await new Promise(r => setTimeout(r, 5000));
    // 85% success rate
    const success = Math.random() > 0.15;
    if (success) {
      setPaymentState('success');
      setTimeout(() => {
        navigate('dineout-success', {
          restaurantId,
          restaurantName,
          seatType,
          date,
          timeSlot,
          guestCount,
          grandTotal,
          bookingId: `JK-DO-${Date.now().toString(36).toUpperCase()}`,
        });
      }, 800);
    } else {
      setPaymentState('failed');
    }
  }, [canPay, navigate, restaurantId, restaurantName, seatType, date, timeSlot, guestCount, grandTotal]);

  const handleRetry = () => setPaymentState('idle');
  const handleCancel = () => { setPaymentState('idle'); onBack(); };

  // Timer expire
  const handleTimerExpire = useCallback(() => {
    setTimerExpired(true);
  }, []);

  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">

      {/* ── Top Bar ── */}
      <div className="sticky top-[56px] md:top-[64px] z-40 bg-white border-b border-gray-100 shadow-soft">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <button onClick={onBack} className="w-9 h-9 min-h-0 min-w-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition shrink-0">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-black text-gray-900 text-sm truncate">Review & Confirm</div>
              <div className="text-[11px] text-gray-500 truncate">{restaurantName}</div>
            </div>
            <PaymentTimer onExpire={handleTimerExpire} />
          </div>
          <ReviewStepper step={3} />
        </div>
      </div>

      {/* Timer expired warning */}
      {timerExpired && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-bold flex-1">Reservation timer expired. Your seat may no longer be available.</p>
            <button onClick={onBack} className="text-xs bg-red-500 text-white font-black px-3 py-1.5 rounded-lg min-h-0 hover:bg-red-600 transition">
              Rebook
            </button>
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="max-w-6xl mx-auto px-4 py-5 pb-32 md:pb-8">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ═══════════ LEFT: Review Content ═══════════ */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* 1. Restaurant Info */}
            <SectionCard title="Restaurant" icon="🏪">
              <div className="flex items-start gap-4">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80"
                  alt={restaurantName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-black text-gray-900 text-base">{restaurantName}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">South Indian • North Indian</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                    <span className="flex items-center gap-0.5 bg-amber-50 border border-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                      <Star size={10} className="fill-amber-400 text-amber-400" /> 4.5
                    </span>
                    <span className="text-gray-400 flex items-center gap-0.5"><MapPin size={10} /> 1.2 km</span>
                    <span className="text-gray-400 flex items-center gap-0.5"><Phone size={10} /> +91 98765 43210</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=13.0220,80.1925`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-3 py-1.5 rounded-lg min-h-0 min-w-0 hover:bg-primary/20 transition">
                  <Navigation2 size={11} /> Navigate
                </a>
                <a href="tel:+919876543210"
                  className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-lg min-h-0 min-w-0 hover:bg-gray-200 transition">
                  <Phone size={11} /> Call
                </a>
              </div>
            </SectionCard>

            {/* 2. Reservation Summary */}
            <SectionCard title="Reservation Details" icon="📋">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Users, label: 'Seat Type', value: `${seatIcon} ${seatType}` },
                  { icon: Users, label: 'Guests', value: `${guestCount} people` },
                  { icon: Calendar, label: 'Date', value: formatDate(date) },
                  { icon: Clock, label: 'Time', value: timeDisplay(timeSlot) },
                  { icon: Timer, label: 'Duration', value: '~90 minutes' },
                  { icon: Sparkles, label: 'Occasion', value: occasion || 'Not specified' },
                ].map(r => (
                  <div key={r.label} className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <r.icon size={13} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{r.label}</div>
                      <div className="text-xs font-black text-gray-800 mt-0.5 leading-tight truncate">{r.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                <span className="text-[11px] text-emerald-700 font-bold">Reservation Confirmed — Seat held for you</span>
              </div>
            </SectionCard>

            {/* 3. Food Order Summary */}
            <SectionCard
              title={hasFoodOrder ? `Food Pre-Order (${foodItems.length} items)` : 'Food Pre-Order'}
              icon="🍽️"
              action={hasFoodOrder ? (
                <button onClick={onBack} className="text-xs text-primary font-bold min-h-0 min-w-0 hover:text-secondary transition">Edit</button>
              ) : undefined}
            >
              {hasFoodOrder ? (
                <div className="space-y-2.5">
                  {foodItems.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <VBadge isVeg={f.isVeg} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-800 truncate">{f.name}</div>
                        {f.note && <div className="text-[10px] text-amber-600 italic mt-0.5">{f.note}</div>}
                      </div>
                      <span className="text-[11px] text-gray-400 font-semibold shrink-0">×{f.qty}</span>
                      <span className="text-xs font-black text-gray-700 shrink-0">₹{f.price * f.qty}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-2.5 mt-2">
                    <Clock size={13} className="text-amber-500 shrink-0" />
                    <div className="text-[11px]">
                      <span className="font-bold text-amber-700">Est. Preparation: 35 min</span>
                      <span className="text-amber-600"> — Food will be ready when you arrive at {timeDisplay(timeSlot)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Utensils size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-semibold mb-3">No food has been pre-ordered.</p>
                  <button onClick={onBack} className="bg-primary/10 text-primary text-xs font-black px-4 py-2 rounded-xl min-h-0 hover:bg-primary/20 transition">
                    + Add Food
                  </button>
                </div>
              )}
            </SectionCard>

            {/* 4. Dining Instructions */}
            <SectionCard title="Dining Instructions" icon="📝">
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Baby, label: 'Baby Chair', active: false },
                  { icon: Accessibility, label: 'Wheelchair', active: false },
                  { icon: PartyPopper, label: occasion === 'Birthday' ? 'Birthday Decoration' : 'Anniversary Decoration', active: !!occasion },
                ].map(d => (
                  <div key={d.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${d.active ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    <d.icon size={13} />
                    {d.label}
                    {d.active && <Check size={10} strokeWidth={3} />}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-3">Special requests will be shared with the restaurant. Availability is subject to confirmation.</p>
            </SectionCard>

            {/* 5. Restaurant Policies */}
            <SectionCard title="Restaurant Policies" icon="📜">
              <div className="space-y-2">
                {(showAllPolicies ? POLICIES : POLICIES.slice(0, 3)).map(p => (
                  <div key={p.title} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-lg shrink-0">{p.icon}</span>
                    <div>
                      <div className="text-xs font-black text-gray-700">{p.title}</div>
                      <div className="text-[10px] text-gray-400 leading-relaxed mt-0.5">{p.desc}</div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setShowAllPolicies(p => !p)} className="text-xs text-primary font-bold min-h-0 min-w-0 flex items-center gap-1 hover:text-secondary transition">
                  {showAllPolicies ? 'Show less' : 'View all policies'}
                  <ChevronDown size={12} className={`transition-transform ${showAllPolicies ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {/* Agree checkbox */}
              <label className="flex items-start gap-3 mt-4 p-3 bg-primary/5 border-2 border-primary/20 rounded-xl cursor-pointer hover:border-primary/40 transition select-none">
                <input type="checkbox" checked={agreedToPolicy} onChange={e => setAgreedToPolicy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-primary" />
                <span className="text-xs text-gray-700 font-semibold leading-snug">
                  I agree to the <strong className="text-primary">Restaurant Policies</strong>, <strong className="text-primary">Terms & Conditions</strong>, and <strong className="text-primary">Cancellation Policy</strong>.
                </span>
              </label>
            </SectionCard>

            {/* 6. Coupon */}
            <SectionCard title="Apply Coupon" icon="🎫">
              <CouponSection
                applied={appliedCoupon}
                subtotal={subtotalBeforeCoupon}
                onApply={setAppliedCoupon}
                onRemove={() => setAppliedCoupon(null)}
              />
            </SectionCard>

            {/* 7. Payment Method */}
            <SectionCard title="Payment Method" icon="💳">
              <div className="space-y-2">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setPaymentMethod(m.key)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all min-h-0 ${
                        isSelected ? 'border-primary bg-primary/5 shadow-glow' : 'border-gray-200 bg-white hover:border-primary/40'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-black ${isSelected ? 'text-primary' : 'text-gray-800'}`}>{m.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{m.sub}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'border-primary' : 'border-gray-300'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* UPI QR Section */}
              {paymentMethod === 'upi' && (
                <div className="mt-5 animate-fade-in">
                  <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 p-5">
                    <h4 className="font-black text-gray-800 text-sm text-center mb-4">Scan & Pay with UPI</h4>
                    <DynamicQR amount={grandTotal} upiId="jiffykart.dineout@ybl" />

                    {/* UPI App buttons */}
                    <div className="flex justify-center gap-3 mt-5">
                      {UPI_APPS.map(app => (
                        <button
                          key={app.name}
                          className="flex flex-col items-center gap-1 min-h-0 min-w-0 group"
                          onClick={handlePay}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: app.color }}
                          >
                            {app.letter}
                          </div>
                          <span className="text-[9px] text-gray-500 font-bold">{app.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-4 bg-blue-50 border border-blue-100 rounded-xl p-2.5">
                      <Shield size={13} className="text-blue-500 shrink-0" />
                      <span className="text-[10px] text-blue-700 font-semibold">100% Secure Payment — Encrypted with 256-bit SSL</span>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* ═══════════ RIGHT: Payment Summary Sidebar ═══════════ */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-[200px] space-y-4">
              {/* Summary Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-secondary to-primary p-4 text-white">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Payment Summary</div>
                  <div className="font-black text-base leading-tight truncate">{restaurantName}</div>
                </div>

                <div className="p-4 space-y-2.5">
                  {/* Quick info */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-semibold flex items-center gap-1"><Users size={11} className="text-primary" /> Seat</span>
                    <span className="font-black text-gray-700">{seatIcon} {seatType}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-semibold flex items-center gap-1"><Calendar size={11} className="text-primary" /> Date</span>
                    <span className="font-black text-gray-700">{formatDate(date).split(',')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-semibold flex items-center gap-1"><Clock size={11} className="text-primary" /> Time</span>
                    <span className="font-black text-gray-700">{timeDisplay(timeSlot)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-semibold flex items-center gap-1"><Users size={11} className="text-primary" /> Guests</span>
                    <span className="font-black text-gray-700">{guestCount}</span>
                  </div>

                  <div className="border-t border-dashed border-gray-100 my-2" />

                  {/* Pricing */}
                  {hasFoodOrder && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Food ({foodItems.length} items)</span>
                      <span className="font-bold text-gray-700">₹{foodSubtotal}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Reservation Fee</span>
                    <span className="font-bold text-emerald-600">{reservationFee === 0 ? 'FREE' : `₹${reservationFee}`}</span>
                  </div>
                  {hasFoodOrder && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">GST (5%)</span>
                        <span className="font-bold text-gray-700">₹{gst}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Service Charge</span>
                        <span className="font-bold text-gray-700">₹{serviceCharge}</span>
                      </div>
                    </>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600 flex items-center gap-1"><Tag size={10} /> Coupon</span>
                      <span className="font-bold text-emerald-600">−₹{couponDiscount}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                    <span className="font-black text-gray-800 text-sm">Grand Total</span>
                    <span className="font-black text-primary text-xl">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Security */}
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-1">
                    <Shield size={10} /> Secured by JiffyKart · 256-bit SSL
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePay}
                disabled={!canPay}
                className="w-full py-3.5 min-h-0 bg-primary text-white font-black text-sm rounded-2xl hover:bg-secondary transition-all shadow-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {grandTotal > 0 ? (
                  <><CreditCard size={16} /> Pay ₹{grandTotal.toLocaleString('en-IN')}</>
                ) : (
                  <><Check size={16} /> Confirm Booking</>
                )}
              </button>
              {!agreedToPolicy && <p className="text-center text-[10px] text-red-400 font-bold">Please accept the policies above</p>}
              {!paymentMethod && agreedToPolicy && <p className="text-center text-[10px] text-amber-500 font-bold">Select a payment method</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-400 font-semibold">Grand Total</div>
            <div className="font-black text-primary text-lg">₹{grandTotal.toLocaleString('en-IN')}</div>
          </div>
          <button
            onClick={handlePay}
            disabled={!canPay}
            className="shrink-0 bg-primary text-white font-black px-6 py-3 rounded-xl hover:bg-secondary transition min-h-0 text-sm disabled:opacity-40 flex items-center gap-2"
          >
            {grandTotal > 0 ? (
              <><CreditCard size={15} /> Pay Now</>
            ) : (
              <><Check size={15} /> Confirm</>
            )}
          </button>
        </div>
      </div>

      {/* ── Payment Processing Overlay ── */}
      <ProcessingOverlay state={paymentState} onRetry={handleRetry} onCancel={handleCancel} />
    </div>
  );
};

export default DineOutReviewPage;
