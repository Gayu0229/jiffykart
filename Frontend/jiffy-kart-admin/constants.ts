
import {
  AdminUser, DashboardStats, SalesDataPoint, CategoryDataPoint, Vendor,
  TrafficSource, VendorFull, PendingVendor, Order, OrderDetail,
  DeliveryPartner, ActiveDelivery, CommissionRule, RefundTransaction,
  Banner, Coupon, FlashSale, AppNotification, Advertisement,
  Customer, CustomerIssue, KYCRequest, Product, SupportTicket,
  Role, Franchise, FranchiseRequest, FranchiseTerritory,
  FranchisePayout, FranchiseIssue, VendorPaymentProfile, UserAccount,
  PayoutHistoryItem, TransactionReportItem, ReturnRequest, ProductCategory
} from './types';

export const MOCK_ADMINS: AdminUser[] = [
  {
    id: 'ADM-001',
    name: 'Admin One',
    email: 'admin1@ziffykart.com',
    mobile: '+1 555-0199',
    username: 'admin1',
    role: 'Super Admin',
    status: 'Active',
    lastLogin: '2023-10-28 09:00',
    createdOn: '2022-01-15',
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin+One&background=random'
  },
  {
    id: 'ADM-002',
    name: 'Support Lead',
    email: 'support@ziffykart.com',
    mobile: '+1 555-0200',
    username: 'support_lead',
    role: 'Support Agent',
    status: 'Active',
    lastLogin: '2023-10-27 14:30',
    createdOn: '2022-03-22',
    avatarUrl: 'https://ui-avatars.com/api/?name=Support+Lead&background=random'
  },
  {
    id: 'FRA-USR-001',
    name: 'James Wilson',
    email: 'james@westcoast.com',
    mobile: '+1 415-555-1234',
    username: 'franchise_west',
    role: 'Franchise Owner',
    status: 'Active',
    lastLogin: '2023-10-29 08:15',
    createdOn: '2023-01-10',
    avatarUrl: 'https://ui-avatars.com/api/?name=James+Wilson&background=random',
    assignedTerritory: ['94103', '94107', '95112', '95113'],
    franchiseId: 'FRA-001'
  }
];

export const MOCK_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'USR-001', name: 'James Wilson', email: 'james@westcoast.com', role: 'Franchise Owner', status: 'Active', lastLogin: '2023-10-28 10:00', avatarUrl: 'https://ui-avatars.com/api/?name=James+Wilson&background=4F46E5&color=fff',
    userType: 'Franchise', territoryOrShop: 'West Zone (SF)', username: 'james_wc'
  },
  {
    id: 'USR-002', name: 'Sarah Chen', email: 'sarah@techworld.com', role: 'Seller', status: 'Active', lastLogin: '2023-10-27 15:30', avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=10B981&color=fff',
    userType: 'Seller', territoryOrShop: 'TechWorld (ID: V001)', username: 'sarah_tech'
  },
  {
    id: 'USR-003', name: 'Marcus Miller', email: 'marcus@fashionhub.com', role: 'Seller', status: 'Inactive', lastLogin: '2023-10-20 09:15', avatarUrl: 'https://ui-avatars.com/api/?name=Marcus+Miller&background=6B7280&color=fff',
    userType: 'Seller', territoryOrShop: 'FashionHub (ID: V002)', username: 'marcus_fsh'
  },
  {
    id: 'USR-004', name: 'Elena Rodriguez', email: 'elena@beautybox.com', role: 'Seller', status: 'Active', lastLogin: '2023-10-28 18:45', avatarUrl: 'https://ui-avatars.com/api/?name=Elena+Rodriguez&background=EC4899&color=fff',
    userType: 'Seller', territoryOrShop: 'BeautyBox (ID: V005)', username: 'elena_bb'
  }
];

