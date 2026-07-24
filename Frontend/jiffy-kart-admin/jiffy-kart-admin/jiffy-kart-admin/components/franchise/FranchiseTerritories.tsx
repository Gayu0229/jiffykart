import React, { useState, useEffect } from 'react';
import { MapPin, Edit, Search, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { FranchiseTerritory } from '../../types';

const FranchiseTerritories: React.FC = () => {
  const [territories, setTerritories] = useState<FranchiseTerritory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTerritories = async () => {
      setLoading(true);
      try {
        const data = await api.getTerritories();
        setTerritories(data);
      } catch (err) {
        console.error("Failed to load territories", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTerritories();
  }, []);

  const handleEdit = (name: string) => {
    alert(`Editing territory: ${name}`);
  };

  const filteredTerritories = territories.filter(ter =>
    ter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ter.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ter.assignedFranchiseName && ter.assignedFranchiseName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Field Manager Territories</h2>
          <p className="text-sm text-gray-500 mt-1">Map regions to field managers.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search territory by name, city or field manager..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center h-[400px]">
            <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-500 font-medium">Synchronizing territories...</p>
          </div>
        ) : (
          <>
            {filteredTerritories.map((ter) => (
              <div key={ter.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 relative hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <MapPin size={24} />
                  </div>
                  <button
                    onClick={() => handleEdit(ter.name)}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{ter.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{ter.city}</p>

                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-400 uppercase font-bold">Assigned To</div>
                  <div className="text-sm font-medium text-indigo-700">{ter.assignedFranchiseName}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <div className="text-xs text-gray-500">Shops</div>
                    <div className="font-bold text-gray-900">{ter.shopCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Orders</div>
                    <div className="font-bold text-gray-900">{ter.orderCount}</div>
                  </div>
                </div>
              </div>
            ))}
            {filteredTerritories.length === 0 && (
              <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                No territories found.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FranchiseTerritories;
