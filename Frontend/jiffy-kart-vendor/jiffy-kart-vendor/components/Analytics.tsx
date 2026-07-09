
import React, { useState, useRef, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Line
} from 'recharts';
import {
  Users, DollarSign, ShoppingCart, Download, Loader2,
  TrendingUp, TrendingDown, Calendar, Filter, ChevronDown,
  Target, Award, Briefcase, MousePointer2, Zap, ArrowUpRight,
  Clock, Activity, Sparkles, Globe, Map, ArrowRight
} from 'lucide-react';

const INITIAL_REVENUE_DATA: { name: string; revenue: number; profit: number; orders: number }[] = [];

const categoryDistribution: { name: string; value: number; color: string }[] = [];

const peakHours: { hour: string; intensity: number }[] = [];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-900 p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between space-x-8 mb-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-[11px] font-bold text-gray-300">{item.name}</span>
            </div>
            <span className="text-xs font-black text-white">{typeof item.value === 'number' && item.value > 1000 ? `₹${item.value.toLocaleString()}` : item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeRange, setActiveRange] = useState('7D');
  const [revenueTrendData, setRevenueTrendData] = useState(INITIAL_REVENUE_DATA);
  const reportRef = useRef<HTMLDivElement>(null);

  // Live data will come from API when connected
  // For now, charts use the empty INITIAL_REVENUE_DATA array

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    const opt = {
      margin: [10, 10],
      filename: `JiffyKart_Board_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
      // @ts-ignore
      await window.html2pdf().from(reportRef.current).set(opt).save();
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Failed to generate report file.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time Intelligence Hub</span>
          </div>
          <h2 className="text-4xl font-black text-brand-900 tracking-tighter">Business Overview</h2>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
            {['7D', '1M', '3M', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-5 py-2 text-[11px] font-black rounded-xl transition-all duration-300 ${activeRange === range ? 'bg-brand-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button className="flex items-center space-x-2 bg-white border border-gray-100 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Calendar className="w-3.5 h-3.5" />
            <span>Range</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center space-x-3 bg-brand-900 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 active:scale-95 group"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />}
            <span>{isExporting ? 'Exporting...' : 'Board Report'}</span>
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PulseCard
            label="Gross Volume"
            value="₹0"
            trend="0%"
            isPositive={true}
            data={revenueTrendData.map(d => ({ v: d.revenue }))}
            icon={<Zap className="w-5 h-5" />}
          />
          <PulseCard
            label="Avg Order Value"
            value="₹0"
            trend="0%"
            isPositive={true}
            data={revenueTrendData.map(d => ({ v: d.revenue * 0.4 }))}
            icon={<Target className="w-5 h-5" />}
          />
          <PulseCard
            label="Active Orders"
            value="0"
            trend="0%"
            isPositive={true}
            data={revenueTrendData.map(d => ({ v: d.orders }))}
            icon={<Activity className="w-5 h-5" />}
          />
          <PulseCard
            label="Retention Rate"
            value="0%"
            trend="0%"
            isPositive={true}
            data={[]}
            icon={<Users className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white p-10 rounded-[48px] shadow-sm border border-gray-50 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-brand-900"></div>
            <div className="flex justify-between items-center mb-12">
              <div>
                <h4 className="text-xl font-black text-brand-900 uppercase tracking-tighter">Profitability Velocity</h4>
                <p className="text-[11px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Revenue vs Direct Profitability Index</p>
              </div>
              <div className="flex items-center space-x-6">
                <LegendItem label="Revenue" color="#272757" />
                <LegendItem label="Profit" color="#0F0E47" />
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueTrendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 800 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 800 }}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="revenue" fill="#272757" radius={[12, 12, 0, 0]} barSize={40} />
                  <Line type="monotone" dataKey="profit" stroke="#0F0E47" strokeWidth={4} dot={{ r: 6, fill: '#0F0E47', strokeWidth: 3, stroke: '#fff' }} animationDuration={300} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-brand-900 p-8 rounded-[48px] shadow-2xl text-white flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-300/10 -mr-16 -mt-16 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <Sparkles className="w-5 h-5 text-brand-300" />
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tighter">AI Predictions</h4>
                </div>
                <div className="space-y-6">
                  <InsightItem
                    title="No Insights"
                    desc="Analytics data will appear here once you start receiving orders."
                    status="Pending"
                  />
                </div>
              </div>
              <button className="mt-8 w-full bg-brand-500 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-xl shadow-brand-900/40">
                Generate Strategy
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-white p-10 rounded-[48px] shadow-sm border border-gray-50">
            <h4 className="text-xl font-black text-brand-900 uppercase tracking-tighter mb-8">Asset Reach</h4>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    innerRadius={75}
                    outerRadius={100}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-brand-900">{categoryDistribution.length > 0 ? `${categoryDistribution[0].value}%` : '0%'}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth Leader</span>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              {categoryDistribution.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-xs font-bold text-gray-600">{cat.name}</span>
                  </div>
                  <span className="text-xs font-black text-brand-900">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white p-10 rounded-[48px] shadow-sm border border-gray-50">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h4 className="text-xl font-black text-brand-900 uppercase tracking-tighter">Peak Operation Hours</h4>
                <p className="text-[11px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Historical Sales Intensity Heatmap</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 mt-12">
              {peakHours.map((h, i) => (
                <div key={i} className="flex flex-col items-center space-y-4">
                  <div className="w-full h-48 bg-gray-50 rounded-2xl relative overflow-hidden flex flex-col justify-end">
                    <div
                      className="w-full bg-brand-500 rounded-xl transition-all duration-1000 ease-out"
                      style={{ height: `${h.intensity}%`, opacity: (h.intensity / 100) + 0.2 }}
                    ></div>
                    {h.intensity > 80 && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2">
                        <Zap className="w-3 h-3 text-brand-300 fill-brand-300" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter rotate-45 mt-2">{h.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PulseCard: React.FC<{
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: React.ReactNode;
  data: any[];
}> = ({ label, value, trend, isPositive, icon, data }) => (
  <div className="bg-white p-8 rounded-[48px] shadow-sm border border-gray-50 flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative">
    <div className="flex justify-between items-start mb-6">
      <div className="p-4 bg-gray-50 rounded-[24px] text-gray-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors">
        {icon}
      </div>
      <div className={`flex items-center px-3 py-1.5 rounded-xl text-[11px] font-black ${isPositive ? 'bg-brand-50 text-brand-600' : 'bg-red-50 text-red-600'
        }`}>
        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
        {trend}
      </div>
    </div>

    <div className="space-y-1 relative z-10">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
      <h3 className="text-4xl font-black text-brand-900 tracking-tighter">{value}</h3>
    </div>

    <div className="absolute bottom-0 left-0 w-full h-16 opacity-30 pointer-events-none group-hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area
            type="monotone"
            dataKey="v"
            stroke={isPositive ? '#272757' : '#EF4444'}
            fill={isPositive ? '#272757' : '#EF4444'}
            strokeWidth={3}
            fillOpacity={0.1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const InsightItem: React.FC<{ title: string; desc: string; status: string }> = ({ title, desc, status }) => (
  <div className="p-6 bg-white/5 border border-white/10 rounded-3xl group hover:bg-white/10 transition-all cursor-pointer">
    <div className="flex justify-between items-start mb-2">
      <h5 className="text-sm font-black uppercase tracking-widest text-brand-300">{title}</h5>
      <span className="text-[9px] font-black uppercase px-2 py-1 bg-white/10 rounded-lg text-gray-400 group-hover:text-white transition-colors">{status}</span>
    </div>
    <p className="text-xs font-bold text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

const LegendItem: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <div className="flex items-center space-x-2">
    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
  </div>
);

export default Analytics;
