import React from 'react';
import { X, ShoppingBag, MapPin, Store } from 'lucide-react';
import { Order } from '../types';

interface OrderDetailModalProps {
    order: Order;
    onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose }) => {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl animate-slide-up overflow-hidden">

                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                            <ShoppingBag className="text-primary" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">Order Details</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{order.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-slate-400 hover:text-slate-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">

                    {/* Shop Info */}
                    <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-white">
                            <img src={order.shop_image} alt={order.shop_name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                <Store size={16} className="text-primary" /> {order.shop_name}
                            </h4>
                            <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5 mt-1">
                                <MapPin size={12} /> {order.shop_location}
                            </p>
                        </div>
                    </div>

                    {/* Product Items */}
                    <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Items Summary</h5>
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 group">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform">
                                    <img src={item.product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'} alt={item.product.name} className="w-full h-full object-contain p-2" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{item.product.name}</h4>
                                    <p className="text-xs text-slate-400 font-bold mt-0.5">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 text-sm">₹{item.priceAtOrder.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-300 font-bold line-through">₹{(item.priceAtOrder * 1.2).toFixed(0)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bill Summary */}
                    <div className="pt-6 border-t border-slate-100 space-y-3">
                        <div className="flex justify-between text-sm font-bold text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{order.total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-slate-500">
                            <span>Delivery Fee</span>
                            <span className="text-emerald-500 uppercase text-[10px]">FREE</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Amount</span>
                            <span className="text-2xl font-black text-primary">₹{order.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Status: {order.status}</span>
                        <span>Placed on: {order.date}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
