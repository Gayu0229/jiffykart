
import React, { useState } from 'react';
import { Zap, Clock, Plus, ChevronRight, Search } from 'lucide-react';
import { FlashSale } from '../../types';

const FlashSales: React.FC = () => {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = sales.filter(sale =>
    sale.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    alert("Create Flash Sale modal would open here.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Flash Sale Manager</h2>
          <p className="text-sm text-gray-500 mt-1">Create time-limited exclusive deals.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          New Flash Sale
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search flash sale..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredSales.map((sale) => (
          <div key={sale.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4 sm:mb-0 w-full sm:w-auto">
              <div className={`p-4 rounded-full ${sale.status === 'Active' ? 'bg-red-100 text-red-600' :
                  sale.status === 'Upcoming' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-500'
                }`}>
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{sale.name}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Clock size={14} className="mr-1.5" />
                  {sale.startTime} — {sale.endTime}
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">{sale.productCount} Products</span>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-medium">Up to {sale.discountUpTo}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${sale.status === 'Active' ? 'bg-red-100 text-red-800 animate-pulse' :
                  sale.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                {sale.status}
              </span>
              <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        ))}
        {filteredSales.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No flash sales found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashSales;
