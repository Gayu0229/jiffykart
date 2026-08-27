import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, ClipboardList, ListOrdered, QrCode, Utensils, MapPin, BarChart3, Settings,
  LogOut, Plus, Clock, Users, Coffee, Trash2, CheckCircle2, XCircle, Timer, AlertCircle, TrendingUp, DollarSign,
  UserCheck, ChefHat, Eye, Edit2, Play, Check, Navigation, AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface RestaurantDashboardProps {
  onLogout: () => void;
  shopName?: string;
}

// ─── TYPES ──────────────────────────────────────────────────────────────────
type ActiveModule = 'dashboard' | 'reservations' | 'seats' | 'live-availability' | 'waitlist' | 'qr-checkin' | 'kitchen' | 'customer-tracking' | 'analytics' | 'settings';

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  guests: number;
  time: string;
  date: string;
  tableType: string;
  assignedTableId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  preOrderItems?: { name: string; qty: number }[];
  etaMinutes?: number;
}

interface Table {
  id: string;
  name: string;
  type: '2 Seater' | '4 Seater' | '6 Seater' | '8 Seater' | '10+ Seater';
  capacity: number;
  status: 'Available' | 'Reserved' | 'Occupied' | 'Cleaning' | 'Maintenance';
}

interface WaitlistEntry {
  id: string;
  customerName: string;
  guests: number;
  joinedTime: string;
  estWaitMinutes: number;
  priority: 'REGULAR' | 'VIP';
  status: 'WAITING' | 'CALLED' | 'EXPIRED';
  expiryTime?: string;
}

interface KitchenItem {
  id: string;
  tableName: string;
  itemName: string;
  qty: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  cookingTimerSeconds: number;
}

// ─── INITIAL MOCK DATA ───────────────────────────────────────────────────────
const INITIAL_RESERVATIONS: Reservation[] = [
  { id: 'RES-891', customerName: 'Rajesh Kumar', phone: '9876543210', guests: 4, time: '19:30', date: '2026-07-13', tableType: '4 Seater', status: 'CONFIRMED', preOrderItems: [{ name: 'Butter Chicken', qty: 2 }, { name: 'Garlic Naan', qty: 4 }], etaMinutes: 12 },
  { id: 'RES-892', customerName: 'Divya Sharma', phone: '9123456789', guests: 2, time: '20:00', date: '2026-07-13', tableType: '2 Seater', status: 'CHECKED_IN', preOrderItems: [{ name: 'Paneer Tikka', qty: 1 }], etaMinutes: 0 },
  { id: 'RES-893', customerName: 'Vikram Singh', phone: '9345678901', guests: 6, time: '21:00', date: '2026-07-13', tableType: '6 Seater', status: 'PENDING', preOrderItems: [], etaMinutes: 45 },
  { id: 'RES-894', customerName: 'Ananya Patel', phone: '9456789012', guests: 8, time: '18:30', date: '2026-07-13', tableType: '8 Seater', status: 'COMPLETED', preOrderItems: [{ name: 'Dal Makhani', qty: 2 }, { name: 'Jeera Rice', qty: 2 }], etaMinutes: 0 },
  { id: 'RES-895', customerName: 'Amit Verma', phone: '9567890123', guests: 2, time: '20:30', date: '2026-07-13', tableType: '2 Seater', status: 'NO_SHOW', preOrderItems: [] }
];

const INITIAL_TABLES: Table[] = [
  { id: 'T1', name: 'Table 1', type: '2 Seater', capacity: 2, status: 'Available' },
  { id: 'T2', name: 'Table 2', type: '2 Seater', capacity: 2, status: 'Reserved' },
  { id: 'T3', name: 'Table 3', type: '4 Seater', capacity: 4, status: 'Occupied' },
  { id: 'T4', name: 'Table 4', type: '4 Seater', capacity: 4, status: 'Cleaning' },
  { id: 'T5', name: 'Table 5', type: '6 Seater', capacity: 6, status: 'Maintenance' },
  { id: 'T6', name: 'Table 6', type: '6 Seater', capacity: 6, status: 'Available' },
  { id: 'T7', name: 'Table 7', type: '8 Seater', capacity: 8, status: 'Available' },
  { id: 'T8', name: 'Table 8', type: '10+ Seater', capacity: 12, status: 'Available' }
];

