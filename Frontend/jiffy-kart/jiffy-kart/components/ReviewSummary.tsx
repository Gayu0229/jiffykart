import React from 'react';
import { Star } from 'lucide-react';
import { ReviewSummary as ReviewSummaryType } from '../types';

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
  averageRating: number;
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({ summary, averageRating }) => {
  const { totalReviews, ratingCounts, criteriaAverages } = summary;

  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Overall Score */}
        <div className="lg:col-span-3 text-center lg:text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Overall Rating</p>
          <div className="flex flex-col items-center lg:items-start">
            <h2 className="text-6xl font-black text-slate-900 tracking-tighter mb-2">{averageRating.toFixed(1)}</h2>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}
                />
              ))}
            </div>
            <p className="text-sm font-bold text-slate-400">{totalReviews} Verified Reviews</p>
          </div>
        </div>

        {/* Rating Bars */}
        <div className="lg:col-span-5 space-y-3">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star] || 0;
            const percentage = getPercentage(count);
            return (
              <div key={star} className="flex items-center gap-4 group">
                <span className="text-xs font-black text-slate-600 w-4">{star}</span>
                <div className="flex-1 h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out group-hover:bg-emerald-400"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 w-8">{percentage.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>

        {/* Criteria Averages */}
        <div className="lg:col-span-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Key Criteria</p>
          {Object.entries(criteriaAverages).length > 0 ? (
            Object.entries(criteriaAverages).map(([name, rating]: [string, number]) => (
              <div key={name} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span className="capitalize">{name}</span>
                  <span className="text-emerald-600 font-black">{rating.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-900 rounded-full transition-all duration-1000 delay-300"
                    style={{ width: `${(rating / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
             <div className="py-4 text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase italic">No criteria data yet</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
