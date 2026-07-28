
import React, { useState, useEffect, useMemo } from 'react';
import {
  Coffee, Search, Plus, Trash2, CheckCircle,
  AlertTriangle, Filter, Package, ExternalLink,
  ArrowRight, ShieldCheck, Store, Loader2, Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { Product } from '../../types';

interface JiffyCafeManagerProps {
  onAddProduct?: () => void;
}

const JiffyCafeManager: React.FC<JiffyCafeManagerProps> = ({ onAddProduct }) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const v = await api.getVendors();
      setVendors(v);
    } catch (e) {
      console.error("Failed to load vendors", e);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const products = await api.getAllProducts();
      setAllProducts(products);
    } catch (e) {
      setToast({ message: "Failed to load products.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const cafeProducts = useMemo(() =>
    allProducts.filter(p => p.isJiffyCafe),
    [allProducts]);

  const filteredDisplay = useMemo(() => {
    return cafeProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [cafeProducts, searchTerm]);

  const handleGoLive = async (product: Product) => {
    try {
      await api.updateProduct(product.id, { status: 'Live' });
      setAllProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, status: 'Live' } : p
      ));
      setToast({ message: `"${product.name}" is now Live!`, type: 'success' });
    } catch (e) {
      setToast({ message: "Failed to publish product.", type: 'error' });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${product.name}"?`)) return;
    
    try {
      await api.deleteProduct(product.id);
      setAllProducts(prev => prev.filter(p => p.id !== product.id));
      setToast({ message: `"${product.name}" deleted successfully.`, type: 'success' });
    } catch (e) {
      setToast({ message: "Failed to delete product.", type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium animate-pulse">Syncing Cafe menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-white" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Coffee size={120} fill="white" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Coffee className="fill-white/20 text-white" size={32} />
            Jiffy Cafe Manager
          </h1>
          <p className="mt-2 text-orange-50 text-max-w-2xl opacity-90 font-medium">
            Manage your food and beverage catalog. Select prepared meals, beverages, and cafe items to showcase in the Jiffy Cafe section.
          </p>
          {onAddProduct && (
            <button
              onClick={onAddProduct}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-xl font-black text-sm shadow-xl shadow-orange-900/20 hover:bg-orange-50 transition-all active:scale-95"
            >
              <Plus size={18} /> Create New Cafe Product
            </button>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-end items-center">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-600 transition-colors" />
          <input
            type="text"
            placeholder="Search cafe items..."
            className="w-full pl-11 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 outline-none shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        {filteredDisplay.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Preview</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Visibility</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDisplay.map((product) => {
                  return (
                    <tr key={product.id} className="hover:bg-orange-50/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="relative h-16 w-16 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center">
                          <img src={product.imageUrl} alt="" className="h-full w-full object-contain" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 group-hover:text-orange-700 transition-colors">{product.name}</span>
                          <div className="flex gap-2 mt-2">
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{product.category}</span>
                            <span className="text-[10px] font-bold text-orange-700">${product.price}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {product.status === 'Live' ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider border border-green-200 shadow-sm flex items-center gap-1">
                              <CheckCircle size={10} /> Live
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider border border-amber-200 shadow-sm flex items-center gap-1">
                              <Clock size={10} /> {product.status || 'Draft'}
                            </div>
                            <button
                              onClick={() => handleGoLive(product)}
                              className="text-[9px] font-bold text-orange-600 hover:text-orange-800 underline transition-colors"
                            >
                              Publish Now
                            </button>
                          </div>
                        )}
                      </td>
                       <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="inline-flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs font-bold border border-red-100 active:scale-95 shadow-sm"
                        >
                          <Trash2 size={14} className="mr-2" /> Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-200">
              <Package size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No Cafe Items</h3>
            <p className="text-gray-500 mt-2 max-w-sm">
              {searchTerm
                ? `No products matching "${searchTerm}" found.`
                : "Your Cafe menu is empty. Start by creating a new cafe product."}
            </p>
          </div>
        )}
      </div>

      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex gap-4 items-start">
        <div className="p-2 bg-white rounded-lg shadow-sm text-orange-700">
          <Coffee size={20} />
        </div>
        <div>
          <h4 className="font-bold text-orange-900">About Jiffy Cafe curation</h4>
          <p className="text-sm text-orange-800 mt-1 leading-relaxed">
            Cafe products are prepared meals or beverages intended for quick delivery. 
            <strong> Selection criteria:</strong> High-quality packaging and preparation speed under 10 minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JiffyCafeManager;