export const MOCK_STATS: DashboardStats = {
  totalOrders: 124,
  totalRevenue: 15430,
  activeVendors: 45,
  activeProducts: 1250,
  pendingVendors: 3,
  pendingProducts: 12,
  ordersProcessing: 18,
  supportTickets: 5
};

export const SALES_DATA_7D: SalesDataPoint[] = [
  { name: 'Mon', orders: 120, revenue: 4500 },
  { name: 'Tue', orders: 145, revenue: 5200 },
  { name: 'Wed', orders: 132, revenue: 4900 },
  { name: 'Thu', orders: 156, revenue: 6100 },
  { name: 'Fri', orders: 189, revenue: 7800 },
  { name: 'Sat', orders: 210, revenue: 8500 },
  { name: 'Sun', orders: 175, revenue: 7100 },
];

export const CATEGORY_DATA: CategoryDataPoint[] = [
  { name: 'Electronics', value: 35, color: '#4F46E5' },
  { name: 'Fashion', value: 25, color: '#10B981' },
  { name: 'Home', value: 20, color: '#F59E0B' },
  { name: 'Beauty', value: 15, color: '#EC4899' },
  { name: 'Furniture', value: 10, color: '#8B5CF6' },
  { name: 'Other', value: 5, color: '#6B7280' },
];

export const TRAFFIC_DATA: TrafficSource[] = [
  { source: 'Direct', value: 40, color: '#4F46E5' },
  { source: 'Social', value: 25, color: '#10B981' },
  { source: 'Organic', value: 20, color: '#F59E0B' },
  { source: 'Referral', value: 15, color: '#EC4899' },
];

export const TOP_VENDORS: Vendor[] = [
  { id: 'V001', name: 'TechWorld', orders: 450, rating: 4.8, deliverySuccess: 98, avatarUrl: 'https://ui-avatars.com/api/?name=Tech+World&background=random' },
  { id: 'V002', name: 'FashionHub', orders: 320, rating: 4.6, deliverySuccess: 95, avatarUrl: 'https://ui-avatars.com/api/?name=Fashion+Hub&background=random' },
  { id: 'V003', name: 'HomeDecor', orders: 210, rating: 4.9, deliverySuccess: 99, avatarUrl: 'https://ui-avatars.com/api/?name=Home+Decor&background=random' },
  { id: 'V004', name: 'SportsGear', orders: 180, rating: 4.5, deliverySuccess: 94, avatarUrl: 'https://ui-avatars.com/api/?name=Sports+Gear&background=random' },
];

export const TOP_CATEGORIES_LIST = ['Electronics', 'Men\'s Fashion', 'Women\'s Fashion', 'Home & Kitchen', 'Beauty'];

export const ALL_VENDORS_DATA: VendorFull[] = [
  {
    id: 'V001',
    shopName: 'TechWorld',
    ownerName: 'John Doe',
    phone: '+1 234 567 8900',
    email: 'john@techworld.com',
    kycStatus: 'Verified',
    productsLive: 120,
    ordersHandled: 4500,
    rating: 4.8,
    status: 'Active',
    avatarUrl: 'https://ui-avatars.com/api/?name=Tech+World&background=random',
    bannerUrl: 'https://picsum.photos/800/300?random=1',
    address: '123 Tech Street, Silicon Valley, CA',
    pincode: '94043',
    businessType: 'Retailer',
    joinedDate: '12 Jan 2023',
    bankDetails: {
      bankName: 'Chase Bank',
      accountNumber: '**** **** **** 1234',
      ifsc: 'CHAS0001234',
      accountName: 'TechWorld Inc'
    },
    totalRevenue: 125000,
    franchiseId: 'FRA-001',
    franchiseName: 'West Coast Distributors'
  },
  {
    id: 'V002',
    shopName: 'FashionHub',
    ownerName: 'Jane Smith',
    phone: '+1 987 654 3210',
    email: 'jane@fashionhub.com',
    kycStatus: 'Verified',
    productsLive: 85,
    ordersHandled: 3200,
    rating: 4.6,
    status: 'Active',
    avatarUrl: 'https://ui-avatars.com/api/?name=Fashion+Hub&background=random',
    bannerUrl: 'https://picsum.photos/800/300?random=2',
    address: '456 Fashion Ave, New York, NY',
    pincode: '10001',
    businessType: 'Retailer',
    joinedDate: '15 Feb 2023',
    bankDetails: {
      bankName: 'Bank of America',
      accountNumber: '**** **** **** 5678',
      ifsc: 'BOA0005678',
      accountName: 'FashionHub LLC'
    },
    totalRevenue: 85000,
    franchiseId: 'FRA-001',
    franchiseName: 'West Coast Distributors'
  }
];

