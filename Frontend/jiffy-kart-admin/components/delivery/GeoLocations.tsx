
import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Loader2, Star, Truck, CreditCard, Save, X, Globe } from 'lucide-react';
import { api } from '../../services/api';
import { City } from '../../types';

const GeoLocations: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const data = await api.getCities();
      setCities(data);
    } catch (err) {
      console.error("Failed to load cities", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleToggleFeatured = async (city: City) => {
    try {
      await api.updateCity(city.id, { isFeatured: !city.isFeatured });
      fetchCities();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleEdit = (city: City) => {
    setSelectedCity({ ...city });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity) return;
    setSaving(true);
    try {
      if (selectedCity.id) {
        await api.updateCity(selectedCity.id, {
          deliveryEstimation: selectedCity.deliveryEstimation,
          isCodAvailable: selectedCity.isCodAvailable,
          isFeatured: selectedCity.isFeatured
        });
      } else {
        // Create not fully implemented with all fields in this mock/partial API
        await api.createCity(selectedCity.name);
      }
      setIsModalOpen(false);
      fetchCities();
      alert("City updated successfully.");
    } catch (err) {
      alert("Failed to save city details");
    } finally {
      setSaving(false);
    }
  };

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Geo Locations Management</h2>
          <p className="text-sm text-gray-500 mt-1">Configure featured cities, delivery times and payment options.</p>
        </div>
        <button 
          onClick={() => { setSelectedCity({ id: '', name: '', isFeatured: false, deliveryEstimation: '', isCodAvailable: true, createdAt: '' }); setIsModalOpen(true); }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Add New City
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search City..." 
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center p-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading locations...</p>
          </div>
        ) : filteredCities.map((city) => (
          <div key={city.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow relative">
            <div className={`absolute top-0 left-0 w-full h-1 ${city.isFeatured ? 'bg-amber-400' : 'bg-transparent'}`}></div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                   <div className={`p-3 rounded-lg ${city.isFeatured ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                      <Globe size={24} />
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-900 line-clamp-1">{city.name}</h3>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">ID: {city.id}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleToggleFeatured(city)}
                  className={`p-1.5 rounded-lg transition-colors ${city.isFeatured ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-300 hover:bg-gray-50'}`}
                  title={city.isFeatured ? 'Featured' : 'Mark as Featured'}
                >
                  <Star size={18} fill={city.isFeatured ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                <div className="space-y-1">
                  <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest flex items-center">
                    <Truck size={10} className="mr-1" /> Delivery
                  </div>
                  <div className="text-sm font-bold text-gray-700">{city.deliveryEstimation || 'Not Set'}</div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest flex items-center justify-end">
                    <CreditCard size={10} className="mr-1" /> COD
                  </div>
                  <div className={`text-sm font-bold ${city.isCodAvailable ? 'text-green-600' : 'text-red-500'}`}>
                    {city.isCodAvailable ? 'Available' : 'Restricted'}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleEdit(city)}
                className="w-full py-2 bg-gray-50 text-gray-700 text-sm font-bold rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={14} /> Configure Location
              </button>
            </div>
          </div>
        ))}
        {!loading && filteredCities.length === 0 && (
          <div className="col-span-full p-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
             <MapPin size={40} className="mx-auto mb-4 opacity-20" />
             <p className="font-medium">No locations matching your search.</p>
          </div>
        )}
      </div>

      {/* Edit City Modal */}
      {isModalOpen && selectedCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Configure {selectedCity.name || 'New City'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-amber-50/30 transition-colors border border-transparent hover:border-amber-100 group">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedCity.isFeatured ? 'bg-amber-100 text-amber-600' : 'bg-white text-gray-400 border border-gray-100'}`}>
                      <Star size={18} fill={selectedCity.isFeatured ? "currentColor" : "none"} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Featured City</p>
                      <p className="text-[10px] text-gray-500">Show on homepage picker</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedCity({...selectedCity, isFeatured: !selectedCity.isFeatured})}
                    className={`w-10 h-5 rounded-full relative transition-colors ${selectedCity.isFeatured ? 'bg-amber-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${selectedCity.isFeatured ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-green-50/30 transition-colors border border-transparent hover:border-green-100 group">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedCity.isCodAvailable ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400 border border-gray-100'}`}>
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Cash on Delivery</p>
                      <p className="text-[10px] text-gray-500">Enable COD for this region</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedCity({...selectedCity, isCodAvailable: !selectedCity.isCodAvailable})}
                    className={`w-10 h-5 rounded-full relative transition-colors ${selectedCity.isCodAvailable ? 'bg-green-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${selectedCity.isCodAvailable ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest pl-1">Delivery Estimation</label>
                <div className="relative">
                  <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="e.g. 25-35 mins or 1-2 days" 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={selectedCity.deliveryEstimation || ''}
                    onChange={e => setSelectedCity({...selectedCity, deliveryEstimation: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-100 text-gray-500 rounded-xl hover:bg-gray-50 text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeoLocations;
