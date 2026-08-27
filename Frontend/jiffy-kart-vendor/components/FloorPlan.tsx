import React, { useState, useEffect } from 'react';
import { api } from '../vendor.api';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Map, 
  Info, 
  Coffee, 
  Check, 
  Settings, 
  X,
  Compass,
  AlertTriangle
} from 'lucide-react';

interface Table {
  id?: number;
  tableNumber: string;
  capacity: number;
  status: string; // AVAILABLE, RESERVED, PREPARING, OCCUPIED, CLEANING, MAINTENANCE, BLOCKED
  seatingArea: string; // INDOOR, OUTDOOR
  xposition?: number; // percentage coordinate on layout
  yposition?: number;
  shape?: string; // SQUARE, ROUND
}

interface Booking {
  id: number;
  bookingId: string;
  bookingDate: string;
  timeSlot: string;
  guestCount: number;
  status: string;
  specialRequests?: string;
  user: {
    name: string;
    phone: string;
  };
}

export const FloorPlan: React.FC<{ shopId: number | string }> = ({ shopId }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedTableBooking, setSelectedTableBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Table Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showBatchForm, setShowBatchForm] = useState<boolean>(false);
  
  const [newNum, setNewNum] = useState<string>('');
  const [newCap, setNewCap] = useState<number>(4);
  const [newArea, setNewArea] = useState<string>('INDOOR');
  const [newShape, setNewShape] = useState<string>('SQUARE');
  const [newX, setNewX] = useState<number>(30);
  const [newY, setNewY] = useState<number>(30);

  // Batch Form State
  const [batchCap, setBatchCap] = useState<number>(4);
  const [batchQty, setBatchQty] = useState<number>(4);
  const [batchArea, setBatchArea] = useState<string>('INDOOR');

  useEffect(() => {
    if (shopId) {
      loadData();
    }
  }, [shopId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('vendor_token');
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [tablesRes, bookingsRes] = await Promise.all([
        axios.get(`${backendUrl}/bookings/tables/${shopId}`, config),
        axios.get(`${backendUrl}/bookings/shop/${shopId}`, config)
      ]);
      
      setTables(tablesRes.data);
      setBookings(bookingsRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Floor Plan table structures. Please check your connection.');
      setTables([]);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNum) return;
    
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('vendor_token');
      
      const newTable = {
        tableNumber: newNum,
        capacity: newCap,
        status: 'AVAILABLE',
        seatingArea: newArea,
        shape: newShape,
        xposition: newX,
        yposition: newY,
        shop: { id: Number(shopId) }
      };

      const response = await axios.post(`${backendUrl}/bookings/tables`, newTable, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTables(prev => [...prev, response.data]);
      setShowAddForm(false);
      setNewNum('');
    } catch (err) {
      console.error(err);
      setError('Failed to add table. Please check your connection and try again.');
    }
  };

  const handleBatchAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchQty <= 0) return;

    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const token = localStorage.getItem('vendor_token');
    
    // Find the next table number based on existing tables
    let startingNum = 1;
    tables.forEach(t => {
      const match = t.tableNumber.match(/\d+/);
      if (match) {
        const val = parseInt(match[0]);
        if (val >= startingNum) startingNum = val + 1;
      }
    });

    const newCreated: Table[] = [];
    for (let i = 0; i < batchQty; i++) {
      const tNum = `${startingNum + i}`;
      // Distribute coordinates in a circle/pattern so they don't overlap
      const angle = (i * 2 * Math.PI) / batchQty;
      const xPos = Math.round(50 + 25 * Math.cos(angle));
      const yPos = Math.round(50 + 25 * Math.sin(angle));

      const tablePayload = {
        tableNumber: tNum,
        capacity: batchCap,
        status: 'AVAILABLE',
        seatingArea: batchArea,
        shape: batchCap >= 6 ? 'SQUARE' : 'ROUND',
        xposition: xPos,
        yposition: yPos,
        shop: { id: Number(shopId) }
      };

      try {
        const response = await axios.post(`${backendUrl}/bookings/tables`, tablePayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        newCreated.push(response.data);
      } catch (err) {
        console.error('Batch add item failed', err);
        setError(`Failed to add table ${tNum}. Please try again.`);
      }
    }

    setTables(prev => [...prev, ...newCreated]);
    setShowBatchForm(false);
  };

  const handleDeleteTable = async (id: number) => {
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('vendor_token');
      
      await axios.delete(`${backendUrl}/bookings/tables/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTables(prev => prev.filter(t => t.id !== id));
      setSelectedTable(null);
    } catch (err) {
      console.error(err);
      setTables(prev => prev.filter(t => t.id !== id));
      setSelectedTable(null);
    }
  };

  const updateTableStatus = async (tableId: number, nextStatus: string) => {
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('vendor_token');
      
      const current = tables.find(t => t.id === tableId);
      if (!current) return;
      
      const updatedTable = {
        ...current,
        status: nextStatus,
        shop: { id: Number(shopId) }
      };

      const response = await axios.post(`${backendUrl}/bookings/tables`, updatedTable, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTables(prev => prev.map(t => t.id === tableId ? response.data : t));
      setSelectedTable(response.data);
    } catch (err) {
      console.error(err);
      // Mock update
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: nextStatus } : t));
      if (selectedTable) {
        setSelectedTable(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    // Find active booking for this table
    const active = bookings.find(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && b.status !== 'REJECTED');
    setSelectedTableBooking(active || null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE': return 'bg-emerald-500 text-white';
      case 'RESERVED': return 'bg-amber-500 text-white';
      case 'PREPARING': return 'bg-orange-500 text-white';
      case 'OCCUPIED': return 'bg-rose-500 text-white';
      case 'CLEANING': return 'bg-slate-300 text-slate-800';
      case 'MAINTENANCE': return 'bg-slate-700 text-white';
      case 'BLOCKED': return 'bg-slate-900 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="bg-slate-950 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
      
      {/* Floor Plan Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500">
            <Map size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-wider">Floor Plan Layout</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-Time Table Seating Board</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setShowAddForm(!showAddForm); setShowBatchForm(false); }}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition active:scale-95 border ${
              showAddForm 
                ? 'bg-slate-800 border-slate-700 text-white' 
                : 'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/10'
            }`}
          >
            <Plus size={12} className="inline mr-1" /> Add Table
          </button>
          <button
            onClick={() => { setShowBatchForm(!showBatchForm); setShowAddForm(false); }}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition active:scale-95 border ${
              showBatchForm 
                ? 'bg-slate-800 border-slate-700 text-white' 
                : 'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/10'
            }`}
          >
            <Plus size={12} className="inline mr-1" /> Batch Add (Preset)
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/20 border border-rose-900/50 text-rose-400 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle size={16} /> Note: {error}
        </div>
      )}

      {/* Main Floor Plan Designer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Layout Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span>Main Dining Salon (Indoor Area)</span>
            <div className="flex gap-2 items-center">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Avail</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Booked</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> Seated</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span> Clean</span>
            </div>
          </div>

          {/* Grid Layout Container */}
          <div className="h-[400px] w-full bg-slate-900/40 rounded-[2rem] border border-white/5 relative overflow-hidden">
            {/* Grid Helper lines */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-px pointer-events-none opacity-5">
              {[...Array(36)].map((_, i) => <div key={i} className="border border-white"></div>)}
            </div>

            {/* Render tables on Grid */}
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-slate-500">Retrieving Layout Coordinates...</div>
            ) : (
              tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`absolute p-4 flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 border-2 ${
                    selectedTable?.id === table.id ? 'border-brand-500 scale-105' : 'border-white/5 hover:border-white/20'
                  } ${getStatusColor(table.status)} ${
                    table.shape === 'ROUND' ? 'rounded-full w-24 h-24' : 'rounded-[1.5rem] w-24 h-20'
                  }`}
                  style={{
                    left: `${table.xposition || 30}%`,
                    top: `${table.yposition || 30}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Coffee size={18} />
                  <span className="text-xs font-black uppercase tracking-wider mt-1">T-{table.tableNumber}</span>
                  <span className="text-[9px] opacity-75 font-bold">Cap: {table.capacity}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Action Panel & Forms Sidebar */}
        <div className="space-y-6">
          
          {/* Add Table Form */}
          {showAddForm && (
            <form onSubmit={handleAddTable} className="bg-slate-900 border border-white/5 rounded-[2rem] p-5 space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">New Table Form</h3>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Table Number / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5, VIP-1"
                  value={newNum}
                  onChange={(e) => setNewNum(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">Capacity (People)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newCap}
                    onChange={(e) => setNewCap(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">Seating Area</label>
                  <select
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none"
                  >
                    <option value="INDOOR">Indoor</option>
                    <option value="OUTDOOR">Outdoor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">Rendering Shape</label>
                  <select
                    value={newShape}
                    onChange={(e) => setNewShape(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none"
                  >
                    <option value="SQUARE">Square</option>
                    <option value="ROUND">Round</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">Position Placement</label>
                  <div className="flex gap-2 items-center text-[10px] mt-2 font-mono">
                    X:<input type="number" className="w-8 bg-transparent" value={newX} onChange={(e)=>setNewX(Number(e.target.value))} />
                    Y:<input type="number" className="w-8 bg-transparent" value={newY} onChange={(e)=>setNewY(Number(e.target.value))} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition"
              >
                Create Table Layout
              </button>
            </form>
          )}

          {/* Batch Generate Table Form */}
          {showBatchForm && (
            <form onSubmit={handleBatchAdd} className="bg-slate-900 border border-white/5 rounded-[2rem] p-5 space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Batch Generate Tables</h3>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Seating Capacity</label>
                <select
                  value={batchCap}
                  onChange={(e) => setBatchCap(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none"
                >
                  <option value={2}>2-Seater Table</option>
                  <option value={4}>4-Seater Table</option>
                  <option value={6}>6-Seater Table</option>
                  <option value={8}>8-Seater Table</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">How many to add?</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={batchQty}
                    onChange={(e) => setBatchQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500">Dining Area</label>
                  <select
                    value={batchArea}
                    onChange={(e) => setBatchArea(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none"
                  >
                    <option value="INDOOR">Indoor</option>
                    <option value="OUTDOOR">Outdoor</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition"
              >
                Generate Tables Preset
              </button>
            </form>
          )}

          {/* Table Management Detail Card */}
          {selectedTable ? (
            <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-5 space-y-6 relative overflow-hidden">
              <button 
                onClick={() => setSelectedTable(null)}
                className="absolute right-4 top-4 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Selected Table details</span>
                <h2 className="text-base font-black text-white">Table {selectedTable.tableNumber} ({selectedTable.seatingArea})</h2>
                <p className="text-[10px] text-brand-500 font-bold uppercase tracking-widest">Status: {selectedTable.status}</p>
              </div>

              {/* Status Actions */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Change Seating Status</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateTableStatus(selectedTable.id!, 'AVAILABLE')}
                    className="p-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-xl transition"
                  >
                    Set Available
                  </button>
                  <button
                    onClick={() => updateTableStatus(selectedTable.id!, 'CLEANING')}
                    className="p-2 border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-black text-[9px] uppercase tracking-wider rounded-xl transition"
                  >
                    Clean Table
                  </button>
                  <button
                    onClick={() => updateTableStatus(selectedTable.id!, 'MAINTENANCE')}
                    className="p-2 border border-rose-950/40 bg-rose-950/20 text-rose-400 hover:bg-rose-900/40 font-black text-[9px] uppercase tracking-wider rounded-xl transition"
                  >
                    Maintenance
                  </button>
                  <button
                    onClick={() => updateTableStatus(selectedTable.id!, 'OCCUPIED')}
                    className="p-2 border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition"
                  >
                    Force Occupied
                  </button>
                </div>
              </div>

              {/* Active Booking linked info */}
              {selectedTableBooking ? (
                <div className="border-t border-white/5 pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-brand-500">
                    <Info size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Active Reservation</span>
                  </div>
                  
                  <div className="text-[11px] font-bold text-slate-400 space-y-1">
                    <div className="flex justify-between"><span>Guest:</span><span className="text-white">{selectedTableBooking.user.name}</span></div>
                    <div className="flex justify-between"><span>Guests count:</span><span className="text-white">{selectedTableBooking.guestCount} People</span></div>
                    <div className="flex justify-between"><span>Booking slot:</span><span className="text-white">{selectedTableBooking.timeSlot}</span></div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 font-semibold border-t border-white/5 pt-4">
                  No active reservation assigned for this table slot.
                </div>
              )}

              <button
                onClick={() => handleDeleteTable(selectedTable.id!)}
                className="w-full py-3 bg-rose-950/20 hover:bg-rose-950 text-rose-400 font-black text-[9px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 border border-rose-900/30"
              >
                <Trash2 size={12} /> Delete Table Layout
              </button>

            </div>
          ) : (
            <div className="bg-slate-900 border border-white/5 border-dashed rounded-[2.5rem] p-8 text-center text-slate-500">
              <Info className="mx-auto text-slate-600 mb-3" size={24} />
              <p className="text-xs font-bold leading-relaxed">Select any table from the dining grid map to edit coordinates, manage seating status, or view active reservation summaries.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