export const PENDING_VENDORS_DATA: PendingVendor[] = [
  { id: 'PV001', vendorName: 'New Age Gadgets', businessType: 'Retailer', kycDocuments: ['ID Proof', 'Business License'], submittedDate: '2 hours ago', status: 'Pending Review' },
  { id: 'PV002', vendorName: 'Organic Foods', businessType: 'Wholesaler', kycDocuments: ['Tax ID', 'Bank Proof'], submittedDate: '5 hours ago', status: 'Pending Review' },
];

export const ALL_ORDERS_DATA: Order[] = [
  { id: 'ORD-7782', customerName: 'Alice Smith', vendorName: 'TechWorld', totalAmount: 299.99, paymentMode: 'Credit Card', status: 'Processing', orderDate: 'Oct 24, 2023', pincode: '94043', franchiseId: 'FRA-001' },
  { id: 'ORD-7781', customerName: 'Bob Jones', vendorName: 'FashionHub', totalAmount: 89.50, paymentMode: 'PayPal', status: 'Delivered', orderDate: 'Oct 23, 2023', pincode: '10001', franchiseId: 'FRA-001' },
];

export const DELIVERY_PARTNERS_DATA: DeliveryPartner[] = [
  { id: 'DP001', name: 'Mike Ross', phone: '555-0101', zone: 'Downtown', pincode: '94043', status: 'Available', activeOrders: 0, completedDeliveries: 120, rating: 4.9, avatarUrl: 'https://ui-avatars.com/api/?name=Mike+Ross&background=random', franchiseName: 'West Coast Distributors' },
];

export const ORDER_DETAIL_MOCK: OrderDetail = {
  id: 'ORD-7782',
  customerName: 'Alice Smith',
  vendorName: 'TechWorld',
  totalAmount: 299.99,
  paymentMode: 'Credit Card',
  status: 'Processing',
  orderDate: 'Oct 24, 2023',
  pincode: '94043',
  franchiseId: 'FRA-001',
  items: [
    { id: 'P001', name: 'Wireless Headphones', quantity: 1, price: 199.99, image: 'https://picsum.photos/200?random=1', variant: 'Black' }
  ],
  customerEmail: 'alice@example.com',
  customerPhone: '555-1234',
  shippingAddress: '123 Maple Ave, Springfield, IL',
  billingAddress: '123 Maple Ave, Springfield, IL',
  vendorId: 'V001',
  deliveryPartner: 'Mike Ross',
  trackingId: 'TRK-123456789',
  paymentStatus: 'Paid',
  subtotal: 299.99,
  tax: 24.00,
  deliveryFee: 10.00,
  logs: [
    { status: 'Placed', timestamp: 'Oct 24, 10:00 AM', description: 'Order placed successfully' }
  ]
};

export const RETURNS_DATA: ReturnRequest[] = [
  { id: 'RET-001', orderId: 'ORD-7780', productName: 'Smart Watch', productImage: 'https://picsum.photos/200?random=3', reason: 'Defective', customerName: 'Charlie Brown', vendorName: 'TechWorld', type: 'Return', status: 'Pending', requestDate: 'Oct 25, 2023', amount: 150.00 },
];

