import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { BackToast } from '../components/BackToast';

// Added 'cart' to the ViewType union
export type ViewType = 'home' | 'shops' | 'details' | 'product-detail' | 'cart' | 'profile' | 'tracking' | 'checkout' | 'jiffy-street' | 'jiffy-cafe' | 'login' | 'signup' | 'verify-otp' | 'seller' | 'seller-registration' | 'privacy-policy' | 'terms-and-conditions' | 'cancellation-refund' | 'collections' | 'admin-banners' | 'wishlist' | 'wallet' | 'track-orders' | 'comparison' | 'payment-status' | 'subscription';

interface NavigationState {
  view: ViewType;
  params: any;
}

interface Coords {
  lat: number;
  lng: number;
}

import { City } from '../types';

interface NavigationContextType {
  view: ViewType;
  params: any;
  navigate: (view: ViewType, params?: any) => void;
  goBack: () => void;
  city: string;
  cityObj: City | null;
  setCity: (city: string) => void;
  setCityObj: (city: City | null) => void;
  area: string;
  areaId: string | null;
  setArea: (area: string) => void;
  setAreaId: (areaId: string | null) => void;
  coords: Coords | null;
  setCoords: (coords: Coords | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// --- Helpers ---

/** Build a URL path from a view name */
const viewToPath = (view: ViewType): string => {
  if (view === 'home') return '/';
  return `/${view}`;
};

/**
 * Extracts only JSON-serializable primitives from params.
 * Objects like `order` (which contain class instances) cannot
 * survive pushState serialization, so we exclude them.
 */
const serializableParams = (params: any): any => {
  if (!params || typeof params !== 'object') return {};
  const safe: any = {};
  for (const key of Object.keys(params)) {
    const val = params[key];
    if (val === null || val === undefined) continue;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      safe[key] = val;
    }
    // Skip complex objects (order, product, etc.) — they stay in-memory only
  }
  return safe;
};

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Flag to distinguish programmatic history changes from user back button
  const isProgrammaticNav = useRef(false);

  const [history, setHistory] = useState<NavigationState[]>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/payment-status') {
        const queryParams = new URLSearchParams(window.location.search);
        const initialState: NavigationState = { view: 'payment-status', params: Object.fromEntries(queryParams.entries()) };
        // Set the initial browser state
        window.history.replaceState({ view: 'payment-status', params: initialState.params, depth: 0 }, '', '/payment-status');
        return [initialState];
      }
      if (path === '/tracking') {
        const queryParams = new URLSearchParams(window.location.search);
        const orderId = queryParams.get('orderId');
        if (orderId) {
          const initialState: NavigationState = { view: 'tracking', params: { orderId } };
          window.history.replaceState({ view: 'tracking', params: { orderId }, depth: 0 }, '', `/tracking?orderId=${orderId}`);
          return [initialState];
        }
      }
    }
    // Default: home
    window.history.replaceState({ view: 'home', params: {}, depth: 0 }, '', '/');
    return [{ view: 'home', params: {} }];
  });

  const [city, setCity] = useState<string>('Chennai');
  const [cityObj, setCityObj] = useState<City | null>(null);
  const [area, setArea] = useState<string>('All Areas');
  const [areaId, setAreaId] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);

  // --- Double-back-to-exit state ---
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressTime = useRef<number>(0);

  const current = history[history.length - 1];

  // --- Navigate: push to both in-memory stack AND browser history ---
  const navigate = useCallback((view: ViewType, params: any = {}) => {
    console.log("🌐 [Navigation] Navigating to:", view, "with params:", params);

    isProgrammaticNav.current = true;

    setHistory(prev => {
      const newHistory = [...prev, { view, params }];
      const depth = newHistory.length - 1;

      // Push to browser history with serializable params only
      const safeParams = serializableParams(params);
      window.history.pushState(
        { view, params: safeParams, depth },
        '',
        viewToPath(view)
      );

      console.log("🌐 [Navigation] Pushed to browser history. Depth:", depth);
      return newHistory;
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    // Reset flag after React processes the state update
    requestAnimationFrame(() => { isProgrammaticNav.current = false; });
  }, []);

  // --- Go Back: pop from in-memory stack ---
  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return [{ view: 'home', params: {} }];
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // --- Handle browser back/forward button (popstate) ---
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If this popstate was triggered by our own navigate() call, ignore it
      if (isProgrammaticNav.current) return;

      console.log("🔙 [PopState] Browser back/forward detected. State:", event.state);

      const state = event.state;

      // --- CASE 1: User is on Home and presses back → double-back-to-exit ---
      if (!state || (history.length <= 1 && current.view === 'home')) {
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          // Second press within 2s → allow the browser to exit naturally
          console.log("🚪 [PopState] Double back → exiting");
          return;
        }

        // First press → show toast, push a dummy state to prevent exit
        lastBackPressTime.current = now;
        setShowExitToast(true);

        // Re-push the current state so the browser doesn't actually go back
        window.history.pushState(
          { view: 'home', params: {}, depth: 0 },
          '',
          '/'
        );
        return;
      }

      // --- CASE 2: Normal back navigation ---
      if (state && state.view) {
        // Restore from browser state
        const targetView = state.view as ViewType;
        const targetParams = state.params || {};
        const targetDepth = state.depth ?? 0;

        setHistory(prev => {
          // If the browser is going back, trim our stack to match
          if (targetDepth < prev.length - 1) {
            const newHistory = prev.slice(0, targetDepth + 1);
            // Merge back params from in-memory (for non-serializable data)
            if (newHistory.length > 0) {
              const last = newHistory[newHistory.length - 1];
              // Keep in-memory params but update serializable ones from state
              newHistory[newHistory.length - 1] = {
                view: targetView,
                params: { ...last.params, ...targetParams }
              };
            }
            return newHistory;
          }
          return prev;
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // --- CASE 3: Deep link / no state → redirect to home ---
        console.log("🏠 [PopState] No state found, redirecting to home");
        window.history.replaceState({ view: 'home', params: {}, depth: 0 }, '', '/');
        setHistory([{ view: 'home', params: {} }]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [history, current]);

  const handleToastDismiss = useCallback(() => {
    setShowExitToast(false);
  }, []);

  return (
    <NavigationContext.Provider value={{
      view: current.view,
      params: current.params,
      navigate,
      goBack,
      city,
      cityObj,
      setCity,
      setCityObj,
      area,
      areaId,
      setArea,
      setAreaId,
      coords,
      setCoords
    }}>
      {children}
      <BackToast visible={showExitToast} onDismiss={handleToastDismiss} />
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within NavigationProvider');
  return context;
};