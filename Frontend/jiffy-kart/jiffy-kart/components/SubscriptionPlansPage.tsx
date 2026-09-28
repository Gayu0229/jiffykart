import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/apiService';
import {
    Crown, Zap, Truck, Shield, Star, ArrowLeft, Check,
    Sparkles, Rocket, ChevronRight, Loader2
} from 'lucide-react';

interface SubscriptionPlansPageProps {
    onBack: () => void;
    isLoggedIn: boolean;
    onLoginRequired: () => void;
}

interface Plan {
    id: number;
    planName: string;
    price: number;
    durationDays: number;
    freeDeliveryAbove: number | null;
    freeDeliveryAll: boolean;
    priorityDelivery: boolean;
    cashbackPercent: number;
    description: string;
}

interface MySubscription {
    planName: string;
    status: string;
    endDate?: string;
}

const FALLBACK_PLANS: Plan[] = [
    { id: 1, planName: 'Free', price: 0, durationDays: 36500, freeDeliveryAbove: null, freeDeliveryAll: false, priorityDelivery: false, cashbackPercent: 0, description: '' },
    { id: 2, planName: 'JiffyKart Plus', price: 99, durationDays: 30, freeDeliveryAbove: 99, freeDeliveryAll: false, priorityDelivery: false, cashbackPercent: 5, description: '' },
    { id: 3, planName: 'JiffyKart Pro', price: 199, durationDays: 30, freeDeliveryAbove: 0, freeDeliveryAll: true, priorityDelivery: true, cashbackPercent: 10, description: '' },
    { id: 4, planName: 'JiffyKart Elite', price: 499, durationDays: 30, freeDeliveryAbove: 0, freeDeliveryAll: true, priorityDelivery: true, cashbackPercent: 15, description: '' },
];

const PLAN_CONFIG: Record<string, {
    icon: React.ReactNode;
    popular?: boolean;
    features: string[];
}> = {
    'Free': {
        icon: <Star size={20} />,
        features: ['Standard delivery', 'Basic offers', 'Normal support']
    },
    'JiffyKart Plus': {
        icon: <Zap size={20} />,
        popular: true,
        features: ['Free delivery above ₹99', 'Priority delivery', 'Exclusive deals', '5% cashback']
    },
    'JiffyKart Pro': {
        icon: <Rocket size={20} />,
        features: ['Free delivery on all orders', 'Fast delivery', 'Flash sale access', '10% cashback']
    },
    'JiffyKart Elite': {
        icon: <Crown size={20} />,
        features: ['Unlimited free delivery', 'VIP support', 'Early deals', '15% cashback']
    }
};

