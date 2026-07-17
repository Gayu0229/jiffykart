
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '../types';

export interface ComparisonHistoryItem {
  id: string;
  timestamp: string;
  products: Product[];
  data: any; 
}

interface ComparisonContextType {
  compareList: Product[];
  comparisonHistory: ComparisonHistoryItem[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  saveToHistory: (products: Product[], data: any) => void;
  clearHistory: () => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistoryItem[]>([]);

  const addToCompare = (product: Product) => {
    setCompareList(prev => {
      if (prev.some(p => p.id === product.id)) return prev;
      if (prev.length >= 3) return prev; 
      return [...prev, product];
    });
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  };

  const clearCompare = () => setCompareList([]);

  const isInCompare = (productId: string) => compareList.some(p => p.id === productId);

  const saveToHistory = (products: Product[], data: any) => {
    const newItem: ComparisonHistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      products,
      data
    };
    setComparisonHistory(prev => [newItem, ...prev].slice(0, 10)); 
  };

  const clearHistory = () => setComparisonHistory([]);

  return (
    <ComparisonContext.Provider value={{ 
      compareList, 
      comparisonHistory, 
      addToCompare, 
      removeFromCompare, 
      clearCompare, 
      isInCompare,
      saveToHistory,
      clearHistory
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error('useComparison must be used within ComparisonProvider');
  return context;
};
