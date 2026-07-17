import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { ApiService } from '../services/apiService';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync cart from server on login
  useEffect(() => {
    if (isLoggedIn) {
      setIsLoading(true);
      ApiService.getCart().then(items => {
        if (items && items.length > 0) {
          setCartItems(items);
        }
      }).finally(() => setIsLoading(false));
    }
  }, [isLoggedIn]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (isLoggedIn) ApiService.updateCartItem(product.id, newQuantity);
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      if (isLoggedIn) ApiService.addToCartApi(product.id, quantity);
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    if (isLoggedIn) ApiService.removeFromCartApi(productId);
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          if (newQuantity === 0) {
             if (isLoggedIn) ApiService.removeFromCartApi(productId);
          } else {
             if (isLoggedIn) ApiService.updateCartItem(productId, newQuantity);
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = useMemo(() => 
    cartItems.reduce((acc, item) => acc + item.quantity, 0), 
  [cartItems]);

  const cartTotal = useMemo(() => 
    cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0), 
  [cartItems]);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      cartCount,
      cartTotal,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};