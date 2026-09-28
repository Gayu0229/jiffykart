import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks';
import api from '../services/axiosConfig';
import { createSocketClient } from '../services/socket';
import { Client } from '@stomp/stompjs';
import { 
  ChevronLeft, 
  MapPin, 
  Compass, 
  Clock, 
  CheckCircle, 
  Car, 
  Utensils, 
  CheckCircle2, 
  QrCode, 
  Maximize2,
  Navigation,
  Sparkles
} from 'lucide-react';

interface Booking {
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
  qrCode?: string;
  foodPreOrder?: string;
  table?: {
    id: number;
    tableNumber: string;
    capacity: number;
  };
  shop: {
    id: number;
    name: string;
    location: string;
  };
}

export const BookingTimelinePage: React.FC<{ 
  onBack: () => void; 
  booking: Booking; 
  bookingId: string 
}> = ({ onBack, booking: initialBooking, bookingId }) => {
  const { user } = useAuth();
  
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [status, setStatus] = useState<string>(initialBooking?.status || 'PENDING');
  const [eta, setEta] = useState<number>(initialBooking?.etaMinutes || 15);
  const [distance, setDistance] = useState<number>(3.5); // km
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const stompClientRef = useRef<Client | null>(null);
  const navigationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll booking details or load initial if initialBooking wasn't passed fully
  useEffect(() => {
    if (!initialBooking && bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      const response = await api.get(`/bookings/user/${user.id}`);
      const found = (response.data as Booking[]).find(b => b.bookingId === bookingId);
      if (found) {
        setBooking(found);
        setStatus(found.status);
        if (found.etaMinutes) setEta(found.etaMinutes);
      }
    } catch (err) {
      console.error('Failed to load booking details', err);
    }
  };

  // Connect WebSockets
  useEffect(() => {
    if (!user) return;
    
    console.log('[Socket] Initializing WebSocket for timeline updates...');
    const client = createSocketClient((topic, body) => {
      console.log(`[Socket] Received message on ${topic}:`, body);
      // If we receive a booking update for this booking
      if (body && body.bookingId === bookingId) {
        setBooking(body);
        setStatus(body.status);
        if (body.etaMinutes !== undefined) setEta(body.etaMinutes);
      }
    });

    stompClientRef.current = client;

    // Subscribe to user booking updates specifically after connect
    setTimeout(() => {
      if (client && client.active) {
        client.subscribe(`/topic/bookings/user/${user.id}`, (message) => {
          const body = JSON.parse(message.body);
          if (body && body.bookingId === bookingId) {
            setBooking(body);
            setStatus(body.status);
            if (body.etaMinutes !== undefined) setEta(body.etaMinutes);
          }
        });
      }
    }, 1500);

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
      if (navigationIntervalRef.current) {
        clearInterval(navigationIntervalRef.current);
      }
    };
  }, [user, bookingId]);

  // Handle status update
  const changeStatus = async (newStatus: string) => {
    setError(null);
    try {
      const response = await api.put(`/bookings/${booking.id}/status`, null, {
        params: { status: newStatus }
      });
      setBooking(response.data);
      setStatus(response.data.status);
    } catch (err: any) {
      console.error(err);
      setError('Could not update status.');
    }
  };

  // Travel GPS Simulation
  const startTravelSimulation = async () => {
    setIsNavigating(true);
    await changeStatus('EN_ROUTE');
    
    let currentEta = 12;
    let currentDist = 2.4;
    
    // Restaurant mock coords
    const restLat = 13.0827;
    const restLng = 80.2707;
    // Customer start coords
    let custLat = 13.0600;
    let custLng = 80.2500;

    const latDelta = (restLat - custLat) / 8;
    const lngDelta = (restLng - custLng) / 8;

    navigationIntervalRef.current = setInterval(() => {
      currentEta = Math.max(0, currentEta - 2);
      currentDist = Math.max(0, parseFloat((currentDist - 0.4).toFixed(1)));
      custLat += latDelta;
      custLng += lngDelta;

      setEta(currentEta);
      setDistance(currentDist);

      // Publish to WebSocket destination `/app/booking/location`
      if (stompClientRef.current && stompClientRef.current.active) {
        stompClientRef.current.publish({
          destination: '/app/booking/location',
          body: JSON.stringify({
            bookingId: bookingId,
            latitude: custLat,
            longitude: custLng,
            etaMinutes: currentEta
          })
        });
      }

      if (currentEta === 0 || currentDist === 0) {
        if (navigationIntervalRef.current) clearInterval(navigationIntervalRef.current);
        setIsNavigating(false);
        changeStatus('READY'); // Table preparing complete -> customer ready at entrance
      }
    }, 4000);
  };

  // Timeline Steps Configuration
  const timelineSteps = [
    { label: 'Confirmed', statusVal: 'PENDING', desc: 'Reservation received' },
    { label: 'Accepted', statusVal: 'ACCEPTED', desc: 'Restaurant confirmed table' },
    { label: 'En Route', statusVal: 'EN_ROUTE', desc: 'Customer traveling' },
    { label: 'Table Prepared', statusVal: 'READY', desc: 'Table is cleaned and ready' },
    { label: 'Checked In', statusVal: 'CHECKED_IN', desc: 'Arrived and checked in' },
    { label: 'Dining', statusVal: 'DINING', desc: 'Currently seated' },
    { label: 'Completed', statusVal: 'COMPLETED', desc: 'Meal complete' }
  ];

  const getStepIndex = (currentStatus: string) => {
    const statusMap: Record<string, number> = {
      'PENDING': 0,
      'ACCEPTED': 1,
      'EN_ROUTE': 2,
      'READY': 3,
      'CHECKED_IN': 4,
      'DINING': 5,
      'COMPLETED': 6,
      'CANCELLED': -1,
      'REJECTED': -1
    };
    return statusMap[currentStatus] ?? 0;
  };

  const activeIndex = getStepIndex(status);

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 pb-24 font-sans">
      {/* Sleek Dark Top bar */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center transition active:scale-95 shadow-inner"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-wide text-white">Live Tracking</h1>
            <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">ID: {bookingId}</p>
          </div>
        </div>
        
        {/* Quick Demo Controls */}
        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          <span className="text-[9px] font-black text-slate-400 uppercase px-2">Demo:</span>
          {status === 'PENDING' && (
            <button 
              onClick={() => changeStatus('ACCEPTED')} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] px-3 py-1 rounded-lg uppercase transition"
            >
              Accept Booking
            </button>
          )}
          {status === 'ACCEPTED' && (
            <button 
              onClick={startTravelSimulation} 
              disabled={isNavigating}
              className="bg-sky-500 hover:bg-sky-600 text-white font-black text-[9px] px-3 py-1 rounded-lg uppercase transition flex items-center gap-1"
            >
              <Car size={10} /> En Route
            </button>
          )}
          {status === 'READY' && (
            <button 
              onClick={() => changeStatus('CHECKED_IN')} 
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-black text-[9px] px-3 py-1 rounded-lg uppercase transition"
            >
              Check-In
            </button>
          )}
          {status === 'CHECKED_IN' && (
            <button 
              onClick={() => changeStatus('DINING')} 
              className="bg-pink-500 hover:bg-pink-600 text-white font-black text-[9px] px-3 py-1 rounded-lg uppercase transition"
            >
              Seat Guest
            </button>
          )}
          {status === 'DINING' && (
            <button 
              onClick={() => changeStatus('COMPLETED')} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] px-3 py-1 rounded-lg uppercase transition"
            >
              Finish Meal
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Booking details & QR */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Restaurant Status Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-6 border border-slate-700/50 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                  {status}
                </span>
                <h2 className="text-xl font-black text-white mt-3">{booking?.shop?.name || 'TableBook Restaurant'}</h2>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                  <MapPin size={12} className="text-emerald-500" /> {booking?.shop?.location || 'Main Street Hub'}
                </p>
              </div>

              {/* Live ETA indicator */}
              {(status === 'EN_ROUTE' || status === 'ACCEPTED') && (
                <div className="text-right bg-slate-900/60 border border-slate-700/50 rounded-2xl p-3 flex flex-col items-end">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={12} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Est. Wait</span>
                  </div>
                  <span className="text-lg font-black text-white mt-1">{eta} mins</span>
                  {status === 'EN_ROUTE' && (
                    <span className="text-[10px] text-sky-400 font-bold mt-0.5">{distance} km away</span>
                  )}
                </div>
              )}
            </div>

            {/* Travel / Map Simulation Block */}
            {status === 'EN_ROUTE' && (
              <div className="mt-6 bg-slate-950 rounded-2xl p-4 border border-slate-800 flex items-center justify-between relative overflow-hidden">
                <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-sky-500/10 rounded-full blur-xl"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-500/20 border border-sky-500/30 rounded-xl flex items-center justify-center text-sky-400 animate-pulse">
                    <Compass size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Simulating GPS Journey</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Pushing updates to restaurant...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-400 rounded-full transition-all duration-1000" 
                      style={{ width: `${((12 - eta) / 12) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-400">{Math.round(((12 - eta) / 12) * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Step Timeline */}
          <div className="bg-slate-800/40 rounded-[2rem] p-6 border border-slate-800/60 shadow-xl space-y-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Live Reservation Timeline</h3>
            
            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-700">
              {timelineSteps.map((step, idx) => {
                const isCompleted = idx < activeIndex;
                const isActive = idx === activeIndex;
                
                let dotClass = 'bg-slate-900 border-slate-700 text-slate-600';
                if (isCompleted) {
                  dotClass = 'bg-emerald-500 border-emerald-500 text-white';
                } else if (isActive) {
                  dotClass = 'bg-emerald-400 border-emerald-400 text-slate-900 animate-pulse scale-110';
                }

                return (
                  <div key={step.label} className="relative flex gap-4 items-start">
                    <div className={`absolute -left-[21px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold z-10 transition-all ${dotClass}`}>
                      {isCompleted ? '✓' : ''}
                    </div>
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-wider transition ${isActive ? 'text-emerald-400' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: QR check-in & summary */}
        <div className="space-y-6">
          {/* QR Code Card */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-[2rem] p-6 border border-indigo-900/50 shadow-2xl text-center space-y-4">
            <div className="flex justify-center items-center gap-1.5 text-indigo-400">
              <QrCode size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">QR Check-In</span>
            </div>
            
            <p className="text-[11px] text-indigo-200 font-bold leading-relaxed px-4">Show this QR code at the restaurant reception desk for instant check-in.</p>
            
            {/* Visual QR Code Box */}
            <div className="inline-block p-4 bg-white rounded-3xl shadow-inner mt-2">
              <div className="w-40 h-40 border border-slate-200 flex flex-col items-center justify-center text-slate-900 relative">
                <Maximize2 className="absolute top-2 right-2 text-slate-400" size={14} />
                {/* Simulated QR Code lines */}
                <div className="w-32 h-32 bg-slate-900 grid grid-cols-5 gap-0.5 p-1 rounded-lg">
                  {[...Array(25)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded ${((i + 3) % 4 === 0 || i % 6 === 0 || i === 0 || i === 4 || i === 20 || i === 24) ? 'bg-white' : 'bg-slate-900'}`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-xl py-2 text-xs font-mono font-black text-indigo-300">
              {bookingId}
            </div>
          </div>

          {/* Quick Details List */}
          <div className="bg-slate-800/40 rounded-[2rem] p-6 border border-slate-800/60 shadow-xl space-y-4 text-xs font-bold text-slate-400">
            <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Party Details</h3>
            <div className="flex justify-between border-b border-slate-800/50 pb-2">
              <span>Date:</span>
              <span className="text-slate-200">{booking?.bookingDate || 'Today'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/50 pb-2">
              <span>Time Slot:</span>
              <span className="text-slate-200">{booking?.timeSlot || '19:00'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/50 pb-2">
              <span>Guests:</span>
              <span className="text-slate-200">{booking?.guestCount || 2} People</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/50 pb-2">
              <span>Preference:</span>
              <span className="text-slate-200">{booking?.seatingArea || 'INDOOR'}</span>
            </div>
            {booking?.table && (
              <div className="flex justify-between">
                <span>Selected Table:</span>
                <span className="text-emerald-400">Table {booking.table.tableNumber}</span>
              </div>
            )}
          </div>

          {/* Pre-Ordered Food Summary */}
          {(() => {
            let items: any[] = [];
            if (booking?.foodPreOrder) {
              try {
                items = JSON.parse(booking.foodPreOrder);
              } catch (e) {
                console.error(e);
              }
            }
            if (items.length === 0) return null;
            
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const gst = subtotal * 0.05;
            const grandTotal = subtotal + gst;

            return (
              <div className="bg-slate-800/40 rounded-[2rem] p-6 border border-slate-800/60 shadow-xl space-y-4 text-xs font-bold text-slate-400">
                <div className="flex items-center gap-1.5 text-orange-400">
                  <Utensils size={14} />
                  <h3 className="text-xs font-black uppercase tracking-wider">Pre-Ordered Food</h3>
                </div>
                
                <div className="space-y-3 pt-2 border-t border-slate-800/50">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-200">
                      <div>
                        <span>{item.name} <span className="text-slate-400 font-mono text-[10px]">x{item.quantity}</span></span>
                        {item.notes && <p className="text-[9px] text-slate-500 font-medium italic mt-0.5">Note: {item.notes}</p>}
                      </div>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-dashed border-slate-800 space-y-2 text-[10px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Food Subtotal:</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5%):</span>
                    <span>₹{gst.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-white pt-1 border-t border-slate-800/50">
                    <span>Grand Total Paid:</span>
                    <span className="text-orange-400">₹{grandTotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
};
