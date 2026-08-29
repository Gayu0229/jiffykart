import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '../hooks';
import {
  ChevronLeft, Calendar, Clock, Users, Search, Filter, Shield, CheckCircle,
  AlertCircle, Star, QrCode, FileText, Download, Share2, Award, Zap,
  Bell, Check, X, Phone, MessageSquare, Navigation2, RefreshCw, Grid,
  ThumbsUp, Heart, TrendingUp, Info, Activity, Flame, ChevronRight, Sparkles
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  seatType: string;
  guestCount: number;
  date: string;
  timeSlot: string;
  status: 'Confirmed' | 'Accepted' | 'Preparing' | 'Customer On The Way' | 'Checked-In' | 'Dining' | 'Completed' | 'Cancelled' | 'Expired' | 'No Show';
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  grandTotal: number;
  hasPreOrder: boolean;
  foodItems?: string[];
  duration?: string;
  ratingGiven?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  category: 'bookings' | 'waitlist' | 'promotions' | 'updates';
  read: boolean;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'JKD202600124',
    restaurantId: '1',
    restaurantName: 'Nazhirya Restaurant',
    restaurantImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
    seatType: '6 Seater',
    guestCount: 6,
    date: '2026-07-12',
    timeSlot: '19:30',
    status: 'Confirmed',
    paymentStatus: 'Paid',
    grandTotal: 2450,
    hasPreOrder: true,
    foodItems: ['Hyderabadi Chicken Biryani x2', 'Paneer Butter Masala x1', 'Garlic Naan x4'],
    duration: '~90 minutes'
  },
  {
    id: 'JKD202600099',
    restaurantId: '2',
    restaurantName: 'BBQ Nation',
    restaurantImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
    seatType: '4 Seater',
    guestCount: 4,
    date: '2026-07-10',
    timeSlot: '20:00',
    status: 'Completed',
    paymentStatus: 'Paid',
    grandTotal: 1890,
    hasPreOrder: true,
    foodItems: ['Assorted Kebabs Platter', 'Chocolate Brownie x2'],
    duration: '~120 minutes',
    ratingGiven: 5
  },
  {
    id: 'JKD202600088',
    restaurantId: '3',
    restaurantName: 'The Spice House',
    restaurantImage: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80',
    seatType: '2 Seater',
    guestCount: 2,
    date: '2026-06-25',
    timeSlot: '13:00',
    status: 'Completed',
    paymentStatus: 'Paid',
    grandTotal: 850,
    hasPreOrder: false,
    duration: '~60 minutes',
    ratingGiven: 4
  },
  {
    id: 'JKD202600045',
    restaurantId: '4',
    restaurantName: 'A2B Adyar Ananda Bhavan',
    restaurantImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    seatType: '4 Seater',
    guestCount: 4,
    date: '2026-06-15',
    timeSlot: '09:30',
    status: 'Cancelled',
    paymentStatus: 'Refunded',
    grandTotal: 450,
    hasPreOrder: false,
    duration: '~45 minutes'
  }
];

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', title: 'Booking Confirmed 🎉', description: 'Your reservation JKD202600124 at Nazhirya Restaurant is confirmed!', time: '10 mins ago', category: 'bookings', read: false },
  { id: 'n2', title: 'Payment Successful 💳', description: 'Payment of ₹2,450 for booking JKD202600124 was successful.', time: '10 mins ago', category: 'bookings', read: false },
  { id: 'n3', title: 'Queue Update 🔔', description: 'Smart Waitlist position updated for BBQ Nation.', time: '2 hours ago', category: 'waitlist', read: true },
  { id: 'n4', title: '20% Weekend Promo! 🎫', description: 'Pre-order food this weekend and get flat 20% off using code WEEKEND20.', time: '1 day ago', category: 'promotions', read: true }
];

