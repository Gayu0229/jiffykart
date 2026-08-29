import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigation } from '../hooks';
import {
  ChevronLeft, Star, MapPin, Clock, Tag, Heart, Share2,
  Users, Wifi, Car, Wind, Music, Accessibility, CreditCard,
  Smartphone, Coffee, CheckCircle, X, ChevronRight, ChevronLeft as CLeft,
  Utensils, Flame, Leaf, Award, Phone, Globe, Instagram,
  Timer, TrendingUp, Info, AlertCircle, Navigation2, Camera,
  MessageSquare, ThumbsUp, ChevronDown, Sparkles
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeatCategory {
  type: string;
  icon: string;
  total: number;
  booked: number;
  available: number;
  priceNote?: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  isVeg: boolean;
  isPopular?: boolean;
  rating?: number;
  image: string;
  category: string;
}

interface Review {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  images?: string[];
  helpfulCount: number;
}

interface RestaurantDetail {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  distance: string;
  travelTime: string;
  avgCost: number;
  openingHours: string;
  isOpen: boolean;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  coverImage: string;
  logo: string;
  gallery: string[];
  tags: string[];
  description: string;
  address: string;
  phone: string;
  website?: string;
  seatCategories: SeatCategory[];
  menu: MenuItem[];
  reviews: Review[];
  amenities: string[];
  lat: number;
  lng: number;
}

// ─── Mock Data Factory ────────────────────────────────────────────────────────

const RESTAURANT_DB: Record<string, RestaurantDetail> = {
  '1': {
    id: '1', name: 'Nazhirya Restaurant', cuisine: 'South Indian • North Indian',
    rating: 4.5, reviewCount: 1243, distance: '1.2 km', travelTime: '8 min',
    avgCost: 450, openingHours: '11:00 AM – 11:00 PM', isOpen: true,
    totalSeats: 50, bookedSeats: 32, availableSeats: 18,
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=85',
    logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
      'https://images.unsplash.com/photo-1484980972926-edee96e0960d?w=600&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
      'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    ],
    tags: ['Family Dining', 'Veg Options', 'AC', 'Parking'],
    description: 'Nazhirya Restaurant is a beloved dining destination in Nesapakkam, renowned for its authentic South Indian flavours crafted with age-old family recipes. Our chefs bring together the finest spices from Tamil Nadu\'s heartland to create a dining experience that is both soulful and memorable. From crispy dosas to rich biryanis, every dish tells a story of tradition and passion.',
    address: '15/6, Kanagasabi Street, Nesapakkam, Chennai - 600092',
    phone: '+91 98765 43210',
    website: 'https://nazhirya.com',
    seatCategories: [
      { type: '2 Seater', icon: '👫', total: 10, booked: 7, available: 3, priceNote: 'Cosy corner tables' },
      { type: '4 Seater', icon: '👨‍👩‍👧‍👦', total: 20, booked: 14, available: 6, priceNote: 'Family / group tables' },
      { type: '6 Seater', icon: '🎉', total: 12, booked: 8, available: 4, priceNote: 'Extended family tables' },
      { type: '8 Seater', icon: '🪑', total: 5, booked: 3, available: 2, priceNote: 'Private dining section' },
      { type: '10+ Seater', icon: '🎊', total: 3, booked: 0, available: 3, priceNote: 'Banquet / party hall' },
    ],
    menu: [
      { id: 'm1', name: 'Masala Dosa', price: 120, description: 'Crispy rice crepe stuffed with spiced potato, served with chutneys & sambar', isVeg: true, isPopular: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=400&q=80', category: 'Starters' },
      { id: 'm2', name: 'Butter Chicken', price: 320, description: 'Tender chicken in velvety tomato-cream sauce with warm naan', isVeg: false, isPopular: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80', category: 'Main Course' },
      { id: 'm3', name: 'Dal Makhani', price: 240, description: 'Slow-cooked black lentils in rich buttery gravy, a North Indian classic', isVeg: true, rating: 4.5, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80', category: 'Main Course' },
      { id: 'm4', name: 'Gulab Jamun', price: 80, description: 'Soft milk-solid dumplings soaked in rose-flavoured sugar syrup', isVeg: true, isPopular: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1527515637462-cff94ece14b5?w=400&q=80', category: 'Desserts' },
      { id: 'm5', name: 'Mango Lassi', price: 90, description: 'Chilled blend of yoghurt, fresh mango pulp & a hint of cardamom', isVeg: true, rating: 4.6, image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80', category: 'Drinks' },
      { id: 'm6', name: 'Chicken Biryani', price: 380, description: 'Aromatic basmati rice slow-cooked with marinated chicken & dum spices', isVeg: false, isPopular: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=400&q=80', category: 'Main Course' },
    ],
    reviews: [
      { id: 'r1', name: 'Priya Sharma', avatar: 'https://i.pravatar.cc/100?img=47', rating: 5, date: '2 days ago', text: 'Absolutely loved the food! The masala dosa was perfectly crispy and the sambar was divine. The ambience is very cosy and the staff was super friendly. Will definitely visit again!', images: ['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=200&q=70'], helpfulCount: 23 },
      { id: 'r2', name: 'Rahul Menon', avatar: 'https://i.pravatar.cc/100?img=12', rating: 4, date: '1 week ago', text: 'Great family restaurant with authentic South Indian flavours. The seating is comfortable and the food comes out pretty quickly. Slightly pricey but worth it for special occasions.', helpfulCount: 14 },
      { id: 'r3', name: 'Anita Krishnan', avatar: 'https://i.pravatar.cc/100?img=32', rating: 5, date: '2 weeks ago', text: 'We had a family gathering here and the 8-seater arrangement was perfect. The staff pre-arranged everything and even helped with special dietary needs. Excellent service!', helpfulCount: 31 },
      { id: 'r4', name: 'Karthik Sundaram', avatar: 'https://i.pravatar.cc/100?img=60', rating: 4, date: '1 month ago', text: 'The butter chicken and naan combo is outstanding. A little hard to find parking on weekends but the food makes up for it. Would recommend the family dining section.', helpfulCount: 8 },
    ],
    amenities: ['Parking', 'WiFi', 'Air Conditioning', 'Outdoor Seating', 'Family Friendly', 'Wheelchair Access', 'Card Payment', 'UPI Accepted'],
    lat: 13.0220, lng: 80.1925,
  },
  '2': {
    id: '2', name: 'BBQ Nation', cuisine: 'BBQ • Continental',
    rating: 4.7, reviewCount: 3812, distance: '2.4 km', travelTime: '12 min',
    avgCost: 1200, openingHours: '12:00 PM – 11:00 PM', isOpen: true,
    totalSeats: 120, bookedSeats: 97, availableSeats: 23,
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85',
    logo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
      'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    ],
    tags: ['Live BBQ', 'Buffet', 'Luxury', 'AC', 'Live Music'],
    description: 'BBQ Nation is a premium live grill dining experience where the barbeque comes to your table! Enjoy unlimited starters, live music, and an extensive buffet spread. Perfect for celebrations, corporate dinners, and family get-togethers.',
    address: '3rd Floor, Ampa Mall, Anna Nagar, Chennai - 600040',
    phone: '+91 99887 76655',
    seatCategories: [
      { type: '2 Seater', icon: '👫', total: 20, booked: 18, available: 2 },
      { type: '4 Seater', icon: '👨‍👩‍👧‍👦', total: 50, booked: 42, available: 8 },
      { type: '6 Seater', icon: '🎉', total: 30, booked: 24, available: 6 },
      { type: '8 Seater', icon: '🪑', total: 15, booked: 10, available: 5 },
      { type: '10+ Seater', icon: '🎊', total: 5, booked: 3, available: 2 },
    ],
    menu: [
      { id: 'm1', name: 'Chicken Tikka', price: 0, description: 'Unlimited | Marinated chicken grilled at your table', isVeg: false, isPopular: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80', category: 'Starters' },
      { id: 'm2', name: 'Paneer Tikka', price: 0, description: 'Unlimited | Cottage cheese with bell peppers and herbs', isVeg: true, isPopular: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80', category: 'Starters' },
      { id: 'm3', name: 'BBQ Buffet Spread', price: 799, description: 'All-inclusive unlimited buffet with live counters', isVeg: false, rating: 4.8, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=400&q=80', category: 'Main Course' },
      { id: 'm4', name: 'Signature Mocktails', price: 120, description: 'Fresh fruit mocktails — Virgin Mojito, Blue Lagoon, Sunset', isVeg: true, rating: 4.5, image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80', category: 'Drinks' },
    ],
    reviews: [
      { id: 'r1', name: 'Deepa Nair', avatar: 'https://i.pravatar.cc/100?img=25', rating: 5, date: '3 days ago', text: 'Best BBQ experience in Chennai! The starters are absolutely unlimited and the staff keeps replenishing without being asked. The ambience with live music is just perfect for a date night.', helpfulCount: 45 },
      { id: 'r2', name: 'Vijay Kumar', avatar: 'https://i.pravatar.cc/100?img=50', rating: 5, date: '1 week ago', text: 'Celebrated my anniversary here and it was wonderful. Pre-ordered a special dessert and the staff decorated our table beautifully. Will always choose BBQ Nation for celebrations!', helpfulCount: 22 },
    ],
    amenities: ['Parking', 'WiFi', 'Air Conditioning', 'Live Music', 'Card Payment', 'UPI Accepted', 'Private Dining', 'Family Friendly'],
    lat: 13.0857, lng: 80.2101,
  },
};

// Fallback for restaurants without detailed data
const getFallbackRestaurant = (id: string): RestaurantDetail => ({
  id, name: 'Restaurant', cuisine: 'Multi-Cuisine',
  rating: 4.3, reviewCount: 500, distance: '2 km', travelTime: '10 min',
  avgCost: 600, openingHours: '11:00 AM – 10:30 PM', isOpen: true,
  totalSeats: 60, bookedSeats: 35, availableSeats: 25,
  coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=85',
  logo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=80',
  gallery: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'],
  tags: ['Dining', 'AC', 'Parking'],
  description: 'A wonderful dining experience with a diverse menu and welcoming ambience. Loved by locals and visitors alike.',
  address: 'Chennai, Tamil Nadu',
  phone: '+91 98765 00000',
  seatCategories: [
    { type: '2 Seater', icon: '👫', total: 12, booked: 8, available: 4 },
    { type: '4 Seater', icon: '👨‍👩‍👧‍👦', total: 24, booked: 16, available: 8 },
    { type: '6 Seater', icon: '🎉', total: 12, booked: 8, available: 4 },
    { type: '8 Seater', icon: '🪑', total: 8, booked: 3, available: 5 },
    { type: '10+ Seater', icon: '🎊', total: 4, booked: 0, available: 4 },
  ],
  menu: [
    { id: 'm1', name: 'Chef Special', price: 350, description: 'Ask your waiter for today\'s chef recommendation', isVeg: false, isPopular: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80', category: 'Main Course' },
  ],
  reviews: [],
  amenities: ['WiFi', 'Air Conditioning', 'Card Payment', 'UPI Accepted'],
  lat: 13.0827, lng: 80.2707,
});

// ─── Amenity Icon Map ─────────────────────────────────────────────────────────

const AMENITY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'Parking': { icon: Car, color: 'text-blue-500', bg: 'bg-blue-50' },
  'WiFi': { icon: Wifi, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  'Air Conditioning': { icon: Wind, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  'Outdoor Seating': { icon: Coffee, color: 'text-amber-500', bg: 'bg-amber-50' },
  'Family Friendly': { icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
  'Live Music': { icon: Music, color: 'text-purple-500', bg: 'bg-purple-50' },
  'Wheelchair Access': { icon: Accessibility, color: 'text-orange-500', bg: 'bg-orange-50' },
  'Private Dining': { icon: Sparkles, color: 'text-rose-500', bg: 'bg-rose-50' },
  'Card Payment': { icon: CreditCard, color: 'text-gray-600', bg: 'bg-gray-100' },
  'UPI Accepted': { icon: Smartphone, color: 'text-green-600', bg: 'bg-green-50' },
};

const MENU_CATEGORIES = ['Starters', 'Main Course', 'Desserts', 'Drinks'];

// ─── Sub-components ───────────────────────────────────────────────────────────

const LiveDot: React.FC<{ label?: string }> = ({ label = 'Live' }) => (
  <span className="relative flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
    {label}
  </span>
);

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star key={s} size={size} className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
    ))}
  </div>
);

const SkeletonHero: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-72 md:h-96 bg-gray-200 w-full" />
    <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
      <div className="bg-white rounded-2xl p-6 shadow-soft">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Seat Category Card ────────────────────────────────────────────────────────

const SeatCategoryCard: React.FC<{ cat: SeatCategory; onBook: () => void; index: number }> = ({ cat, onBook, index }) => {
  const pct = cat.total > 0 ? (cat.booked / cat.total) * 100 : 0;
  const isFull = cat.available === 0;
  const urgency = cat.available <= 2 && cat.available > 0;

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{cat.icon}</span>
          <div>
            <div className="font-black text-gray-800 text-sm">{cat.type}</div>
            {cat.priceNote && <div className="text-[10px] text-gray-400">{cat.priceNote}</div>}
          </div>
        </div>
        <div className={`text-[11px] font-black px-2 py-0.5 rounded-full ${isFull ? 'bg-red-50 text-red-500' : urgency ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {isFull ? 'Full' : urgency ? `Only ${cat.available} left!` : `${cat.available} free`}
        </div>
      </div>

      {/* Seat count pills */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
          <div className="text-xs text-gray-400 mb-0.5">Total</div>
          <div className="font-black text-gray-700 text-sm">{cat.total}</div>
        </div>
        <div className="flex-1 bg-rose-50 rounded-xl p-2 text-center border border-rose-100">
          <div className="text-xs text-rose-400 mb-0.5">Booked</div>
          <div className="font-black text-rose-600 text-sm">{cat.booked}</div>
        </div>
        <div className="flex-1 bg-emerald-50 rounded-xl p-2 text-center border border-emerald-100">
          <div className="text-xs text-emerald-500 mb-0.5">Free</div>
          <div className="font-black text-emerald-600 text-sm">{cat.available}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isFull ? 'bg-red-400' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>{Math.round(pct)}% booked</span>
          <LiveDot label="Updated now" />
        </div>
      </div>

      {/* CTA */}
      {isFull ? (
        <button
          onClick={onBook}
          className="w-full py-2 min-h-0 text-xs font-black border-2 border-amber-400 text-amber-600 rounded-xl hover:bg-amber-50 transition"
        >
          Join Waitlist
        </button>
      ) : (
        <button
          onClick={onBook}
          className="w-full py-2 min-h-0 text-xs font-black bg-primary text-white rounded-xl hover:bg-secondary transition-all"
        >
          Book {cat.type}
        </button>
      )}
    </div>
  );
};

// ─── Gallery Section ───────────────────────────────────────────────────────────

const GallerySection: React.FC<{ images: string[]; restaurantName: string }> = ({ images, restaurantName }) => {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!images.length) return (
    <div className="flex flex-col items-center py-12 text-center">
      <Camera size={40} className="text-gray-200 mb-3" />
      <p className="text-gray-400 text-sm">No photos available yet</p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => setLightbox(i)}
          >
            <img src={img} alt={`${restaurantName} photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <Camera size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 min-h-0 min-w-0 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition">
            <X size={20} />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 min-h-0 min-w-0 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
            onClick={(e) => { e.stopPropagation(); setLightbox(i => i !== null && i > 0 ? i - 1 : images.length - 1); }}
          >
            <CLeft size={20} />
          </button>
          <img
            src={images[lightbox]}
            alt=""
            className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 min-h-0 min-w-0 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
            onClick={(e) => { e.stopPropagation(); setLightbox(i => i !== null && i < images.length - 1 ? i + 1 : 0); }}
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === lightbox ? 'bg-white w-4' : 'bg-white/40'}`} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ─── Menu Preview ──────────────────────────────────────────────────────────────

const MenuPreview: React.FC<{ items: MenuItem[] }> = ({ items }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', ...MENU_CATEGORIES.filter(c => items.some(i => i.category === c))];
  const filtered = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

  if (!items.length) return (
    <div className="flex flex-col items-center py-12 text-center">
      <Utensils size={40} className="text-gray-200 mb-3" />
      <p className="text-gray-400 text-sm">Menu not available yet</p>
    </div>
  );

  return (
    <div>
      {/* Notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5">
        <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 font-semibold leading-relaxed">
          Food can be pre-ordered after selecting your seat. This is a preview only.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all min-h-0 min-w-0 ${activeCategory === c ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {filtered.map(item => (
          <div key={item.id} className="flex items-center gap-4 bg-gray-50 rounded-2xl p-3 border border-gray-100 hover:bg-white hover:shadow-soft transition-all">
            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                </span>
                <span className="font-black text-gray-800 text-sm truncate">{item.name}</span>
                {item.isPopular && (
                  <span className="shrink-0 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Flame size={9} /> Popular
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-1">{item.description}</p>
              <div className="flex items-center gap-2 mt-1">
                {item.rating && (
                  <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                    <Star size={10} className="fill-amber-400 text-amber-400" /> {item.rating}
                  </span>
                )}
                <span className="text-[11px] text-gray-300">•</span>
                <span className="text-xs font-black text-gray-700">{item.price === 0 ? 'Unlimited' : `₹${item.price}`}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Review Card ──────────────────────────────────────────────────────────────

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const [helpful, setHelpful] = useState(false);
  return (
    <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-100" />
          <div>
            <div className="font-black text-gray-800 text-sm">{review.name}</div>
            <div className="text-[11px] text-gray-400">{review.date}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <span className="text-xs font-black text-amber-700">{review.rating}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-3">{review.text}</p>
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-3">
          {review.images.map((img, i) => (
            <img key={i} src={img} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
          ))}
        </div>
      )}
      <button
        onClick={() => setHelpful(p => !p)}
        className={`flex items-center gap-1.5 text-[11px] font-bold min-h-0 min-w-0 transition-colors ${helpful ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <ThumbsUp size={13} className={helpful ? 'fill-primary' : ''} />
        Helpful ({review.helpfulCount + (helpful ? 1 : 0)})
      </button>
    </div>
  );
};

// ─── Policy Card ──────────────────────────────────────────────────────────────

const POLICIES = [
  { title: 'Reservation Policy', desc: 'Tables are held for 15 minutes past the reservation time. Advance booking recommended on weekends.', icon: '📋' },
  { title: 'Cancellation Policy', desc: 'Free cancellation up to 1 hour before your reservation. Late cancellations may incur a fee.', icon: '❌' },
  { title: 'Children Policy', desc: 'All ages welcome. High chairs available on request. Children\'s menu available.', icon: '👶' },
  { title: 'Dress Code', desc: 'Smart casual attire is encouraged. Slippers and shorts not allowed during dinner hours.', icon: '👔' },
  { title: 'Outside Food', desc: 'Outside food and beverages are strictly not allowed. Birthday cakes with prior arrangement are permitted.', icon: '🎂' },
  { title: 'Pet Policy', desc: 'Pets are not allowed inside the restaurant. Service animals are always welcome.', icon: '🐾' },
];

// ─── Similar Restaurants data ─────────────────────────────────────────────────

const SIMILAR = [
  { id: '2', name: 'BBQ Nation', cuisine: 'BBQ • Continental', rating: 4.7, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80', available: 23, distance: '2.4 km' },
  { id: '3', name: 'The Spice House', cuisine: 'Mughlai • Biryani', rating: 4.3, image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80', available: 42, distance: '0.8 km' },
  { id: '4', name: 'A2B Adyar Ananda Bhavan', cuisine: 'South Indian', rating: 4.4, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', available: 28, distance: '1.8 km' },
  { id: '7', name: 'Starbucks Reserve', cuisine: 'Café • Beverages', rating: 4.5, image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400&q=80', available: 33, distance: '0.5 km' },
];

// ─── Section Wrapper ──────────────────────────────────────────────────────────

const Section: React.FC<{ id?: string; title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ id, title, children, action }) => (
  <section id={id} className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-black text-gray-900">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export const RestaurantDetailsPage: React.FC<{ restaurantId: string; onBack: () => void }> = ({ restaurantId, onBack }) => {
  const { navigate } = useNavigation();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [showAllPolicies, setShowAllPolicies] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Load restaurant data
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const data = RESTAURANT_DB[restaurantId] || getFallbackRestaurant(restaurantId);
      setRestaurant(data);
      setIsLoading(false);
    }, 900);
    return () => clearTimeout(timer);
  }, [restaurantId]);

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => setStickyVisible(window.scrollY > 350);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBook = useCallback(() => {
    navigate('dineout-booking', { restaurantId });
  }, [navigate, restaurantId]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: restaurant?.name, text: `Check out ${restaurant?.name} on JiffyKart DineOut!`, url: window.location.href });
      } catch {}
    }
  }, [restaurant]);

  const sortedReviews = restaurant ? [...restaurant.reviews].sort((a, b) => {
    if (reviewSort === 'highest') return b.rating - a.rating;
    if (reviewSort === 'lowest') return a.rating - b.rating;
    return 0;
  }) : [];

  if (isLoading) return <SkeletonHero />;
  if (!restaurant) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle size={48} className="text-gray-300" />
      <p className="text-gray-500 font-semibold">Restaurant not found</p>
      <button onClick={onBack} className="bg-primary text-white px-5 py-2 rounded-xl font-black min-h-0">Go Back</button>
    </div>
  );

  const bookedPct = restaurant.totalSeats > 0 ? (restaurant.bookedSeats / restaurant.totalSeats) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky Action Bar ── */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${stickyVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="bg-white border-b border-gray-100 shadow-soft px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 min-h-0 min-w-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition shrink-0">
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-black text-gray-900 text-sm truncate">{restaurant.name}</div>
            <div className="flex items-center gap-1 text-[11px]">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              <span className="font-bold text-gray-700">{restaurant.rating}</span>
              <span className="text-gray-400">({restaurant.reviewCount.toLocaleString()} reviews)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setLiked(p => !p)} className="w-9 h-9 min-h-0 min-w-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-rose-50 transition">
              <Heart size={16} className={liked ? 'fill-rose-500 text-rose-500' : 'text-gray-500'} />
            </button>
            <button onClick={handleShare} className="w-9 h-9 min-h-0 min-w-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-blue-50 transition">
              <Share2 size={15} className="text-gray-500" />
            </button>
            <button onClick={handleBook} className="bg-primary text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-secondary transition min-h-0">
              Book Table
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
           HERO BANNER
      ════════════════════════════════ */}
      <div ref={heroRef} className="relative">
        {/* Cover image */}
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img src={restaurant.coverImage} alt={restaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-4 left-4 w-10 h-10 min-h-0 min-w-0 rounded-full bg-black/30 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-black/50 transition"
          >
            <ChevronLeft size={20} />
          </button>
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => setLiked(p => !p)} className="w-10 h-10 min-h-0 min-w-0 rounded-full bg-black/30 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-black/50 transition">
              <Heart size={17} className={liked ? 'fill-rose-400 text-rose-400' : 'text-white'} />
            </button>
            <button onClick={handleShare} className="w-10 h-10 min-h-0 min-w-0 rounded-full bg-black/30 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-black/50 transition">
              <Share2 size={16} className="text-white" />
            </button>
          </div>
          {/* Status badge */}
          <div className="absolute bottom-4 left-4">
            <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${restaurant.isOpen ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-white'}`}>
              {restaurant.isOpen ? '🟢 Open Now' : '🔴 Closed'}
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className="max-w-6xl mx-auto px-4 -mt-12 md:-mt-16 relative z-10">
          <div className="bg-white rounded-3xl p-5 md:p-7 shadow-xl border border-gray-100 animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              {/* Logo */}
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-white shadow-soft shrink-0"
              />
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{restaurant.name}</h1>
                <p className="text-gray-500 text-sm mt-1">{restaurant.cuisine}</p>

                {/* Rating row */}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="font-black text-amber-700 text-sm">{restaurant.rating}</span>
                    <span className="text-amber-500 text-xs">({restaurant.reviewCount.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin size={14} className="text-primary" /> {restaurant.distance} · {restaurant.travelTime}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Tag size={14} className="text-primary" /> ₹{restaurant.avgCost} for two
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock size={14} className="text-primary" /> {restaurant.openingHours}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {restaurant.tags.map(t => (
                    <span key={t} className="text-[11px] font-bold bg-background text-primary border border-primary/15 px-3 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA block - desktop */}
              <div className="hidden md:flex flex-col gap-2 shrink-0">
                <button
                  onClick={handleBook}
                  disabled={!restaurant.isOpen}
                  className="bg-primary text-white font-black px-7 py-3 rounded-2xl hover:bg-secondary transition-all min-h-0 flex items-center gap-2 disabled:opacity-50 shadow-glow"
                >
                  <Utensils size={16} /> Book a Table
                </button>
                <div className="text-center">
                  <LiveDot label={`${restaurant.availableSeats} seats available`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
           MAIN CONTENT
      ════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-28 md:pb-10 space-y-5">

        {/* ── Live Seat Availability ── */}
        <Section id="availability" title="🪑 Live Seat Availability">
          {/* Overall stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total Seats', val: restaurant.totalSeats, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-100' },
              { label: 'Booked', val: restaurant.bookedSeats, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
              { label: 'Available', val: restaurant.availableSeats, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-3 md:p-4 text-center`}>
                <div className={`text-2xl md:text-3xl font-black ${s.color}`}>{s.val}</div>
                <div className="text-[11px] text-gray-500 font-semibold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Overall bar */}
          <div className="mb-2">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-400 to-emerald-400 rounded-full transition-all duration-700" style={{ width: '100%' }}>
                <div className="h-full bg-rose-400 rounded-l-full" style={{ width: `${bookedPct}%` }} />
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
              <span>{Math.round(bookedPct)}% booked</span>
              <LiveDot label="Updated just now" />
            </div>
          </div>

          {/* Seat category cards */}
          <h3 className="font-black text-gray-700 text-sm mt-5 mb-3 uppercase tracking-wider">By Seat Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {restaurant.seatCategories.map((cat, i) => (
              <SeatCategoryCard key={cat.type} cat={cat} onBook={handleBook} index={i} />
            ))}
          </div>
        </Section>

        {/* ── About ── */}
        <Section title="📖 About the Restaurant">
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{restaurant.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Phone, label: 'Contact', val: restaurant.phone },
              { icon: MapPin, label: 'Address', val: restaurant.address },
              { icon: Clock, label: 'Hours', val: restaurant.openingHours },
              { icon: Tag, label: 'Avg Cost', val: `₹${restaurant.avgCost} for two` },
            ].map(row => (
              <div key={row.label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <row.icon size={15} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{row.label}</div>
                  <div className="text-sm text-gray-700 font-semibold mt-0.5 leading-tight">{row.val}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Gallery ── */}
        <Section title="📸 Restaurant Gallery">
          <GallerySection images={restaurant.gallery} restaurantName={restaurant.name} />
        </Section>

        {/* ── Menu Preview ── */}
        <Section title="🍽️ Menu Preview">
          <MenuPreview items={restaurant.menu} />
        </Section>

        {/* ── Amenities ── */}
        <Section title="✨ Amenities & Features">
          {restaurant.amenities.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No amenity information available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {restaurant.amenities.map(a => {
                const config = AMENITY_CONFIG[a] || { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' };
                const Icon = config.icon;
                return (
                  <div key={a} className={`${config.bg} rounded-2xl p-3 flex flex-col items-center gap-2 text-center hover:scale-105 transition-transform duration-200`}>
                    <Icon size={22} className={config.color} />
                    <span className="text-[11px] font-black text-gray-700 leading-tight">{a}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* ── Policies ── */}
        <Section title="📋 Restaurant Policies">
          <div className="space-y-3">
            {(showAllPolicies ? POLICIES : POLICIES.slice(0, 3)).map(p => (
              <div key={p.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xl shrink-0">{p.icon}</span>
                <div>
                  <div className="font-black text-gray-800 text-sm">{p.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.desc}</div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowAllPolicies(p => !p)}
              className="flex items-center gap-1 text-primary font-bold text-sm hover:text-secondary transition min-h-0 min-w-0"
            >
              {showAllPolicies ? 'Show less' : 'View all policies'}
              <ChevronDown size={15} className={`transition-transform ${showAllPolicies ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </Section>

        {/* ── Reviews ── */}
        <Section
          title={`⭐ Customer Reviews (${restaurant.reviewCount.toLocaleString()})`}
          action={
            <select
              value={reviewSort}
              onChange={e => setReviewSort(e.target.value as any)}
              className="text-xs font-bold text-gray-600 bg-gray-100 border-0 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          }
        >
          {/* Rating summary */}
          <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 mb-5">
            <div className="text-center">
              <div className="text-5xl font-black text-amber-600">{restaurant.rating}</div>
              <StarRow rating={restaurant.rating} />
              <div className="text-[11px] text-gray-500 mt-1">{restaurant.reviewCount.toLocaleString()} reviews</div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map(s => {
                const approxPct = s === 5 ? 55 : s === 4 ? 28 : s === 3 ? 10 : s === 2 ? 5 : 2;
                return (
                  <div key={s} className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 w-2">{s}</span>
                    <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${approxPct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 w-6">{approxPct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {sortedReviews.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <MessageSquare size={40} className="text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedReviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          )}
        </Section>

        {/* ── Location ── */}
        <Section title="📍 Location & Directions">
          {/* Map placeholder */}
          <div className="relative h-52 md:h-64 rounded-2xl overflow-hidden bg-gray-100 mb-4 border border-gray-200">
            <iframe
              title="Restaurant Location"
              src={`https://maps.google.com/maps?q=${restaurant.lat},${restaurant.lng}&z=16&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Address</div>
              <div className="text-sm text-gray-700 font-semibold">{restaurant.address}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <Timer size={12} /> {restaurant.travelTime} away · {restaurant.distance}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:w-40">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-primary text-white text-xs font-black py-2.5 px-4 rounded-xl hover:bg-secondary transition min-h-0"
              >
                <Navigation2 size={14} /> Navigate
              </a>
              <a
                href={`tel:${restaurant.phone}`}
                className="flex items-center justify-center gap-2 border-2 border-primary text-primary text-xs font-black py-2.5 px-4 rounded-xl hover:bg-primary hover:text-white transition min-h-0"
              >
                <Phone size={14} /> Call Now
              </a>
            </div>
          </div>
        </Section>

        {/* ── Similar Restaurants ── */}
        <Section title="🍴 You May Also Like">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {SIMILAR.filter(s => s.id !== restaurantId).map(s => (
              <div
                key={s.id}
                className="shrink-0 w-52 cursor-pointer group"
                onClick={() => navigate('dineout-restaurant', { restaurantId: s.id })}
              >
                <div className="relative h-32 rounded-2xl overflow-hidden mb-2">
                  <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-full">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-black">{s.rating}</span>
                  </div>
                </div>
                <div className="font-black text-gray-800 text-sm truncate">{s.name}</div>
                <div className="text-[11px] text-gray-400 truncate">{s.cuisine}</div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-emerald-600 font-bold">{s.available} seats free</span>
                  <span className="text-gray-400">{s.distance}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

      </div>

      {/* ════════════════════════════════
           MOBILE STICKY BOOKING BAR
      ════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-black text-gray-900 text-sm truncate">{restaurant.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <LiveDot label={`${restaurant.availableSeats} seats available`} />
            </div>
          </div>
          <button
            onClick={handleBook}
            disabled={!restaurant.isOpen}
            className="shrink-0 bg-primary text-white font-black px-6 py-2.5 rounded-xl hover:bg-secondary transition min-h-0 disabled:opacity-50 text-sm"
          >
            Book Table
          </button>
        </div>
      </div>

    </div>
  );
};

export default RestaurantDetailsPage;
