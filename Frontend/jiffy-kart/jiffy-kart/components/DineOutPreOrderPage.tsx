import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigation } from '../hooks';
import {
  ChevronLeft, ChevronRight, Check, Search, X, Star, Plus, Minus,
  Trash2, ShoppingCart, ChevronDown, Info, Clock, Utensils, Flame,
  Leaf, Award, Sparkles, Gift, Baby, Accessibility, ArrowRight,
  Heart, TrendingUp, Tag, Zap, Coffee, AlertCircle, Loader2, Filter
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isVeg: boolean;
  spiceLevel: 'mild' | 'medium' | 'hot' | 'extra-hot';
  prepTime: number; // minutes
  rating: number;
  ratingCount: number;
  isPopular?: boolean;
  isChefSpecial?: boolean;
  isAvailable: boolean;
  variants?: { label: string; price: number }[];
  customizations?: string[];
}

interface CartItem {
  food: FoodItem;
  quantity: number;
  variant?: string;
  customizations: string[];
  cookingNote: string;
}

interface ReservationSummary {
  restaurantId: string;
  restaurantName: string;
  seatType: string;
  seatIcon: string;
  date: string;
  timeSlot: string;
  guestCount: number;
  occasion: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MENU_CATEGORIES = [
  { key: 'starter', label: 'Starters', emoji: '🥗' },
  { key: 'main', label: 'Main Course', emoji: '🍛' },
  { key: 'biryani', label: 'Biryani', emoji: '🍚' },
  { key: 'chinese', label: 'Chinese', emoji: '🍜' },
  { key: 'south-indian', label: 'South Indian', emoji: '🥞' },
  { key: 'north-indian', label: 'North Indian', emoji: '🫓' },
  { key: 'desserts', label: 'Desserts', emoji: '🍰' },
  { key: 'beverages', label: 'Beverages', emoji: '🥤' },
  { key: 'kids', label: 'Kids Menu', emoji: '🧒' },
  { key: 'chef-special', label: 'Chef Special', emoji: '👨‍🍳' },
];

const FOOD_FILTERS = [
  { key: 'all', label: 'All', icon: null },
  { key: 'veg', label: 'Veg', icon: Leaf },
  { key: 'nonveg', label: 'Non-Veg', icon: Flame },
  { key: 'popular', label: 'Best Seller', icon: TrendingUp },
  { key: 'under300', label: 'Under ₹300', icon: Tag },
  { key: 'chef', label: 'Chef Special', icon: Award },
  { key: 'rated', label: 'Highly Rated', icon: Star },
];

const CUSTOMIZATION_OPTIONS = [
  'Less Spicy', 'Medium Spicy', 'Extra Spicy',
  'No Onion', 'No Garlic', 'Extra Butter', 'Extra Cheese',
  'Jain Preparation', 'Gluten Free',
];

const OFFERS = [
  { label: 'Combo Deal', sub: 'Biryani + Drink at ₹399', color: 'from-orange-500 to-red-500', code: 'COMBO399' },
  { label: "Today's Special", sub: 'Chef Special 20% OFF', color: 'from-purple-500 to-violet-600', code: 'SPECIAL20' },
  { label: 'Festival Offer', sub: 'Free Dessert on ₹1000+', color: 'from-pink-500 to-rose-600', code: 'FEST1K' },
];

// ─── Mock Food Data ───────────────────────────────────────────────────────────

const FOOD_MENU: FoodItem[] = [
  // Starters
  { id: 'f1', name: 'Crispy Masala Papad', description: 'Thin lentil wafers topped with tangy onion-tomato masala', price: 80, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80', category: 'starter', isVeg: true, spiceLevel: 'mild', prepTime: 5, rating: 4.3, ratingCount: 120, isAvailable: true },
  { id: 'f2', name: 'Paneer Tikka', description: 'Charcoal-grilled cottage cheese marinated in yogurt spices', price: 280, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=400&q=80', category: 'starter', isVeg: true, spiceLevel: 'medium', prepTime: 18, rating: 4.7, ratingCount: 340, isPopular: true, isAvailable: true, variants: [{ label: 'Half', price: 160 }, { label: 'Full', price: 280 }] },
  { id: 'f3', name: 'Chicken Tikka', description: 'Juicy boneless chicken marinated in tandoori spices, clay-oven roasted', price: 320, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80', category: 'starter', isVeg: false, spiceLevel: 'hot', prepTime: 20, rating: 4.8, ratingCount: 560, isPopular: true, isChefSpecial: true, isAvailable: true },
  { id: 'f4', name: 'Veg Spring Rolls', description: 'Crispy rolls stuffed with stir-fried vegetables and glass noodles', price: 180, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', category: 'starter', isVeg: true, spiceLevel: 'mild', prepTime: 12, rating: 4.2, ratingCount: 89, isAvailable: true },
  // Main Course
  { id: 'f5', name: 'Butter Chicken', description: 'Tender chicken in velvety tomato-cream sauce, a North Indian classic', price: 350, originalPrice: 420, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80', category: 'main', isVeg: false, spiceLevel: 'medium', prepTime: 25, rating: 4.9, ratingCount: 890, isPopular: true, isChefSpecial: true, isAvailable: true },
  { id: 'f6', name: 'Dal Makhani', description: 'Slow-cooked black lentils in rich buttery gravy, 12-hour simmer', price: 260, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80', category: 'main', isVeg: true, spiceLevel: 'mild', prepTime: 15, rating: 4.6, ratingCount: 445, isPopular: true, isAvailable: true },
  { id: 'f7', name: 'Mutton Rogan Josh', description: 'Kashmiri style slow-braised lamb in aromatic spice gravy', price: 420, image: 'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&q=80', category: 'main', isVeg: false, spiceLevel: 'hot', prepTime: 30, rating: 4.7, ratingCount: 312, isAvailable: true },
  { id: 'f8', name: 'Paneer Butter Masala', description: 'Cottage cheese cubes in creamy tomato gravy with fenugreek', price: 280, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80', category: 'main', isVeg: true, spiceLevel: 'mild', prepTime: 18, rating: 4.5, ratingCount: 390, isAvailable: true },
  // Biryani
  { id: 'f9', name: 'Hyderabadi Chicken Biryani', description: 'Fragrant basmati rice layered with spiced chicken, dum cooked for perfection', price: 380, image: 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=400&q=80', category: 'biryani', isVeg: false, spiceLevel: 'hot', prepTime: 35, rating: 4.9, ratingCount: 1240, isPopular: true, isChefSpecial: true, isAvailable: true, variants: [{ label: 'Half', price: 220 }, { label: 'Full', price: 380 }, { label: 'Family Pack', price: 680 }] },
  { id: 'f10', name: 'Veg Biryani', description: 'Aromatic rice with garden-fresh vegetables and mint layers', price: 280, image: 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=400&q=80', category: 'biryani', isVeg: true, spiceLevel: 'medium', prepTime: 28, rating: 4.4, ratingCount: 310, isAvailable: true },
  { id: 'f11', name: 'Mutton Biryani', description: 'Tender mutton pieces slow-cooked with aged basmati rice', price: 450, image: 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=400&q=80', category: 'biryani', isVeg: false, spiceLevel: 'hot', prepTime: 40, rating: 4.8, ratingCount: 780, isAvailable: true },
  // Chinese
  { id: 'f12', name: 'Veg Manchurian', description: 'Crispy vegetable dumplings in tangy Indo-Chinese sauce', price: 220, image: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=400&q=80', category: 'chinese', isVeg: true, spiceLevel: 'medium', prepTime: 15, rating: 4.3, ratingCount: 210, isAvailable: true },
  { id: 'f13', name: 'Chilli Chicken', description: 'Crispy batter-fried chicken tossed with green chillies and soy', price: 290, image: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=400&q=80', category: 'chinese', isVeg: false, spiceLevel: 'extra-hot', prepTime: 18, rating: 4.6, ratingCount: 320, isPopular: true, isAvailable: true },
  // South Indian
  { id: 'f14', name: 'Masala Dosa', description: 'Crispy rice crepe stuffed with spiced potato, served with sambar & chutneys', price: 120, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=400&q=80', category: 'south-indian', isVeg: true, spiceLevel: 'mild', prepTime: 12, rating: 4.8, ratingCount: 890, isPopular: true, isAvailable: true },
  { id: 'f15', name: 'Idli Sambar', description: 'Soft steamed rice cakes served with lentil sambar and coconut chutney', price: 90, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=400&q=80', category: 'south-indian', isVeg: true, spiceLevel: 'mild', prepTime: 10, rating: 4.5, ratingCount: 560, isAvailable: true },
  // North Indian
  { id: 'f16', name: 'Garlic Naan', description: 'Soft tandoor bread brushed with butter and roasted garlic', price: 60, image: 'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&q=80', category: 'north-indian', isVeg: true, spiceLevel: 'mild', prepTime: 8, rating: 4.6, ratingCount: 670, isPopular: true, isAvailable: true },
  { id: 'f17', name: 'Tandoori Roti', description: 'Whole wheat flatbread baked in clay oven', price: 40, image: 'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&q=80', category: 'north-indian', isVeg: true, spiceLevel: 'mild', prepTime: 6, rating: 4.3, ratingCount: 340, isAvailable: true },
  // Desserts
  { id: 'f18', name: 'Gulab Jamun', description: 'Soft milk-solid dumplings soaked in rose-flavoured sugar syrup', price: 120, image: 'https://images.unsplash.com/photo-1527515637462-cff94ece14b5?w=400&q=80', category: 'desserts', isVeg: true, spiceLevel: 'mild', prepTime: 8, rating: 4.9, ratingCount: 780, isPopular: true, isAvailable: true },
  { id: 'f19', name: 'Brownie with Ice Cream', description: 'Warm chocolate brownie topped with vanilla ice cream and chocolate sauce', price: 180, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80', category: 'desserts', isVeg: true, spiceLevel: 'mild', prepTime: 10, rating: 4.7, ratingCount: 450, isChefSpecial: true, isAvailable: true },
  // Beverages
  { id: 'f20', name: 'Mango Lassi', description: 'Chilled blend of yoghurt, fresh mango pulp & a hint of cardamom', price: 90, image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80', category: 'beverages', isVeg: true, spiceLevel: 'mild', prepTime: 5, rating: 4.6, ratingCount: 390, isAvailable: true },
  { id: 'f21', name: 'Cold Coffee', description: 'Blended coffee with milk, cream, and chocolate shavings', price: 140, image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80', category: 'beverages', isVeg: true, spiceLevel: 'mild', prepTime: 5, rating: 4.4, ratingCount: 280, isAvailable: true },
  { id: 'f22', name: 'Fresh Lime Soda', description: 'Refreshing lime soda — sweet or salted', price: 70, image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80', category: 'beverages', isVeg: true, spiceLevel: 'mild', prepTime: 3, rating: 4.2, ratingCount: 190, isAvailable: true },
  // Kids
  { id: 'f23', name: 'Mini Pizza', description: 'Cheesy personal-size pizza with your choice of toppings', price: 180, image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', category: 'kids', isVeg: true, spiceLevel: 'mild', prepTime: 15, rating: 4.3, ratingCount: 120, isAvailable: true, variants: [{ label: 'Veg', price: 180 }, { label: 'Non-Veg', price: 220 }] },
  { id: 'f24', name: 'French Fries', description: 'Crispy golden potato fries with ketchup', price: 120, image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', category: 'kids', isVeg: true, spiceLevel: 'mild', prepTime: 10, rating: 4.5, ratingCount: 230, isPopular: true, isAvailable: true },
  // Chef Special
  { id: 'f25', name: 'Nazhirya Signature Thali', description: 'A grand platter with 12 items — the chef\'s pride & our bestseller', price: 550, originalPrice: 700, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', category: 'chef-special', isVeg: false, spiceLevel: 'medium', prepTime: 25, rating: 4.9, ratingCount: 1680, isPopular: true, isChefSpecial: true, isAvailable: true },
  { id: 'f26', name: 'Royal Paneer Platter', description: 'Three paneer preparations — tikka, butter masala & palak — with naan & rice', price: 480, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', category: 'chef-special', isVeg: true, spiceLevel: 'medium', prepTime: 22, rating: 4.7, ratingCount: 560, isChefSpecial: true, isAvailable: true },
];

const RECOMMENDED_IDS = ['f16', 'f21', 'f18'];

const STEPPER = [
  { id: 1, label: 'Reservation', done: true },
  { id: 2, label: 'Food Pre-Order', active: true },
  { id: 3, label: 'Review Booking', active: false },
  { id: 4, label: 'Payment', active: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d: string) => {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const timeDisplay = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ${ampm}`;
};

const spiceLabel = (l: FoodItem['spiceLevel']) => {
  const m: Record<string, { text: string; color: string }> = {
    'mild': { text: '🌶 Mild', color: 'text-green-600' },
    'medium': { text: '🌶🌶 Medium', color: 'text-amber-600' },
    'hot': { text: '🌶🌶🌶 Hot', color: 'text-orange-600' },
    'extra-hot': { text: '🔥 Extra Hot', color: 'text-red-600' },
  };
  return m[l] || m['mild'];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Stepper
const PreOrderStepper: React.FC = () => (
  <div className="flex items-center justify-between relative py-3">
    <div className="absolute top-[22px] left-0 right-0 h-0.5 bg-gray-200 z-0">
      <div className="h-full bg-primary transition-all duration-500" style={{ width: '33%' }} />
    </div>
    {STEPPER.map(s => (
      <div key={s.id} className="flex flex-col items-center z-10 flex-1">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all border-2 ${
          s.done ? 'bg-primary border-primary text-white' : s.active ? 'bg-white border-primary text-primary shadow-glow' : 'bg-white border-gray-200 text-gray-300'
        }`}>
          {s.done ? <Check size={12} strokeWidth={3} /> : s.id}
        </div>
        <span className={`text-[10px] mt-1 font-bold ${s.active ? 'text-primary' : s.done ? 'text-primary/70' : 'text-gray-300'}`}>
          {s.label}
        </span>
      </div>
    ))}
  </div>
);

// Veg/Non-Veg Badge
const VegBadge: React.FC<{ isVeg: boolean; size?: number }> = ({ isVeg, size = 14 }) => (
  <span className={`inline-flex w-[${size}px] h-[${size}px] rounded-sm border-2 items-center justify-center shrink-0 ${isVeg ? 'border-green-500' : 'border-red-500'}`} style={{ width: size, height: size }}>
    <span className={`rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: size * 0.45, height: size * 0.45 }} />
  </span>
);

// Food Card
const FoodCard: React.FC<{
  item: FoodItem;
  cartQty: number;
  onAdd: (item: FoodItem) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}> = ({ item, cartQty, onAdd, onIncrement, onDecrement }) => {
  const [imgErr, setImgErr] = useState(false);
  const sp = spiceLabel(item.spiceLevel);

  return (
    <div className={`flex gap-3 p-3 rounded-2xl border transition-all animate-fade-in ${!item.isAvailable ? 'opacity-50 bg-gray-50 border-gray-100' : 'bg-white border-gray-100 hover:shadow-soft hover:border-gray-200'}`}>
      {/* Image */}
      <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden shrink-0">
        <img
          src={imgErr ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' : item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
        {item.isChefSpecial && (
          <span className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Award size={8} /> Chef
          </span>
        )}
        {item.isPopular && !item.isChefSpecial && (
          <span className="absolute top-1 left-1 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <TrendingUp size={8} /> Best
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start gap-1.5 mb-0.5">
            <VegBadge isVeg={item.isVeg} />
            <h3 className="font-black text-gray-800 text-sm leading-tight truncate">{item.name}</h3>
          </div>
          <p className="text-[11px] text-gray-400 line-clamp-2 leading-snug mb-1.5">{item.description}</p>
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className={`font-bold ${sp.color}`}>{sp.text}</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400 flex items-center gap-0.5"><Clock size={9} /> {item.prepTime} min</span>
            <span className="text-gray-300">•</span>
            <span className="text-amber-600 font-bold flex items-center gap-0.5"><Star size={9} className="fill-amber-400 text-amber-400" /> {item.rating}</span>
          </div>
        </div>

        {/* Price + Add */}
        <div className="flex items-end justify-between mt-2">
          <div>
            <span className="font-black text-gray-800 text-sm">₹{item.price}</span>
            {item.originalPrice && (
              <span className="text-gray-400 text-[11px] line-through ml-1.5">₹{item.originalPrice}</span>
            )}
            {item.variants && item.variants.length > 0 && (
              <span className="text-[10px] text-primary font-bold ml-1.5">+{item.variants.length} sizes</span>
            )}
          </div>

          {!item.isAvailable ? (
            <span className="text-[10px] text-red-400 font-bold">Unavailable</span>
          ) : cartQty > 0 ? (
            <div className="flex items-center gap-1 bg-primary rounded-xl overflow-hidden">
              <button onClick={() => onDecrement(item.id)} className="w-7 h-7 min-w-0 min-h-0 flex items-center justify-center text-white hover:bg-secondary transition">
                <Minus size={12} strokeWidth={3} />
              </button>
              <span className="text-white font-black text-xs w-5 text-center">{cartQty}</span>
              <button onClick={() => onIncrement(item.id)} className="w-7 h-7 min-w-0 min-h-0 flex items-center justify-center text-white hover:bg-secondary transition">
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(item)}
              className="flex items-center gap-1 border-2 border-primary text-primary text-xs font-black px-3 py-1 rounded-xl hover:bg-primary hover:text-white transition-all min-h-0 min-w-0"
            >
              <Plus size={12} /> ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Cart Summary Sidebar
const CartSidebar: React.FC<{
  cart: CartItem[];
  reservation: ReservationSummary;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onContinue: () => void;
}> = ({ cart, reservation, onIncrement, onDecrement, onRemove, onClear, onContinue }) => {
  const subtotal = cart.reduce((s, c) => s + (c.variant ? (c.food.variants?.find(v => v.label === c.variant)?.price || c.food.price) : c.food.price) * c.quantity, 0);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const maxPrep = cart.length > 0 ? Math.max(...cart.map(c => c.food.prepTime)) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary to-primary p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} />
            <span className="font-black text-sm">Your Pre-Order</span>
          </div>
          <span className="bg-white/20 text-xs font-black px-2 py-0.5 rounded-full">{totalItems} items</span>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-h-[40vh] space-y-3">
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">No food selected yet</p>
            <p className="text-gray-300 text-xs mt-1">Browse the menu and add items</p>
          </div>
        ) : (
          <>
            {cart.map(c => (
              <div key={c.food.id} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                <VegBadge isVeg={c.food.isVeg} size={12} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-800 truncate">{c.food.name}</div>
                  {c.variant && <div className="text-[10px] text-primary font-semibold">{c.variant}</div>}
                  <div className="text-[11px] text-gray-500 font-semibold">
                    ₹{(c.variant ? (c.food.variants?.find(v => v.label === c.variant)?.price || c.food.price) : c.food.price) * c.quantity}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg">
                  <button onClick={() => onDecrement(c.food.id)} className="w-6 h-6 min-w-0 min-h-0 flex items-center justify-center text-gray-600 hover:text-primary transition">
                    <Minus size={10} strokeWidth={3} />
                  </button>
                  <span className="text-xs font-black text-gray-700 w-4 text-center">{c.quantity}</span>
                  <button onClick={() => onIncrement(c.food.id)} className="w-6 h-6 min-w-0 min-h-0 flex items-center justify-center text-gray-600 hover:text-primary transition">
                    <Plus size={10} strokeWidth={3} />
                  </button>
                </div>
                <button onClick={() => onRemove(c.food.id)} className="w-5 h-5 min-w-0 min-h-0 text-gray-300 hover:text-red-500 transition">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            <button onClick={onClear} className="text-[10px] text-red-400 font-bold hover:text-red-600 transition min-h-0 min-w-0 mt-1">
              Clear Cart
            </button>
          </>
        )}
      </div>

      {/* Summary */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span className="font-bold text-gray-700">₹{subtotal}</span></div>
          <div className="flex justify-between text-xs text-gray-500"><span>GST (5%)</span><span className="font-bold text-gray-700">₹{gst}</span></div>
          <div className="flex justify-between text-xs text-gray-500"><span>Reservation Fee</span><span className="font-bold text-emerald-600">FREE</span></div>
          <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between">
            <span className="font-black text-gray-800 text-sm">Grand Total</span>
            <span className="font-black text-primary text-base">₹{total}</span>
          </div>

          {/* Prep time */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs">
            <Clock size={14} className="text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-amber-700">Est. Preparation: {maxPrep} min</span>
              {reservation.timeSlot && (
                <div className="text-[10px] text-amber-600 mt-0.5">
                  Your table is at {timeDisplay(reservation.timeSlot)} — food will be ready when you arrive!
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full py-3 min-h-0 bg-primary text-white font-black rounded-xl hover:bg-secondary transition-all text-sm flex items-center justify-center gap-2 shadow-glow"
          >
            Continue to Review <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

// Skip confirmation dialog
const SkipDialog: React.FC<{ onSkip: () => void; onClose: () => void }> = ({ onSkip, onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-sm p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
      <div className="text-center mb-5">
        <div className="text-4xl mb-3">🍽️</div>
        <h3 className="text-lg font-black text-gray-900 mb-2">Skip Food Pre-Order?</h3>
        <p className="text-sm text-gray-500">You can still order food after reaching the restaurant. Pre-ordering saves you wait time!</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 min-h-0 border-2 border-gray-200 text-gray-600 font-black rounded-2xl hover:border-gray-400 transition text-sm">
          Go Back
        </button>
        <button onClick={onSkip} className="flex-1 py-3 min-h-0 bg-primary text-white font-black rounded-2xl hover:bg-secondary transition text-sm">
          Skip & Continue
        </button>
      </div>
    </div>
  </div>
);

// Customization Modal
const CustomizationModal: React.FC<{
  item: FoodItem;
  onClose: () => void;
  onConfirm: (variant: string | null, customs: string[], note: string) => void;
}> = ({ item, onClose, onConfirm }) => {
  const [variant, setVariant] = useState<string | null>(item.variants ? item.variants[0].label : null);
  const [customs, setCustoms] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const toggleCustom = (c: string) => setCustoms(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const selectedPrice = variant && item.variants ? (item.variants.find(v => v.label === variant)?.price || item.price) : item.price;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-5 pb-3 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <VegBadge isVeg={item.isVeg} size={16} />
            <div>
              <h3 className="font-black text-gray-900">{item.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Customise your dish</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 min-w-0 min-h-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">Choose Size *</p>
              <div className="flex gap-2 flex-wrap">
                {item.variants.map(v => (
                  <button
                    key={v.label}
                    onClick={() => setVariant(v.label)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all min-h-0 min-w-0 ${
                      variant === v.label ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-primary'
                    }`}
                  >
                    {v.label} — ₹{v.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customizations */}
          <div>
            <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">Customizations</p>
            <div className="flex flex-wrap gap-2">
              {CUSTOMIZATION_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCustom(c)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full border-2 transition-all min-h-0 min-w-0 ${
                    customs.includes(c) ? 'bg-primary border-primary text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-primary/50'
                  }`}
                >
                  {customs.includes(c) && <Check size={9} className="inline mr-1" strokeWidth={3} />}{c}
                </button>
              ))}
            </div>
          </div>

          {/* Cooking instructions */}
          <div>
            <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-2">Cooking Instructions</p>
            <textarea
              placeholder="E.g., Make it very crispy, add extra sauce..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary transition resize-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-400">Item Total</div>
            <div className="font-black text-primary text-lg">₹{selectedPrice}</div>
          </div>
          <button
            onClick={() => onConfirm(variant, customs, note)}
            className="bg-primary text-white font-black px-6 py-3 rounded-2xl hover:bg-secondary transition min-h-0 text-sm flex items-center gap-2 shadow-glow"
          >
            <Plus size={15} /> Add to Order
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export const DineOutPreOrderPage: React.FC<{
  restaurantId: string;
  restaurantName?: string;
  seatType?: string;
  seatIcon?: string;
  date?: string;
  timeSlot?: string;
  guestCount?: number;
  occasion?: string;
  onBack: () => void;
}> = ({ restaurantId, restaurantName = 'Restaurant', seatType = '4 Seater', seatIcon = '👨‍👩‍👧‍👦', date = '', timeSlot = '', guestCount = 2, occasion = '', onBack }) => {
  const { navigate } = useNavigation();

  // Build reservation summary
  const reservation: ReservationSummary = { restaurantId, restaurantName, seatType, seatIcon, date, timeSlot, guestCount, occasion };

  // Phase — 'choice' | 'menu'
  const [phase, setPhase] = useState<'choice' | 'menu'>('choice');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Menu state
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [customizingItem, setCustomizingItem] = useState<FoodItem | null>(null);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ── Cart helpers ──────────────────────────────────────────────────
  const addToCart = useCallback((item: FoodItem, variant?: string | null, customs: string[] = [], note: string = '') => {
    setCart(prev => {
      const existing = prev.find(c => c.food.id === item.id);
      if (existing) {
        return prev.map(c => c.food.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { food: item, quantity: 1, variant: variant || undefined, customizations: customs, cookingNote: note }];
    });
    setToast(`✅ ${item.name} added!`);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const increment = useCallback((id: string) => {
    setCart(prev => prev.map(c => c.food.id === id ? { ...c, quantity: c.quantity + 1 } : c));
  }, []);

  const decrement = useCallback((id: string) => {
    setCart(prev => {
      const item = prev.find(c => c.food.id === id);
      if (item && item.quantity <= 1) return prev.filter(c => c.food.id !== id);
      return prev.map(c => c.food.id === id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(c => c.food.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const getCartQty = useCallback((id: string) => cart.find(c => c.food.id === id)?.quantity || 0, [cart]);

  const totalCartItems = cart.reduce((s, c) => s + c.quantity, 0);

  // ── Filtering ──────────────────────────────────────────────────────
  const filteredMenu = useMemo(() => {
    let items = FOOD_MENU;
    const q = search.toLowerCase();
    if (q) items = items.filter(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.category.includes(q));
    if (activeFilter === 'veg') items = items.filter(f => f.isVeg);
    else if (activeFilter === 'nonveg') items = items.filter(f => !f.isVeg);
    else if (activeFilter === 'popular') items = items.filter(f => f.isPopular);
    else if (activeFilter === 'under300') items = items.filter(f => f.price < 300);
    else if (activeFilter === 'chef') items = items.filter(f => f.isChefSpecial);
    else if (activeFilter === 'rated') items = items.filter(f => f.rating >= 4.5);
    return items;
  }, [search, activeFilter]);

  // Group by category
  const groupedMenu = useMemo(() => {
    const groups: Record<string, FoodItem[]> = {};
    filteredMenu.forEach(f => {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    });
    return groups;
  }, [filteredMenu]);

  const visibleCategories = MENU_CATEGORIES.filter(c => groupedMenu[c.key]?.length);

  // Scroll to category
  const scrollToCategory = (key: string) => {
    setActiveCategory(key);
    const el = categoryRefs.current[key];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Recommendations
  const recommendations = FOOD_MENU.filter(f => RECOMMENDED_IDS.includes(f.id) && !cart.some(c => c.food.id === f.id));

  // Continue to review
  const handleContinue = useCallback(() => {
    navigate('dineout-review', {
      restaurantId,
      restaurantName,
      seatType,
      seatIcon,
      date,
      timeSlot,
      guestCount,
      occasion,
      cartItems: cart.length,
      cartTotal: cart.reduce((s, c) => s + c.food.price * c.quantity, 0),
    });
  }, [navigate, restaurantId, restaurantName, seatType, seatIcon, date, timeSlot, guestCount, occasion, cart]);

  const handleSkip = useCallback(() => {
    setShowSkipDialog(false);
    handleContinue();
  }, [handleContinue]);

  // Handle customization add
  const handleCustomAdd = useCallback((item: FoodItem) => {
    if (item.variants || item.customizations) {
      setCustomizingItem(item);
    } else {
      addToCart(item);
    }
  }, [addToCart]);

  // ════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top Bar ── */}
      <div className="sticky top-[56px] md:top-[64px] z-40 bg-white border-b border-gray-100 shadow-soft">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <button onClick={onBack} className="w-9 h-9 min-h-0 min-w-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition shrink-0">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-black text-gray-900 text-sm truncate">{phase === 'choice' ? 'Pre-Order Food' : 'Restaurant Menu'}</div>
              <div className="text-[11px] text-gray-500 truncate">{restaurantName}</div>
            </div>
            {phase === 'menu' && (
              <button
                onClick={() => setShowCartMobile(p => !p)}
                className="md:hidden relative flex items-center gap-1.5 bg-primary text-white text-xs font-black px-3 py-1.5 rounded-full min-h-0 min-w-0"
              >
                <ShoppingCart size={13} />
                {totalCartItems > 0 && <span>{totalCartItems}</span>}
              </button>
            )}
          </div>
          <PreOrderStepper />
        </div>
      </div>

      {/* ── Reservation Summary Strip ── */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4 overflow-x-auto no-scrollbar text-[11px]">
          <span className="shrink-0 font-bold text-primary flex items-center gap-1">{seatIcon} {seatType}</span>
          <span className="text-gray-300">|</span>
          {date && <span className="shrink-0 text-gray-600 font-semibold">{formatDate(date)}</span>}
          {timeSlot && <><span className="text-gray-300">|</span><span className="shrink-0 text-gray-600 font-semibold">{timeDisplay(timeSlot)}</span></>}
          <span className="text-gray-300">|</span>
          <span className="shrink-0 text-gray-600 font-semibold">{guestCount} guests</span>
          {occasion && <><span className="text-gray-300">|</span><span className="shrink-0 text-primary font-bold">{occasion}</span></>}
        </div>
      </div>

      {/* ────────────────────────────────────
          PHASE: CHOICE CARD
      ──────────────────────────────────── */}
      {phase === 'choice' && (
        <div className="max-w-xl mx-auto px-4 pt-12 pb-20 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 text-center">
            <div className="text-6xl mb-5">🍽️</div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-3">
              Would You Like to<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-highlight">Pre-Order Food?</span>
            </h1>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
              Skip the waiting time. Your food will be prepared before you arrive so it's ready when you sit down!
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setPhase('menu')}
                className="w-full py-4 min-h-0 bg-primary text-white font-black text-sm rounded-2xl hover:bg-secondary transition-all shadow-glow flex items-center justify-center gap-2"
              >
                <Utensils size={18} /> YES, PRE-ORDER FOOD
              </button>
              <button
                onClick={() => setShowSkipDialog(true)}
                className="w-full py-4 min-h-0 border-2 border-gray-200 text-gray-600 font-black text-sm rounded-2xl hover:border-gray-400 transition-all flex items-center justify-center gap-2"
              >
                <Coffee size={18} /> NO, ORDER AT RESTAURANT
              </button>
            </div>

            {/* Benefit strip */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              {[
                { icon: Zap, label: 'No Wait', desc: 'Food ready on arrival' },
                { icon: Clock, label: 'Save Time', desc: 'Skip 20+ min wait' },
                { icon: Award, label: 'Best Price', desc: 'Pre-order discounts' },
              ].map(b => (
                <div key={b.label} className="text-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-1.5">
                    <b.icon size={18} className="text-primary" />
                  </div>
                  <div className="text-[11px] font-black text-gray-700">{b.label}</div>
                  <div className="text-[10px] text-gray-400">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────
          PHASE: MENU
      ──────────────────────────────────── */}
      {phase === 'menu' && (
        <div className="max-w-7xl mx-auto px-4 py-4 pb-32 md:pb-6">
          <div className="flex gap-5">

            {/* ── Left: Menu Content ── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Search */}
              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-gray-200 shadow-soft">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search food items..."
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
                {search && <button onClick={() => setSearch('')} className="min-h-0 min-w-0 w-6 h-6 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
              </div>

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {FOOD_FILTERS.map(f => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border-2 transition-all min-h-0 min-w-0 ${
                        activeFilter === f.key
                          ? 'bg-primary border-primary text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-primary/50'
                      }`}
                    >
                      {Icon && <Icon size={12} />}
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {/* Offer Banners */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {OFFERS.map(o => (
                  <div key={o.code} className={`shrink-0 bg-gradient-to-r ${o.color} rounded-2xl px-4 py-3 text-white min-w-[200px] cursor-pointer hover:scale-[1.02] transition-transform`}>
                    <div className="font-black text-sm">{o.label}</div>
                    <div className="text-white/80 text-[11px] mt-0.5">{o.sub}</div>
                    <div className="text-[10px] bg-white/20 backdrop-blur px-2 py-0.5 rounded-full inline-block mt-2 font-bold tracking-wider">{o.code}</div>
                  </div>
                ))}
              </div>

              {/* Category Tabs (sticky) */}
              <div className="sticky top-[150px] md:top-[166px] z-30 bg-background pt-1 pb-2 -mx-1 px-1">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {visibleCategories.map(c => (
                    <button
                      key={c.key}
                      onClick={() => scrollToCategory(c.key)}
                      className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all min-h-0 min-w-0 ${
                        activeCategory === c.key
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40'
                      }`}
                    >
                      <span>{c.emoji}</span> {c.label}
                      <span className="text-[10px] opacity-70">({groupedMenu[c.key]?.length || 0})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Items grouped by category */}
              {visibleCategories.length === 0 ? (
                <div className="text-center py-16">
                  <Search size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-semibold">No items found</p>
                  <button onClick={() => { setSearch(''); setActiveFilter('all'); }} className="text-primary font-bold text-xs mt-3 min-h-0 min-w-0">Reset Filters</button>
                </div>
              ) : (
                visibleCategories.map(cat => (
                  <div
                    key={cat.key}
                    ref={el => { categoryRefs.current[cat.key] = el; }}
                    className="scroll-mt-44"
                  >
                    <h2 className="flex items-center gap-2 text-base font-black text-gray-800 mb-3 pt-2">
                      <span>{cat.emoji}</span> {cat.label}
                      <span className="text-xs text-gray-400 font-normal">({groupedMenu[cat.key]?.length || 0})</span>
                    </h2>
                    <div className="space-y-2">
                      {(groupedMenu[cat.key] || []).map(item => (
                        <FoodCard
                          key={item.id}
                          item={item}
                          cartQty={getCartQty(item.id)}
                          onAdd={handleCustomAdd}
                          onIncrement={increment}
                          onDecrement={decrement}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && cart.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-6">
                  <h3 className="font-black text-amber-800 text-sm mb-3 flex items-center gap-2">
                    <Sparkles size={15} className="text-amber-500" /> Customers Also Ordered
                  </h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {recommendations.map(r => (
                      <div key={r.id} className="shrink-0 w-36 bg-white rounded-xl overflow-hidden border border-amber-100 shadow-sm cursor-pointer hover:shadow-md transition">
                        <img src={r.image} alt={r.name} className="w-full h-20 object-cover" />
                        <div className="p-2">
                          <div className="text-xs font-bold text-gray-800 truncate">{r.name}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-black text-gray-700">₹{r.price}</span>
                            <button onClick={() => addToCart(r)} className="w-5 h-5 min-w-0 min-h-0 bg-primary rounded-md flex items-center justify-center text-white hover:bg-secondary transition">
                              <Plus size={10} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skip / Continue row (mobile) */}
              <div className="md:hidden flex gap-3 mt-6">
                <button
                  onClick={() => setShowSkipDialog(true)}
                  className="flex-1 py-3 min-h-0 border-2 border-gray-200 text-gray-600 font-bold text-xs rounded-xl hover:border-gray-400 transition"
                >
                  Skip Pre-Order
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 py-3 min-h-0 bg-primary text-white font-black text-xs rounded-xl hover:bg-secondary transition flex items-center justify-center gap-1.5 shadow-glow"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* ── Right: Cart Sidebar (desktop) ── */}
            <div className="hidden md:block w-80 shrink-0">
              <div className="sticky top-[200px]">
                <CartSidebar
                  cart={cart}
                  reservation={reservation}
                  onIncrement={increment}
                  onDecrement={decrement}
                  onRemove={removeFromCart}
                  onClear={clearCart}
                  onContinue={handleContinue}
                />
                {/* Skip link */}
                <button
                  onClick={() => setShowSkipDialog(true)}
                  className="w-full mt-3 py-2 min-h-0 text-xs text-gray-400 font-bold hover:text-gray-600 transition"
                >
                  Skip pre-order →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Cart Bottom Sheet ── */}
      {phase === 'menu' && showCartMobile && (
        <div className="fixed inset-0 z-[150] flex items-end bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setShowCartMobile(false)}>
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900">Your Pre-Order</h3>
              <button onClick={() => setShowCartMobile(false)} className="w-8 h-8 min-w-0 min-h-0 rounded-full bg-gray-100 flex items-center justify-center"><X size={16} className="text-gray-600" /></button>
            </div>
            <CartSidebar
              cart={cart}
              reservation={reservation}
              onIncrement={increment}
              onDecrement={decrement}
              onRemove={removeFromCart}
              onClear={clearCart}
              onContinue={() => { setShowCartMobile(false); handleContinue(); }}
            />
          </div>
        </div>
      )}

      {/* ── Mobile Sticky Bottom Bar (menu phase) ── */}
      {phase === 'menu' && !showCartMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3">
          <div className="flex items-center gap-3">
            {totalCartItems > 0 ? (
              <>
                <button
                  onClick={() => setShowCartMobile(true)}
                  className="flex-1 flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2 min-h-0"
                >
                  <ShoppingCart size={14} className="text-primary" />
                  <span className="text-xs font-black text-primary">{totalCartItems} items</span>
                  <span className="text-xs text-gray-400 ml-auto">₹{cart.reduce((s, c) => s + c.food.price * c.quantity, 0)}</span>
                </button>
                <button
                  onClick={handleContinue}
                  className="shrink-0 bg-primary text-white font-black px-5 py-2.5 rounded-xl hover:bg-secondary transition min-h-0 text-sm flex items-center gap-1.5"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </>
            ) : (
              <div className="flex-1 text-center text-xs text-gray-400 font-semibold py-1">
                Browse the menu and add items to pre-order
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-2xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* ── Skip Dialog ── */}
      {showSkipDialog && <SkipDialog onSkip={handleSkip} onClose={() => setShowSkipDialog(false)} />}

      {/* ── Customization Modal ── */}
      {customizingItem && (
        <CustomizationModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onConfirm={(variant, customs, note) => {
            addToCart(customizingItem, variant, customs, note);
            setCustomizingItem(null);
          }}
        />
      )}
    </div>
  );
};

export default DineOutPreOrderPage;
