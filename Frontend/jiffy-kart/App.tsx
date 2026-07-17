
import React from 'react';
import { NavigationProvider } from './context/NavigationContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { AppRouter } from './router/AppRouter';

function App() {
  return (
    <NavigationProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <ComparisonProvider>
              <div className="min-h-screen bg-gray-50 font-sans text-gray-800 overflow-x-hidden">
                <AppRouter />
              </div>
            </ComparisonProvider>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </NavigationProvider>
  );
}

export default App;
