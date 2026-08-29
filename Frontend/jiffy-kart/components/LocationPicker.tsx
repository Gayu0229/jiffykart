import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, X, ChevronRight, ChevronLeft, Search, Check, Globe, Star } from 'lucide-react';
import { useNavigation } from '../hooks';
import { ApiService } from '../services/apiService';
import { City } from '../types';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CityData extends City {}

export const LocationPicker: React.FC<LocationPickerProps> = ({ isOpen, onClose }) => {
  const { city, setCity, setCityObj, area, setArea, setAreaId, setCoords } = useNavigation();
  const [isDetecting, setIsDetecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCityForZones, setSelectedCityForZones] = useState<CityData | null>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLocations();
    } else {
      setSelectedCityForZones(null);
      setAreas([]);
    }
  }, [isOpen]);

  const loadLocations = async () => {
    setLoading(true);
    const data = await ApiService.getLocations();
    setCities(data);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCityForZones) {
      setLoadingAreas(true);
      ApiService.getZones(selectedCityForZones.id)
        .then(setAreas)
        .finally(() => setLoadingAreas(false));
    }
  }, [selectedCityForZones]);

  if (!isOpen) return null;

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    const loc = await ApiService.getCurrentLocation();
    setIsDetecting(false);
    if (loc) {
      setCoords(loc);
      setArea('Nearby Me');
      onClose();
    } else {
      alert("Location access denied or unavailable.");
    }
  };

  const handleSelectCity = (targetCity: CityData) => {
    setCity(targetCity.name);
    setCityObj(targetCity);
    setSelectedCityForZones(targetCity);
  };

  const handleSelectArea = (targetArea: string, targetAreaId: string | null) => {
    setArea(targetArea);
    setAreaId(targetAreaId);
    setCoords(null);
    onClose();
  };

  const featuredCities = cities.filter(c => c.isFeatured);
  const otherCities = cities.filter(c => !c.isFeatured);

  const filterFn = (c: CityData) => c.name.toLowerCase().includes(searchQuery.toLowerCase());
  const displayFeatured = featuredCities.filter(filterFn);
  const displayOthers = otherCities.filter(filterFn);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center md:items-center px-0 md:px-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>

      <div className="bg-white w-full max-w-xl h-full md:h-auto md:max-h-[85vh] md:rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedCityForZones ? (
              <button 
                onClick={() => setSelectedCityForZones(null)}
                className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition"
              >
                <ChevronLeft size={24} />
              </button>
            ) : (
              <div className="w-10 h-10 bg-indigo-50 text-primary rounded-xl flex items-center justify-center">
                <Globe size={24} />
              </div>
            )}
            <h2 className="text-xl font-black text-slate-900">
              {selectedCityForZones ? `Select Area in ${selectedCityForZones.name}` : 'Change Location'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-900">
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        {!selectedCityForZones && (
          <div className="px-6 py-4 bg-slate-50/50">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search your city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 pl-12 pr-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-slate-900"
                autoFocus
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {selectedCityForZones ? (
            <div className="space-y-4">
              {loadingAreas ? (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400 font-bold">Fetching areas...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleSelectArea('All Areas', null)}
                    className={`flex items-center justify-between p-4 rounded-2xl transition group ${area === 'All Areas' ? 'bg-indigo-50 border border-primary/20' : 'hover:bg-slate-50 border border-transparent'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${area === 'All Areas' ? 'bg-primary text-white' : 'bg-white text-slate-400 group-hover:text-slate-600 transition shadow-sm'}`}>
                        <MapPin size={18} />
                      </div>
                      <span className={`font-bold ${area === 'All Areas' ? 'text-primary' : 'text-slate-700'}`}>All Areas</span>
                    </div>
                    {area === 'All Areas' && <Check size={18} className="text-primary" strokeWidth={3} />}
                  </button>
                  {areas.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleSelectArea(a.name, a.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl transition group ${area === a.name ? 'bg-indigo-50 border border-primary/20' : 'hover:bg-slate-50 border border-transparent'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${area === a.name ? 'bg-primary text-white' : 'bg-white text-slate-400 group-hover:text-slate-600 transition shadow-sm'}`}>
                          <MapPin size={18} />
                        </div>
                        <span className={`font-bold ${area === a.name ? 'text-primary' : 'text-slate-700'}`}>{a.name}</span>
                      </div>
                      {area === a.name && <Check size={18} className="text-primary" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* GPS Option */}
              {!searchQuery && (
                <button
                  onClick={handleDetectLocation}
                  className="w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-indigo-50 transition group"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-sm ${isDetecting ? 'bg-primary text-white animate-pulse' : 'bg-white text-primary group-hover:bg-primary group-hover:text-white'}`}>
                    <Navigation size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-black text-slate-900 group-hover:text-primary transition">Detect current location</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Using GPS / Precise location</p>
                  </div>
                  <ChevronRight size={20} className="ml-auto text-slate-300 group-hover:text-primary" />
                </button>
              )}

              {/* Featured Cities */}
              {displayFeatured.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 ml-2">
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Featured Locations</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {displayFeatured.map((c) => (
                      <CityItem key={c.id} c={c} isSelected={city === c.name} onSelect={() => handleSelectCity(c)} />
                    ))}
                  </div>
                </div>
              )}

              {/* All Other Cities */}
              {displayOthers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">All Cities</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {displayOthers.map((c) => (
                      <CityItem key={c.id} c={c} isSelected={city === c.name} onSelect={() => handleSelectCity(c)} />
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400 font-bold">Fetching locations...</p>
                </div>
              )}

              {!loading && displayFeatured.length === 0 && displayOthers.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <Search size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">No results found</h3>
                  <p className="text-slate-400">Try searching with a different city name.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Hyperlocal delivery available in <br />
            <span className="text-slate-600">All Featured Cities</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const CityItem: React.FC<{ c: CityData; isSelected: boolean; onSelect: () => void }> = ({ c, isSelected, onSelect }) => (
  <button
    onClick={onSelect}
    className={`flex items-center justify-between p-4 rounded-2xl transition group ${isSelected ? 'bg-indigo-50 border border-primary/20' : 'hover:bg-slate-50 border border-transparent'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-white text-slate-400 group-hover:text-slate-600 transition shadow-sm'}`}>
        <MapPin size={18} />
      </div>
      <span className={`font-bold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{c.name}</span>
    </div>
    {isSelected ? (
      <Check size={18} className="text-primary" strokeWidth={3} />
    ) : (
      <ChevronRight size={18} className="text-slate-200 opacity-0 group-hover:opacity-100 transition" />
    )}
  </button>
);
