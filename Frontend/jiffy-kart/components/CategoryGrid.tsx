
import React from 'react';
import { CATEGORIES } from './constants';

interface CategoryGridProps {
  onCategoryClick: (id: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onCategoryClick }) => {
  return (
    <div className="mb-12">
      <div className="mb-8">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Shop by Category</h3>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Explore our range</p>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">
        {CATEGORIES.map((cat, index) => (
          <button
            key={cat.id}
            onClick={() => onCategoryClick(cat.id)}
            className="group flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-primary/20 transition-all duration-500"
          >
            <div className={`
                w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all duration-700 overflow-hidden
                group-hover:scale-110 group-hover:rotate-3
                ${index % 4 === 0 ? 'bg-indigo-50 text-indigo-600 group-hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)]' :
                index % 4 === 1 ? 'bg-rose-50 text-rose-600 group-hover:shadow-[0_20px_40px_-10px_rgba(225,29,72,0.4)]' :
                  index % 4 === 2 ? 'bg-emerald-50 text-emerald-600 group-hover:shadow-[0_20px_40px_-10px_rgba(5,150,105,0.4)]' :
                    'bg-amber-50 text-amber-600 group-hover:shadow-[0_20px_40px_-10px_rgba(217,119,6,0.4)]'}
            `}>
              <img 
                src={`/assets/images/categories/${cat.id}.png`}
                alt={cat.name}
                className="w-full h-full object-contain p-2 sm:p-4 transition-all duration-500 group-hover:drop-shadow-lg mix-blend-multiply"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] group-hover:text-slate-900 transition-colors text-center px-1">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
