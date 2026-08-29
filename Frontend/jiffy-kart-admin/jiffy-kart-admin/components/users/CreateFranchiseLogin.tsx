import React, { useState, useEffect } from 'react';
import { User, Lock, Briefcase, CheckCircle, RefreshCw, Save, ChevronDown, ChevronRight, MapPin, CheckSquare, Square } from 'lucide-react';
import { api } from '../../services/api';
import { City, Zone, Pincode } from '../../types';

interface NestedZone {
  zone: Zone;
  pincodes: Pincode[];
}

interface NestedCity {
  city: City;
  zones: NestedZone[];
}

const CreateFranchiseLogin: React.FC = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('FIELD_MANAGER');
  const [status, setStatus] = useState('Active');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Geo Data
  const [geoHierarchy, setGeoHierarchy] = useState<NestedCity[]>([]);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  // Selections
  const [selectedCityIds, setSelectedCityIds] = useState<Set<string>>(new Set());
  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<string>>(new Set());
  const [selectedPincodeIds, setSelectedPincodeIds] = useState<Set<string>>(new Set());

  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    loadAllGeoData();
  }, []);

  const loadAllGeoData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const cities = await api.getCities();
      const hierarchicalData = await Promise.all(cities.map(async (city) => {
        const zones = await api.getZones(city.id);
        const zonesWithPincodes = await Promise.all(zones.map(async (zone) => {
          const pincodes = await api.getPincodes(zone.id);
          return { zone, pincodes };
        }));
        return { city, zones: zonesWithPincodes };
      }));
      setGeoHierarchy(hierarchicalData);
    } catch (error: any) {
      console.error("Error loading geo data:", error);
      const errorMsg = error?.response?.data?.message || String(error);
      setApiError(`Failed to load territories: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCity = (cityId: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(cityId)) newExpanded.delete(cityId);
    else newExpanded.add(cityId);
    setExpandedCities(newExpanded);
  };

  const toggleZoneExpansion = (zoneId: string) => {
    const newExpanded = new Set(expandedZones);
    if (newExpanded.has(zoneId)) newExpanded.delete(zoneId);
    else newExpanded.add(zoneId);
    setExpandedZones(newExpanded);
  };

  const handleCitySelect = (city: NestedCity) => {
    const cityId = city.city.id;
    const newCityIds = new Set(selectedCityIds);
    const newZoneIds = new Set(selectedZoneIds);
    const newPincodeIds = new Set(selectedPincodeIds);

    if (newCityIds.has(cityId)) {
      // Deselect City and all children
      newCityIds.delete(cityId);
      city.zones.forEach(nz => {
        newZoneIds.delete(nz.zone.id);
        nz.pincodes.forEach(p => newPincodeIds.delete(p.id));
      });
    } else {
      // Select City and all children
      newCityIds.add(cityId);
      city.zones.forEach(nz => {
        newZoneIds.add(nz.zone.id);
        nz.pincodes.forEach(p => newPincodeIds.add(p.id));
      });
    }

    setSelectedCityIds(newCityIds);
    setSelectedZoneIds(newZoneIds);
    setSelectedPincodeIds(newPincodeIds);
  };

  const handleZoneSelect = (nestedCity: NestedCity, nestedZone: NestedZone) => {
    const zoneId = nestedZone.zone.id;
    const newZoneIds = new Set(selectedZoneIds);
    const newPincodeIds = new Set(selectedPincodeIds);
    const newCityIds = new Set(selectedCityIds);

    if (newZoneIds.has(zoneId)) {
      newZoneIds.delete(zoneId);
      nestedZone.pincodes.forEach(p => newPincodeIds.delete(p.id));
      newCityIds.delete(nestedCity.city.id);
    } else {
      newZoneIds.add(zoneId);
      nestedZone.pincodes.forEach(p => newPincodeIds.add(p.id));

      // Check if all zones of this city are now selected
      const allZonesSelected = nestedCity.zones.every(nz => newZoneIds.has(nz.zone.id));
      if (allZonesSelected) newCityIds.add(nestedCity.city.id);
    }

    setSelectedZoneIds(newZoneIds);
    setSelectedPincodeIds(newPincodeIds);
    setSelectedCityIds(newCityIds);
  };

  const handlePincodeSelect = (nestedCity: NestedCity, nestedZone: NestedZone, pincodeId: string) => {
    const newPincodeIds = new Set(selectedPincodeIds);
    const newZoneIds = new Set(selectedZoneIds);
    const newCityIds = new Set(selectedCityIds);

    if (newPincodeIds.has(pincodeId)) {
      newPincodeIds.delete(pincodeId);
      newZoneIds.delete(nestedZone.zone.id);
      newCityIds.delete(nestedCity.city.id);
    } else {
      newPincodeIds.add(pincodeId);

      // Check if all pincodes of this zone are now selected
      const allPincodesSelected = nestedZone.pincodes.every(p => newPincodeIds.has(p.id));
      if (allPincodesSelected) {
        newZoneIds.add(nestedZone.zone.id);
        // Check if all zones of this city are now selected
        const allZonesSelected = nestedCity.zones.every(nz => newZoneIds.has(nz.zone.id));
        if (allZonesSelected) newCityIds.add(nestedCity.city.id);
      }
    }

    setSelectedPincodeIds(newPincodeIds);
    setSelectedZoneIds(newZoneIds);
    setSelectedCityIds(newCityIds);
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "field";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setConfirmPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (selectedPincodeIds.size === 0) {
      alert("Please select at least one pincode.");
      return;
    }

    setIsLoading(true);
    try {
      const userResponse = await api.createAdminUser({
        name: name || username,
        email: username.includes('@') ? username : `${username}@jiffykart.org`,
        phone: null,
        password: password,
        role: role,
        enabled: status === 'Active',
        forcePasswordChange: true
      });

      await api.assignFieldManagerAreas(userResponse.id, {
        cityIds: Array.from(selectedCityIds),
        zoneIds: Array.from(selectedZoneIds),
        pincodeIds: Array.from(selectedPincodeIds)
      });

      setIsSuccess(true);
    } catch (error: any) {
      alert(error.response?.data || "Failed to create field manager.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Success!</h2>
        <p className="text-green-700 mb-6">Field manager account created and areas assigned.</p>
        <div className="bg-white p-4 rounded-lg border border-green-200 text-left mb-6 font-mono text-sm inline-block">
          <div><span className="font-bold">Username:</span> {username}</div>
          <div><span className="font-bold">Password:</span> {password}</div>
        </div>
        <button
          onClick={() => {
            setIsSuccess(false);
            setName('');
            setUsername('');
            setPassword('');
            setConfirmPassword('');
            setSelectedCityIds(new Set());
            setSelectedZoneIds(new Set());
            setSelectedPincodeIds(new Set());
          }}
          className="block w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
        >
          Create Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">Create Field Manager</h2>
        <p className="text-gray-600">Assign territories in <b>Chennai</b> and <b>Bengaluru</b>.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: User Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <User size={20} className="text-indigo-600" /> Account Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username / Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="field_manager_1"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-2 text-sm font-bold"
                  >
                    <RefreshCw size={16} /> Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                  <select
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="FIELD_MANAGER">Field Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Geo Selector */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm min-h-[500px] flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
              <MapPin size={20} className="text-indigo-600" /> Assign Territories
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 max-h-[600px] pr-2 custom-scrollbar">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <RefreshCw className="animate-spin mb-4" size={32} />
                  <p className="font-medium">Loading geographic data...</p>
                </div>
              )}

              {apiError && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-red-500 border-2 border-dashed border-red-100 bg-red-50/50 rounded-2xl">
                  <MapPin size={48} className="mb-4 opacity-50" />
                  <p className="font-bold">API Connection Failed</p>
                  <p className="text-sm mt-2 text-red-400 px-6 text-center">{apiError}</p>
                </div>
              )}

              {!apiError && !isLoading && geoHierarchy.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                  <MapPin size={48} className="mb-4 opacity-20" />
                  <p className="font-medium">No territories found in database</p>
                  <p className="text-xs mt-1">Please ensure Chennai and Bengaluru are seeded.</p>
                </div>
              )}

              {geoHierarchy.map((nc) => (
                <div key={nc.city.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  {/* City Header */}
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleCity(nc.city.id)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                        {expandedCities.has(nc.city.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                      <button
                        onClick={() => handleCitySelect(nc)}
                        className="flex items-center gap-2 group"
                      >
                        {selectedCityIds.has(nc.city.id) ? (
                          <CheckSquare size={22} className="text-indigo-600 fill-indigo-50" />
                        ) : (
                          <Square size={22} className="text-gray-300 group-hover:text-gray-400" />
                        )}
                        <span className="font-bold text-gray-800 tracking-tight">{nc.city.name}</span>
                      </button>
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-gray-100">
                      City scope
                    </span>
                  </div>

                  {/* Zones */}
                  {expandedCities.has(nc.city.id) && (
                    <div className="p-2 space-y-2 bg-white">
                      {nc.zones.map((nz) => (
                        <div key={nz.zone.id} className="ml-4 border-l-2 border-indigo-50 pl-4 py-1">
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <button onClick={() => toggleZoneExpansion(nz.zone.id)} className="text-gray-400 hover:text-indigo-500">
                                {expandedZones.has(nz.zone.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <button
                                onClick={() => handleZoneSelect(nc, nz)}
                                className="flex items-center gap-2"
                              >
                                {selectedZoneIds.has(nz.zone.id) ? (
                                  <CheckSquare size={18} className="text-indigo-500" />
                                ) : (
                                  <Square size={18} className="text-gray-300" />
                                )}
                                <span className="text-sm font-semibold text-gray-700">{nz.zone.name}</span>
                              </button>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 uppercase tracking-tighter transition-opacity pr-2">
                              Select All Pincodes
                            </span>
                          </div>

                          {/* Pincodes */}
                          {expandedZones.has(nz.zone.id) && (
                            <div className="grid grid-cols-2 gap-2 mt-2 ml-6">
                              {nz.pincodes.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => handlePincodeSelect(nc, nz, p.id)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${selectedPincodeIds.has(p.id)
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                  {selectedPincodeIds.has(p.id) ? (
                                    <CheckSquare size={14} className="text-indigo-600" />
                                  ) : (
                                    <Square size={14} />
                                  )}
                                  <span className="text-xs font-mono font-medium">{p.pincode}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Selected Pincodes</p>
                <p className="text-2xl font-black text-indigo-600">{selectedPincodeIds.size}</p>
              </div>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || selectedPincodeIds.size === 0}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:shadow-none transition-all flex items-center gap-2"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                Save Field Manager
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFranchiseLogin;
