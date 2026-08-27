import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { createSocketClient } from '../socket';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle2, 
  Coffee, 
  Car, 
  Utensils, 
  RefreshCw, 
  AlertTriangle 
} from 'lucide-react';

interface ArrivalBooking {
  id: number;
  bookingId: string;
  bookingDate: string;
  timeSlot: string;
  guestCount: number;
  seatingArea: string;
  status: string;
  etaMinutes?: number;
  latitude?: number;
  longitude?: number;
  specialRequests?: string;
  user: {
    id: number;
    name: string;
    phone?: string;
  };
  table?: {
    tableNumber: string;
    capacity: number;
  };
}

export const LiveArrivals: React.FC<{ shopId: number | string }> = ({ shopId }) => {
  const [arrivals, setArrivals] = useState<ArrivalBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const stompRef = useRef<Client | null>(null);

  useEffect(() => {
    loadArrivals();
  }, [shopId]);

  // WebSocket connection for live ETA/location updates
  useEffect(() => {
    const client = createSocketClient((topic, body) => {
      console.log('[LiveArrivals] WS message:', topic, body);
      if (body && body.id) {
        // Update the specific booking in our list
        setArrivals(prev => 
          prev.map(a => a.id === body.id ? { ...a, ...body } : a)
        );
      }
    });

    stompRef.current = client;

    // Subscribe to shop arrivals topic after connection
    setTimeout(() => {
      if (client && client.active) {
        client.subscribe(`/topic/bookings/shop/${shopId}/arrivals`, (message) => {
          const body = JSON.parse(message.body);
          setArrivals(prev => {
            const exists = prev.find(a => a.id === body.id);
            if (exists) {
              return prev.map(a => a.id === body.id ? { ...a, ...body } : a);
            }
            return [body, ...prev];
          });
        });

        client.subscribe(`/topic/bookings/shop/${shopId}`, (message) => {
          const body = JSON.parse(message.body);
          setArrivals(prev => {
            const exists = prev.find(a => a.id === body.id);
            if (exists) {
              return prev.map(a => a.id === body.id ? { ...a, ...body } : a);
            }
            return [body, ...prev];
          });
        });
      }
    }, 1500);

    return () => {
      if (stompRef.current) stompRef.current.deactivate();
    };
  }, [shopId]);

  const loadArrivals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('vendor_token');
      const response = await axios.get(`${backendUrl}/bookings/shop/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter to show only active bookings (not completed/cancelled)
      const active = (response.data as ArrivalBooking[]).filter(b => 
        !['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(b.status)
      );
      setArrivals(active);
    } catch (err) {
      console.error(err);
      setError('Could not load arrivals. Displaying demo data.');
      injectMockArrivals();
    } finally {
      setIsLoading(false);
    }
  };

  const injectMockArrivals = () => {
    setArrivals([
      {
        id: 1001, bookingId: 'TB-3F8A2C', bookingDate: new Date().toISOString().split('T')[0],
        timeSlot: '19:30', guestCount: 4, seatingArea: 'INDOOR', status: 'EN_ROUTE',
        etaMinutes: 8, latitude: 13.065, longitude: 80.255, specialRequests: 'Birthday celebration',
        user: { id: 1, name: 'John Doe', phone: '+919876543210' },
        table: { tableNumber: '3', capacity: 6 }
      },
      {
        id: 1002, bookingId: 'TB-9X7K1P', bookingDate: new Date().toISOString().split('T')[0],
        timeSlot: '20:00', guestCount: 2, seatingArea: 'OUTDOOR', status: 'ACCEPTED',
        etaMinutes: undefined, user: { id: 2, name: 'Sarah Wilson', phone: '+918765432100' },
        table: { tableNumber: '10', capacity: 4 }
      },
      {
        id: 1003, bookingId: 'TB-5M2N8Q', bookingDate: new Date().toISOString().split('T')[0],
        timeSlot: '19:00', guestCount: 3, seatingArea: 'INDOOR', status: 'CHECKED_IN',
        user: { id: 3, name: 'Mike Brown', phone: '+917654321000' },
        table: { tableNumber: '8', capacity: 4 }
      },
      {
        id: 1004, bookingId: 'TB-1R4T6Y', bookingDate: new Date().toISOString().split('T')[0],
        timeSlot: '19:30', guestCount: 2, seatingArea: 'INDOOR', status: 'DINING',
        user: { id: 4, name: 'Priya Sharma' },
        table: { tableNumber: '5', capacity: 2 }
      }
    ]);
  };

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('vendor_token');
      
      await axios.put(`${backendUrl}/bookings/${bookingId}/status`, null, {
        params: { status: newStatus },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setArrivals(prev => prev.map(a => a.id === bookingId ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error(err);
      // Optimistic update
      setArrivals(prev => prev.map(a => a.id === bookingId ? { ...a, status: newStatus } : a));
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      'PENDING':    { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Pending', icon: <Clock size={10} /> },
      'ACCEPTED':   { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Accepted', icon: <CheckCircle2 size={10} /> },
      'EN_ROUTE':   { color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', label: 'En Route', icon: <Car size={10} /> },
      'PREPARING':  { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Preparing', icon: <Coffee size={10} /> },
      'READY':      { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Table Ready', icon: <CheckCircle2 size={10} /> },
      'CHECKED_IN': { color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', label: 'Checked In', icon: <MapPin size={10} /> },
      'DINING':     { color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', label: 'Dining', icon: <Utensils size={10} /> },
    };
    const s = map[status] || { color: 'bg-slate-700 text-slate-300 border-slate-600', label: status, icon: null };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.color}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  const getDistance = (arrival: ArrivalBooking) => {
    if (!arrival.latitude || !arrival.longitude) return null;
    // Rough calculation from restaurant (mock center: 13.0827, 80.2707)
    const dlat = 13.0827 - arrival.latitude;
    const dlng = 80.2707 - arrival.longitude;
    const km = Math.sqrt(dlat * dlat + dlng * dlng) * 111; // ~111km per degree
    return km.toFixed(1);
  };

  return (
    <div className="bg-slate-950 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400">
            <Navigation size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-wider">Live Arrivals Board</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time customer ETA & status feed</p>
          </div>
        </div>

        <button
          onClick={loadArrivals}
          className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-xl border border-white/5 transition flex items-center gap-2 active:scale-95"
        >
          <RefreshCw size={12} /> Refresh Feed
        </button>
      </div>

      {error && (
        <div className="bg-amber-950/20 border border-amber-900/40 text-amber-400 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-xs font-bold text-slate-500">Loading live arrivals data...</div>
      ) : arrivals.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <Navigation className="mx-auto text-slate-700" size={32} />
          <p className="text-xs font-bold text-slate-500">No active reservations at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest px-5 py-2">
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Reservation</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">ETA / Distance</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {arrivals.map(arrival => {
            const dist = getDistance(arrival);
            return (
              <div 
                key={arrival.id}
                className={`bg-slate-900/60 border rounded-2xl p-5 transition-all hover:border-white/10 ${
                  arrival.status === 'EN_ROUTE' ? 'border-sky-500/30 shadow-lg shadow-sky-500/5' : 'border-white/5'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Customer Info */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-800 border border-white/10 rounded-xl flex items-center justify-center text-slate-400">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{arrival.user.name}</p>
                      {arrival.user.phone && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone size={8} /> {arrival.user.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reservation Info */}
                  <div className="col-span-2 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-300">
                      {arrival.guestCount} Guests • {arrival.seatingArea}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">{arrival.timeSlot} • Table {arrival.table?.tableNumber || '—'}</p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    {getStatusBadge(arrival.status)}
                  </div>

                  {/* ETA */}
                  <div className="col-span-2">
                    {arrival.status === 'EN_ROUTE' ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-sky-400">{arrival.etaMinutes || '?'} min</p>
                        {dist && <p className="text-[10px] text-slate-500 font-bold">{dist} km away</p>}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-bold">—</span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="col-span-3 flex items-center justify-end gap-2 flex-wrap">
                    {arrival.status === 'PENDING' && (
                      <button
                        onClick={() => updateBookingStatus(arrival.id, 'ACCEPTED')}
                        className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                      >
                        Accept
                      </button>
                    )}
                    {arrival.status === 'ACCEPTED' && (
                      <button
                        onClick={() => updateBookingStatus(arrival.id, 'PREPARING')}
                        className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                      >
                        Prepare Table
                      </button>
                    )}
                    {arrival.status === 'EN_ROUTE' && (
                      <button
                        onClick={() => updateBookingStatus(arrival.id, 'PREPARING')}
                        className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                      >
                        Prepare Table
                      </button>
                    )}
                    {(arrival.status === 'PREPARING' || arrival.status === 'READY') && (
                      <button
                        onClick={() => updateBookingStatus(arrival.id, 'CHECKED_IN')}
                        className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                      >
                        Check-In
                      </button>
                    )}
                    {arrival.status === 'CHECKED_IN' && (
                      <button
                        onClick={() => updateBookingStatus(arrival.id, 'DINING')}
                        className="px-3 py-1.5 bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500 hover:text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                      >
                        Seat Guest
                      </button>
                    )}
                    {arrival.status === 'DINING' && (
                      <button
                        onClick={() => updateBookingStatus(arrival.id, 'COMPLETED')}
                        className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                      >
                        Complete
                      </button>
                    )}
                    {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(arrival.status) && (
                      <button
                        onClick={() => updateBookingStatus(arrival.id, 'NO_SHOW')}
                        className="px-3 py-1.5 bg-slate-800 border border-white/5 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                      >
                        No-Show
                      </button>
                    )}
                  </div>
                </div>

                {/* Special Requests */}
                {arrival.specialRequests && (
                  <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-slate-500 font-bold">
                    <span className="text-slate-600">Note:</span> {arrival.specialRequests}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