const INITIAL_WAITLIST: WaitlistEntry[] = [
  { id: 'W-01', customerName: 'Sanjay Dutt', guests: 3, joinedTime: '19:10', estWaitMinutes: 15, priority: 'REGULAR', status: 'WAITING' },
  { id: 'W-02', customerName: 'Kareena Kapoor', guests: 2, joinedTime: '19:15', estWaitMinutes: 10, priority: 'VIP', status: 'WAITING' },
  { id: 'W-03', customerName: 'Ranveer Singh', guests: 6, joinedTime: '19:25', estWaitMinutes: 30, priority: 'REGULAR', status: 'WAITING' }
];

const INITIAL_KITCHEN_ITEMS: KitchenItem[] = [
  { id: 'K-101', tableName: 'Table 3', itemName: 'Chicken Biryani', qty: 2, status: 'PREPARING', cookingTimerSeconds: 360 },
  { id: 'K-102', tableName: 'Table 3', itemName: 'Butter Naan', qty: 4, status: 'PENDING', cookingTimerSeconds: 0 },
  { id: 'K-103', tableName: 'Table 2', itemName: 'Paneer Tikka Masala', qty: 1, status: 'READY', cookingTimerSeconds: 0 },
  { id: 'K-104', tableName: 'Table 4', itemName: 'Mocktail Blue Lagoon', qty: 3, status: 'SERVED', cookingTimerSeconds: 0 }
];

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({ onLogout, shopName }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);
  const [kitchenItems, setKitchenItems] = useState<KitchenItem[]>(INITIAL_KITCHEN_ITEMS);

  // QR scanner scan trigger simulation
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [scannedReservation, setScannedReservation] = useState<Reservation | null>(null);
  const [scanMessage, setScanMessage] = useState('');

  // Restaurant settings state
  const [settings, setSettings] = useState({
    profileName: shopName || 'Premium DineOut Restaurant',
    openingTime: '11:00',
    closingTime: '23:00',
    holidayMode: false,
    autoAssignTable: true,
    maxAdvanceDays: 30,
    cancellationPolicy: 'Free cancellation up to 2 hours before dining time.'
  });

  // Analytics mockup data
  const weeklyReservationsData = [
    { name: 'Mon', count: 18 },
    { name: 'Tue', count: 22 },
    { name: 'Wed', count: 30 },
    { name: 'Thu', count: 28 },
    { name: 'Fri', count: 45 },
    { name: 'Sat', count: 65 },
    { name: 'Sun', count: 58 }
  ];

  const occupancyHourlyData = [
    { time: '12:00', occupancy: 40 },
    { time: '14:00', occupancy: 35 },
    { time: '16:00', occupancy: 15 },
    { time: '18:00', occupancy: 65 },
    { time: '20:00', occupancy: 95 },
    { time: '22:00', occupancy: 70 }
  ];

  // Kitchen countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setKitchenItems(prev =>
        prev.map(item => {
          if (item.status === 'PREPARING' && item.cookingTimerSeconds > 0) {
            return { ...item, cookingTimerSeconds: item.cookingTimerSeconds - 1 };
          }
          return item;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick stats calculation
  const totalCapacity = tables.reduce((acc, t) => acc + t.capacity, 0);
  const occupiedSeats = tables.filter(t => t.status === 'Occupied').reduce((acc, t) => acc + t.capacity, 0);
  const reservedSeats = tables.filter(t => t.status === 'Reserved').reduce((acc, t) => acc + t.capacity, 0);
  const availableSeats = totalCapacity - occupiedSeats - reservedSeats;

  // Handler functions
  const handleUpdateReservationStatus = (id: string, newStatus: Reservation['status']) => {
    setReservations(prev => prev.map(res => {
      if (res.id === id) {
        // If status becomes CHECKED_IN, assign table if needed
        let assignedTableId = res.assignedTableId;
        if (newStatus === 'CHECKED_IN') {
          const availableTable = tables.find(t => t.status === 'Available');
          if (availableTable) {
            assignedTableId = availableTable.id;
            setTables(ts => ts.map(t => t.id === availableTable.id ? { ...t, status: 'Occupied' } : t));
          }
        }
        if (newStatus === 'COMPLETED' && res.assignedTableId) {
          setTables(ts => ts.map(t => t.id === res.assignedTableId ? { ...t, status: 'Cleaning' } : t));
        }
        return { ...res, status: newStatus, assignedTableId };
      }
      return res;
    }));
  };

  const handleUpdateTableStatus = (id: string, newStatus: Table['status']) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleAddWalkIn = () => {
    const newId = `RES-${Math.floor(100 + Math.random() * 900)}`;
    const newRes: Reservation = {
      id: newId,
      customerName: 'Walk-In Guest',
      phone: 'N/A',
      guests: 2,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      tableType: '2 Seater',
      status: 'CHECKED_IN'
    };
    const availableTable = tables.find(t => t.status === 'Available' && t.capacity >= 2);
    if (availableTable) {
      newRes.assignedTableId = availableTable.id;
      setTables(ts => ts.map(t => t.id === availableTable.id ? { ...t, status: 'Occupied' } : t));
    }
    setReservations(prev => [newRes, ...prev]);
  };

  const handleWaitlistCall = (id: string) => {
    setWaitlist(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          status: 'CALLED',
          expiryTime: new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return w;
    }));
  };

  const handleWaitlistPromote = (id: string) => {
    const entry = waitlist.find(w => w.id === id);
    if (!entry) return;

    // Convert waitlist to Checked In
    const newRes: Reservation = {
      id: `RES-${Math.floor(100 + Math.random() * 900)}`,
      customerName: entry.customerName,
      phone: 'N/A',
      guests: entry.guests,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      tableType: `${entry.guests} Seater`,
      status: 'CHECKED_IN'
    };
    const availableTable = tables.find(t => t.status === 'Available' && t.capacity >= entry.guests);
    if (availableTable) {
      newRes.assignedTableId = availableTable.id;
      setTables(ts => ts.map(t => t.id === availableTable.id ? { ...t, status: 'Occupied' } : t));
    }
    setReservations(prev => [newRes, ...prev]);
    setWaitlist(prev => prev.filter(w => w.id !== id));
  };

  const handleScanQrCode = (e: React.FormEvent) => {
    e.preventDefault();
    const res = reservations.find(r => r.id.toLowerCase() === qrCodeInput.toLowerCase());
    if (res) {
      setScannedReservation(res);
      setScanMessage('');
    } else {
      setScannedReservation(null);
      setScanMessage('Invalid QR Code. Please check the ID.');
    }
  };

  const handleConfirmQrCheckIn = () => {
    if (scannedReservation) {
      handleUpdateReservationStatus(scannedReservation.id, 'CHECKED_IN');
      setScannedReservation(null);
      setQrCodeInput('');
      setScanMessage('Check-in Successful!');
      setTimeout(() => setScanMessage(''), 3000);
    }
  };

  // MODULE RENDERERS
  const renderDashboardModule = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Today\'s Reservations', val: reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN').length, icon: Calendar, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { title: 'Occupied Seats', val: `${occupiedSeats} / ${totalCapacity}`, icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { title: 'Available Seats', val: availableSeats, icon: Coffee, color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { title: 'Active Waitlist', val: waitlist.filter(w => w.status === 'WAITING').length, icon: ListOrdered, color: 'text-amber-600 bg-amber-50 border-amber-100' }
        ].map((stat, idx) => (
          <div key={idx} className={`p-6 bg-white border rounded-[2rem] shadow-sm flex items-center justify-between`}>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.val}</h3>
            </div>
            <div className={`p-4 rounded-2xl ${stat.color}`}>{<stat.icon size={20} />}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main interactive area: Quick actions & Live status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={handleAddWalkIn} className="flex items-center justify-center gap-2 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-md shadow-indigo-100">
                <Plus size={16} /> Add Walk-In
              </button>
              <button onClick={() => setActiveModule('qr-checkin')} className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-slate-100 text-slate-700 hover:bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest transition">
                <QrCode size={16} /> QR Check-In
              </button>
              <button onClick={() => setActiveModule('waitlist')} className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-slate-100 text-slate-700 hover:bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest transition">
                <ListOrdered size={16} /> Manage Waitlist
              </button>
            </div>
          </div>

          {/* Today's upcoming feed */}
          <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Live Reservation Feed</h3>
            <div className="divide-y divide-slate-50">
              {reservations.slice(0, 4).map(res => (
                <div key={res.id} className="py-4 flex justify-between items-center">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 font-bold">{res.guests}</div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{res.customerName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{res.time} · {res.tableType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                      res.status === 'CONFIRMED' ? 'bg-indigo-50 text-indigo-600' :
                      res.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-600 animate-pulse' :
                      res.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>{res.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick seat overview */}
        <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Capacity Utilization</h3>
            <div className="space-y-4">
              {[
                { name: 'Occupied Seats', val: occupiedSeats, pct: (occupiedSeats / totalCapacity) * 100, color: 'bg-emerald-500' },
                { name: 'Reserved Seats', val: reservedSeats, pct: (reservedSeats / totalCapacity) * 100, color: 'bg-indigo-500' },
                { name: 'Available Seats', val: availableSeats, pct: (availableSeats / totalCapacity) * 100, color: 'bg-sky-400' }
              ].map((seat, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{seat.name}</span>
                    <span>{seat.val} seats ({seat.pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${seat.color}`} style={{ width: `${seat.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-6 border-t border-slate-50 mt-6 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Restaurant Capacity</p>
            <h2 className="text-3xl font-black text-slate-800 mt-1">{totalCapacity} Guests</h2>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReservationsModule = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">Reservation Management</h2>
            <p className="text-xs text-slate-400">Accept bookings, assign seats, and track dining check-ins.</p>
          </div>
          <button onClick={handleAddWalkIn} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-widest transition flex items-center gap-1">
            <Plus size={14} /> Add Walk-In
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                {['ID', 'Customer', 'Guests', 'Date/Time', 'Status', 'Table', 'Actions'].map((h, i) => (
                  <th key={i} className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reservations.map(res => (
                <tr key={res.id} className="hover:bg-slate-50/50">
                  <td className="py-4 text-xs font-black text-slate-800">{res.id}</td>
                  <td className="py-4">
                    <p className="text-sm font-bold text-slate-700">{res.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{res.phone}</p>
                  </td>
                  <td className="py-4 text-xs font-bold text-slate-600">{res.guests} Guests</td>
                  <td className="py-4 text-xs text-slate-600 font-semibold">{res.date} at {res.time}</td>
                  <td className="py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      res.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      res.status === 'CONFIRMED' ? 'bg-indigo-50 text-indigo-600' :
                      res.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-600' :
                      res.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>{res.status}</span>
                  </td>
                  <td className="py-4 text-xs font-bold text-slate-700">{res.assignedTableId || 'Not Assigned'}</td>
                  <td className="py-4 flex gap-1.5 flex-wrap">
                    {res.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleUpdateReservationStatus(res.id, 'CONFIRMED')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Confirm"><CheckCircle2 size={16} /></button>
                        <button onClick={() => handleUpdateReservationStatus(res.id, 'CANCELLED')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Reject"><XCircle size={16} /></button>
                      </>
                    )}
                    {res.status === 'CONFIRMED' && (
                      <>
                        <button onClick={() => handleUpdateReservationStatus(res.id, 'CHECKED_IN')} className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[10px] font-black rounded-lg transition uppercase tracking-widest">Check-In</button>
                        <button onClick={() => handleUpdateReservationStatus(res.id, 'NO_SHOW')} className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-[10px] font-black rounded-lg transition uppercase tracking-widest">No Show</button>
                      </>
                    )}
                    {res.status === 'CHECKED_IN' && (
                      <button onClick={() => handleUpdateReservationStatus(res.id, 'COMPLETED')} className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-black rounded-lg transition uppercase tracking-widest">Complete Dining</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSeatManagementModule = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">Seat Configuration & Table Status</h2>
            <p className="text-xs text-slate-400">Configure dining seat zones and update instant table statuses.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map(table => (
            <div key={table.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-slate-800 text-sm">{table.name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{table.type}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Capacity: {table.capacity} Guests</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    table.status === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                    table.status === 'Reserved' ? 'bg-indigo-100 text-indigo-800' :
                    table.status === 'Occupied' ? 'bg-rose-100 text-rose-800' :
                    table.status === 'Cleaning' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>{table.status}</span>
                </div>

                <select
                  value={table.status}
                  onChange={(e) => handleUpdateTableStatus(table.id, e.target.value as Table['status'])}
                  className="w-full text-xs font-semibold p-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                >
                  {['Available', 'Reserved', 'Occupied', 'Cleaning', 'Maintenance'].map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLiveAvailabilityModule = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4">Live Seat Availability Grid</h2>
        
        {/* Graphical floor map mockup */}
        <div className="p-6 bg-slate-900 rounded-[2rem] min-h-[400px] flex flex-col justify-between">
          <div>
            <div className="flex gap-4 mb-6 flex-wrap">
              {[
                { label: 'Available', color: 'bg-emerald-500' },
                { label: 'Reserved', color: 'bg-indigo-500' },
                { label: 'Occupied', color: 'bg-rose-500' },
                { label: 'Cleaning', color: 'bg-amber-500' },
                { label: 'Maintenance', color: 'bg-slate-500' }
              ].map((leg, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-3.5 h-3.5 rounded-full ${leg.color}`} />
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{leg.label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {tables.map(table => (
                <div key={table.id} className="relative aspect-square border-2 border-slate-800/80 rounded-3xl flex flex-col items-center justify-center gap-2 p-4 overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                    table.status === 'Available' ? 'bg-emerald-500' :
                    table.status === 'Reserved' ? 'bg-indigo-500' :
                    table.status === 'Occupied' ? 'bg-rose-500' :
                    table.status === 'Cleaning' ? 'bg-amber-500' :
                    'bg-slate-500'
                  }`} />
                  <span className="text-2xl">🍽️</span>
                  <p className="text-xs font-black text-white">{table.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{table.type}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center pt-8 text-slate-500 text-[10px] font-black uppercase tracking-wider">DineOut Live Room map · auto-refreshing</div>
        </div>
      </div>
    </div>
  );

  const renderWaitlistModule = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">Waitlist Queue</h2>
            <p className="text-xs text-slate-400">Instantly promote waiting clients to checked-in diners as tables clear.</p>
          </div>
        </div>

        <div className="space-y-3">
          {waitlist.map((entry) => (
            <div key={entry.id} className="p-5 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center border border-indigo-100">
                  <span className="text-xs font-black">{entry.guests}</span>
                  <span className="text-[8px] font-black uppercase">PAX</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    {entry.customerName}
                    {entry.priority === 'VIP' && <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded">VIP</span>}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Joined at {entry.joinedTime} · Est. Wait: {entry.estWaitMinutes} mins</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {entry.status === 'WAITING' && (
                  <>
                    <button onClick={() => handleWaitlistCall(entry.id)} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-black rounded-xl transition uppercase tracking-widest">Call Guest</button>
                    <button onClick={() => handleWaitlistPromote(entry.id)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition uppercase tracking-widest">Auto Assign Table</button>
                  </>
                )}
                {entry.status === 'CALLED' && (
                  <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-xl border border-amber-100">
                    <Timer size={14} className="text-amber-600" />
                    <span className="text-[9px] font-black text-amber-700 uppercase">Called · Hold Expires: {entry.expiryTime}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQrCheckInModule = () => (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-5 text-center">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">QR Code Check-In</h2>
          <p className="text-xs text-slate-400 mt-1">Scan or manually verify reservation tickets.</p>
        </div>

        <form onSubmit={handleScanQrCode} className="flex gap-2">
          <input
            type="text"
            value={qrCodeInput}
            onChange={(e) => setQrCodeInput(e.target.value)}
            placeholder="Enter Reservation ID (e.g. RES-891)"
            className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-indigo-400 outline-none rounded-2xl text-sm font-semibold transition"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 rounded-2xl uppercase tracking-widest transition">Scan ID</button>
        </form>

        {scanMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs font-bold">
            {scanMessage}
          </div>
        )}

        <AnimatePresence>
          {scannedReservation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-6 border border-slate-100 rounded-3xl bg-slate-50/50 text-left space-y-4"
            >
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Ticket Verified</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="font-bold text-slate-400">Customer</span> <span className="font-bold text-slate-700">{scannedReservation.customerName}</span></div>
                <div className="flex justify-between text-sm"><span className="font-bold text-slate-400">Guests</span> <span className="font-bold text-slate-700">{scannedReservation.guests} PAX</span></div>
                <div className="flex justify-between text-sm"><span className="font-bold text-slate-400">Time Slot</span> <span className="font-bold text-slate-700">{scannedReservation.time}</span></div>
                {scannedReservation.preOrderItems && scannedReservation.preOrderItems.length > 0 && (
                  <div className="border-t pt-2 mt-2">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Pre-Ordered Meals:</span>
                    <ul className="text-xs font-bold text-slate-600 mt-1">
                      {scannedReservation.preOrderItems.map((item, idx) => (
                        <li key={idx}>• {item.name} (x{item.qty})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button onClick={handleConfirmQrCheckIn} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-4 rounded-2xl uppercase tracking-widest shadow-md transition">Confirm Check-In</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderKitchenModule = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4">Kitchen pre-order Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kitchenItems.map(item => (
            <div key={item.id} className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.tableName}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    item.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                    item.status === 'PREPARING' ? 'bg-indigo-100 text-indigo-800' :
                    item.status === 'READY' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>{item.status}</span>
                </div>
                <h4 className="font-black text-slate-800 text-sm mt-2">{item.itemName} (x{item.qty})</h4>
              </div>

              <div className="space-y-3">
                {item.status === 'PREPARING' && item.cookingTimerSeconds > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <Timer size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-bold text-indigo-700">Cooking: {Math.floor(item.cookingTimerSeconds / 60)}:{(item.cookingTimerSeconds % 60).toString().padStart(2, '0')} mins</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {item.status === 'PENDING' && (
                    <button onClick={() => setKitchenItems(prev => prev.map(k => k.id === item.id ? { ...k, status: 'PREPARING', cookingTimerSeconds: 420 } : k))} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition flex items-center justify-center gap-1"><Play size={12} /> Cook</button>
                  )}
                  {item.status === 'PREPARING' && (
                    <button onClick={() => setKitchenItems(prev => prev.map(k => k.id === item.id ? { ...k, status: 'READY', cookingTimerSeconds: 0 } : k))} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition flex items-center justify-center gap-1"><Check size={12} /> Ready</button>
                  )}
                  {item.status === 'READY' && (
                    <button onClick={() => setKitchenItems(prev => prev.map(k => k.id === item.id ? { ...k, status: 'SERVED' } : k))} className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition flex items-center justify-center gap-1">Serve Plate</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCustomerTrackingModule = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4">Live Customer Arrival & ETA Tracking</h2>
        
        <div className="space-y-4">
          {reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN').map(res => (
            <div key={res.id} className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl">👤</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{res.customerName}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold mt-1">
                    <Clock size={12} /> Time Slot: {res.time} · assigned: {res.assignedTableId || 'None'}
                  </div>
                </div>
              </div>

              {/* Progress visual tracker */}
              <div className="flex-1 max-w-xs space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                  <span>Journey Progress</span>
                  <span>{res.status === 'CHECKED_IN' ? 'Arrived' : `${res.etaMinutes || 15} mins remaining`}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                  <div className={`h-full bg-indigo-600 transition-all`} style={{ width: res.status === 'CHECKED_IN' ? '100%' : '60%' }} />
                </div>
              </div>

              <div>
                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 ${
                  res.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {res.status === 'CHECKED_IN' ? <Check size={10} /> : <Navigation size={10} className="animate-bounce" />}
                  {res.status === 'CHECKED_IN' ? 'Dining Room' : 'En Route'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalyticsModule = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4">Restaurant Analytics & Occupancy Logs</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-slate-100 rounded-2xl h-[300px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Daily Reservations (This Week)</p>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={weeklyReservationsData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 border border-slate-100 rounded-2xl h-[300px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Occupancy Rate by Peak Hours</p>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={occupancyHourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Bar dataKey="occupancy" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsModule = () => (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-6">
        <h2 className="text-base font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4">Restaurant Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Restaurant Profile Name</label>
            <input
              type="text"
              value={settings.profileName}
              onChange={(e) => setSettings(prev => ({ ...prev, profileName: e.target.value }))}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-indigo-400 outline-none rounded-2xl text-sm font-semibold transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Opening Time</label>
              <input
                type="time"
                value={settings.openingTime}
                onChange={(e) => setSettings(prev => ({ ...prev, openingTime: e.target.value }))}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-indigo-400 outline-none rounded-2xl text-sm font-semibold transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Closing Time</label>
              <input
                type="time"
                value={settings.closingTime}
                onChange={(e) => setSettings(prev => ({ ...prev, closingTime: e.target.value }))}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-indigo-400 outline-none rounded-2xl text-sm font-semibold transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Holiday Settings Mode</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Instantly stop incoming reservations for scheduled days.</p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, holidayMode: !prev.holidayMode }))}
              className={`w-12 h-6 rounded-full p-1 transition-all ${settings.holidayMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all ${settings.holidayMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cancellation Policy</label>
            <textarea
              rows={2}
              value={settings.cancellationPolicy}
              onChange={(e) => setSettings(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-indigo-400 outline-none rounded-2xl text-sm font-semibold transition resize-none"
            />
          </div>

          <button onClick={() => alert('Settings Saved!')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-4 rounded-2xl uppercase tracking-widest shadow-md transition">Save Configurations</button>
        </div>
      </div>
    </div>
  );

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'dashboard': return renderDashboardModule();
      case 'reservations': return renderReservationsModule();
      case 'seats': return renderSeatManagementModule();
      case 'live-availability': return renderLiveAvailabilityModule();
      case 'waitlist': return renderWaitlistModule();
      case 'qr-checkin': return renderQrCheckInModule();
      case 'kitchen': return renderKitchenModule();
      case 'customer-tracking': return renderCustomerTrackingModule();
      case 'analytics': return renderAnalyticsModule();
      case 'settings': return renderSettingsModule();
      default: return null;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'seats', label: 'Seat Management', icon: Coffee },
    { id: 'live-availability', label: 'Live Availability', icon: Eye },
    { id: 'waitlist', label: 'Waitlist Queue', icon: ListOrdered },
    { id: 'qr-checkin', label: 'QR Check-In', icon: QrCode },
    { id: 'kitchen', label: 'Kitchen Dashboard', icon: Utensils },
    { id: 'customer-tracking', label: 'Customer ETA', icon: Navigation },
    { id: 'analytics', label: 'Analytics Logs', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      {/* Dynamic Restaurant Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full overflow-hidden shrink-0 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-black">R</div>
          <div className="flex flex-col -space-y-0.5">
            <span className="text-sm font-black text-white uppercase tracking-tight">{settings.profileName.slice(0, 16)}</span>
            <span className="text-[9px] font-black text-indigo-400 tracking-[0.2em] uppercase">DineOut Manager</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all group relative ${
                activeModule === item.id ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-4.5 h-4.5" />
                <span className="text-[10px] uppercase font-black tracking-widest">{item.label}</span>
              </div>
              {activeModule === item.id && <div className="absolute right-0 w-1.5 h-6 bg-white rounded-l-full"></div>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition">
            <LogOut size={16} />
            <span className="text-[10px] uppercase font-black tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">
              {navItems.find(i => i.id === activeModule)?.label}
            </h2>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">DineOut Management Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-[9px] font-black text-emerald-700 uppercase">Live Connections Status</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {renderModuleContent()}
        </main>
      </div>
    </div>
  );
};
