import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  MessageSquare, 
  RefreshCw,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { api } from '../vendor.api';

const AIAssistant: React.FC = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [insights, setInsights] = useState<string | null>(null);
  const [inventoryAlerts, setInventoryAlerts] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [priceRecommendation, setPriceRecommendation] = useState('');
  const [customerMsg, setCustomerMsg] = useState('');
  const [replySuggestion, setReplySuggestion] = useState('');

  const fetchInsights = async () => {
    setLoading(prev => ({ ...prev, insights: true }));
    try {
      const data = await api.getAiSalesInsights();
      setInsights(data);
    } catch (error) {
      console.error("Failed to fetch insights", error);
    } finally {
      setLoading(prev => ({ ...prev, insights: false }));
    }
  };

  const fetchInventoryAlerts = async () => {
    setLoading(prev => ({ ...prev, inventory: true }));
    try {
      const data = await api.getAiInventoryAlerts();
      setInventoryAlerts(data);
    } catch (error) {
      console.error("Failed to fetch inventory alerts", error);
    } finally {
      setLoading(prev => ({ ...prev, inventory: false }));
    }
  };

  const handleGenerateDescription = async () => {
    if (!productName) return;
    setLoading(prev => ({ ...prev, description: true }));
    try {
      const data = await api.generateAiDescription(productName);
      setDescription(data);
    } catch (error) {
      console.error("Description generation failed", error);
    } finally {
      setLoading(prev => ({ ...prev, description: false }));
    }
  };

  const handlePriceRecommendation = async () => {
    if (!productName || !currentPrice) return;
    setLoading(prev => ({ ...prev, price: true }));
    try {
      const data = await api.getAiPriceRecommendation(productName, parseFloat(currentPrice));
      setPriceRecommendation(data);
    } catch (error) {
      console.error("Price recommendation failed", error);
    } finally {
      setLoading(prev => ({ ...prev, price: false }));
    }
  };

  const handleReplySuggestion = async () => {
    if (!customerMsg) return;
    setLoading(prev => ({ ...prev, reply: true }));
    try {
      const data = await api.getAiReplySuggestion(customerMsg);
      setReplySuggestion(data);
    } catch (error) {
      console.error("Reply suggestion failed", error);
    } finally {
      setLoading(prev => ({ ...prev, reply: false }));
    }
  };

  useEffect(() => {
    fetchInsights();
    fetchInventoryAlerts();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-brand-500/20 rounded-lg">
              <Brain className="w-6 h-6 text-brand-400" />
            </div>
            <span className="text-xs font-black text-brand-400 uppercase tracking-[0.3em]">Neural Integration</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">AI Assistant <span className="text-brand-500">Node</span></h1>
          <p className="text-slate-400 mt-2 font-medium max-w-lg">Intelligent tools to automate your store management and boost sales performance.</p>
        </div>
        <button 
          onClick={() => { fetchInsights(); fetchInventoryAlerts(); }}
          className="relative z-10 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all flex items-center space-x-2 backdrop-blur-md"
        >
          <RefreshCw className={`w-4 h-4 ${loading.insights || loading.inventory ? 'animate-spin' : ''}`} />
          <span>Refresh All Systems</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Insights */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-soft flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <TrendingUp className="text-emerald-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Sales Insights</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Growth Analytics</p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            {loading.insights ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-8 h-8 border-2 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Analyzing Sales Vectors...</p>
              </div>
            ) : insights ? (
              <div className="space-y-4">
                 {insights.split('\n').map((line, i) => line.trim() && (
                  <div key={i} className="flex items-start space-x-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{line.replace(/^[•\-\*]/, '').trim()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm font-medium">No insights generated yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-soft flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="text-amber-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Inventory Alerts</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Stock Surveillance</p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            {loading.inventory ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-8 h-8 border-2 border-slate-100 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Scanning Logistics Matrix...</p>
              </div>
            ) : inventoryAlerts ? (
              <div className="space-y-4">
                {inventoryAlerts.split('\n').map((line, i) => line.trim() && (
                  <div key={i} className="flex items-start space-x-3 p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{line.replace(/^[•\-\*]/, '').trim()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm font-medium">Everything looks good.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Product Description Gen */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-soft space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Description Gen</h3>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Product Name (e.g. Boat Headphones)"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
            />
            <button 
              onClick={handleGenerateDescription}
              disabled={loading.description}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
            >
              {loading.description ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Synthesize Content</span>}
            </button>
            {description && (
              <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 mt-4">
                <p className="text-xs text-indigo-900 leading-relaxed font-medium">{description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Pro */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-soft space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-violet-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Market Pricing</h3>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Product Name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-medium"
            />
            <input 
              type="number" 
              placeholder="Your Price (₹)"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-medium"
            />
            <button 
              onClick={handlePriceRecommendation}
              disabled={loading.price}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
            >
              {loading.price ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Recommend Price</span>}
            </button>
            {priceRecommendation && (
              <div className="p-5 bg-violet-50/50 rounded-2xl border border-violet-100 mt-4">
                <p className="text-xs text-violet-900 leading-relaxed font-medium">{priceRecommendation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Support AI */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-soft space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-rose-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Response Pulse</h3>
          </div>
          <div className="space-y-4">
            <textarea 
              placeholder="Customer Query (e.g. My order is late)"
              value={customerMsg}
              onChange={(e) => setCustomerMsg(e.target.value)}
              className="w-full h-24 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-medium resize-none"
            />
            <button 
              onClick={handleReplySuggestion}
              disabled={loading.reply}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
            >
              {loading.reply ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Generate Reply</span>}
            </button>
            {replySuggestion && (
              <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100 mt-4">
                <p className="text-xs text-rose-900 leading-relaxed font-medium italic">"{replySuggestion}"</p>
                <button className="mt-3 text-[10px] font-black text-rose-600 uppercase flex items-center space-x-1 hover:space-x-2 transition-all">
                  <span>Copy to Clipboard</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
