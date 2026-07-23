import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  Users, 
  Coffee, 
  Navigation, 
  CheckCircle2, 
  BarChart3, 
  TrendingUp, 
  Building2, 
  Map,
  RefreshCw,
  AlertTriangle,
  Utensils
} from 'lucide-react';

interface PlatformStats {
  totalActiveBookings: number;
  totalOccupiedTables: number;
  totalAvailableTables: number;
  enRouteCustomers: number;
  checkedInCustomers: number;
  diningCustomers: number;
  totalReservationsToday: number;
  noShowCount: number;
  totalRestaurantsOnline: number;
  averageWaitMinutes: number;
}

interface RecentBooking {
  id: number;
  bookingId: string;
  restaurantName: string;
  guestName: string;
  guestCount: number;
  timeSlot: string;
  status: string;
  createdAt: string;
}

const MOCK_STATS: PlatformStats = {
  totalActiveBookings: 47,
  totalOccupiedTables: 23,
  totalAvailableTables: 12,
  enRouteCustomers: 8,
  checkedInCustomers: 6,
  diningCustomers: 19,
  totalReservationsToday: 84,
  noShowCount: 3,
  totalRestaurantsOnline: 14,
  averageWaitMinutes: 12
};

const MOCK_RECENT: RecentBooking[] = [
  { id: 1, bookingId: 'TB-7A4B1D', restaurantName: 'The Spice Garden', guestName: 'Arjun Mehra', guestCount: 4, timeSlot: '19:30', status: 'DINING', createdAt: '2 min ago' },
  { id: 2, bookingId: 'TB-3F2C9X', restaurantName: 'Bella Italia', guestName: 'Sarah Wilson', guestCount: 2, timeSlot: '20:00', status: 'EN_ROUTE', createdAt: '5 min ago' },
  { id: 3, bookingId: 'TB-9K1M5P', restaurantName: 'Dragon Palace', guestName: 'James Brown', guestCount: 6, timeSlot: '19:00', status: 'CHECKED_IN', createdAt: '12 min ago' },
  { id: 4, bookingId: 'TB-2Q8R4T', restaurantName: 'The Spice Garden', guestName: 'Priya Sharma', guestCount: 3, timeSlot: '19:30', status: 'ACCEPTED', createdAt: '18 min ago' },
  { id: 5, bookingId: 'TB-6N3H7Y', restaurantName: 'Mumbai Tiffin', guestName: 'David Lee', guestCount: 2, timeSlot: '20:30', status: 'PENDING', createdAt: '22 min ago' },
  { id: 6, bookingId: 'TB-5X1J9K', restaurantName: 'Bella Italia', guestName: 'Riya Patel', guestCount: 4, timeSlot: '21:00', status: 'COMPLETED', createdAt: '45 min ago' },
];

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ label, value, icon, color, subtitle }) => (
  <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm`}>
    <div className="flex items-center justify-between mb-3">
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </span>
    </div>
    <p className="text-2xl font-black text-gray-900">{value}</p>
    <p className="text-xs font-bold text-gray-500 mt-0.5">{label}</p>
    {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    'PENDING':    'bg-gray-100 text-gray-600',
    'ACCEPTED':   'bg-amber-50 text-amber-600',
    'EN_ROUTE':   'bg-sky-50 text-sky-600',
    'PREPARING':  'bg-orange-50 text-orange-600',
    'READY':      'bg-emerald-50 text-emerald-600',
    'CHECKED_IN': 'bg-indigo-50 text-indigo-600',
    'DINING':     'bg-pink-50 text-pink-600',
    'COMPLETED':  'bg-gray-50 text-gray-400',
    'NO_SHOW':    'bg-red-50 text-red-500',
    'CANCELLED':  'bg-red-50 text-red-500',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const LiveAnalytics: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('admin_jwt_token');

      const [statsRes, bookingsRes] = await Promise.all([
        axios.get(`${backendUrl}/admin/bookings/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${backendUrl}/admin/bookings/recent`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
      if (!silent) {
        setError('Live data unavailable — showing demo statistics.');
        setStats(MOCK_STATS);
        setRecentBookings(MOCK_RECENT);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Restaurant Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">Live platform-wide table booking analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400 font-bold">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => loadData()}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] font-black text-gray-600 hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-sm font-bold text-gray-400">Loading live reservation analytics...</div>
      ) : stats ? (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard
              label="Active Bookings"
              value={stats.totalActiveBookings}
              icon={<Calendar size={18} />}
              color="bg-indigo-50 text-indigo-600"
              subtitle="Platform-wide"
            />
            <StatCard
              label="Tables Occupied"
              value={stats.totalOccupiedTables}
              icon={<Coffee size={18} />}
              color="bg-rose-50 text-rose-600"
              subtitle={`${stats.totalAvailableTables} available`}
            />
            <StatCard
              label="En-Route Guests"
              value={stats.enRouteCustomers}
              icon={<Navigation size={18} />}
              color="bg-sky-50 text-sky-600"
              subtitle="Heading to restaurant"
            />
            <StatCard
              label="Currently Dining"
              value={stats.diningCustomers}
              icon={<Utensils size={18} />}
              color="bg-pink-50 text-pink-600"
              subtitle={`${stats.checkedInCustomers} just checked in`}
            />
            <StatCard
              label="Restaurants Online"
              value={stats.totalRestaurantsOnline}
              icon={<Building2 size={18} />}
              color="bg-emerald-50 text-emerald-600"
              subtitle="With table booking active"
            />
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Today's Reservations</p>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <p className="text-3xl font-black text-gray-900 mt-2">{stats.totalReservationsToday}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Avg. Wait Time</p>
                <Clock size={14} className="text-amber-500" />
              </div>
              <p className="text-3xl font-black text-gray-900 mt-2">{stats.averageWaitMinutes}<span className="text-base font-bold text-gray-400"> min</span></p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">No-Shows Today</p>
                <Users size={14} className="text-rose-500" />
              </div>
              <p className="text-3xl font-black text-gray-900 mt-2">{stats.noShowCount}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Checked In</p>
                <CheckCircle2 size={14} className="text-indigo-500" />
              </div>
              <p className="text-3xl font-black text-gray-900 mt-2">{stats.checkedInCustomers}</p>
            </div>
          </div>

          {/* Occupancy Visual */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-black text-gray-900">Platform Occupancy</h2>
                <p className="text-xs text-gray-400 mt-0.5">Across all restaurant tables</p>
              </div>
              <Map size={18} className="text-gray-400" />
            </div>
            
            <div className="space-y-3">
              {[
                { label: 'Occupied', value: stats.totalOccupiedTables, total: stats.totalOccupiedTables + stats.totalAvailableTables, color: 'bg-rose-500' },
                { label: 'Reserved (Pending Arrival)', value: stats.enRouteCustomers + stats.checkedInCustomers, total: stats.totalOccupiedTables + stats.totalAvailableTables, color: 'bg-amber-400' },
                { label: 'Available', value: stats.totalAvailableTables, total: stats.totalOccupiedTables + stats.totalAvailableTables, color: 'bg-emerald-500' },
              ].map(bar => {
                const pct = bar.total > 0 ? Math.min(100, Math.round((bar.value / bar.total) * 100)) : 0;
                return (
                  <div key={bar.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>{bar.label}</span>
                      <span>{bar.value} tables ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bar.color} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-gray-900">Recent Reservations</h2>
                <p className="text-xs text-gray-400 mt-0.5">Latest booking activity across all restaurants</p>
              </div>
              <BarChart3 size={18} className="text-gray-400" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Booking ID', 'Restaurant', 'Guest', 'Guests', 'Slot', 'Status', 'Created'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentBookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-indigo-600 whitespace-nowrap">{booking.bookingId}</td>
                      <td className="px-5 py-4 text-xs font-bold text-gray-700 whitespace-nowrap">{booking.restaurantName}</td>
                      <td className="px-5 py-4 text-xs font-bold text-gray-900 whitespace-nowrap">{booking.guestName}</td>
                      <td className="px-5 py-4 text-xs font-bold text-gray-500 text-center">{booking.guestCount}</td>
                      <td className="px-5 py-4 text-xs font-bold text-gray-700 whitespace-nowrap">{booking.timeSlot}</td>
                      <td className="px-5 py-4">{getStatusBadge(booking.status)}</td>
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{booking.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
