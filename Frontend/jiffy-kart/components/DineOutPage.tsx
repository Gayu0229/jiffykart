import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigation } from '../hooks';
import { ApiService } from '../services/apiService';
import { Shop } from '../types';

import {
  Search, MapPin, Star, Clock, ChevronRight, Heart, Mic,
  TrendingUp, Zap, Award, Coffee, Utensils, ChevronLeft,
  SlidersHorizontal, ArrowRight, Users, Tag, Timer,
  CheckCircle, Bell, Wifi, Shield, X, ChevronDown, Filter,
  Calendar
} from 'lucide-react';

const mapShopToRestaurant = (shop: Shop): Restaurant => {
  return {
    id: shop.id,
    name: shop.name,
    cuisine: shop.tags.length > 0 ? shop.tags : ['South Indian'],
    cuisineLabel: shop.tags.length > 0 ? shop.tags.join(' • ') : 'South Indian',
    rating: shop.rating || 4.2,
    reviewCount: parseInt(shop.rating_count) || 0,
    distance: shop.distance || '2.0 km',
    travelTime: shop.delivery_time || '15 min',
    avgCost: shop.cost_for_two ? parseInt(shop.cost_for_two.replace(/[^0-9]/g, '')) || 400 : 400,
    openingHours: '11:00 AM – 11:00 PM',
    isOpen: shop.isOpen,
    totalSeats: 50,
    bookedSeats: 15,
    availableSeats: 35,
    image: shop.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    logo: shop.logo,
    tags: shop.tags.length > 0 ? shop.tags : ['Restaurant'],
    trending: true,
    featured: true,
    offer: shop.active_coupons && shop.active_coupons.length > 0 ? shop.active_coupons[0].description : undefined,
    area: shop.area || 'Koramangala',
    city: shop.city || 'Bengaluru',
  };
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  cuisineLabel: string;
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
  image: string;
  logo: string;
  tags: string[];
  trending?: boolean;
  featured?: boolean;
  offer?: string;
  area: string;
  city: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const RESTAURANTS: Restaurant[] = [
  {
    id: '1', name: 'Nazhirya Restaurant', cuisine: ['South Indian', 'North Indian'],
    cuisineLabel: 'South Indian • North Indian',
    rating: 4.5, reviewCount: 1243, distance: '1.2 km', travelTime: '8 min',
    avgCost: 450, openingHours: '11:00 AM – 11:00 PM', isOpen: true,
    totalSeats: 48, bookedSeats: 31, availableSeats: 17,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&q=80',
    tags: ['Family Dining', 'Veg Options'], trending: true, featured: true,
    offer: '20% OFF', area: 'Nesapakkam', city: 'Chennai',
  },
  {
    id: '2', name: 'BBQ Nation', cuisine: ['BBQ', 'Continental'],
    cuisineLabel: 'BBQ • Continental',
    rating: 4.7, reviewCount: 3812, distance: '2.4 km', travelTime: '12 min',
    avgCost: 1200, openingHours: '12:00 PM – 11:00 PM', isOpen: true,
    totalSeats: 120, bookedSeats: 97, availableSeats: 23,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&q=80',
    tags: ['Live BBQ', 'Buffet'], trending: true, featured: true,
    offer: 'Flat ₹500 OFF', area: 'Anna Nagar', city: 'Chennai',
  },
  {
    id: '3', name: 'The Spice House', cuisine: ['Mughlai', 'Biryani'],
    cuisineLabel: 'Mughlai • Biryani',
    rating: 4.3, reviewCount: 876, distance: '0.8 km', travelTime: '5 min',
    avgCost: 600, openingHours: '10:00 AM – 10:30 PM', isOpen: true,
    totalSeats: 60, bookedSeats: 18, availableSeats: 42,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=80',
    tags: ['Biryani Specialist', 'Non-Veg'], featured: true,
    offer: 'Free Dessert', area: 'T Nagar', city: 'Chennai',
  },
  {
    id: '4', name: 'A2B Adyar Ananda Bhavan', cuisine: ['South Indian', 'Sweets'],
    cuisineLabel: 'South Indian • Sweets',
    rating: 4.4, reviewCount: 2190, distance: '1.8 km', travelTime: '10 min',
    avgCost: 350, openingHours: '08:00 AM – 10:00 PM', isOpen: true,
    totalSeats: 80, bookedSeats: 52, availableSeats: 28,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&q=80',
    tags: ['Pure Veg', 'Family Friendly'],
    area: 'Adyar', city: 'Chennai',
  },
  {
    id: '5', name: 'Absolute Barbecue', cuisine: ['BBQ', 'American'],
    cuisineLabel: 'BBQ • American Grill',
    rating: 4.6, reviewCount: 2847, distance: '3.2 km', travelTime: '18 min',
    avgCost: 1500, openingHours: '12:00 PM – 11:30 PM', isOpen: true,
    totalSeats: 150, bookedSeats: 134, availableSeats: 16,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=100&q=80',
    tags: ['Unlimited BBQ', 'Premium'], trending: true,
    offer: 'Weekend Buffet', area: 'OMR', city: 'Chennai',
  },
  {
    id: '6', name: "Sultan's Biryani House", cuisine: ['Biryani', 'Arabian'],
    cuisineLabel: 'Biryani • Arabian',
    rating: 4.2, reviewCount: 1567, distance: '2.0 km', travelTime: '11 min',
    avgCost: 500, openingHours: '11:30 AM – 11:00 PM', isOpen: false,
    totalSeats: 70, bookedSeats: 0, availableSeats: 70,
    image: 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=100&q=80',
    tags: ['Biryani', 'Arabian Cuisine'],
    area: 'Kilpauk', city: 'Chennai',
  },
  {
    id: '7', name: 'Starbucks Reserve', cuisine: ['Cafe', 'Beverages'],
    cuisineLabel: 'Café • Beverages',
    rating: 4.5, reviewCount: 3241, distance: '0.5 km', travelTime: '3 min',
    avgCost: 700, openingHours: '07:00 AM – 11:00 PM', isOpen: true,
    totalSeats: 45, bookedSeats: 12, availableSeats: 33,
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=100&q=80',
    tags: ['Café', 'Work-Friendly', 'Rooftop'],
    offer: 'Member Exclusive', area: 'Nungambakkam', city: 'Chennai',
  },
  {
    id: '8', name: 'Empire Restaurant', cuisine: ['North Indian', 'Mughlai'],
    cuisineLabel: 'North Indian • Mughlai',
    rating: 4.1, reviewCount: 987, distance: '4.1 km', travelTime: '22 min',
    avgCost: 550, openingHours: '11:00 AM – 11:00 PM', isOpen: true,
    totalSeats: 90, bookedSeats: 43, availableSeats: 47,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1551183053-bf91798d792f?w=100&q=80',
    tags: ['Outdoor Seating', 'Live Music'],
    area: 'Egmore', city: 'Chennai',
  },
  {
    id: '9', name: 'Copper Kitchen', cuisine: ['Continental', 'Asian Fusion'],
    cuisineLabel: 'Continental • Asian Fusion',
    rating: 4.8, reviewCount: 1834, distance: '5.0 km', travelTime: '26 min',
    avgCost: 1800, openingHours: '12:00 PM – 11:00 PM', isOpen: true,
    totalSeats: 65, bookedSeats: 60, availableSeats: 5,
    image: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1484980972926-edee96e0960d?w=100&q=80',
    tags: ['Fine Dining', 'Rooftop', 'Luxury'], featured: true,
    offer: 'Member Exclusive', area: 'MRC Nagar', city: 'Chennai',
  },
  {
    id: '10', name: 'Nobi Jiffy Kitchen', cuisine: ['Fast Food', 'Healthy'],
    cuisineLabel: 'Fast Food • Healthy Bowl',
    rating: 4.0, reviewCount: 542, distance: '0.3 km', travelTime: '2 min',
    avgCost: 300, openingHours: '09:00 AM – 09:00 PM', isOpen: true,
    totalSeats: 30, bookedSeats: 8, availableSeats: 22,
    image: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=80',
    tags: ['Quick Bite', 'Healthy'],
    area: 'Nesapakkam', city: 'Chennai',
  },
];

const CUISINE_CATEGORIES = [
  { label: 'South Indian', emoji: '🍛', color: 'from-amber-400 to-orange-500' },
  { label: 'North Indian', emoji: '🫓', color: 'from-red-400 to-rose-600' },
  { label: 'Chinese', emoji: '🍜', color: 'from-yellow-400 to-amber-500' },
  { label: 'Italian', emoji: '🍕', color: 'from-green-400 to-emerald-600' },
  { label: 'Arabian', emoji: '🥙', color: 'from-purple-400 to-violet-600' },
  { label: 'BBQ', emoji: '🍖', color: 'from-orange-500 to-red-600' },
  { label: 'Café', emoji: '☕', color: 'from-brown-400 to-amber-700' },
  { label: 'Bakery', emoji: '🥐', color: 'from-yellow-300 to-amber-400' },
  { label: 'Biryani', emoji: '🍚', color: 'from-amber-500 to-yellow-600' },
  { label: 'Fast Food', emoji: '🍔', color: 'from-red-500 to-orange-500' },
  { label: 'Desserts', emoji: '🍰', color: 'from-pink-400 to-rose-500' },
  { label: 'Healthy', emoji: '🥗', color: 'from-green-400 to-teal-500' },
];

const FILTER_CHIPS = ['All', 'Nearby', 'Top Rated', 'Trending', 'Open Now', 'Veg', 'Non Veg', 'Family Dining', 'Café', 'Fine Dining', 'Buffet', 'Rooftop', 'Outdoor', 'Luxury'];

const OFFERS = [
  { label: '20% OFF', sub: 'On your first booking', color: 'from-orange-500 to-red-500', emoji: '🔥', code: 'FIRST20' },
  { label: 'Flat ₹500 OFF', sub: 'Min order ₹1500', color: 'from-purple-500 to-violet-600', emoji: '💜', code: 'SAVE500' },
  { label: 'Free Dessert', sub: 'On dining for 2+', color: 'from-pink-500 to-rose-600', emoji: '🍰', code: 'SWEET2' },
  { label: 'Weekend Buffet', sub: '₹799 all inclusive', color: 'from-amber-500 to-orange-600', emoji: '🍽️', code: 'WKND799' },
  { label: 'Member Exclusive', sub: 'JiffyKart Plus only', color: 'from-indigo-500 to-blue-600', emoji: '⭐', code: 'JKPLUS' },
];

const WHY_DINEOUT = [
  { icon: Wifi, title: 'Real-Time Availability', desc: 'See live seat counts updated every minute', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Zap, title: 'Instant Booking', desc: 'Reserve your table in under 10 seconds', color: 'text-amber-500', bg: 'bg-amber-50' },
  { icon: Utensils, title: 'Pre-Order Food', desc: 'Order your meal before you arrive', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: Shield, title: 'Verified Restaurants', desc: 'All restaurants are quality-verified', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Bell, title: 'Live Notifications', desc: 'Get alerts for your booking status', color: 'text-rose-500', bg: 'bg-rose-50' },
  { icon: CheckCircle, title: 'No Hidden Charges', desc: 'What you see is what you pay', color: 'text-teal-500', bg: 'bg-teal-50' },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

const AvailabilityBar: React.FC<{ total: number; booked: number; available: number }> = ({ total, booked, available }) => {
  const bookedPct = total > 0 ? (booked / total) * 100 : 0;
  const availPct = total > 0 ? (available / total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 gap-0.5">
        <div
          className="bg-rose-400 rounded-full transition-all duration-700"
          style={{ width: `${bookedPct}%` }}
        />
        <div
          className="bg-emerald-400 rounded-full transition-all duration-700"
          style={{ width: `${availPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-semibold">
        <span className="flex items-center gap-1 text-rose-500">
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
          {booked} Booked
        </span>
        <span className="text-gray-400 font-normal">{total} total</span>
        <span className="flex items-center gap-1 text-emerald-600">
          {available} Avail
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        </span>
      </div>
    </div>
  );
};

const LiveDot: React.FC = () => (
  <span className="relative flex items-center gap-1 text-[10px] font-bold text-emerald-600">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
    Live
  </span>
);

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-soft animate-pulse">
    <div className="h-44 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="h-2 bg-gray-100 rounded w-full" />
      <div className="flex gap-2 pt-1">
        <div className="h-8 bg-gray-100 rounded-lg flex-1" />
        <div className="h-8 bg-gray-100 rounded-lg flex-1" />
      </div>
    </div>
  </div>
);

// ─── Restaurant Card ──────────────────────────────────────────────────────────

interface CardProps {
  r: Restaurant;
  onNavigate: (id: string) => void;
  index?: number;
}

const RestaurantCard: React.FC<CardProps> = ({ r, onNavigate, index = 0 }) => {
  const [liked, setLiked] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const animDelay = `${index * 60}ms`;

  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-in flex flex-col"
      style={{ animationDelay: animDelay }}
      onClick={() => onNavigate(r.id)}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={imgErr ? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80' : r.image}
          alt={r.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgErr(true)}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex gap-2">
          {r.isOpen ? (
            <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
              Open Now
            </span>
          ) : (
            <span className="bg-gray-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Closed
            </span>
          )}
          {r.trending && (
            <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={10} /> Trending
            </span>
          )}
        </div>

        {/* Offer badge top-right */}
        {r.offer && (
          <div className="absolute top-3 right-10 bg-white/90 backdrop-blur text-primary text-[10px] font-black px-2 py-0.5 rounded-full shadow">
            {r.offer}
          </div>
        )}

        {/* Heart */}
        <button
          className="absolute top-2 right-2 w-8 h-8 min-w-0 min-h-0 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow transition-all hover:scale-110"
          onClick={(e) => { e.stopPropagation(); setLiked(p => !p); }}
        >
          <Heart size={14} className={liked ? 'fill-rose-500 text-rose-500' : 'text-gray-500'} />
        </button>

        {/* Rating bottom-left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <span className="text-xs font-black text-gray-800">{r.rating}</span>
          <span className="text-[10px] text-gray-500">({r.reviewCount.toLocaleString()})</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Name + logo row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-gray-900 text-[15px] leading-tight truncate">{r.name}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{r.cuisineLabel}</p>
          </div>
          <img
            src={r.logo}
            alt=""
            className="w-9 h-9 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-primary" /> {r.distance}
          </span>
          <span className="flex items-center gap-1">
            <Timer size={11} className="text-primary" /> {r.travelTime}
          </span>
          <span className="flex items-center gap-1">
            <Tag size={11} className="text-primary" /> ₹{r.avgCost} for 2
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {r.tags.slice(0, 2).map(t => (
            <span key={t} className="text-[10px] bg-background text-primary px-2 py-0.5 rounded-full font-semibold border border-primary/10">
              {t}
            </span>
          ))}
        </div>

        {/* Seat availability */}
        {r.isOpen && (
          <div className="mt-1 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider flex items-center gap-1">
                🪑 Seat Availability
              </span>
              <LiveDot />
            </div>
            <AvailabilityBar total={r.totalSeats} booked={r.bookedSeats} available={r.availableSeats} />
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            className="flex-1 py-2 min-h-0 text-[12px] font-black border-2 border-primary text-primary rounded-xl hover:bg-primary hover:text-white transition-all duration-200"
            onClick={(e) => { e.stopPropagation(); onNavigate(r.id); }}
          >
            View Details
          </button>
          <button
            className="flex-1 py-2 min-h-0 text-[12px] font-black bg-primary text-white rounded-xl hover:bg-secondary transition-all duration-200 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!r.isOpen || r.availableSeats === 0}
            onClick={(e) => { e.stopPropagation(); onNavigate(r.id); }}
          >
            Book Table
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Carousel Card (compact horizontal) ──────────────────────────────────────

const CarouselCard: React.FC<CardProps> = ({ r, onNavigate }) => {
  const [liked, setLiked] = useState(false);

  return (
    <div
      className="group shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={() => onNavigate(r.id)}
    >
      <div className="relative h-40 overflow-hidden">
        <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {r.isOpen ? (
          <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Open</span>
        ) : (
          <span className="absolute top-3 left-3 bg-gray-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Closed</span>
        )}
        {r.offer && (
          <span className="absolute top-3 right-9 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{r.offer}</span>
        )}
        <button
          className="absolute top-2 right-2 w-7 h-7 min-w-0 min-h-0 rounded-full bg-white/90 backdrop-blur flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); setLiked(p => !p); }}
        >
          <Heart size={12} className={liked ? 'fill-rose-500 text-rose-500' : 'text-gray-400'} />
        </button>
        <div className="absolute bottom-2 left-3 flex items-center gap-1 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-full">
          <Star size={10} className="fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-black text-gray-800">{r.rating}</span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-black text-gray-900 text-sm truncate">{r.name}</h3>
        <p className="text-[11px] text-gray-400 truncate">{r.cuisineLabel}</p>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
          <span><MapPin size={10} className="inline text-primary mr-0.5" />{r.distance}</span>
          <span><Tag size={10} className="inline text-primary mr-0.5" />₹{r.avgCost} for 2</span>
        </div>
        {r.isOpen && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px]">
            <span className="text-emerald-600 font-bold">{r.availableSeats} seats free</span>
            <LiveDot />
          </div>
        )}
        <button
          className="mt-2 w-full py-1.5 min-h-0 text-[11px] font-black bg-primary text-white rounded-xl hover:bg-secondary transition-all disabled:opacity-40"
          disabled={!r.isOpen}
          onClick={(e) => { e.stopPropagation(); onNavigate(r.id); }}
        >
          Book Table
        </button>
      </div>
    </div>
  );
};

// ─── Horizontal Carousel Shell ────────────────────────────────────────────────

const HCarousel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'l' | 'r') => {
    if (ref.current) ref.current.scrollBy({ left: dir === 'r' ? 300 : -300, behavior: 'smooth' });
  };
  return (
    <div className="relative">
      <button
        onClick={() => scroll('l')}
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 min-h-0 min-w-0 rounded-full bg-white shadow-soft border border-gray-100 items-center justify-center hover:bg-gray-50 transition"
      >
        <ChevronLeft size={18} className="text-gray-600" />
      </button>
      <div ref={ref} className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
        {children}
      </div>
      <button
        onClick={() => scroll('r')}
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 min-h-0 min-w-0 rounded-full bg-white shadow-soft border border-gray-100 items-center justify-center hover:bg-gray-50 transition"
      >
        <ChevronRight size={18} className="text-gray-600" />
      </button>
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; subtitle?: string; onSeeAll?: () => void }> = ({ title, subtitle, onSeeAll }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {onSeeAll && (
      <button onClick={onSeeAll} className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all min-h-0 min-w-0">
        See All <ArrowRight size={15} />
      </button>
    )}
  </div>
);

// ─── Stat Counter (animated count-up) ────────────────────────────────────────

const CountUp: React.FC<{ target: number; suffix?: string }> = ({ target, suffix = '' }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [target]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const DineOutPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { navigate, city } = useNavigation();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stickySearch, setStickySearch] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(RESTAURANTS);
  const heroRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load real restaurants from backend
  useEffect(() => {
    //   setIsLoading(true);
    // ApiService.getShops({ category: 'Food' })
    //   .then(fetchedShops => {
    //     const mapped = fetchedShops.map(mapShopToRestaurant);
    //     setRestaurants(prev => {
    //       const ids = new Set(mapped.map(m => m.id));
    //       const uniquePrev = prev.filter(p => !ids.has(p.id));
    //       return [...mapped, ...uniquePrev];
    //     });
    //   })
    //   .catch(err => console.error("Failed to load dynamic shops for DineOut", err))
    //   .finally(() => setIsLoading(false));


    // Commented out to prevent ERR_CONNECTION_REFUSED since there is no backend code implemented for Dineout yet.
    // setIsLoading(true);
    // ApiService.getShops({ category: 'Food' })
    //   .then(fetchedShops => {
    //     const mapped = fetchedShops.map(mapShopToRestaurant);
    //     setRestaurants(prev => {
    //       const ids = new Set(mapped.map(m => m.id));
    //       const uniquePrev = prev.filter(p => !ids.has(p.id));
    //       return [...mapped, ...uniquePrev];
    //     });
    //   })
    //   .catch(err => console.error("Failed to load dynamic shops for DineOut", err))
    //   .finally(() => setIsLoading(false));
    setIsLoading(false);
  }, []);

  // Sticky search on scroll
  useEffect(() => {
    const handleScroll = () => setStickySearch(window.scrollY > 320);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigateToRestaurant = useCallback((id: string) => {
    navigate('dineout-restaurant', { restaurantId: id });
  }, [navigate]);

  // Filtered restaurants
  const filteredRestaurants = restaurants.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.cuisineLabel.toLowerCase().includes(q) || r.area.toLowerCase().includes(q);
    const matchCuisine = !activeCuisine || r.cuisine.some(c => c.toLowerCase().includes(activeCuisine.toLowerCase())) || r.cuisineLabel.toLowerCase().includes(activeCuisine.toLowerCase());
    let matchFilter = true;
    if (activeFilter === 'Nearby') matchFilter = parseFloat(r.distance) < 2;
    else if (activeFilter === 'Top Rated') matchFilter = r.rating >= 4.4;
    else if (activeFilter === 'Trending') matchFilter = !!r.trending;
    else if (activeFilter === 'Open Now') matchFilter = r.isOpen;
    else if (activeFilter === 'Veg') matchFilter = r.tags.some(t => t.toLowerCase().includes('veg'));
    else if (activeFilter === 'Non Veg') matchFilter = r.tags.some(t => t.toLowerCase().includes('non-veg'));
    else if (['Family Dining', 'Café', 'Fine Dining', 'Buffet', 'Rooftop', 'Outdoor', 'Luxury'].includes(activeFilter)) {
      matchFilter = r.tags.some(t => t.toLowerCase().includes(activeFilter.toLowerCase()));
    }
    return matchSearch && matchCuisine && matchFilter;
  });

  const featuredRestaurants = restaurants.filter(r => r.featured);
  const trendingRestaurants = restaurants.filter(r => r.trending && r.isOpen);
  const nearbyRestaurants = restaurants.filter(r => parseFloat(r.distance) < 2).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  const totalSeats = restaurants.reduce((s, r) => s + r.totalSeats, 0);
  const totalBooked = restaurants.reduce((s, r) => s + r.bookedSeats, 0);
  const totalAvail = restaurants.reduce((s, r) => s + r.availableSeats, 0);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky Search Bar (appears after hero scrolls away) ── */}
      <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${stickySearch ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="bg-white border-b border-gray-100 shadow-soft px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search restaurants, cuisines or dishes..."
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
            {search && <button onClick={() => setSearch('')} className="min-h-0 min-w-0 w-6 h-6 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
            <button className="min-h-0 min-w-0 w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition">
              <Mic size={14} className="text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════ */}
      <div ref={heroRef} className="relative min-h-[480px] md:min-h-[560px] overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80"
            alt="Restaurant"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/90 via-primary/80 to-secondary/70" />
          {/* Animated blobs */}
          <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-highlight/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* DineOut badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 animate-fade-in">
              <span className="text-lg">🍽️</span>
              <span className="text-white font-black text-sm uppercase tracking-widest">DiniBee</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-bold">{restaurants.filter(r => r.isOpen).length} Open Now</span>
            </div>
            {/* Dashboard Link */}
            <button
              onClick={() => navigate('dineout-dashboard')}
              className="bg-white hover:bg-slate-50 text-primary font-black text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transition-all min-h-0 min-w-0"
            >
              <Calendar size={13} />
              My Bookings
            </button>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            Reserve Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
              Perfect Dining Experience
            </span>
          </h1>

          <p className="text-white/75 text-sm md:text-base max-w-xl mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
            Discover top-rated restaurants, check live seat availability, and reserve your table instantly near {city || 'Chennai'}.
          </p>

          {/* Search Bar */}
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 shadow-xl max-w-2xl">
              <Search size={20} className="text-primary shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search restaurants, cuisines or dishes..."
                className="flex-1 text-gray-700 text-sm md:text-base outline-none placeholder:text-gray-400 bg-transparent"
              />
              {search && (
                <button onClick={() => setSearch('')} className="min-h-0 min-w-0 w-7 h-7 text-gray-400 hover:text-gray-600 transition">
                  <X size={16} />
                </button>
              )}
              <div className="w-px h-6 bg-gray-200" />
              <button className="min-h-0 min-w-0 w-8 h-8 flex items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 transition">
                <Mic size={16} className="text-primary" />
              </button>
              <button
                onClick={() => { if (searchRef.current) searchRef.current.blur(); }}
                className="hidden md:flex items-center gap-2 bg-primary text-white font-black text-sm px-5 py-2 rounded-xl hover:bg-secondary transition min-h-0"
              >
                <Search size={15} /> Search
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 md:gap-6 mt-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
            {[
              { val: restaurants.length, label: 'Restaurants', suffix: '+' },
              { val: totalAvail, label: 'Seats Available', suffix: '' },
              { val: restaurants.filter(r => r.isOpen).length, label: 'Open Now', suffix: '' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="text-xl font-black text-white">
                  <CountUp target={s.val} suffix={s.suffix} />
                </div>
                <div className="text-white/60 text-xs font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z" fill="#F9FAFB" />
          </svg>
        </div>
      </div>

      {/* ════════════════════════════════════════
          FILTER CHIPS
      ════════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button className="shrink-0 flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 font-bold text-xs px-3 py-2 rounded-xl shadow-sm hover:border-primary hover:text-primary transition min-h-0 min-w-0">
            <SlidersHorizontal size={13} /> Filters
          </button>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {FILTER_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => { setActiveFilter(chip); setActiveCuisine(null); }}
                className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all min-h-0 min-w-0 ${activeFilter === chip
                  ? 'bg-primary text-white shadow-glow'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 pb-16 space-y-12">

        {/* ── Live Stats Banner ── */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {[
            { label: 'Total Seats', val: totalSeats, color: 'text-gray-800', bg: 'bg-white', icon: '🪑' },
            { label: 'Booked', val: totalBooked, color: 'text-rose-600', bg: 'bg-rose-50', icon: '📌' },
            { label: 'Available', val: totalAvail, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✅' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 md:p-5 text-center shadow-soft border border-gray-100 animate-fade-in`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl md:text-3xl font-black ${s.color}`}>
                <CountUp target={s.val} />
              </div>
              <div className="text-xs text-gray-500 font-semibold mt-0.5">{s.label}</div>
              <div className="flex justify-center mt-1"><LiveDot /></div>
            </div>
          ))}
        </div>

        {/* ── Cuisine Categories ── */}
        <section>
          <SectionHeader title="Browse by Cuisine" subtitle="Find your favourite flavours" />
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
            {CUISINE_CATEGORIES.map(c => (
              <button
                key={c.label}
                onClick={() => setActiveCuisine(activeCuisine === c.label ? null : c.label)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all hover:scale-105 border min-h-0 min-w-0 ${activeCuisine === c.label ? 'border-primary bg-primary/5 shadow-glow' : 'bg-white border-gray-100 hover:border-primary/30 shadow-soft'}`}
              >
                <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-lg shadow-sm`}>
                  {c.emoji}
                </span>
                <span className="text-[10px] font-black text-gray-700 text-center leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Featured Restaurants (Carousel) ── */}
        <section>
          <SectionHeader title="✨ Featured Restaurants" subtitle="Handpicked premium dining experiences" />
          <HCarousel>
            {isLoading
              ? Array(4).fill(0).map((_, i) => <div key={i} className="shrink-0 w-72"><SkeletonCard /></div>)
              : featuredRestaurants.map(r => <CarouselCard key={r.id} r={r} onNavigate={handleNavigateToRestaurant} />)
            }
          </HCarousel>
        </section>

        {/* ── Offers ── */}
        <section>
          <SectionHeader title="🔥 Exclusive Offers" subtitle="Limited time deals just for you" />
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {OFFERS.map(o => (
              <div key={o.code} className={`shrink-0 w-56 bg-gradient-to-br ${o.color} rounded-2xl p-4 text-white shadow-lg hover:scale-105 transition-transform duration-200 cursor-pointer`}>
                <div className="text-3xl mb-2">{o.emoji}</div>
                <div className="font-black text-lg leading-tight">{o.label}</div>
                <div className="text-white/80 text-xs mt-1">{o.sub}</div>
                <div className="mt-3 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-black tracking-widest inline-block">
                  {o.code}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trending ── */}
        {trendingRestaurants.length > 0 && (
          <section>
            <SectionHeader title="🔥 Trending Now" subtitle="Most booked restaurants today" />
            <HCarousel>
              {trendingRestaurants.map(r => <CarouselCard key={r.id} r={r} onNavigate={handleNavigateToRestaurant} />)}
            </HCarousel>
          </section>
        )}

        {/* ── Nearby ── */}
        {nearbyRestaurants.length > 0 && (
          <section>
            <SectionHeader title="📍 Closest to You" subtitle="Walk-in friendly restaurants nearby" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {nearbyRestaurants.slice(0, 3).map((r, i) => (
                <RestaurantCard key={r.id} r={r} onNavigate={handleNavigateToRestaurant} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ── All / Filtered Restaurants ── */}
        <section id="all-restaurants">
          <SectionHeader
            title={activeFilter === 'All' && !activeCuisine && !search
              ? '🏆 All Restaurants'
              : `Showing Results${activeCuisine ? ` · ${activeCuisine}` : ''}${search ? ` · "${search}"` : ''}`}
            subtitle={`${filteredRestaurants.length} restaurant${filteredRestaurants.length !== 1 ? 's' : ''} found in ${city || 'Chennai'}`}
          />

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="text-7xl mb-4">🍽️</div>
              <h3 className="text-xl font-black text-gray-800 mb-2">No Restaurants Found</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-xs">
                We couldn't find any restaurants matching your filters. Try resetting or broadening your search.
              </p>
              <button
                onClick={() => { setSearch(''); setActiveFilter('All'); setActiveCuisine(null); }}
                className="bg-primary text-white font-black px-6 py-2.5 rounded-xl hover:bg-secondary transition min-h-0"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredRestaurants.map((r, i) => (
                <RestaurantCard key={r.id} r={r} onNavigate={handleNavigateToRestaurant} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* ── Why Choose DineOut ── */}
        <section className="bg-white rounded-3xl p-6 md:p-10 shadow-soft border border-gray-100">
          <SectionHeader title="Why Choose DiniBee?" subtitle="Everything you need for a perfect dining experience" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {WHY_DINEOUT.map(w => (
              <div key={w.title} className={`flex gap-3 items-start p-4 rounded-2xl ${w.bg} hover:scale-[1.02] transition-transform duration-200`}>
                <div className={`w-10 h-10 rounded-xl ${w.bg} border border-white flex items-center justify-center shrink-0 shadow-sm`}>
                  <w.icon size={18} className={w.color} />
                </div>
                <div>
                  <div className="font-black text-gray-800 text-sm leading-tight">{w.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-snug">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default DineOutPage;
