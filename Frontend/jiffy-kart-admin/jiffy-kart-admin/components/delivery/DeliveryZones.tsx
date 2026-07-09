
import React, { useState } from 'react';
import { Search, Plus, Map, Edit, Trash2, MapPin, X, Save } from 'lucide-react';

interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  activePartners: number;
  pendingOrders: number;
  status: 'Active' | 'Inactive';
  coverageRadius: string;
}

const MOCK_ZONES: DeliveryZone[] = [
  { id: 'Z001', name: 'Downtown Core', city: 'Springfield', activePartners: 12, pendingOrders: 45, status: 'Active', coverageRadius: '5 km' },
  { id: 'Z002', name: 'North Industrial', city: 'Springfield', activePartners: 5, pendingOrders: 12, status: 'Active', coverageRadius: '8 km' },
  { id: 'Z003', name: 'West Suburbs', city: 'Springfield', activePartners: 8, pendingOrders: 23, status: 'Active', coverageRadius: '10 km' },
  { id: 'Z004', name: 'East Riverside', city: 'Springfield', activePartners: 0, pendingOrders: 0, status: 'Inactive', coverageRadius: '6 km' },
];

const DeliveryZones: React.FC = () => {
  const [zones, setZones] = useState<DeliveryZone[]>(MOCK_ZONES);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newZone, setNewZone] = useState<Partial<DeliveryZone>>({
    name: '',
    city: '',
    coverageRadius: '',
    status: 'Active'
  });

  const filteredZones = zones.filter(zone => 
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    zone.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this zone?')) {
      try {
        // Mock API Call: DELETE /api/v1/delivery/zones/:id
        // await fetch(`/api/v1/delivery/zones/${id}`, { method: 'DELETE' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setZones(prev => prev.filter(z => z.id !== id));
      } catch (e) {
        alert("Failed to delete zone.");
      }
    }
  };

  const handleAddZone = () => {
    setNewZone({
        name: '',
        city: '',
        coverageRadius: '',
        status: 'Active'
    });
    setIsAddModalOpen(true);
  };

  const handleEditZone = (zone: DeliveryZone) => {
    alert(`Editing zone "${zone.name}"... (Edit modal would open here)`);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZone.name || !newZone.city || !newZone.coverageRadius) {
        alert("Please fill in all required fields");
        return;
    }

    try {
        // Mock API Call: POST /api/v1/delivery/zones
        // await fetch('/api/v1/delivery/zones', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(newZone),
        // });

        await new Promise(resolve => setTimeout(resolve, 500));

        const zoneToAdd: DeliveryZone = {
            id: `Z${Math.floor(Math.random() * 10000)}`,
            name: newZone.name || '',
            city: newZone.city || '',
            coverageRadius: newZone.coverageRadius.includes('km') ? newZone.coverageRadius : `${newZone.coverageRadius} km`,
            status: 'Active',
            activePartners: 0,
            pendingOrders: 0
        };

        setZones(prev => [...prev, zoneToAdd]);
        setIsAddModalOpen(false);
        alert("Zone created successfully.");
    } catch (error) {
        console.error("Failed to save zone", error);
        alert("Failed to save delivery zone.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Delivery Zones</h2>
          <p className="text-sm text-gray-500 mt-1">Manage delivery areas and coverage.</p>
        </div>
        <button 
          onClick={handleAddZone}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Add New Zone
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search Zone Name or City..." 
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredZones.map((zone) => (
          <div key={zone.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-32 bg-gray-100 relative group">
               {/* Mock Map Background */}
               <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400">
                  <Map size={48} className="opacity-20" />
               </div>
               {/* Actions always visible */}
               <div className="absolute top-2 right-2 flex gap-2">
                  <button 
                    onClick={() => handleEditZone(zone)}
                    className="p-1.5 bg-white text-gray-600 rounded shadow hover:text-primary transition-colors"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(zone.id)}
                    className="p-1.5 bg-white text-red-600 rounded shadow hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
               </div>
               <div className="absolute bottom-2 left-2">
                 <span className={`px-2 py-1 text-xs font-bold rounded shadow-sm ${
                   zone.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                 }`}>
                   {zone.status}
                 </span>
               </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="font-bold text-gray-900 text-lg">{zone.name}</h3>
                   <div className="text-sm text-gray-500 flex items-center">
                     <MapPin size={12} className="mr-1" /> {zone.city}
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
                <div>
                   <div className="text-xs text-gray-400 uppercase font-bold">Coverage</div>
                   <div className="font-medium text-gray-700">{zone.coverageRadius}</div>
                </div>
                 <div>
                   <div className="text-xs text-gray-400 uppercase font-bold">Active Drivers</div>
                   <div className="font-medium text-gray-700">{zone.activePartners}</div>
                </div>
                 <div>
                   <div className="text-xs text-gray-400 uppercase font-bold">Pending Orders</div>
                   <div className="font-medium text-gray-700">{zone.pendingOrders}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Zone Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800">Create Delivery Zone</h3>
                 <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                 </button>
              </div>
              <form onSubmit={handleSaveZone} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="e.g. Downtown South"
                      value={newZone.name}
                      onChange={e => setNewZone({...newZone, name: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="e.g. Springfield"
                      value={newZone.city}
                      onChange={e => setNewZone({...newZone, city: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Radius (km)</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="e.g. 5"
                      value={newZone.coverageRadius}
                      onChange={e => setNewZone({...newZone, coverageRadius: e.target.value})}
                    />
                 </div>
                 
                 <div className="pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                       Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center"
                    >
                       <Save size={18} className="mr-2"/> Create Zone
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryZones;
