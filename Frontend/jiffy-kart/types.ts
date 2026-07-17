export interface City {
  id: string;
  name: string;
  isFeatured: boolean;
  deliveryEstimation: string;
  isCodAvailable: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Offer {
  code: string;
  description: string;
  subDescription?: string;
}

export interface Review {
  id: string;
  user: string;
  userId?: number;
  rating: number;
  comment: string;
  date: string;
  title?: string;
  images?: string[];
  videoUrl?: string;
  criteriaRatings?: Record<string, number>;
  isVerified?: boolean;
  helpfulCount?: number;
  pros?: string[];
  cons?: string[];
}

export interface ReviewSummary {
  totalReviews: number;
  ratingCounts: Record<number, number>;
  criteriaAverages: Record<string, number>;
}

export interface Shop {
  id: string;
  name: string;
  rating: number;
  rating_count: string;
  delivery_time: string;
  cost_for_two: string;
  image: string;
  logo?: string;
  banner_url?: string;
  tags: string[];
  distance: string;
  location: string;
  city?: string;
  area?: string;
  category: string;
  offers: Offer[];
  active_coupons?: { id: string; code: string; discountType: string; value: number; description: string }[];
  shop_type: 'Official' | 'Reseller';
  isOpen: boolean;
  approvalStatus?: string;
  kycStatus?: string;
  vendorType?: 'ECOMMERCE' | 'FOOD' | 'STREET_HUB';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  description: string;
  image: string;
  images?: string[];
  category: string;
  rating: number;
  votes: number;
  is_best_seller?: boolean;
  warranty_period?: string;
  warranty_type?: 'Manufacturer' | 'Seller' | 'Brand';
  shop_id?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  priceAtOrder: number;
}

export interface CartItem {
  id?: string; // Database ID for the cart line item
  product: Product;
  quantity: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface Order {
  id: string;
  shop_id: string;
  shop_name: string;
  shop_image: string;
  shop_location: string;
  items: OrderItem[];
  total: number;
  date: string;
  status: 'Order Received' | 'Order Confirmed' | 'Packed & Ready' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  orderStatus?: string;
  returnRequest?: {
    id: number;
    status: string;
    reason: string;
    type: string;
    rejectionReason?: string;
    createdAt: string;
  };
}

export interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  address_line1: string;
  address_line2: string;
  is_default?: boolean;
}

export interface PaymentMethod {
  id: string;
  user_id?: string;
  type: 'Card' | 'UPI' | 'Wallet';
  provider: string;
  last4?: string;
  upi_id?: string;
  expiry?: string;
  is_default?: boolean;
}

export interface Banner {
  id: string | number;
  title: string;
  subtitle?: string;
  imageDesktopUrl: string;
  imageMobileUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  position: 'Home' | 'Street' | 'Category' | 'Shop' | 'Inline' | 'Tracking';
  isActive: boolean;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface Wallet {
  balance: number;
  user_id: string;
  transactions: Transaction[];
}

export interface TicketMessage {
  id: number;
  senderRole: 'USER' | 'VENDOR' | 'ADMIN';
  senderId: number;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: number;
  ticketId: string;
  createdByRole: 'USER' | 'VENDOR' | 'ADMIN';
  createdById: number;
  subject: string;
  category: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  orderId?: number;
  adminResponse?: string;
  resolutionReason?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}