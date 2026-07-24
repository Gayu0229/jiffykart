
import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap, Search, Plus, Trash2, CheckCircle,
  AlertTriangle, Filter, Package, ExternalLink,
  ArrowRight, ShieldCheck, Store, Loader2, Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { Product } from '../../types';

interface JiffyStreetManagerProps {
  onAddProduct?: () => void;
}

const JiffyStreetManager: React.FC<JiffyStreetManagerProps> = ({ onAddProduct }) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'street' | 'catalog'>('street');
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

  const streetProducts = useMemo(() =>
    allProducts.filter(p => p.isJiffyStreet),
    [allProducts]);

  const catalogProducts = useMemo(() =>
    allProducts.filter(p => !p.isJiffyStreet),
    [allProducts]);

  const filteredDisplay = useMemo(() => {
    const list = view === 'street' ? streetProducts : catalogProducts;
    return list.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [view, streetProducts, catalogProducts, searchTerm]);

  const handleToggleStreet = async (product: Product, state: boolean) => {
    try {
      await api.updateProduct(product.id, { isJiffyStreet: state });

      setAllProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, isJiffyStreet: state } : p
      ));

      setToast({
        message: state
          ? `"${product.name}" added to Jiffy Street.`
          : `"${product.name}" removed from Jiffy Street.`,
        type: 'success'
      });
    } catch (e) {
      setToast({ message: "Failed to update product.", type: 'error' });
    }
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium animate-pulse">Syncing Street catalog...</p>
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
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-700 to-accent rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Zap size={120} fill="white" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="fill-yellow-400 text-yellow-400" size={32} />
            Jiffy Street Curation Manager
          </h1>
          <p className="mt-2 text-indigo-100 max-w-2xl opacity-90 font-medium">
            Control exactly what appears on the Jiffy Street customer page. Only admin-selected items with "Jiffy" fulfillment standards are displayed here.
          </p>
          {onAddProduct && (
            <button
              onClick={onAddProduct}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-white text-indigo-900 rounded-xl font-black text-sm shadow-xl shadow-indigo-900/20 hover:bg-indigo-50 transition-all active:scale-95"
            >
              <Plus size={18} /> Create New Street Product
            </button>
          )}
        </div>
      </div>

      {/* Navigation and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full md:w-auto">
          <button
            onClick={() => setView('street')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${view === 'street' ? 'bg-indigo-700 text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
              }`}
          >
            Live on Street ({streetProducts.length})
          </button>
          {/* <button
            onClick={() => setView('catalog')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${view === 'catalog' ? 'bg-indigo-700 text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
              }`}
          >
            Global Catalog
          </button> */}
        </div>

        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder={view === 'street' ? "Search curated items..." : "Search global catalog to promote..."}
            className="w-full pl-11 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none shadow-sm transition-all"
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
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fulfillment</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Visibility</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Curation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDisplay.map((product) => {
                  const vendor = vendors.find(v => v.id === product.vendorId);
                  return (
                    <tr key={product.id} className="hover:bg-indigo-50/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="relative h-16 w-16 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center">
                          <img src={product.imageUrl} alt="" className="h-full w-full object-contain" />
                          {product.isJiffyStreet && (
                            <div className="absolute top-0 right-0 bg-indigo-700 text-white p-1 rounded-bl-lg shadow-sm">
                              <Zap size={10} fill="white" className="animate-pulse" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 group-hover:text-indigo-800 transition-colors">{product.name}</span>
                          <span className="text-xs text-gray-500 font-mono mt-0.5">SKU: {product.sku}</span>
                          <div className="flex gap-2 mt-2">
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{product.category}</span>
                            <span className="text-[10px] font-bold text-indigo-700">${product.price}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {vendor ? (
                          <div className="flex flex-col">
                            <div className="flex items-center text-sm font-medium text-gray-800">
                              <Store size={14} className="mr-1.5 text-gray-400" /> {vendor.shopName}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1 flex items-center">
                              <ShieldCheck size={10} className="mr-1 text-green-500" /> KYC Verified
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit border border-orange-100 font-medium">
                            <AlertTriangle size={12} className="mr-1.5" /> No Vendor Linked
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center text-sm font-bold text-gray-900">
                            <span className="text-yellow-400 mr-1">★</span> {product.rating}
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium">Stock: <span className={product.stock < 10 ? 'text-red-600 font-bold' : 'text-green-600'}>{product.stock} units</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {product.status === 'Live' ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider border border-green-200 shadow-sm flex items-center gap-1">
                              <CheckCircle size={10} /> Live
                            </div>
                            <span className="text-[8px] text-gray-400 font-medium whitespace-nowrap">Visible to Users</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider border border-amber-200 shadow-sm flex items-center gap-1">
                              <Clock size={10} /> {product.status || 'Draft'}
                            </div>
                            <button
                              onClick={() => handleGoLive(product)}
                              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 underline transition-colors"
                            >
                              Publish Now
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {product.isJiffyStreet ? (
                          <button
                            onClick={() => handleToggleStreet(product, false)}
                            className="inline-flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all text-xs font-bold border border-red-100 active:scale-95"
                          >
                            <Trash2 size={14} className="mr-2" /> Remove from Street
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStreet(product, true)}
                            className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-800 rounded-xl hover:bg-indigo-700 hover:text-white transition-all text-xs font-bold border border-indigo-100 shadow-sm active:scale-95"
                          >
                            <Plus size={14} className="mr-2" /> Promote to Street
                          </button>
                        )}
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
            <h3 className="text-xl font-bold text-gray-900">No Products Found</h3>
            <p className="text-gray-500 mt-2 max-w-sm">
              {searchTerm
                ? `We couldn't find any products matching "${searchTerm}" in this view.`
                : view === 'street'
                  ? "No products have been curated for Jiffy Street yet. Start by promoting items from the Global Catalog."
                  : "All products from your vendors appear here. Use the search to find items to curate."}
            </p>
          </div>
        )}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex gap-4 items-start">
        <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-700">
          <Zap size={20} />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900">About Jiffy Street Curation</h4>
          <p className="text-sm text-indigo-800 mt-1 leading-relaxed">
            Jiffy Street is a premium discovery section. Products added here bypass standard algorithmic listings and are given top priority in the customer app.
            <strong> Best Practice:</strong> Only promote items with &gt;4.5 rating and guaranteed 15-minute fulfillment capability.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JiffyStreetManager;