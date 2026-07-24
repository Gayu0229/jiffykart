
import React, { useState } from 'react';
import { Save, Percent, Layers, Briefcase } from 'lucide-react';
import { CommissionRule } from '../../types';

const CommissionSettings: React.FC = () => {
  const [defaultCommission, setDefaultCommission] = useState(5);
  const [categoryRules, setCategoryRules] = useState<CommissionRule[]>([]);

  const handleCategoryChange = (id: string, newVal: string) => {
    const val = parseFloat(newVal);
    setCategoryRules(prev => prev.map(r => r.id === id ? { ...r, percentage: isNaN(val) ? 0 : val } : r));
  };

  const handleSave = async () => {
    try {
      // Mock API Call: PUT /api/v1/settings/commission
      // await fetch('/api/v1/settings/commission', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ defaultCommission, categoryRules })
      // });
      await new Promise(resolve => setTimeout(resolve, 600));

      alert('Commission settings have been successfully updated.');
    } catch (e) {
      alert('Failed to save settings.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Commission Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure platform fees and revenue sharing models.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Save size={18} className="mr-2" />
          Save Settings
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* Default Commission */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Briefcase size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Default Platform Commission</h3>
              <p className="text-sm text-gray-500 mb-4">
                This percentage applies to all transactions unless a specific category or vendor rule overrides it.
              </p>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={defaultCommission}
                  onChange={(e) => setDefaultCommission(parseFloat(e.target.value))}
                  className="w-full pl-4 pr-10 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-medium"
                />
                <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Category-wise Commission */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Layers size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Category-wise Commission</h3>
          </div>

          <div className="space-y-4">
            {categoryRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors bg-gray-50/50">
                <div className="font-medium text-gray-800">{rule.category}</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Commission:</span>
                  <div className="relative w-24">
                    <input
                      type="number"
                      value={rule.percentage}
                      onChange={(e) => handleCategoryChange(rule.id, e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 bg-white text-gray-900 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-right font-medium"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-primary font-medium hover:underline">
            + Add New Category Rule
          </button>
        </div>

        {/* Vendor Specific (Placeholder) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm opacity-70">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Vendor-specific Overrides</h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded uppercase font-bold">Coming Soon</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Set custom commission rates for specific high-volume or strategic partners.
          </p>
        </div>

      </div>
    </div>
  );
};

export default CommissionSettings;
