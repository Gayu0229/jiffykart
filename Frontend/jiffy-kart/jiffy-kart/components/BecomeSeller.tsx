
import React from 'react';
import {
  Store, TrendingUp, Upload, ShieldCheck, Headphones,
  CheckCircle, FileText, CreditCard, Package, BarChart, ArrowRight,
  LayoutDashboard, Zap, Sparkles
} from 'lucide-react';

interface BecomeSellerProps {
  onBack: () => void;
  onRegisterClick: () => void;
}

import { useStats } from '../hooks/useStats';
import { Footer } from './Footer';

const CountUp = ({ end, duration = 2000, decimals = 0, suffix = "" }: { end: number, duration?: number, decimals?: number, suffix?: string }) => {
  const [count, setCount] = React.useState(0);
  const countRef = React.useRef(0);
  const startTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    startTimeRef.current = null;
    const startValue = countRef.current;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const currentCount = startValue + (end - startValue) * easedProgress;

      setCount(currentCount);
      countRef.current = currentCount;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return (
    <span>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </span>
  );
};

export const BecomeSeller: React.FC<BecomeSellerProps> = ({ onBack, onRegisterClick }) => {
  const { stats, loading, error } = useStats();

  return (
    <div className="min-h-screen bg-background font-sans animate-fade-in">

      {/* 1. HERO SECTION */}
      <div className="bg-secondary relative overflow-hidden text-white pt-12 pb-20 md:pt-20 md:pb-32 px-4 rounded-b-[4rem] shadow-2xl">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent opacity-10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary opacity-20 blur-[100px]"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 border border-white/10 text-accent">
            <Store size={14} className="text-white" /> Partner with Jiffy
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9] text-white">
            Empower Your <br className="hidden md:block" />
            <span className="text-accent">Local Store.</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Join Jiffy Kart to bring your neighbor's favorites online.
            Experience 30-minute hyperlocal reach for your electronics or fashion shop.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <button
              onClick={onRegisterClick}
              className="bg-white text-dark px-10 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 group"
            >
              Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={onBack} className="px-10 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest border-2 border-white/10 hover:bg-white/5 transition backdrop-blur-sm">
              Back Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20">

        {/* 2. STATS BAR */}
        <div className="bg-white rounded-[2.5rem] shadow-soft p-10 flex flex-wrap justify-around items-center gap-10 border border-slate-100 min-h-[140px]">
          {loading ? (
            // Skeleton Loader
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="w-24 h-10 bg-slate-100 rounded-xl mb-2 mx-auto"></div>
                <div className="w-20 h-3 bg-slate-50 rounded-full mx-auto"></div>
              </div>
            ))
          ) : stats ? (
            [
              { label: 'Verified Sellers', val: stats.verifiedSellers, suffix: '+' },
              { label: 'Avg. Delivery', val: stats.avgDeliveryMins, suffix: ' Mins' },
              { label: 'Cities Live', val: stats.citiesLive, suffix: '' },
              { label: 'User Rating', val: stats.userRating, decimals: 1, suffix: '/5' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-secondary tracking-tighter mb-1">
                  <CountUp end={stat.val} decimals={stat.decimals} suffix={stat.suffix} />
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))
          ) : (
            <div className="text-slate-400 font-bold">Failed to load live statistics</div>
          )}
        </div>

        {/* 3. WHY SELL SECTION */}
        <div className="py-20">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">The Jiffy Advantage</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">Built from the ground up for modern local commerce.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Zap size={24} />, title: "Instant Visibility", desc: "Appear on thousands of neighborhood customer screens instantly." },
              { icon: <Sparkles size={24} />, title: "Elite Branding", desc: "Get a professional digital storefront that reflects your store's quality." },
              { icon: <Upload size={24} />, title: "Jiffy Inventory", desc: "Bulk upload items and manage stock with a single tap." },
              { icon: <ShieldCheck size={24} />, title: "Eclipse Security", desc: "Bank-grade encrypted payouts and fraud protection for sellers." },
              { icon: <Package size={24} />, title: "Logistic Support", desc: "No need to hire riders. Our dedicated fleet handles every delivery." },
              { icon: <Headphones size={24} />, title: "Seller Growth", desc: "Weekly analytics and personalized insights to grow your sales." },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-soft hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
                <div className="w-14 h-14 bg-indigo-50 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. HOW IT WORKS */}
        <div className="mb-32">
          <h2 className="text-4xl font-black text-slate-900 mb-16 text-center tracking-tighter">Your Journey to Growth</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { step: "01", title: "Registration", desc: "Fast signup with your mobile number and store name." },
              { step: "02", title: "Verification", desc: "Our team validates your store credentials for trust." },
              { step: "03", title: "Catalogue", desc: "List your top fashion or electronics items." },
              { step: "04", title: "Start Selling", desc: "Receive orders and track your revenue live." },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="text-7xl font-black text-slate-100 absolute -top-10 -left-4 -z-10">{s.step}</div>
                <div className="bg-white p-8 rounded-3xl border border-slate-50 shadow-sm h-full hover:border-primary transition duration-500">
                  <h3 className="text-xl font-black text-secondary mb-3 tracking-tight">{s.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dark rounded-[3.5rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(134,134,172,0.1),transparent)]"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">Ready to scale?</h2>
            <button
              onClick={onRegisterClick}
              className="bg-primary text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
            >
              Register Your Shop Now
            </button>
            <p className="text-accent mt-8 text-[10px] font-black uppercase tracking-[0.3em]">No Registration Fee • Zero Upfront Cost</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};