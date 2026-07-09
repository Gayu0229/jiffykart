import React, { useState, useEffect } from 'react';
import {
    Crown, Zap, Rocket, Star, Users, TrendingUp, DollarSign,
    Calendar, Check, X, Edit2, Plus, ToggleLeft, ToggleRight,
    Search, Filter, ChevronDown, Loader2, BarChart3, PieChart,
    ArrowUpRight, ArrowDownRight, RefreshCw, Eye
} from 'lucide-react';
import { api } from '../../services/api';

interface SubscriptionManagerProps {
    defaultTab?: 'plans' | 'subscribers' | 'analytics';
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ defaultTab = 'plans' }) => {
    const [tab, setTab] = useState(defaultTab);
    const [plans, setPlans] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => { loadData(); }, [tab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (tab === 'plans' || tab === 'analytics') {
                const p = await api.getSubscriptionPlans();
                setPlans(p);
            }
            if (tab === 'subscribers') {
                const s = await api.getSubscriptionUsers();
                setSubscribers(s);
            }
            if (tab === 'analytics') {
                const a = await api.getSubscriptionAnalytics();
                setAnalytics(a);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    // ────── PLANS TAB ──────
    const renderPlans = () => {
        const PLAN_ICONS: Record<string, React.ReactNode> = {
            'Free': <Star size={22} className="text-gray-500" />,
            'JiffyKart Plus': <Zap size={22} className="text-indigo-600" />,
            'JiffyKart Pro': <Rocket size={22} className="text-fuchsia-600" />,
            'JiffyKart Elite': <Crown size={22} className="text-amber-500" />
        };

        return (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Subscription Plans</h2>
                    <button
                        onClick={() => { setEditingPlan(null); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={16} /> Create Plan
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-indigo-600" /></div>
                ) : plans.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Crown size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-semibold">No plans found</p>
                        <p className="text-sm mt-1">Create your first subscription plan</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {plans.map((plan: any) => (
                            <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                                {PLAN_ICONS[plan.planName] || <Star size={20} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-sm">{plan.planName}</h3>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${plan.isActive !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {plan.isActive !== false ? '● Active' : '● Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <span className="text-2xl font-black text-gray-900">₹{plan.price}</span>
                                        <span className="text-xs text-gray-400 font-semibold ml-1">
                                            /{plan.durationDays === 30 ? 'month' : plan.durationDays === 365 ? 'year' : `${plan.durationDays}d`}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-5">
                                        {plan.freeDeliveryAll && (
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                <Check size={12} className="text-emerald-500" /> Free delivery on all orders
                                            </div>
                                        )}
                                        {plan.freeDeliveryAbove > 0 && !plan.freeDeliveryAll && (
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                <Check size={12} className="text-emerald-500" /> Free delivery above ₹{plan.freeDeliveryAbove}
                                            </div>
                                        )}
                                        {plan.priorityDelivery && (
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                <Check size={12} className="text-emerald-500" /> Priority delivery
                                            </div>
                                        )}
                                        {plan.cashbackPercent > 0 && (
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                <Check size={12} className="text-emerald-500" /> {plan.cashbackPercent}% cashback
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setEditingPlan(plan); setShowForm(true); }}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                        >
                                            <Edit2 size={12} /> Edit
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await api.updateSubscriptionPlan(plan.id, { ...plan, isActive: !plan.isActive });
                                                loadData();
                                            }}
                                            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-lg transition-colors ${plan.isActive !== false
                                                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                                    : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                                }`}
                                        >
                                            {plan.isActive !== false ? <><ToggleRight size={12} /> Disable</> : <><ToggleLeft size={12} /> Enable</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Plan Form Modal */}
                {showForm && <PlanFormModal
                    plan={editingPlan}
                    onClose={() => setShowForm(false)}
                    onSave={async (data: any) => {
                        try {
                            if (editingPlan) {
                                await api.updateSubscriptionPlan(editingPlan.id, data);
                            } else {
                                await api.createSubscriptionPlan(data);
                            }
                            setShowForm(false);
                            loadData();
                        } catch (e) { console.error(e); }
                    }}
                />}
            </div>
        );
    };

    // ────── SUBSCRIBERS TAB ──────
    const renderSubscribers = () => {
        const filtered = subscribers.filter(s => {
            const matchSearch = !searchQuery ||
                s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.planName?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = statusFilter === 'all' || s.status === statusFilter;
            return matchSearch && matchStatus;
        });

        return (
            <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Active Subscribers</h2>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search users..."
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 outline-none bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-indigo-600" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Users size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-semibold">No subscribers found</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">User</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Plan</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Price</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Start</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Expiry</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((sub: any) => (
                                        <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{sub.userName}</p>
                                                    <p className="text-xs text-gray-400">{sub.userEmail}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-gray-700">{sub.planName}</td>
                                            <td className="py-3 px-4 font-bold text-gray-800">₹{sub.price}</td>
                                            <td className="py-3 px-4 text-gray-500 text-xs">{sub.startDate ? new Date(sub.startDate).toLocaleDateString('en-IN') : '-'}</td>
                                            <td className="py-3 px-4 text-gray-500 text-xs">{sub.endDate ? new Date(sub.endDate).toLocaleDateString('en-IN') : '-'}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
                                                        sub.status === 'EXPIRED' ? 'bg-red-50 text-red-500' :
                                                            'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ────── ANALYTICS TAB ──────
    const renderAnalytics = () => {
        const stats = [
            {
                label: 'Total Subscribers', value: analytics?.totalSubscriptions || 0,
                icon: <Users size={20} />, color: 'bg-indigo-50 text-indigo-600'
            },
            {
                label: 'Active Subscriptions', value: analytics?.activeSubscriptions || 0,
                icon: <Check size={20} />, color: 'bg-emerald-50 text-emerald-600'
            },
            {
                label: 'Monthly Revenue', value: `₹${(analytics?.totalRevenue || 0).toLocaleString('en-IN')}`,
                icon: <DollarSign size={20} />, color: 'bg-amber-50 text-amber-600'
            },
            {
                label: 'Active Plans', value: plans.filter(p => p.isActive !== false).length,
                icon: <Crown size={20} />, color: 'bg-fuchsia-50 text-fuchsia-600'
            }
        ];

        return (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Subscription Analytics</h2>
                    <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-indigo-600" /></div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                            {stats.map((stat, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                                            {stat.icon}
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                    <p className="text-xs font-semibold text-gray-400 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Plan Breakdown */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-gray-700 mb-4">Plan Breakdown</h3>
                            <div className="space-y-4">
                                {plans.map((plan: any, i: number) => {
                                    const total = analytics?.totalSubscriptions || 1;
                                    const count = analytics?.[`plan_${plan.id}_count`] || 0;
                                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                    const colors = ['bg-indigo-500', 'bg-fuchsia-500', 'bg-amber-500', 'bg-emerald-500'];

                                    return (
                                        <div key={plan.id}>
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="font-bold text-gray-700">{plan.planName}</span>
                                                <span className="font-semibold text-gray-400">₹{plan.price}/mo</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all`} style={{ width: `${Math.max(pct, 5)}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const tabs = [
        { key: 'plans', label: 'Plans', icon: <Crown size={16} /> },
        { key: 'subscribers', label: 'Subscribers', icon: <Users size={16} /> },
        { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> }
    ];

    return (
        <div>
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {tab === 'plans' && renderPlans()}
            {tab === 'subscribers' && renderSubscribers()}
            {tab === 'analytics' && renderAnalytics()}
        </div>
    );
};

// ────── PLAN FORM MODAL ──────
const PlanFormModal: React.FC<{
    plan: any;
    onClose: () => void;
    onSave: (data: any) => void;
}> = ({ plan, onClose, onSave }) => {
    const [form, setForm] = useState({
        planName: plan?.planName || '',
        price: plan?.price || 0,
        durationDays: plan?.durationDays || 30,
        freeDeliveryAbove: plan?.freeDeliveryAbove || 0,
        freeDeliveryAll: plan?.freeDeliveryAll || false,
        priorityDelivery: plan?.priorityDelivery || false,
        cashbackPercent: plan?.cashbackPercent || 0,
        description: plan?.description || '',
        isActive: plan?.isActive !== false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">{plan ? 'Edit Plan' : 'Create Plan'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Plan Name</label>
                        <input value={form.planName} onChange={e => setForm({ ...form, planName: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Price (₹)</label>
                            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" min={0} required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Duration (days)</label>
                            <input type="number" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" min={1} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Free Delivery Above (₹)</label>
                            <input type="number" value={form.freeDeliveryAbove} onChange={e => setForm({ ...form, freeDeliveryAbove: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" min={0} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Cashback (%)</label>
                            <input type="number" value={form.cashbackPercent} onChange={e => setForm({ ...form, cashbackPercent: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" min={0} max={100} />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.freeDeliveryAll} onChange={e => setForm({ ...form, freeDeliveryAll: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm font-medium text-gray-700">Free delivery on all</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.priorityDelivery} onChange={e => setForm({ ...form, priorityDelivery: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm font-medium text-gray-700">Priority delivery</span>
                        </label>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none" />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit"
                            className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors">
                            {plan ? 'Update Plan' : 'Create Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubscriptionManager;
