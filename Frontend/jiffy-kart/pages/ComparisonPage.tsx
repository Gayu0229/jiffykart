
import React, { useState, useEffect } from 'react';
import { useComparison, useNavigation, useCart } from '../hooks';
import { compareProducts } from '../services/geminiService';
import { 
  ArrowLeft, Scale, Sparkles, X, Plus, ShoppingCart, 
  CheckCircle2, AlertCircle, Info, ChevronRight, History, Trash2, Calendar
} from 'lucide-react';
import { Product } from '../types';

export const ComparisonPage: React.FC = () => {
  const { 
    compareList, 
    removeFromCompare, 
    clearCompare, 
    saveToHistory, 
    comparisonHistory, 
    clearHistory 
  } = useComparison();
  const { goBack, navigate } = useNavigation();
  const { addToCart } = useCart();
  
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (compareList.length >= 2) {
      startComparison();
    } else {
      setComparisonData(null);
    }
  }, [compareList.length]);

  const startComparison = async () => {
    setIsComparing(true);
    setError(null);
    try {
      const data = await compareProducts(compareList);
      if (data) {
        setComparisonData(data);
        saveToHistory([...compareList], data);
      } else {
        setError("AI Comparison failed. Check your internet.");
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setIsComparing(false);
    }
  };

  const loadFromHistory = (item: any) => {
    setComparisonData(item.data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const NoItemsView = () => (
    <div className="py-20 flex flex-col items-center justify-center text-center px-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-soft border border-slate-100 max-w-md w-full">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <Scale size={36} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Bucket is Empty</h2>
          <p className="text-slate-500 mb-8 text-sm font-medium">Add products from any shop to compare features instantly.</p>
          <button onClick={() => navigate('home')} className="w-full bg-dark text-white font-black py-4 rounded-2xl hover:bg-primary transition shadow-xl">Browse Shops</button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in pb-24 min-h-screen bg-background">
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"><ArrowLeft size={24}/></button>
            <h1 className="text-2xl font-black text-dark tracking-tight">AI Compare</h1>
          </div>
          <button onClick={clearCompare} className="text-rose-500 font-black text-xs uppercase tracking-widest hover:underline">Clear Bucket</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        {compareList.length === 0 ? <NoItemsView /> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {compareList.map(product => (
                <div key={product.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative group animate-fade-in">
                    <button onClick={() => removeFromCompare(product.id)} className="absolute -top-2 -right-2 bg-white text-slate-400 p-2 rounded-full shadow-lg border border-slate-100 hover:text-rose-500 transition-colors z-10"><X size={16} strokeWidth={3}/></button>
                    <div className="aspect-square rounded-2xl bg-slate-50 p-4 mb-4 flex items-center justify-center"><img src={product.image} className="max-h-full object-contain" alt=""/></div>
                    <h3 className="font-black text-slate-900 text-base line-clamp-1 mb-1">{product.name}</h3>
                    <p className="font-black text-emerald-600 text-xl">₹{product.price.toLocaleString()}</p>
                    <button onClick={() => addToCart(product)} className="w-full mt-4 bg-slate-900 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary transition"><ShoppingCart size={16}/> Add</button>
                </div>
              ))}
              {compareList.length < 3 && (
                <button onClick={() => navigate('home')} className="border-4 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-8 text-slate-300 hover:border-primary hover:text-primary transition-all group min-h-[280px]">
                    <Plus size={48} className="mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-black text-xs uppercase tracking-widest">Add Product</p>
                </button>
              )}
            </div>

            <div className="bg-white rounded-[3rem] shadow-soft border border-slate-100 overflow-hidden relative mb-16">
              {isComparing ? (
                <div className="py-24 text-center">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
                    <h3 className="text-xl font-black">AI is analyzing features...</h3>
                </div>
              ) : comparisonData ? (
                <div className="animate-fade-in">
                    <div className="bg-indigo-600 p-10 text-white relative">
                      <Sparkles size={80} className="absolute top-4 right-4 opacity-10" />
                      <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase mb-4 border border-white/20">Smart Verdict</div>
                      <h2 className="text-3xl font-black leading-tight tracking-tight mb-6">{comparisonData.verdict}</h2>
                      <div className="bg-black/10 p-6 rounded-2xl border border-white/5 backdrop-blur-sm max-w-xl">
                        <p className="text-[10px] font-black uppercase opacity-60 mb-2">AI Recommendation</p>
                        <p className="text-xl font-black mb-1">{comparisonData.recommendation.who}</p>
                        <p className="text-sm font-medium opacity-80">{comparisonData.recommendation.why}</p>
                      </div>
                    </div>
                    <div className="p-10">
                        {comparisonData.features.map((feature: any, idx: number) => (
                           <div key={idx} className="grid grid-cols-[140px_1fr] gap-6 py-6 border-b border-slate-50 items-center">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{feature.name}</div>
                              <div className="flex gap-4">
                                 {feature.values.map((v: string, i: number) => (
                                    <div key={i} className="flex-1 text-sm font-bold text-slate-600">{v}</div>
                                 ))}
                              </div>
                           </div>
                        ))}
                    </div>
                </div>
              ) : null}
            </div>
          </>
        )}

        {comparisonHistory.length > 0 && (
           <div className="mt-20">
              <div className="flex items-center justify-between mb-8 px-2">
                 <div className="flex items-center gap-3">
                    <History className="text-primary" />
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">History</h3>
                 </div>
                 <button onClick={clearHistory} className="text-xs font-black text-slate-400 uppercase hover:text-rose-500">Clear History</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {comparisonHistory.map(item => (
                   <div key={item.id} onClick={() => loadFromHistory(item)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
                      <div className="flex items-center gap-1 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4"><Calendar size={12}/> {new Date(item.timestamp).toLocaleDateString()}</div>
                      <div className="flex gap-2 mb-4 overflow-hidden h-12">
                         {item.products.map(p => <img key={p.id} src={p.image} className="w-12 h-12 rounded-lg bg-slate-50 object-contain p-1 border border-slate-100" alt=""/>)}
                      </div>
                      <h4 className="font-black text-slate-800 text-sm mb-2 line-clamp-1 group-hover:text-primary transition-colors">{item.products.map(p => p.name).join(' vs ')}</h4>
                      <p className="text-[11px] text-slate-500 italic line-clamp-2">"{item.data.verdict}"</p>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
