
export enum View {
  DASHBOARD = 'DASHBOARD',
  ORDERS = 'ORDERS',
  NEW_ORDERS = 'NEW_ORDERS',
  ORDER_DETAILS = 'ORDER_DETAILS',
  PRODUCTS = 'PRODUCTS',
  ANALYTICS = 'ANALYTICS',
  CUSTOMERS = 'CUSTOMERS',
  PAYMENTS = 'PAYMENTS',
  DISCOUNTS = 'DISCOUNTS',
  SHOP_LOCATION = 'SHOP_LOCATION',
  SETTINGS = 'SETTINGS',
  SUPPORT = 'SUPPORT',
  AI_ASSISTANT = 'AI_ASSISTANT',
  RETURNS = 'RETURNS'
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: UserProfile;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
}

export interface Order {
  id: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId: string;
  address: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  paymentProvider: string;
  transactionId?: string;
  orderStatus: 'ORDER_PLACED' | 'ORDER_RECEIVED' | 'ORDER_CONFIRMED' | 'PACKED_READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'REJECTED' | 'CANCELLED' | 'Pending';
  itemsCount: number;
  totalPrice: number;
  customerAvatar?: string;
  trackingNumber?: string;
  carrier?: string;
  items?: OrderItem[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export interface TicketMessage {
  id: number;
  senderRole: 'USER' | 'VENDOR' | 'ADMIN';
  senderId: number;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface Ticket {
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
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
  unreadByVendor?: boolean;
}

export interface Wallet {
  balance: number;
  pending: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'Credit' | 'Payout';
  amount: number;
  date: string;
  status: 'Completed' | 'Processing' | 'Failed';
}

export interface VendorProfile {
  shopName: string;
  businessType: string;
  category: string;
  gstNumber: string;
  businessAddress: string;
  city: string;
  state: string;
  area: string;
  bannerUrl?: string;
  logoUrl?: string;
  status: string;
  email?: string;
  phone?: string;
  pincode?: string;
  deliveryTime?: string;
  costForTwo?: string;
}

export interface Shop {
  id: string;
  name: string;
  status: 'Open' | 'Closed' | 'Under Review';
  rating: number;
  location: string;
  area?: string;
  joinedDate: string;
}

export interface ReturnRequest {
  id: number;
  orderId: number;
  userId: number;
  vendorId: number;
  productId: number;
  reason: string;
  details: string;
  type: 'RETURN' | 'REPLACEMENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  images: string[];
  createdAt: string;
  updatedAt: string;
}
