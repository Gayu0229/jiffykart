
import React, { useState, useEffect } from 'react';
import {
    Search, CheckCircle, XCircle, Eye, Package,
    AlertCircle, X, AlertTriangle, Loader2, Image as ImageIcon, Zap
} from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';

const PendingProducts: React.FC = () => {
    const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // UI State
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [detailsModal, setDetailsModal] = useState<{
        isOpen: boolean;
        product: Product | null;
    }>({ isOpen: false, product: null });
    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject' | null;
        product: Product | null;
    }>({ isOpen: false, type: null, product: null });

    const fetchPendingProducts = async () => {
        setIsLoading(true);
        try {
            const data = await api.getPendingProducts();
            setPendingProducts(data);
        } catch (e) {
            console.error('Fetch error:', e);
            setToast({ message: 'Failed to load pending products.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingProducts();
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const filteredProducts = pendingProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const initiateAction = (product: Product, type: 'approve' | 'reject') => {
        setRejectionReason('');
        setActionModal({ isOpen: true, type, product });
    };

    const confirmAction = async () => {
        if (!actionModal.product || !actionModal.type) return;

        try {
            if (actionModal.type === 'approve') {
                await api.approveProduct(actionModal.product.id);
                setToast({ message: `Product "${actionModal.product.name}" approved!`, type: 'success' });
            } else {
                await api.rejectProduct(actionModal.product.id, rejectionReason);
                setToast({ message: `Product "${actionModal.product.name}" rejected.`, type: 'error' });
            }
            fetchPendingProducts();
        } catch (error) {
            console.error('Action failed:', error);
            setToast({ message: 'Action failed. Please try again.', type: 'error' });
        } finally {
            setActionModal({ isOpen: false, type: null, product: null });
            setDetailsModal({ isOpen: false, product: null });
            setRejectionReason('');
        }
    };

    return (
        <div className="space-y-6 relative animate-in fade-in duration-300">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="text-indigo-600" /> Pending Product Approvals
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Review vendor products before they are published to the store.</p>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 text-indigo-800 text-sm font-medium flex items-center">
                    <AlertCircle size={16} className="mr-2" />
                    {pendingProducts.length} Products Waiting
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by Name, SKU or Vendor..."
                        className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                        <p className="text-sm text-gray-500 font-medium">Fetching pending products...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor / Shop</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price / Category</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-indigo-50/10 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 relative">
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} className="w-full h-full object-contain" alt={product.name} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <ImageIcon size={20} />
                                                        </div>
                                                    )}
                                                    {product.isJiffyStreet && (
                                                        <div className="absolute top-0 right-0 p-0.5 bg-indigo-600 text-white rounded-bl-md">
                                                            <Zap size={8} fill="white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{product.name}</div>
                                                    <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{product.vendorName || 'N/A'}</div>
                                            <div className="text-[10px] text-indigo-600 font-bold uppercase">{product.shopName || 'No Shop'}</div>
                                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-indigo-700">₹{product.price}</div>
                                            <div className="text-xs text-gray-500">{product.category}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium text-[10px] uppercase">
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setDetailsModal({ isOpen: true, product })}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => initiateAction(product, 'approve')}
                                                    className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-bold shadow-sm"
                                                >
                                                    <CheckCircle size={14} className="mr-1.5" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => initiateAction(product, 'reject')}
                                                    className="flex items-center px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors text-xs font-bold"
                                                >
                                                    <XCircle size={14} className="mr-1.5" /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!isLoading && filteredProducts.length === 0 && (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Package size={48} className="text-gray-200 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Pending Products</h3>
                        <p className="text-sm text-gray-400 mt-1">There are no products waiting for approval in the database.</p>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {actionModal.isOpen && actionModal.product && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">
                                {actionModal.type === 'approve' ? 'Approve Product' : 'Reject Product'}
                            </h3>
                            <button onClick={() => setActionModal({ isOpen: false, type: null, product: null })} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-600 text-sm mb-4">
                                Are you sure you want to {actionModal.type} <span className="font-bold text-gray-900">{actionModal.product.name}</span>?
                                {actionModal.type === 'approve' ? ' It will be live on the store immediately.' : ' The vendor will be notified of the rejection.'}
                            </p>

                            {actionModal.type === 'reject' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Reason for Rejection</label>
                                    <textarea
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all h-24 resize-none"
                                        placeholder="e.g. Images are blurry, price is too high for this category..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionModal({ isOpen: false, type: null, product: null })}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`flex-1 py-2 text-white rounded-lg font-medium shadow-sm ${actionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Details Modal */}
            {detailsModal.isOpen && detailsModal.product && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Product Review</h3>
                                <p className="text-xs text-gray-500 font-medium">Detailed specifications and vendor information</p>
                            </div>
                            <button onClick={() => setDetailsModal({ isOpen: false, product: null })} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Left: Images & Basic Info */}
                                <div className="space-y-6">
                                    <div className="aspect-square rounded-3xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center p-8">
                                        {detailsModal.product.imageUrl ? (
                                            <img src={detailsModal.product.imageUrl} className="max-w-full max-h-full object-contain" alt="" />
                                        ) : (
                                            <ImageIcon size={64} className="text-gray-200" />
                                        )}
                                    </div>
                                     <div className="grid grid-cols-1 gap-4">
                                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Price</p>
                                            <p className="text-xl font-black text-indigo-700">₹{detailsModal.product.price}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Metadata & Description */}
                                <div className="space-y-8">
                                    <div>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded uppercase tracking-wider">{detailsModal.product.category}</span>
                                        <h2 className="text-3xl font-black text-gray-900 mt-2 tracking-tight">{detailsModal.product.name}</h2>
                                        <p className="text-sm text-gray-400 font-medium mt-1">SKU: {detailsModal.product.sku}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 pb-6 border-b border-gray-100">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Vendor</p>
                                            <p className="text-sm font-bold text-gray-900">{detailsModal.product.vendorName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Shop Name</p>
                                            <p className="text-sm font-bold text-indigo-600 uppercase">{detailsModal.product.shopName || 'No Shop'}</p>
                                        </div>
                                         <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">MRP</p>
                                            <p className="text-sm font-bold text-gray-500 line-through">₹{detailsModal.product.mrp}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Jiffy Street</p>
                                            <div className={`text-xs font-bold inline-flex items-center gap-1 ${detailsModal.product.isJiffyStreet ? 'text-indigo-600' : 'text-gray-400'}`}>
                                                {detailsModal.product.isJiffyStreet ? <Zap size={12} fill="currentColor" /> : null}
                                                {detailsModal.product.isJiffyStreet ? 'Exclusive' : 'Regular Store'}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest leading-none">Product Description</p>
                                        <div className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            {detailsModal.product.description || 'No description provided.'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <button
                                onClick={() => initiateAction(detailsModal.product!, 'reject')}
                                className="flex-1 py-4 bg-white border border-red-200 text-red-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-50 transition-all shadow-sm"
                            >
                                Reject Product
                            </button>
                            <button
                                onClick={() => initiateAction(detailsModal.product!, 'approve')}
                                className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-700 hover:scale-[1.02] transition-all shadow-xl shadow-green-200"
                            >
                                Approve & Publish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingProducts;
