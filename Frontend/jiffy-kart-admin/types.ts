
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeVendors: number;
  activeProducts: number;
  pendingVendors: number;
  pendingProducts: number;
  ordersProcessing: number;
  supportTickets: number;
  totalCustomers: number;
  totalDeliveryPartners: number;
}

export interface SalesDataPoint {
  name: string;
  orders: number;
  revenue: number;
  [key: string]: any;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

export interface Vendor {
  id: string;
  name: string;
  orders: number;
  rating: number;
  deliverySuccess: number;
  avatarUrl: string;
}

export interface VendorFull {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  productsLive: number;
  ordersHandled: number;
  rating: number;
  status: 'Active' | 'Inactive' | 'Blocked';
  avatarUrl: string;
  bannerUrl: string;
  address: string;
  pincode: string; // Added for territory filtering
  businessType: string;
  joinedDate: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountName: string;
  };
  totalRevenue: number;
  franchiseId?: string;
  franchiseName?: string;
}

export interface PendingVendor {
  id: string;
  vendorName: string;
  businessType: string;
  kycDocuments: string[];
  submittedDate: string;
  status: 'Pending Review';
}

export interface TrafficSource {
  source: string;
  value: number;
  color: string;
  [key: string]: any;
}

export enum TimeRange {
  WEEK = '7 days',
  MONTH = '30 days',
  QUARTER = '90 days'
}

// --- Order Management Types ---

export interface Order {
  id: string;
  customerName: string;
  vendorName: string;
  totalAmount: number;
  paymentMode: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  orderDate: string;
  franchiseId?: string;
  franchiseName?: string;
  pincode: string; // Delivery pincode for filtering
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  variant?: string; // e.g., "Size: M, Color: Blue"
}

export interface OrderLog {
  status: string;
  timestamp: string;
  description: string;
  icon?: string;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  billingAddress: string;
  vendorId: string;
  deliveryPartner?: string;
  trackingId?: string;
  paymentStatus: 'Paid' | 'Unpaid' | 'Refunded';
  subtotal: number;
  tax: number;
  deliveryFee: number;
  logs: OrderLog[];
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
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Delivery Management Types ---

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  zone: string;
  pincode: string; // Added for territory filtering
  status: 'Available' | 'Busy' | 'Offline';
  activeOrders: number;
  completedDeliveries: number;
  rating: number;
  avatarUrl: string;
  franchiseId?: string;
  franchiseName?: string;
  walletBalance: number;
}

export interface ActiveDelivery {
  id: string;
  orderId: string;
  partnerName: string;
  customerName: string;
  address: string;
  status: 'On Time' | 'Delayed' | 'Arriving Soon';
  location: { x: number; y: number }; // Percentages for mock map
  eta: string;
}

// --- Payment & Finance Types ---

export interface Payout {
  id: string;
  vendorName: string;
  vendorId: string;
  totalEarnings: number;
  commissionDeducted: number;
  netPayout: number;
  status: 'Paid' | 'Pending' | 'Processing' | 'Failed';
  payoutDate: string;
}

export interface VendorPaymentProfile {
  vendorId: string;
  vendorName: string; // Shop Name + Owner Name usually combined in UI, but kept separate in data
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  category: string;
  kycStatus: 'Verified' | 'Pending' | 'Rejected' | 'Not Verified';

  // Current Cycle Financials
  totalEarnings: number;
  commissionDeducted: number;
  refundsDeducted: number;
  penalties: number;
  tds: number;
  netPayable: number;
  walletBalance?: number;

  status: 'Completed' | 'Pending' | 'Failed' | 'On Hold' | 'Processing';
  settlementCycle: 'Daily' | 'Weekly' | 'Monthly';
  paymentMethod: 'Bank Transfer' | 'UPI';
  lastPayoutDate: string;

  bankDetails: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upiId?: string;
  };
  franchiseId?: string;
  franchiseName?: string;
}

