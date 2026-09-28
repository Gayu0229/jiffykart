
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`}></div>
);

export const ShopSkeleton: React.FC = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="aspect-[4/3] rounded-[2rem]" />
    <div className="px-1 space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-1/3 rounded-xl" />
    </div>
  </div>
);
