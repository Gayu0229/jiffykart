import { Category } from '../types';
import React from 'react';
import {
  Cpu, Shirt, Home, Sparkles, HeartPulse, Dumbbell,
  BookOpen, Gamepad2, Car, PenLine, PawPrint, Utensils,
  ShoppingBasket, Sofa
} from 'lucide-react';

export const CATEGORIES: (Category & { iconComponent: React.ReactNode })[] = [
  { id: 'cat_electronics',  name: 'Electronics',   icon: 'electronics',  iconComponent: <Cpu size={24} /> },
  { id: 'cat_fashion',      name: 'Fashion',        icon: 'fashion',      iconComponent: <Shirt size={24} /> },
  { id: 'cat_home',         name: 'Home & Kitchen', icon: 'home',         iconComponent: <Home size={24} /> },
  { id: 'cat_beauty',       name: 'Beauty',         icon: 'beauty',       iconComponent: <Sparkles size={24} /> },
  { id: 'cat_health',       name: 'Health',         icon: 'health',       iconComponent: <HeartPulse size={24} /> },
  { id: 'cat_sports',       name: 'Sports',         icon: 'sports',       iconComponent: <Dumbbell size={24} /> },
  { id: 'cat_books',        name: 'Books',          icon: 'books',        iconComponent: <BookOpen size={24} /> },
  { id: 'cat_toys',         name: 'Toys',           icon: 'toys',         iconComponent: <Gamepad2 size={24} /> },
  { id: 'cat_auto',         name: 'Auto Parts',     icon: 'auto',         iconComponent: <Car size={24} /> },
  { id: 'cat_stationery',   name: 'Stationery',     icon: 'stationery',   iconComponent: <PenLine size={24} /> },
  { id: 'cat_pets',         name: 'Pet Supplies',   icon: 'pets',         iconComponent: <PawPrint size={24} /> },
  { id: 'cat_food',         name: 'Food',           icon: 'food',         iconComponent: <Utensils size={24} /> },
  { id: 'cat_groceries',    name: 'Groceries',      icon: 'groceries',    iconComponent: <ShoppingBasket size={24} /> },
  { id: 'cat_furniture',    name: 'Furniture',      icon: 'furniture',    iconComponent: <Sofa size={24} /> },
];