export const ACTIVE_DELIVERIES_DATA: ActiveDelivery[] = [
  { id: 'DEL-001', orderId: 'ORD-7782', partnerName: 'Mike Ross', customerName: 'Alice Smith', address: '123 Maple Ave', status: 'On Time', location: { x: 40, y: 30 }, eta: '10 mins' },
];

export const COMMISSION_RULES: CommissionRule[] = [
  { id: 'CR001', category: 'Electronics', percentage: 8, type: 'Category' },
];

export const REFUND_TRANSACTIONS_DATA: RefundTransaction[] = [
  { id: 'RF-1001', orderId: 'ORD-7770', customerName: 'John Doe', amount: 45.00, status: 'Pending', requestDate: 'Oct 26, 2023', reason: 'Item not as described' },
];

export const BANNERS_DATA: Banner[] = [
  { id: 'BN-001', title: 'Summer Sale', imageUrl: 'https://picsum.photos/800/300?random=10', type: 'Homepage', status: 'Active', startDate: '2023-06-01', endDate: '2023-06-30' },
];

export const COUPONS_DATA: Coupon[] = [
  { id: 'CPN-001', code: 'WELCOME50', discountType: 'Fixed Amount', value: 50, minOrderValue: 500, validity: '2023-12-31', applicableTo: 'All', usageCount: 150, status: 'Active' },
];

export const FLASH_SALES_DATA: FlashSale[] = [
  { id: 'FS-001', name: 'Midnight Madness', startTime: '12:00 AM', endTime: '03:00 AM', productCount: 50, status: 'Active', discountUpTo: '70%' },
];

export const NOTIFICATIONS_DATA: AppNotification[] = [
  { id: 'NOT-001', title: 'Big Sale Alert', message: 'Check out our biggest sale of the year!', recipientType: 'All Users', sentDate: 'Oct 25, 2023 10:00 AM', status: 'Sent' },
];

export const MOCK_ADS: Advertisement[] = [
  { id: 'AD-001', title: 'Featured Product', imageUrl: 'https://picsum.photos/400/300?random=20', placements: ['Homepage Top'], startDate: '2023-10-01', endDate: '2023-10-31', status: 'Active' },
];

export const CUSTOMERS_DATA: Customer[] = [
  { id: 'C001', name: 'Alice Smith', email: 'alice@example.com', phone: '555-1111', totalOrders: 12, joinDate: 'Jan 15, 2023', status: 'Active', avatarUrl: 'https://ui-avatars.com/api/?name=Alice+Smith&background=random' },
];

export const CUSTOMER_ISSUES_DATA: CustomerIssue[] = [
  { id: 'ISS-001', customerId: 'C001', customerName: 'Alice Smith', vendorName: 'TechWorld', orderId: 'ORD-7782', issueType: 'Wrong Item', description: 'Received a blue case instead of clear', status: 'Open', priority: 'Medium', date: 'Oct 26, 2023' },
];