// SVG QR Generator simulated pattern
function generateQRMatrix(data: string, size: number = 21): boolean[][] {
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
  let s = seed;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (matrix[r][c]) continue;
    if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) continue;
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    matrix[r][c] = (s % 3) < 1;
  }
  return matrix;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const DineOutDashboardPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { navigate } = useNavigation();

  // Dashboard Sub-navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'history' | 'notifications' | 'rewards'>('bookings');

  // Page 1 filter / tab sub-states
  const [bookingsTab, setBookingsTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Page 2 details detail modal/overlay
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  // Review & Rating Modal states
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [ratingInput, setRatingInput] = useState({ restaurant: 5, food: 5, service: 5 });
  const [reviewText, setReviewText] = useState('');

  // Statistics memo
  const stats = useMemo(() => {
    return {
      total: MOCK_BOOKINGS.length,
      spent: MOCK_BOOKINGS.filter(b => b.status === 'Completed').reduce((sum, b) => sum + b.grandTotal, 0),
      visited: MOCK_BOOKINGS.filter(b => b.status === 'Completed').length,
      avgRating: 4.5
    };
  }, []);

  // Filter Bookings List
  const filteredBookings = useMemo(() => {
    return MOCK_BOOKINGS.filter(b => {
      // Tab matching
      if (bookingsTab === 'upcoming' && b.status !== 'Confirmed' && b.status !== 'Accepted') return false;
      if (bookingsTab === 'completed' && b.status !== 'Completed') return false;
      if (bookingsTab === 'cancelled' && b.status !== 'Cancelled') return false;

      // Search query matching
      if (searchQuery && !b.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) && !b.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // Status dropdown matching
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      return true;
    });
  }, [bookingsTab, searchQuery, statusFilter]);

  // Handle rebook (pre-fill restaurant details & pre-orders)
  const handleRebook = (booking: Booking) => {
    navigate('dineout-restaurant', {
      restaurantId: booking.restaurantId,
      prefilledSeat: booking.seatType,
      prefilledGuests: booking.guestCount
    });
  };

  // Handle Review submission
  const submitReview = () => {
    alert('Thank you for your rating & feedback! 🌟');
    setReviewBooking(null);
    setReviewText('');
  };

  const handleDownloadInvoice = () => {
    alert('Invoice downloaded successfully! (Demo PDF Generated)');
  };

  // Helper date formatter
  const formatDateShort = (d: string) => {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      
      {/* Confetti & overlay widgets for ratings/reviews */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900 text-sm">Rate Experience</h3>
              <button onClick={() => setReviewBooking(null)} className="p-1 rounded-full hover:bg-gray-100"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 font-bold">Restaurant Rating</span>
                <div className="flex gap-1.5 mt-1">
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => setRatingInput(p => ({ ...p, restaurant: v }))} className="text-amber-400">
                      <Star className={v <= ratingInput.restaurant ? 'fill-amber-400' : 'text-gray-200'} size={24} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-bold">Food Quality</span>
                <div className="flex gap-1.5 mt-1">
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => setRatingInput(p => ({ ...p, food: v }))} className="text-amber-400">
                      <Star className={v <= ratingInput.food ? 'fill-amber-400' : 'text-gray-200'} size={24} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Write your review here..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-primary transition"
              />
              <button onClick={submitReview} className="w-full py-3 bg-primary text-white font-black rounded-xl text-xs hover:bg-secondary transition min-h-0">
                Submit Review
              </button>
            </div>
          </div>
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
              <h1 className="font-black text-gray-900 text-sm md:text-base">DineOut Dashboard</h1>
              <p className="text-[11px] text-gray-500">Manage reservations, tracker, and rewards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white border-b border-gray-200/60 sticky top-[108px] md:top-[120px] z-30">
        <div className="max-w-6xl mx-auto px-4 flex gap-6 overflow-x-auto no-scrollbar">
          {[
            { key: 'bookings', label: 'My Bookings' },
            { key: 'history', label: 'History & Stats' },
            { key: 'notifications', label: 'Alerts Hub' },
            { key: 'rewards', label: 'DineOut Loyalty' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`py-3.5 border-b-2 font-black text-xs transition-all whitespace-nowrap min-h-0 min-w-0 ${
                activeSubTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">

        {/* ════════════════════════════════
            SUB-TAB: MY BOOKINGS
        ════════════════════════════════ */}
        {activeSubTab === 'bookings' && (
          <div className="space-y-6">
            {/* Search, Filter & Tabs bar */}
            <div className="bg-white rounded-3xl p-4 shadow-soft border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Inner Tab Pill Switch */}
              <div className="flex gap-1 bg-gray-50 p-1 rounded-xl">
                {['upcoming', 'completed', 'cancelled'].map(t => (
                  <button
                    key={t}
                    onClick={() => setBookingsTab(t as any)}
                    className={`text-[10px] font-black py-1.5 px-4 rounded-lg capitalize transition min-h-0 min-w-0 ${
                      bookingsTab === t ? 'bg-white text-primary shadow-soft' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Search & Status Filters */}
              <div className="flex items-center gap-2 flex-1 md:justify-end">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 max-w-xs">
                  <Search size={14} className="text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search restaurant..."
                    className="bg-transparent text-xs text-gray-700 outline-none w-full"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* List */}
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-soft">
                <Calendar size={48} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-semibold">No bookings found</p>
                <p className="text-gray-300 text-xs mt-1">Try changing filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBookings.map(booking => (
                  <div key={booking.id} className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                    <div className="p-5 flex gap-4">
                      <img src={booking.restaurantImage} alt={booking.restaurantName} className="w-16 h-16 rounded-2xl object-cover shrink-0 border" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-black text-gray-800 text-sm truncate">{booking.restaurantName}</h3>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            booking.status === 'Confirmed' ? 'text-green-600 bg-green-50' :
                            booking.status === 'Completed' ? 'text-blue-600 bg-blue-50' :
                            'text-gray-400 bg-gray-100'
                          }`}>{booking.status}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">Booking ID: {booking.id}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 font-semibold">
                          <span className="flex items-center gap-0.5"><Users size={11} /> {booking.guestCount} guests</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Clock size={11} /> {booking.timeSlot}</span>
                        </div>
                      </div>
                    </div>
                    {/* Foot Actions */}
                    <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-3.5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="text-[10px] text-primary font-black bg-primary/10 px-4 py-2 rounded-xl min-h-0 hover:bg-primary/20 transition"
                      >
                        View Ticket
                      </button>
                      <div className="flex items-center gap-1.5">
                        {booking.status === 'Completed' && (
                          <button
                            onClick={() => setReviewBooking(booking)}
                            className="text-[10px] text-amber-600 border border-amber-200 bg-amber-50 px-3.5 py-2 rounded-xl min-h-0 hover:bg-amber-100 transition"
                          >
                            Rate
                          </button>
                        )}
                        <button
                          onClick={() => handleRebook(booking)}
                          className="text-[10px] text-gray-700 border border-gray-200 bg-white px-3.5 py-2 rounded-xl min-h-0 hover:bg-gray-50 transition"
                        >
                          Book Again
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════
            SUB-TAB: HISTORY & STATS
        ════════════════════════════════ */}
        {activeSubTab === 'history' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Reservations', value: stats.total, color: 'from-blue-500 to-indigo-600', icon: '📅' },
                { label: 'Visited Restaurants', value: stats.visited, color: 'from-emerald-400 to-green-500', icon: '🏪' },
                { label: 'Total Money Spent', value: `₹${stats.spent.toLocaleString('en-IN')}`, color: 'from-amber-400 to-orange-500', icon: '💰' },
                { label: 'Avg Rating Given', value: `${stats.avgRating} / 5.0`, color: 'from-purple-500 to-violet-600', icon: '⭐' }
              ].map(s => (
                <div key={s.label} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft">
                  <span className="text-2xl">{s.icon}</span>
                  <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-2">{s.label}</div>
                  <div className="font-black text-gray-800 text-lg mt-1">{s.value}</div>
                </div>
              ))}
            </div>

            {/* History Table/List */}
            <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100">
              <h3 className="font-black text-gray-900 text-sm mb-4">Past Dinings</h3>
              <div className="space-y-3.5">
                {MOCK_BOOKINGS.filter(b => b.status === 'Completed').map(b => (
                  <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                    <div>
                      <h4 className="font-black text-gray-800 text-sm">{b.restaurantName}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDateShort(b.date)} · {b.seatType} · {b.duration}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right sm:text-left">
                        <div className="text-xs font-black text-gray-700">₹{b.grandTotal}</div>
                        <button onClick={handleDownloadInvoice} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 mt-0.5 min-h-0 min-w-0">
                          <FileText size={10} /> PDF Invoice
                        </button>
                      </div>
                      <button
                        onClick={() => handleRebook(b)}
                        className="bg-primary text-white font-black text-xs px-4 py-2.5 rounded-xl hover:bg-secondary transition min-h-0"
                      >
                        Rebook
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            SUB-TAB: ALERTS HUB
        ════════════════════════════════ */}
        {activeSubTab === 'notifications' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Unread Alerts</span>
              <button
                onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                className="text-xs text-primary font-bold hover:underline min-h-0 min-w-0"
              >
                Mark all as read
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-soft">
                <Bell size={48} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-semibold">No alerts found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 rounded-3xl border transition relative flex items-start gap-3.5 ${
                    n.read ? 'bg-white border-gray-100' : 'bg-primary/5 border-primary/20 shadow-soft'
                  }`}>
                    <span className="text-2xl mt-0.5">🔔</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-gray-800 leading-tight">{n.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 leading-snug">{n.description}</p>
                      <span className="text-[9px] text-gray-400 mt-2 block font-semibold">{n.time}</span>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════
            SUB-TAB: LOYALTY
        ════════════════════════════════ */}
        {activeSubTab === 'rewards' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">
                  🏆
                </div>
                <div>
                  <h2 className="text-lg font-black leading-tight">DineOut Gold Status</h2>
                  <p className="text-white/80 text-xs mt-0.5">Unlock 20% flat discount on bookings</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-[10px] font-bold uppercase tracking-wider">BALANCE POINTS</div>
                <div className="text-3xl font-black tabular-nums mt-0.5">1,250 XP</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Unlocked Badges */}
              <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100">
                <h3 className="font-black text-gray-900 text-sm mb-4">Milestones & Achievements</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'First Diner', desc: 'Booked first table', icon: '⭐', done: true },
                    { label: 'Top Explorer', desc: 'Visited 5+ spots', icon: '🍕', done: true },
                    { label: 'Weekend Diner', desc: 'Saturday bookings', icon: '🔥', done: false }
                  ].map(a => (
                    <div key={a.label} className={`p-3 rounded-2xl border text-center ${
                      a.done ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-gray-50 border-gray-200 text-gray-300'
                    }`}>
                      <span className="text-2xl">{a.icon}</span>
                      <div className="text-[10px] font-black mt-2 leading-tight">{a.label}</div>
                      <div className="text-[8px] text-gray-400 mt-0.5 leading-snug">{a.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupons */}
              <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100">
                <h3 className="font-black text-gray-900 text-sm mb-4">DineOut Rewards Coupons</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Flat 20% OFF', code: 'GOLD20', desc: 'Special promo for Gold members' },
                    { label: 'Free Dessert', code: 'SWEETTREAT', desc: 'Valid at any Nazhirya branch' }
                  ].map(c => (
                    <div key={c.code} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                      <div>
                        <div className="font-black text-gray-800">{c.label}</div>
                        <p className="text-[9px] text-gray-400 mt-0.5">{c.desc}</p>
                      </div>
                      <span className="bg-primary/10 text-primary font-black px-3 py-1.5 rounded-lg tracking-widest">{c.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Ticket Detail Modal Overlay ── */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-5 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
              <div className="flex justify-between items-start">
                <h3 className="font-black text-base leading-tight truncate">{selectedBooking.restaurantName}</h3>
                <button onClick={() => setSelectedBooking(null)} className="p-1 rounded-full hover:bg-white/10 text-white/70"><X size={16} /></button>
              </div>
              <p className="text-white/60 text-[10px] mt-1">Booking ID: {selectedBooking.id}</p>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-gray-400 block text-[9px] font-bold">DATE</span><span className="font-black text-gray-700">{selectedBooking.date}</span></div>
                <div><span className="text-gray-400 block text-[9px] font-bold">TIME</span><span className="font-black text-gray-700">{selectedBooking.timeSlot}</span></div>
                <div><span className="text-gray-400 block text-[9px] font-bold">SEAT</span><span className="font-black text-gray-700">{selectedBooking.seatType}</span></div>
                <div><span className="text-gray-400 block text-[9px] font-bold">GUESTS</span><span className="font-black text-gray-700">{selectedBooking.guestCount} guests</span></div>
              </div>

              {/* QR */}
              <div className="flex flex-col items-center border-t border-dashed border-gray-200 pt-4">
                <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-soft">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    {generateQRMatrix(selectedBooking.id, 21).map((row, r) => row.map((cell, c) => cell ? (
                      <rect key={`${r}-${c}`} x={c * 5.7} y={r * 5.7} width="5.7" height="5.7" fill="#1a1a2e" />
                    ) : null))}
                  </svg>
                </div>
                <span className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">HOST SCAN CHECK-IN</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DineOutDashboardPage;
