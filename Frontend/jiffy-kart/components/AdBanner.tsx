
import React from 'react';
import { ArrowRight, Sparkles, Tag, ShoppingBag, Zap } from 'lucide-react';

interface AdBannerProps {
  variant?: 'hero' | 'middle' | 'sidebar' | 'leaderboard' | 'inline' | 'mini';
  title: string;
  subtitle?: string;
  ctaText?: string;
  onClick?: () => void;
  image?: string; 
  gradient?: string;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  variant = 'middle',
  title, 
  subtitle, 
  ctaText = "Shop Now", 
  onClick, 
  image,
  gradient,
  className = ''
}) => {
  
  const getGradient = () => {
    if (gradient) return gradient;
    switch(variant) {
      case 'sidebar': return 'from-[#115e59] to-[#0f766e]';
      case 'leaderboard': return 'from-[#f59e0b] to-[#ea580c]';
      case 'inline': return 'from-[#0d9488] to-[#14b8a6]';
      case 'mini': return 'from-[#134e4a] to-[#115e59]';
      default: return 'from-[#4338ca] to-[#3730a3]';
    }
  };

  const currentGradient = getGradient();

  if (variant === 'sidebar') {
    return (
      <div 
        onClick={onClick}
        className={`relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-br ${currentGradient} text-white shadow-soft cursor-pointer group hover:shadow-xl transition-all duration-500 flex flex-col p-8 ${className}`}
      >
        {image && (
          <div className="absolute inset-0 z-0">
             <img src={image} className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" alt="" />
             <div className={`absolute inset-0 bg-gradient-to-br ${currentGradient} mix-blend-multiply`}></div>
          </div>
        )}
        <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 text-white border border-white/10 shadow-inner">
            <Zap size={20} fill="currentColor" />
          </div>
          <h3 className="text-2xl font-black leading-tight mb-3 tracking-tight">{title}</h3>
          <p className="text-white/70 font-medium mb-8 text-sm leading-relaxed border-l-2 border-white/20 pl-4">{subtitle}</p>
          
          <div className="mt-auto">
             <button className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 group-hover:gap-3 transition-all">
               {ctaText} <ArrowRight size={14} />
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'leaderboard') {
    return (
      <div 
        onClick={onClick}
        className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-r ${currentGradient} text-white shadow-sm cursor-pointer group py-4 px-6 flex items-center justify-between hover:shadow-md transition-all gap-4 ${className}`}
      >
         {image && (
           <div className="absolute inset-0 z-0">
              <img src={image} className="w-full h-full object-cover opacity-10 group-hover:scale-105 transition-transform" alt="" />
              <div className={`absolute inset-0 bg-gradient-to-r ${currentGradient} mix-blend-multiply`}></div>
           </div>
         )}
         <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Sparkles size={18} className="text-yellow-100 fill-yellow-100" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black uppercase tracking-tight">{title}</h3>
              {subtitle && <p className="text-white/80 text-[10px] md:text-xs mt-0.5 font-medium">{subtitle}</p>}
            </div>
         </div>
         <div className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition relative z-10">
            <ArrowRight size={16} />
         </div>
         <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
      </div>
    );
  }

  if (variant === 'inline' || variant === 'middle') {
    return (
      <div 
        onClick={onClick}
        className={`relative w-full overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${currentGradient} text-white shadow-soft cursor-pointer group hover:-translate-y-1 hover:shadow-2xl transition-all duration-500 p-8 md:p-14 ${className}`}
      >
         {image && (
           <div className="absolute inset-0 z-0">
              <img src={image} className="w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-[2s]" alt="" />
              <div className={`absolute inset-0 bg-gradient-to-br ${currentGradient} mix-blend-overlay`}></div>
              <div className="absolute inset-0 bg-black/20"></div>
           </div>
         )}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-125 transition-transform"></div>
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

         <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black mb-6 border border-white/10 shadow-sm uppercase tracking-widest">
              <Tag size={12} className="text-yellow-300" /> Season Special
            </div>
            <h3 className="text-3xl md:text-5xl font-black leading-none mb-4 tracking-tighter drop-shadow-md">
               {title}
            </h3>
            {subtitle && (
               <p className="text-white/80 text-sm md:text-lg font-medium mb-8 max-w-xl leading-relaxed drop-shadow-sm">{subtitle}</p>
            )}
            <button className="bg-white text-slate-900 px-8 py-3 md:px-10 md:py-4 rounded-full font-black text-xs md:text-sm shadow-xl inline-flex items-center gap-2 group-hover:scale-105 transition-transform uppercase">
               {ctaText} <ArrowRight size={18} />
            </button>
         </div>
      </div>
    );
  }

  if (variant === 'mini') {
    return (
       <div 
        onClick={onClick}
        className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-r ${currentGradient} text-white shadow-sm cursor-pointer group p-4 flex items-center gap-4 hover:shadow-md transition-all ${className}`}
      >
         {image && (
           <div className="absolute inset-0 z-0 opacity-20">
              <img src={image} className="w-full h-full object-cover" alt="" />
           </div>
         )}
         <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shrink-0 border border-white/10 relative z-10">
            <ShoppingBag size={20} className="text-white" />
         </div>
         <div className="flex-1 min-w-0 relative z-10">
             <h4 className="font-black text-sm uppercase tracking-tight truncate drop-shadow-sm">{title}</h4>
             <p className="text-xs text-white/70 mt-0.5 truncate font-medium drop-shadow-sm">{subtitle}</p>
         </div>
         <ArrowRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all relative z-10" />
      </div>
    );
  }

  return null;
};