export const MOCK_KYC_REQUESTS: KYCRequest[] = [
  {
    id: 'KYC-001', vendorId: 'V005', vendorName: 'Gadget Guru', ownerName: 'Sam Wilson', email: 'sam@guru.com', phone: '555-3333', businessType: 'Proprietorship', vendorCategory: 'Electronics', submittedDate: 'Oct 25, 2023', status: 'Pending Verification', address: '456 Tech Park', pickupAddress: '456 Tech Park',
    documents: [
      { id: 'DOC-1', type: 'ID Proof', category: 'Identity', fileName: 'aadhar.jpg', url: '', fileType: 'image', status: 'Pending' }
    ],
    bankDetails: { bankName: 'HDFC', accountNumber: '1234567890', ifsc: 'HDFC0001234', accountName: 'Sam Wilson' }
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'P001',
    name: 'Wireless Headphones',
    brand: 'Sony',
    category: 'Electronics',
    subCategory: 'Audio',
    price: 199.99,
    mrp: 249.99,
    discount: 20,
    stock: 50,
    stockStatus: 'In Stock',
    unitType: 'piece',
    status: 'Live',
    rating: 4.5,
    imageUrl: 'https://picsum.photos/200?random=1',
    galleryImages: [],
    vendorId: 'V001',
    sku: 'WH-1000XM4',
    shortDescription: 'Premium noise cancelling headphones',
    description: 'Industry-leading noise cancellation...',
    hasVariants: false,
    variants: [],
    featured: true,
    showOnHomepage: true,
    createdAt: '2023-01-15',
    isJiffyStreet: true
  },
  {
    id: 'P002',
    name: 'Smart Watch',
    brand: 'Apple',
    category: 'Electronics',
    subCategory: 'Wearables',
    price: 149.99,
    mrp: 199.99,
    discount: 25,
    stock: 30,
    stockStatus: 'Low Stock',
    unitType: 'piece',
    status: 'Live',
    rating: 4.2,
    imageUrl: 'https://picsum.photos/200?random=3',
    galleryImages: [],
    vendorId: 'V001',
    sku: 'AW-SE-44',
    shortDescription: 'Stay connected and active',
    description: 'The ultimate device for a healthy life...',
    hasVariants: true,
    variants: [],
    featured: false,
    showOnHomepage: false,
    createdAt: '2023-02-20',
    isJiffyStreet: false
  },
];

export const CATEGORIES_TREE: ProductCategory[] = [
  { id: 'cat_groc', name: 'Groceries', subCategories: ['Fruits', 'Vegetables', 'Dairy', 'Snacks'] },
  { id: 'cat_elec', name: 'Electronics', subCategories: ['Mobiles', 'Laptops', 'Audio', 'Wearables'] },
  { id: 'cat_fash', name: 'Fashion', subCategories: ['Men', 'Women', 'Kids', 'Accessories'] },
  { id: 'cat_home', name: 'Home & Kitchen', subCategories: ['Cookware', 'Decor', 'Furniture', 'Appliances'] },
  { id: 'cat_eau', name: 'Beauty', subCategories: ['Skincare', 'Makeup', 'Perfumery', 'Personal Care'] },
  { id: 'cat_heal', name: 'Health', subCategories: ['Wellness', 'Medicines', 'Supplements', 'Hygiene'] },
  { id: 'cat_spor', name: 'Sports', subCategories: ['Fitness', 'Outdoor', 'Team Sports', 'Footwear'] },
  { id: 'cat_book', name: 'Books', subCategories: ['Fiction', 'Academic', 'Kids', 'Self Help'] },
  { id: 'cat_toys', name: 'Toys', subCategories: ['Educational', 'Action Figures', 'Board Games', 'Outdoor'] },
  { id: 'cat_auto', name: 'Auto Parts', subCategories: ['Accessories', 'Spare Parts', 'Tools', 'Car Care'] },
  { id: 'cat_stat', name: 'Stationery', subCategories: ['Office', 'School', 'Art Supplies', 'Paper'] },
  { id: 'cat_pet', name: 'Pet Supplies', subCategories: ['Dog Food', 'Cat Food', 'Toys', 'Grooming'] },
  { id: 'cat_food', name: 'Food', subCategories: ['Meals', 'Fast Food', 'Beverages', 'Desserts', 'Snacks'] },
  { id: 'cat_furniture', name: 'Furniture', subCategories: ['Bed', 'Sofa', 'Table', 'Chair', 'Storage'] },
];

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-001', ticketNumber: '#1001', source: 'Vendor', requesterName: 'TechWorld', requesterId: 'V001', email: 'john@techworld.com', subject: 'Payout Issue', category: 'Payment', priority: 'High', status: 'Open', createdDate: 'Oct 26, 2023', lastActivity: '2 hours ago',
    messages: [
      { id: 'M1', sender: 'User', content: 'My payout for last week is still pending.', timestamp: 'Oct 26, 10:00 AM' }
    ]
  }
];

