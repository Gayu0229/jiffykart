import { Category, Shop, Product, Review, Order, Address } from './types';
import React from 'react';
import { 
  Gamepad2, Smartphone, Headphones, Speaker, Camera, 
  Watch, Tv, Zap, Fan,
  Puzzle, Shirt, Sofa
} from 'lucide-react';

export const CATEGORIES: (Category & { iconComponent: React.ReactNode })[] = [
  { id: 'cat_toys', name: 'Toys', icon: 'toys', iconComponent: <Puzzle size={28} /> },
  { id: 'cat_fashion', name: 'Dresses', icon: 'fashion', iconComponent: <Shirt size={28} /> },
  { id: '1', name: 'Gaming', icon: 'gaming', iconComponent: <Gamepad2 size={28} /> },
  { id: '2', name: 'Mobile', icon: 'mobile', iconComponent: <Smartphone size={28} /> },
  { id: '3', name: 'Earbuds', icon: 'earbuds', iconComponent: <Headphones size={28} /> },
  { id: '4', name: 'Portable', icon: 'portable', iconComponent: <Speaker size={28} /> },
  { id: '5', name: 'Audio', icon: 'earphone', iconComponent: <Headphones size={28} /> },
  { id: '6', name: 'Cameras', icon: 'action', iconComponent: <Camera size={28} /> },
  { id: '7', name: 'Wearables', icon: 'smart', iconComponent: <Watch size={28} /> },
  { id: '8', name: 'TV & Home', icon: 'tv', iconComponent: <Tv size={28} /> },
  { id: '9', name: 'Power', icon: 'charger', iconComponent: <Zap size={28} /> },
  { id: '10', name: 'Appliances', icon: 'fridge', iconComponent: <Fan size={28} /> },
  { id: 'cat_furniture', name: 'Furniture', icon: 'furniture', iconComponent: <Sofa size={28} /> },
];