export interface PayoutHistoryItem {
  id: string;
  date: string;
  amount: number;
  method: string;
  transactionId: string;
  status: 'Success' | 'Failed' | 'Processing';
  notes?: string;
}

export interface RefundTransaction {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Processed';
  requestDate: string;
  reason?: string;
}

export interface CommissionRule {
  id: string;
  category: string;
  percentage: number;
  type: 'Global' | 'Category' | 'Vendor';
}

export interface TransactionReportItem {
  id: string;
  date: string;
  type: 'Commission' | 'Payout' | 'Refund' | 'Subscription' | 'Penalty';
  partyName: string; // Vendor or Customer Name
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  paymentMethod: string;
  referenceId: string;
}

// --- Marketing & Promotions Types ---

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageDesktopUrl: string;
  imageMobileUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  type: 'Homepage' | 'Category' | 'Shop' | 'Home' | 'Street';
  position: string;
  target?: string;
  status: 'Active' | 'Scheduled' | 'Inactive';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  displayOrder?: number;
  cityId?: string;
  zoneId?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'Percentage' | 'Fixed Amount';
  value: number;
  minOrderValue: number;
  validity: string;
  applicableTo: 'All' | 'Specific Vendors' | 'Specific Categories';
  usageCount: number;
  status: 'Active' | 'Expired';
}

export interface FlashSale {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  productCount: number;
  status: 'Active' | 'Upcoming' | 'Ended';
  discountUpTo: string; // e.g., "50%"
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  recipientType: 'All Users' | 'All Vendors' | 'Specific Category' | 'Specific Shop';
  recipientTarget?: string;
  sentDate: string;
  status: 'Sent' | 'Scheduled';
}

export interface Advertisement {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  redirectUrl?: string;
  placements: string[];
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive' | 'Scheduled';
}

// --- Customer Management Types ---

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  joinDate: string;
  status: 'Active' | 'Blocked';
  avatarUrl: string;
}

export interface CustomerIssue {
  id: string;
  customerId: string;
  customerName: string;
  vendorName: string;
  orderId?: string;
  issueType: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'High' | 'Medium' | 'Low';
  date: string;
}

// --- KYC Management Types ---

export interface KYCDocument {
  id: string;
  type: string;
  category: 'Identity' | 'Address' | 'Business' | 'Bank';
  fileName: string;
  url: string;
  fileType: 'image' | 'pdf';
  status: 'Verified' | 'Pending' | 'Rejected';
}

export interface KYCRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessType: 'Individual' | 'Proprietorship' | 'Partnership' | 'Company';
  vendorCategory: string;
  submittedDate: string;
  status: 'Pending Verification' | 'Approved' | 'Rejected' | 'Resubmitted' | 'Awaiting Vendor Action';
  remarks?: string;
  address: string;
  pickupAddress: string;
  documents: KYCDocument[];
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountName: string;
  };
}

// --- Product Management Types ---

export interface ProductVariant {
  id: string;
  name: string; // e.g., "500g", "XL"
  sku: string;
  price: number;
  stock: number;
}

export interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
}

export interface ProductSEO {
  metaTitle: string;
  metaDescription: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subCategory?: string;
  sku: string; // Main SKU

  // Pricing & Inventory
  price: number; // Selling Price
  mrp: number; // Maximum Retail Price
  discount: number; // Calculated Percentage
  purchaseCost?: number; // Internal Cost
  stock: number;
  stockStatus: 'In Stock' | 'Out of Stock' | 'Low Stock';
  unitType: string; // e.g. kg, pc, box

  // Media & Details
  imageUrl: string; // Main image for lists
  galleryImages: ProductImage[];
  shortDescription: string;
  description: string;

  // Variants
  hasVariants: boolean;
  variants: ProductVariant[];

  // SEO
  seo?: ProductSEO;