export const MOCK_ROLES: Role[] = [
  { id: 'R001', name: 'Super Admin', description: 'Full access to all modules', usersCount: 2, isSystem: true, permissions: [] }
];

export const SYSTEM_MODULES = ['Dashboard', 'Vendors', 'Orders', 'Delivery', 'Payments', 'Marketing', 'Customers', 'Support', 'Settings'];

export const MOCK_FRANCHISES: Franchise[] = [
  {
    id: 'FRA-001', ownerName: 'James Wilson', businessName: 'West Coast Distributors', territory: ['West Zone', 'Coastal'], pincodes: ['94043', '94103', '94107'], phone: '555-0001', email: 'james@westcoast.com', totalShops: 12, totalOrders: 1450, earnings: 12500, status: 'Active', avatarUrl: 'https://ui-avatars.com/api/?name=James+Wilson&background=random', joinedDate: 'Jan 10, 2023', kycStatus: 'Verified', address: '101 Ocean Drive, CA'
  }
];

export const MOCK_FRANCHISE_REQUESTS: FranchiseRequest[] = [
  { id: 'FRQ-001', applicantName: 'Sarah Connor', phone: '555-9999', email: 'sarah@future.com', city: 'Los Angeles', state: 'CA', applicationDate: 'Oct 20, 2023', kycStatus: 'Pending', status: 'Pending', documents: ['ID', 'Address Proof'] }
];

export const MOCK_FRANCHISE_TERRITORIES: FranchiseTerritory[] = [
  { id: 'TER-001', name: 'West Zone', city: 'San Francisco', pincodes: ['94103', '94107'], assignedFranchiseId: 'FRA-001', assignedFranchiseName: 'West Coast Distributors', shopCount: 8, orderCount: 500 }
];

export const MOCK_FRANCHISE_PAYOUTS: FranchisePayout[] = [
  { id: 'FP-001', franchiseName: 'West Coast Distributors', franchiseId: 'FRA-001', totalEarnings: 5000, commissionDeducted: 500, netPayable: 4500, status: 'Pending', payoutDate: 'Oct 31, 2023' }
];

export const MOCK_FRANCHISE_ISSUES: FranchiseIssue[] = [
  { id: 'FI-001', ticketId: 'TKT-2001', franchiseName: 'West Coast Distributors', franchiseId: 'FRA-001', issueType: 'Territory Dispute', description: 'Another franchise is operating in my zone', priority: 'High', status: 'Open', date: 'Oct 27, 2023' }
];

export const VENDOR_PAYMENTS_LIST: VendorPaymentProfile[] = [
  {
    vendorId: 'V001', vendorName: 'TechWorld', shopName: 'TechWorld', ownerName: 'John Doe', phone: '555-1234', email: 'john@techworld.com', category: 'Electronics', kycStatus: 'Verified',
    totalEarnings: 15000, commissionDeducted: 1500, refundsDeducted: 200, penalties: 0, tds: 150, netPayable: 13150, walletBalance: 500,
    status: 'Pending', settlementCycle: 'Weekly', paymentMethod: 'Bank Transfer', lastPayoutDate: 'Oct 20, 2023',
    bankDetails: { accountName: 'TechWorld Inc', bankName: 'Chase', accountNumber: '123456789', ifsc: 'CHAS001' }
  }
];

export const PAYOUT_HISTORY_MOCK: PayoutHistoryItem[] = [
  { id: 'PH-001', date: 'Oct 20, 2023', amount: 12000, method: 'Bank Transfer', transactionId: 'TXN123456', status: 'Success' }
];

export const TRANSACTION_REPORTS_DATA: TransactionReportItem[] = [
  { id: 'TXN-001', date: 'Oct 26, 2023', type: 'Commission', partyName: 'TechWorld', amount: 150, status: 'Completed', paymentMethod: 'System', referenceId: 'ORD-7782' }
];
