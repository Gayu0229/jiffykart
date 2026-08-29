
import React, { useState } from 'react';
import { User, Lock, Store, CheckCircle, RefreshCw, Save } from 'lucide-react';
import { api } from '../../services/api';

const CreateSellerLogin: React.FC = () => {
  const [selectedSeller, setSelectedSeller] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shopId, setShopId] = useState('');
  const [role, setRole] = useState('Seller');
  const [status, setStatus] = useState('Active');
  const [isSuccess, setIsSuccess] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchVendors = async () => {
      try {
        const data = await api.getVendors();
        setVendors(data);
      } catch (err) {
        console.error("Failed to fetch vendors", err);
      }
    };
    fetchVendors();
  }, []);

  // Auto-fill when seller is selected
  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value;
    setSelectedSeller(vendorId);

    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setShopId(vendor.id);
      // Auto-suggest username
      const suggestedUser = `seller_${vendor.shopName.toLowerCase().replace(/\s+/g, '').slice(0, 10)}`;
      setUsername(suggestedUser);
    } else {
      setShopId('');
      setUsername('');
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$@!";
    let pass = "";
    for (let i = 0; i < 10; i++) {
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
    if (!selectedSeller || !username || !password) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      // Mock API Call: POST /api/v1/users/seller
      // const response = await fetch('/api/v1/users/seller', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     shopId: selectedSeller,
      //     username,
      //     password,
      //     role,
      //     status
      //   }),
      // });

      // if (!response.ok) throw new Error('Failed to create login');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSuccess(true);
    } catch (error) {
      console.error("Error creating seller login:", error);
      alert("Failed to create login. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-indigo-900 mb-2">Seller Login Created!</h2>
        <p className="text-indigo-700 mb-6">The seller can now sign into their specific Seller Dashboard.</p>
        <div className="bg-white p-4 rounded-lg border border-indigo-200 inline-block text-left mb-6 shadow-sm">
          <div className="mb-2"><span className="font-bold text-gray-600 w-24 inline-block">Username:</span> <span className="font-mono text-gray-800">{username}</span></div>
          <div><span className="font-bold text-gray-600 w-24 inline-block">Password:</span> <span className="font-mono text-gray-800">{password}</span></div>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setIsSuccess(false);
              setSelectedSeller('');
              setUsername('');
              setPassword('');
              setConfirmPassword('');
              setShopId('');
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create Seller Login Credentials</h2>
        <p className="text-gray-500 mt-1">Grant access to shop owners to manage products and orders.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Seller Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Shop / Seller</label>
            <div className="relative">
              <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                value={selectedSeller}
                onChange={handleSellerChange}
                required
              >
                <option value="">Select Seller...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.shopName} ({v.ownerName})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder-gray-400"
                placeholder="enter_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono placeholder-gray-400"
                  placeholder="Secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={generatePassword}
                className="w-full py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center font-medium text-sm"
              >
                <RefreshCw size={16} className="mr-2" /> Generate Password
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder-gray-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Shop ID (Read Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Shop ID</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none font-mono"
              value={shopId}
              readOnly
              placeholder="Shop ID will appear here..."
            />
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
              <select
                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option>Seller</option>
                <option>Seller Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
              <select
                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-lg shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.99] flex items-center justify-center"
            >
              <Save size={20} className="mr-2" /> Create Seller Login
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateSellerLogin;