  // Metadata
  status: 'Live' | 'Draft' | 'Pending' | 'Rejected' | 'Inactive';
  featured: boolean;
  showOnHomepage: boolean;
  isJiffyStreet?: boolean; // Added for Jiffy Street products
  isJiffyCafe?: boolean; // Added for Jiffy Cafe products
  rating: number;
  vendorId: string;
  vendorName?: string;
  shopName?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  shopName: string;
  shopLogo?: string;
  customerName: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  status: 'Published' | 'Pending' | 'Rejected';
  likes: number;
  adminReply?: string;
  type: 'PRODUCT' | 'SHOP';
  isJiffyStreet?: boolean;
  isJiffyCafe?: boolean;
  images?: string[];
  videoUrl?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  subCategories: string[];
}

// --- Support Types ---

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
  lastActivity?: string;
  messages: TicketMessage[];

  // UI Helper fields (mapped from requester/source)
  requesterName?: string;
  source?: 'Customer' | 'Vendor';
  email?: string;
  phone?: string;
  assignedTeam?: string;
  summary?: string;
}

// --- Admin System Types ---

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  mobile?: string; // Added
  username?: string;
  role: 'Super Admin' | 'Support Agent' | 'Manager' | 'Editor' | 'Franchise Owner' | 'Franchise Staff' | 'Seller' | 'Seller Staff';
  status: 'Active' | 'Inactive';
  lastLogin: string;
  createdOn?: string; // Added
  avatarUrl: string;
  assignedTerritory?: string[]; // List of Pincodes for Franchise roles
  franchiseId?: string; // Link to franchise entity
  sellerId?: string; // Link to vendor entity
  shopId?: string; // Link to shop
  forcePasswordChange?: boolean;
}

export interface RolePermission {
  module: string;
  view: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: RolePermission[];
  isSystem: boolean;
}

// --- Franchise Module Types ---

export interface Franchise {
  id: string;
  ownerName: string;
  businessName: string;
  territory: string[];
  pincodes: string[];
  phone: string;
  email: string;
  totalShops: number;
  totalOrders: number;
  earnings: number;
  status: 'Active' | 'On Hold' | 'Disabled';
  avatarUrl: string;
  joinedDate: string;
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  address: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountName: string;
  };
}

export interface FranchiseRequest {
  id: string;
  applicantName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  applicationDate: string;
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  status: 'Pending' | 'Approved' | 'Rejected';
  documents: string[];
}

export interface FranchiseTerritory {
  id: string;
  name: string;
  city: string;
  pincodes: string[];
  assignedFranchiseId?: string;
  assignedFranchiseName?: string;
  shopCount: number;
  orderCount: number;
}

export interface FranchisePayout {
  id: string;
  franchiseName: string;
  franchiseId: string;
  totalEarnings: number;
  commissionDeducted: number;
  netPayable: number;
  status: 'Paid' | 'Pending' | 'Processing' | 'Failed';
  payoutDate: string;
}

export interface FranchiseIssue {
  id: string;
  ticketId: string;
  franchiseName: string;
  franchiseId: string;
  issueType: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  date: string;
}

// --- Login Management Types ---

export interface UserAccount extends AdminUser {
  userType: 'Franchise' | 'Seller';
  territoryOrShop: string; // Display string: "Chennai (5 pincodes)" or "Shop ID: SHP001"
}
export interface SellerApplication {
  id: number;
  shopName: string;
  businessDescription: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  businessType: string;
  category: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  accountHolderName: string;
  bankAccountNumber: string;
  ifscCode: string;
  idProofUrl?: string;
  businessProofUrl?: string;
  addressProofUrl?: string;
  cancelledChequeUrl?: string;
  vendorType: 'ECOMMERCE' | 'FOOD';
  cuisineType?: string;
  fssaiNumber?: string;
  openingTime?: string;
  closingTime?: string;
}

export interface City {
  id: string;
  name: string;
  isFeatured: boolean;
  deliveryEstimation: string;
  isCodAvailable: boolean;
  createdAt: string;
}

export interface Zone {
  id: string;
  cityId: string;
  name: string;
  createdAt: string;
}

export interface Pincode {
  id: string;
  zoneId: string;
  pincode: string;
  createdAt: string;
}