export const SubscriptionPlansPage: React.FC<SubscriptionPlansPageProps> = ({ onBack, isLoggedIn, onLoginRequired }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [mySub, setMySub] = useState<MySubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<number | null>(null);
    const [toast, setToast] = useState('');
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [plansData, subData] = await Promise.all([
                ApiService.getSubscriptionPlans(),
                isLoggedIn ? ApiService.getMySubscription() : Promise.resolve(null)
            ]);
            setPlans(plansData && plansData.length > 0 ? plansData : FALLBACK_PLANS);
            setMySub(subData);
        } catch (e) {
            console.error(e);
            setPlans(FALLBACK_PLANS);
        }
        setLoading(false);
    };

    const handleSubscribe = async (planId: number) => {
        if (!isLoggedIn) { onLoginRequired(); return; }
        setPurchasing(planId);
        try {
            const result = await ApiService.purchaseSubscription(planId);
            if (result.success) {
                setToast('🎉 Plan activated!');
                setTimeout(() => { setToast(''); loadData(); }, 2500);
            } else if (result.paymentResponse) {
                const url = result.paymentResponse?.data?.instrumentResponse?.redirectInfo?.url;
                if (url) window.location.href = url;
            }
        } catch (e: any) {
            console.error('Subscription purchase error:', e);
            const errorMessage = e?.response?.data?.error || 'Please try again later';
            setToast('Error: ' + errorMessage);
            setTimeout(() => setToast(''), 3500);
        }
        setPurchasing(null);
    };

    const isCurrent = (name: string) => mySub?.planName === name && mySub?.status === 'ACTIVE';

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                <Loader2 size={36} color="#000" className="animate-spin" />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fff', color: '#000' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
                    background: '#000', color: '#fff', padding: '12px 32px', borderRadius: 16,
                    fontWeight: 800, fontSize: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}>
                    {toast}
                </div>
            )}

            {/* Header */}
            <div style={{ padding: '48px 16px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
                    width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,0,0,0.02) 0%, transparent 70%)',
                    borderRadius: '50%'
                }} />

                <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto' }}>
                    <button onClick={onBack} style={{
                        display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(0,0,0,0.3)',
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 11,
                        fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 40
                    }}>
                        <ArrowLeft size={16} /> Back
                    </button>

                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(0,0,0,0.04)', padding: '6px 20px', borderRadius: 50,
                        fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' as const,
                        color: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 24
                    }}>
                        <Sparkles size={12} /> Choose Your Plan
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, color: '#000',
                        letterSpacing: -2, marginBottom: 12, lineHeight: 1.05
                    }}>
                        Unlock Premium<br />Benefits
                    </h1>
                    <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: 15, maxWidth: 420, margin: '0 auto', fontWeight: 500 }}>
                        Save on every order with free delivery, cashback & exclusive deals
                    </p>
                </div>
            </div>

            {/* Plan Cards */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 80px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 16
                }}>
                    {plans.map((plan) => {
                        const cfg = PLAN_CONFIG[plan.planName] || PLAN_CONFIG['Free'];
                        const isFree = plan.price === 0;
                        const current = isCurrent(plan.planName);
                        const hovered = hoveredId === plan.id;

                        return (
                            <div
                                key={plan.id}
                                onMouseEnter={() => setHoveredId(plan.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    background: cfg.popular ? '#000' : '#fff',
                                    color: cfg.popular ? '#fff' : '#000',
                                    borderRadius: 24,
                                    overflow: 'hidden',
                                    border: cfg.popular ? '2px solid #000' : '1px solid rgba(0,0,0,0.08)',
                                    transition: 'all 0.3s ease',
                                    transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
                                    boxShadow: hovered
                                        ? '0 24px 60px rgba(0,0,0,0.1)'
                                        : cfg.popular ? '0 20px 60px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.04)',
                                    position: 'relative' as const,
                                    display: 'flex',
                                    flexDirection: 'column' as const,
                                }}
                            >
                                {/* Popular Badge */}
                                {cfg.popular && (
                                    <div style={{
                                        background: '#fff', textAlign: 'center', padding: '10px 0',
                                        fontSize: 10, fontWeight: 900, letterSpacing: 2,
                                        textTransform: 'uppercase' as const, color: '#000'
                                    }}>
                                        ⭐ Most Popular
                                    </div>
                                )}

                                <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column' as const }}>
                                    {/* Icon + Name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 14,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: cfg.popular ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                                            color: cfg.popular ? '#fff' : '#000'
                                        }}>
                                            {cfg.icon}
                                        </div>
                                        <h3 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.5 }}>
                                            {plan.planName}
                                        </h3>
                                    </div>

                                    {/* Price */}
                                    <div style={{ marginBottom: 28 }}>
                                        <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: -2 }}>
                                            {isFree ? '₹0' : `₹${plan.price}`}
                                        </span>
                                        <span style={{
                                            fontSize: 14, fontWeight: 600, marginLeft: 4,
                                            color: cfg.popular ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'
                                        }}>
                                            {isFree ? '/forever' : '/month'}
                                        </span>
                                    </div>

                                    {/* Divider */}
                                    <div style={{
                                        height: 1, marginBottom: 24,
                                        background: cfg.popular ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
                                    }} />

                                    {/* Features */}
                                    <div style={{ flex: 1, marginBottom: 28 }}>
                                        {cfg.features.map((feature, i) => (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16
                                            }}>
                                                <div style={{
                                                    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: cfg.popular ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'
                                                }}>
                                                    <Check size={13} strokeWidth={3}
                                                        color={cfg.popular ? '#fff' : '#000'} />
                                                </div>
                                                <span style={{
                                                    fontSize: 13, fontWeight: 600,
                                                    color: cfg.popular ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)'
                                                }}>
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA Button */}
                                    {current ? (
                                        <div style={{
                                            width: '100%', padding: '14px 0', borderRadius: 14, textAlign: 'center',
                                            fontSize: 11, fontWeight: 900, letterSpacing: 2,
                                            textTransform: 'uppercase' as const,
                                            background: cfg.popular ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                                            color: cfg.popular ? '#fff' : '#000',
                                            border: cfg.popular ? '2px solid rgba(255,255,255,0.2)' : '2px solid rgba(0,0,0,0.1)'
                                        }}>
                                            ✓ Current Plan
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe(plan.id)}
                                            disabled={purchasing !== null}
                                            style={{
                                                width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                                                fontSize: 12, fontWeight: 900, letterSpacing: 1.5,
                                                textTransform: 'uppercase' as const, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                background: cfg.popular ? '#fff' : '#000',
                                                color: cfg.popular ? '#000' : '#fff',
                                                transition: 'opacity 0.2s ease',
                                            }}
                                        >
                                            {purchasing === plan.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <>
                                                    {isFree ? 'Get Started' : 'Subscribe Now'}
                                                    <ChevronRight size={14} />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Active Subscription Banner */}
                {mySub && mySub.status === 'ACTIVE' && mySub.planName !== 'Free' && (
                    <div style={{
                        marginTop: 40, background: '#000', borderRadius: 24, padding: 32,
                        color: '#fff', position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center',
                            justifyContent: 'space-between', gap: 16
                        }}>
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Active Plan</p>
                                <h3 style={{ fontSize: 22, fontWeight: 900 }}>{mySub.planName}</h3>
                                {mySub.endDate && (
                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                                        Valid until {new Date(mySub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                )}
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: 14,
                                fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' as const,
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <Shield size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />Active
                            </div>
                        </div>
                    </div>
                )}

                {/* Trust Section */}
                <div style={{ marginTop: 56, display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' as const }}>
                    {[
                        { icon: <Shield size={18} />, label: 'Secure Payment' },
                        { icon: <Zap size={18} />, label: 'Instant Benefits' },
                        { icon: <Truck size={18} />, label: 'Cancel Anytime' },
                    ].map((item, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 40, height: 40, background: 'rgba(0,0,0,0.03)', color: 'rgba(0,0,0,0.3)',
                                borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 8px', border: '1px solid rgba(0,0,0,0.05)'
                            }}>
                                {item.icon}
                            </div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.3)' }}>{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
