
import React from 'react';
import { Shop } from '../types';
import { Star, Clock, MapPin, CheckCircle, Shield } from 'lucide-react';

interface HomeShopSectionProps {
  shops: Shop[];
  onShopClick: (id: string) => void;
}

export const HomeShopSection: React.FC<HomeShopSectionProps> = ({ shops, onShopClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {shops.map((shop) => (
        <div
          key={shop.id}
          className="group cursor-pointer flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
          onClick={() => onShopClick(shop.id)}
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={shop.image}
              alt={shop.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />

            <div className="absolute top-4 left-4">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xl backdrop-blur-md ${shop.isOpen ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${shop.isOpen ? 'bg-emerald-200 animate-pulse' : 'bg-red-200'}`}></span>
                {shop.isOpen ? 'Open' : 'Closed'}
              </div>
            </div>

            <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
              {shop.active_coupons && shop.active_coupons.length > 0 ? (
                <div className="bg-primary/95 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {shop.active_coupons[0].description}
                </div>
              ) : (
                shop.offers.length > 0 && (
                  <div className="bg-primary/95 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {shop.offers[0].description.split(' ')[0]}
                  </div>
                )
              )}
            </div>

            <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black text-white shadow-lg flex items-center gap-1.5 border border-white/10">
              <Clock size={12} className="text-primary" /> {shop.delivery_time}
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-xl text-slate-900 leading-tight group-hover:text-primary transition-colors">
                {shop.name}
              </h3>
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl text-sm font-black">
                {shop.rating} <Star size={12} fill="currentColor" />
              </div>
            </div>

            <p className="text-slate-400 text-sm font-medium line-clamp-1 mb-4">
              {shop.tags.join(', ')}
            </p>

            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <MapPin size={14} className="text-primary" />
                <span className="truncate max-w-[100px]">{shop.location.split(',')[0]}</span>
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                {shop.distance}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
