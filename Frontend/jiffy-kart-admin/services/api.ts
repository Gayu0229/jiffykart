import axios from 'axios';
import {
  VendorFull, Order, DashboardStats, Product, VendorPaymentProfile,
  SupportTicket, KYCRequest, Payout, TransactionReportItem, TicketMessage,
  SalesDataPoint, CategoryDataPoint, TrafficSource, UserAccount, SellerApplication,
  City, Zone, Pincode, Review, Customer, DeliveryPartner, OrderDetail, Banner
} from '../types';
import {
  ALL_VENDORS_DATA, ALL_ORDERS_DATA,
  TRANSACTION_REPORTS_DATA
} from '../constants';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Axios instance with JWT interceptor
const backend = axios.create({ baseURL: API_BASE });

backend.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

backend.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '';

    if (status === 401 || (status === 403 && (message.includes('blocked') || message.includes('inactive') || message.includes('Unauthorized')))) {
      // Force logout on token expiration or access restriction
      console.warn(`[AUTH] Session invalidated (${status}). Clearing local storage.`);
      localStorage.removeItem('admin_jwt_token');
      localStorage.removeItem('admin_user');
      
      // Avoid infinite reload if we are already on a login-related path or if the error came from a login attempt
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && !error.config?.url?.includes('/auth/login')) {
        window.location.reload(); 
      }
    }
    return Promise.reject(error);
  }
);

class JiffyAPI {
  constructor() { }

  // ═══════════════════════════════════════════
  // AUTH — Real Backend Login
  // ═══════════════════════════════════════════
  async login(identifier: string, password: string): Promise<{ token: string; user: any }> {
    const response = await backend.post('/auth/login/password', { identifier, password });
    const { token, user } = response.data;
    localStorage.setItem('admin_jwt_token', token);

    // Map avatar to avatarUrl for consistency with frontend types
    if (user && user.avatar) {
      user.avatarUrl = user.avatar;
    }

    localStorage.setItem('admin_user', JSON.stringify(user));
    return { token, user };
  }

  logout() {
    localStorage.removeItem('admin_jwt_token');
    localStorage.removeItem('admin_user');
  }

  getToken(): string | null {
    return localStorage.getItem('admin_jwt_token');
  }

  // ═══════════════════════════════════════════
  // DASHBOARD — Real Backend Stats
  // ═══════════════════════════════════════════
  async getStats(): Promise<DashboardStats> {
    let s = { orders: 0, gmv: 0, shops: 0, products: 0, customers: 0, deliveryPartners: 0 };
    let vendors: any[] = [];
    let products: any[] = [];
    let tickets: any[] = [];

    try {
      const statsResponse = await backend.get('/admin/stats');
      s = statsResponse.data || s;
    } catch (e) {
      console.error('Failed to load /admin/stats:', e);
    }

    try {
      vendors = await this.getVendors();
    } catch (e) {
      console.error('Failed to load vendors:', e);
    }

    try {
      products = await this.getPendingProducts();
    } catch (e) {
      console.error('Failed to load pending products:', e);
    }

    try {
      tickets = await this.getTickets();
    } catch (e) {
      console.error('Failed to load tickets:', e);
    }

    return {
      totalOrders: s.orders || 0,
      totalRevenue: s.gmv || 0,
      activeVendors: s.shops || 0,
      activeProducts: s.products || 0,
      pendingVendors: vendors.filter(v => v.kycStatus === 'Pending').length,
      pendingProducts: products.length,
      ordersProcessing: 0, // Need to implement status filtering in getOrders
      supportTickets: tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length,
      totalCustomers: s.customers || 0,
      totalDeliveryPartners: s.deliveryPartners || 0,
    };
  }

  async getSalesData(): Promise<SalesDataPoint[]> {
    // Return empty to trigger 'No data' state in UI instead of mock data
    return [];
  }

  async getCategoryData(): Promise<CategoryDataPoint[]> {
    return [];
  }

  async getTrafficData(): Promise<TrafficSource[]> {
    return [];
  }

  async getTopVendors(): Promise<any[]> {
    return [];
  }

  // ═══════════════════════════════════════════
  // USER ACCOUNTS
  // ═══════════════════════════════════════════
  async getUserAccounts(): Promise<UserAccount[]> {
    const response = await backend.get('/admin/users');
    return response.data || [];
  }

  async updateUserAccount(id: string, updates: Partial<UserAccount>): Promise<UserAccount> {
    const response = await backend.put(`/admin/users/${id}`, updates);
    return response.data;
  }

  async updateProfileImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await backend.post('/users/profile-image', formData);

    // Update local storage user data immediately
    if (response.data?.avatarUrl) {
      const storedUser = localStorage.getItem('admin_user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userObj.avatarUrl = response.data.avatarUrl;
        localStorage.setItem('admin_user', JSON.stringify(userObj));
      }
    }

    return response.data;
  }

  async deleteProfileImage(): Promise<any> {
    const response = await backend.delete('/users/profile-image');

    // Update local storage
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      const userObj = JSON.parse(storedUser);
      delete userObj.avatarUrl;
      delete userObj.avatar;
      localStorage.setItem('admin_user', JSON.stringify(userObj));
    }

    return response.data;
  }


  // Real backend Admin User management
  async createAdminUser(userData: any): Promise<any> {
    const response = await backend.post('/admin/users/create', userData);
    return response.data;
  }

  async resetAdminUserPassword(userId: number | string, password: string): Promise<any> {
    const response = await backend.post(`/admin/users/${userId}/reset-password`, password, {
      headers: { 'Content-Type': 'text/plain' }
    });
    return response.data;
  }

  async toggleAdminUserStatus(userId: number | string, enabled: boolean): Promise<any> {
    const response = await backend.patch(`/admin/users/${userId}/status?enabled=${enabled}`);
    return response.data;
  }

  async getFranchises(): Promise<any[]> {
    try {
      const users = await this.getUserAccounts();
      // Filter for franchise roles
      const franchises = users.filter(u => u.role.includes('Franchise') || u.role.includes('Field Manager'));

      // Map and fetch statistics if available (mocking stats for now if not in user object)
      return franchises.map(u => ({
        id: u.id.toString(),
        ownerName: u.name,
        businessName: u.username || u.name,
        territory: u.assignedTerritory || [],
        pincodes: u.assignedTerritory || [], // Assuming territory list contains pincodes
        phone: u.mobile || 'N/A',
        email: u.email,
        totalShops: 0,
        totalOrders: 0,
        earnings: 0,
        status: u.status === 'Active' ? 'Active' : 'Disabled',
        avatarUrl: u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`,
        joinedDate: u.createdOn || new Date().toLocaleDateString(),
        kycStatus: 'Verified',
        address: 'N/A',
        walletBalance: 0 // Added walletBalance as per instruction
      }));
    } catch (e) {
      console.error('Failed to fetch franchises:', e);
      return [];
    }
  }

  async getFranchiseRequests(): Promise<any[]> {
    // Backend doesn't support franchise requests yet
    return [];
  }

  async getTerritories(): Promise<any[]> {
    // We could potentially map Zones or Cities to Territories here
    return [];
  }

  async getFranchisePayouts(): Promise<any[]> {
    return [];
  }

  async getFranchiseTickets(): Promise<any[]> {
    try {
      const allTickets = await this.getTickets();
      // Filter for franchise tickets if possible, or return empty for now
      return allTickets.filter(t => t.createdByRole === 'ADMIN' && t.category.includes('Franchise'));
    } catch (e) {
      return [];
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<any> {
    const response = await backend.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  }

  // ═══════════════════════════════════════════
  // VENDORS & SELLER APPLICATIONS — Real Backend
  // ═══════════════════════════════════════════
  async getVendors(): Promise<VendorFull[]> {
    const response = await backend.get('/admin/shops');
    const realShops = response.data;

    const mappedShops: VendorFull[] = realShops.map((shop: any) => ({
      id: shop.id.toString(),
      shopName: shop.name,
      ownerName: shop.owner?.name || shop.ownerName || 'Unknown',
      phone: shop.phone || shop.owner?.phone || 'N/A',
      email: shop.email || shop.owner?.email || 'N/A',
      kycStatus: shop.kycStatus === 'VERIFIED' ? 'Verified' : 'Pending',
      productsLive: shop.productsLive || 0,
      ordersHandled: 0,
      rating: shop.rating || 0,
      status: shop.approvalStatus === 'REJECTED' ? 'Blocked' : (shop.isActive ? 'Active' : 'Inactive'),
      avatarUrl: shop.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=random`,
      bannerUrl: shop.bannerUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
      address: shop.address,
      pincode: shop.pincode,
      businessType: shop.businessType,
      joinedDate: shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      totalRevenue: 0
    }));
    return mappedShops;
  }

  async getSellerApplications(status: string = 'PENDING'): Promise<SellerApplication[]> {
    const response = await backend.get(`/admin/seller-applications?status=${status}`);
    return response.data || [];
  }

  async getPendingShopsAsVendors(): Promise<VendorFull[]> {
    try {
      const response = await backend.get('/admin/seller-applications?status=PENDING');
      const realApps = response.data;

      const mappedApps: VendorFull[] = realApps.map((app: any) => ({
        id: app.id.toString(),
        shopName: app.shopName,
        ownerName: app.user?.name || 'Unknown',
        phone: app.user?.phone || 'N/A',
        email: app.user?.email || 'N/A',
        kycStatus: 'Pending',
        productsLive: 0,
        ordersHandled: 0,
        rating: 0,
        status: 'Inactive',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(app.shopName)}&background=random`,
        bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
        address: app.address,
        pincode: app.pincode,
        businessType: app.businessType,
        joinedDate: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        totalRevenue: 0
      }));
      return mappedApps;
    } catch (e) {
      console.error('Failed to fetch pending applications:', e);
      return [];
    }
  }

  async approveApplication(id: string | number): Promise<void> {
    await backend.post(`/admin/seller-applications/${id}/approve`);
  }

  async rejectApplication(id: string | number, reason: string): Promise<void> {
    await backend.post(`/admin/seller-applications/${id}/reject`, { reason });
  }

  async addVendor(vendor: VendorFull): Promise<VendorFull> {
    const response = await backend.post('/admin/shops', vendor);
    return response.data;
  }

  async updateVendor(id: string, updates: Partial<VendorFull>): Promise<VendorFull> {
    const response = await backend.put(`/admin/shops/${id}`, updates);
    return response.data;
  }

  async approveShop(id: string | number): Promise<void> {
    await backend.put(`/admin/shop/${id}/approve`);
  }

  async rejectShop(id: string | number, reason: string = 'No reason provided'): Promise<void> {
    await backend.put(`/admin/shop/${id}/reject`, { reason });
  }

  async sendVendorWarning(id: string | number, message: string): Promise<void> {
    await backend.post(`/admin/shops/${id}/warning`, { message });
  }

  async blockVendor(id: string | number): Promise<void> {
    await backend.post(`/admin/shops/${id}/block`);
  }

  async unblockVendor(id: string | number): Promise<void> {
    await backend.post(`/admin/shops/${id}/unblock`);
  }

  // ═══════════════════════════════════════════
  // ORDERS — Real Backend
  // ═══════════════════════════════════════════
  async getOrders(): Promise<Order[]> {
    const response = await backend.get('/admin/orders');
    return (response.data || []).map((o: any) => ({
      id: String(o.id),
      customerName: o.user?.name || 'Unknown',
      vendorName: o.shop?.name || 'Unknown',
      totalAmount: o.total || 0,
      paymentMode: o.paymentProvider || 'COD',
      status: o.status || o.orderStatus || 'Pending',
      orderDate: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      pincode: o.shop?.pincode || '000000'
    }));
  }

  async getOrderById(id: string | number): Promise<OrderDetail> {
    const response = await backend.get(`/admin/orders/${id}`);
    const o = response.data;
    return {
      id: String(o.id),
      customerName: o.user?.name || 'Unknown',
      customerEmail: o.user?.email || 'N/A',
      customerPhone: o.user?.phone || 'N/A',
      vendorName: o.shop?.name || 'Unknown',
      vendorId: String(o.shop?.id || ''),
      totalAmount: o.total || 0,
      paymentMode: o.paymentProvider || 'COD',
      status: o.status || o.orderStatus || 'Pending',
      orderDate: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      shippingAddress: o.address || 'N/A',
      billingAddress: o.address || 'N/A',
      subtotal: o.total || 0,
      tax: 0,
      deliveryFee: 0,
      paymentStatus: (o.paymentStatus === 'SUCCESS' ? 'Paid' : (o.paymentStatus === 'FAILED' ? 'Refunded' : 'Unpaid')) as any,
      items: (o.items || []).map((item: any) => ({
        id: String(item.id),
        name: item.product?.name || 'Product',
        quantity: item.quantity || 1,
        price: item.priceAtOrder || 0,
        image: item.product?.image || ''
      })),
      logs: []
    } as any;
  }

  async updateOrderStatus(id: string | number, status: string): Promise<any> {
    if (status === 'Cancelled') {
      return this.cancelOrder(id);
    }
    const response = await backend.put(`/admin/orders/${id}/status`, { status });
    return response.data;
  }

  async cancelOrder(id: string | number): Promise<any> {
    const response = await backend.delete(`/admin/orders/${id}`);
    return response.data;
  }
  // ═══════════════════════════════════════════
  // PRODUCTS — Real Backend
  // ═══════════════════════════════════════════
  private mapBackendProduct(p: any): Product {
    return {
      ...p,
      id: String(p.id),
      sku: p.sku || `JK-${p.id}`,
      imageUrl: p.image ? (p.image.startsWith('http') ? p.image : `https://api.jiffykart.in${p.image}`) : '',
      stock: p.stockQuantity || 0,
      isJiffyStreet: p.showOnJiffyStreet || false,
      isJiffyCafe: p.showOnJiffyCafe || false,
      vendorId: p.shopId ? String(p.shopId) : '',
      status: p.status === 'PUBLISHED' ? 'Live' : (p.status === 'DRAFT' ? 'Draft' : (p.status === 'PENDING' ? 'Pending' : (p.status === 'REJECTED' ? 'Rejected' : p.status))),
      brand: p.shopName || '',
      shopName: p.shopName || '',
      rejectionReason: p.rejectionReason || '',
    };
  }

  async getProducts(): Promise<Product[]> {
    try {
      const response = await backend.get('/admin/products/pending');
      return (response.data || []).map((p: any) => this.mapBackendProduct(p));
    } catch (e) {
      console.error('Failed to fetch pending products:', e);
      throw e;
    }
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await backend.get('/admin/products');
      return (response.data || []).map((p: any) => this.mapBackendProduct(p));
    } catch (e) {
      console.error('Failed to fetch all products:', e);
      throw e;
    }
  }

  async getPendingProducts(): Promise<Product[]> {
    const response = await backend.get('/admin/products/pending');
    return (response.data || []).map((p: any) => this.mapBackendProduct(p));
  }

  async approveProduct(id: string | number): Promise<void> {
    await backend.post(`/admin/products/${id}/approve`);
  }

  async rejectProduct(id: string | number, reason?: string): Promise<void> {
    await backend.post(`/admin/products/${id}/reject`, { reason });
  }

  async addProduct(data: Product | FormData): Promise<Product> {
    try {
      const headers: any = {};
      if (data instanceof FormData) {
        headers['Content-Type'] = undefined;
      }
      const response = await backend.post('/admin/products', data, { headers });
      return this.mapBackendProduct(response.data);
    } catch (e) {
      console.error('Failed to create product on backend:', e);
      throw e;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      // Map frontend field names to backend field names
      const backendUpdates: any = { ...updates };
      if ('isJiffyStreet' in updates) {
        backendUpdates.showOnJiffyStreet = updates.isJiffyStreet;
        delete backendUpdates.isJiffyStreet;
      }
      if ('isJiffyCafe' in updates) {
        backendUpdates.showOnJiffyCafe = updates.isJiffyCafe;
        delete backendUpdates.isJiffyCafe;
      }
      if (updates.status === 'Live') {
        backendUpdates.status = 'PUBLISHED';
      }
      const response = await backend.put(`/admin/products/${id}`, backendUpdates);
      return this.mapBackendProduct(response.data);
    } catch (e) {
      console.error('Failed to update product on backend:', e);
      throw e;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    await backend.delete(`/admin/products/${id}`);
  }

  // ═══════════════════════════════════════════
  // SUPPORT — Real Backend
  // ═══════════════════════════════════════════
  async getTickets(): Promise<SupportTicket[]> {
    const response = await backend.get('/admin/support/tickets');
    return (response.data || []).map((t: any) => ({
      ...t,
      source: t.createdByRole === 'VENDOR' ? 'Vendor' : 'Customer',
      requesterName: t.requesterName || (t.createdByRole + ' #' + t.createdById),
      lastActivity: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : 'N/A'
    }));
  }

  async getTicketDetails(id: string): Promise<SupportTicket> {
    const response = await backend.get(`/support/tickets/${id}`);
    const t = response.data;
    return {
      ...t,
      source: t.createdByRole === 'VENDOR' ? 'Vendor' : 'Customer',
      lastActivity: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : 'N/A'
    };
  }

  async replyToTicket(ticketId: string, message: string): Promise<TicketMessage> {
    const response = await backend.post(`/support/tickets/${ticketId}/reply`, { message });
    return response.data;
  }

  async updateTicketStatus(ticketId: string, status: string): Promise<SupportTicket> {
    const response = await backend.put(`/admin/support/tickets/${ticketId}/status`, { status });
    return response.data;
  }

  async replyToTicketWithResolution(ticketId: string, resolution: string, reason: string, status: string): Promise<SupportTicket> {
    const response = await backend.post(`/admin/support/tickets/${ticketId}/reply`, {
      resolution,
      reason,
      status
    });
    return response.data;
  }

  // ═══════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════
  async getNotifications(userId: number) {
    const response = await backend.get(`/notifications/user/${userId}`);
    return response.data;
  }

  async markNotificationAsRead(id: number) {
    await backend.post(`/notifications/${id}/read`);
  }

  async markAllNotificationsRead(userId: number) {
    await backend.post(`/notifications/user/${userId}/read-all`);
  }

  // ═══════════════════════════════════════════
  // GEOGRAPHIC MANAGEMENT
  // ═══════════════════════════════════════════
  async getCities(): Promise<City[]> {
    const response = await backend.get('/admin/geo/cities');
    return response.data;
  }

  async createCity(name: string): Promise<City> {
    const response = await backend.post('/admin/geo/cities', { name });
    return response.data;
  }

  async updateCity(id: string, data: Partial<City>): Promise<City> {
    const response = await backend.put(`/admin/geo/cities/${id}`, data);
    return response.data;
  }

  async getZones(cityId: string): Promise<Zone[]> {
    const response = await backend.get(`/admin/geo/zones?cityId=${cityId}`);
    return response.data;
  }

  async createZone(cityId: string, name: string): Promise<Zone> {
    const response = await backend.post('/admin/geo/zones', { city: { id: cityId }, name });
    return response.data;
  }

  async getPincodes(zoneId: string): Promise<Pincode[]> {
    const response = await backend.get(`/admin/geo/pincodes?zoneId=${zoneId}`);
    return response.data;
  }

  async createPincode(zoneId: string, pincode: string): Promise<Pincode> {
    const response = await backend.post('/admin/geo/pincodes', { zone: { id: zoneId }, pincode });
    return response.data;
  }

  async assignFieldManagerAreas(userId: number | string, data: { cityIds?: string[], zoneIds?: string[], pincodeIds?: string[] }): Promise<void> {
    await backend.post(`/admin/geo/field-managers/${userId}/areas`, data);
  }

  async getAssignedAreas(userId: number | string): Promise<any[]> {
    const response = await backend.get(`/admin/geo/field-managers/${userId}/areas`);
    return response.data;
  }
  async getAllReviews(): Promise<Review[]> {
    const response = await backend.get('/admin/reviews');
    const { productReviews, shopReviews } = response.data;

    const mappedProductReviews: Review[] = (productReviews || []).map((r: any) => ({
      id: String(r.id),
      productId: String(r.productId || ''),
      productName: r.productName || 'Unknown Product',
      productImage: r.productImage || '',
      shopName: r.shopName || 'Unknown Shop',
      customerName: r.userName || 'Anonymous',
      rating: r.rating || 0,
      title: r.title || '',
      content: r.comment || '',
      date: r.date ? new Date(r.date).toLocaleDateString() : new Date().toLocaleDateString(),
      status: (r.isVerified || r.verified) ? 'Published' : 'Pending',
      likes: r.helpfulCount || 0,
      adminReply: r.adminReply || '',
      type: 'PRODUCT',
      isJiffyStreet: r.isJiffyStreet || false,
      isJiffyCafe: r.isJiffyCafe || false,
      images: r.images || [],
      videoUrl: r.videoUrl || ''
    }));

    const mappedShopReviews: Review[] = (shopReviews || []).map((r: any) => ({
      id: `shop-${r.id}`,
      productId: 'shop',
      productName: 'Shop Review',
      productImage: r.shopLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.shopName || 'Shop')}&background=6366f1&color=fff`,
      shopName: r.shopName || 'Unknown Shop',
      customerName: r.userName || 'Anonymous',
      rating: r.rating || 0,
      title: r.title || '',
      content: r.comment || '',
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      status: (r.isVerified || r.verified) ? 'Published' : 'Pending',
      likes: 0,
      adminReply: r.adminReply || '',
      type: 'SHOP',
      isJiffyStreet: false,
      isJiffyCafe: false,
      images: r.images || [],
      videoUrl: r.videoUrl || ''
    }));

    return [...mappedProductReviews, ...mappedShopReviews];
  }

  async getTransactions(): Promise<TransactionReportItem[]> {
    const response = await backend.get('/admin/transactions');
    return (response.data || []).map((t: any) => ({
      id: String(t.id),
      date: t.date ? new Date(t.date).toLocaleDateString() : new Date().toLocaleDateString(),
      type: t.type === 'credit' ? 'Payout' : 'Penalty', // Mapping to frontend types
      partyName: t.wallet?.user?.name || 'Unknown',
      amount: t.amount || 0,
      status: t.status === 'completed' ? 'Completed' : (t.status === 'pending' ? 'Pending' : 'Failed'),
      paymentMethod: 'Wallet',
      referenceId: `TXN-${t.id}`
    }));
  }

  async getDeliveryPartners(): Promise<DeliveryPartner[]> {
    const response = await backend.get('/admin/delivery-partners');
    return (response.data || []).map((u: any) => ({
      id: String(u.id),
      name: u.name,
      phone: u.phone || 'N/A',
      zone: 'All Zones', // Placeholder if not in user entity
      pincode: '000000',
      status: u.enabled ? 'Available' : 'Offline',
      activeOrders: 0,
      completedDeliveries: 0,
      rating: 5.0,
      avatarUrl: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`,
      walletBalance: u.walletBalance || 0
    }));
  }

  async getCustomers(): Promise<Customer[]> {
    const response = await backend.get('/admin/customers');
    return (response.data || []).map((u: any) => ({
      id: String(u.id), name: u.name,
      email: u.email,
      phone: u.phone || 'N/A',
      totalOrders: 0,
      joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      status: u.enabled ? 'Active' : 'Blocked',
      avatarUrl: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`
    }));
  }

  async updateReviewStatus(reviewId: string | number, status: 'PUBLISHED' | 'REJECTED'): Promise<any> {
    const isShop = String(reviewId).includes('shop-');
    const cleanId = String(reviewId).replace('shop-', '');
    const type = isShop ? 'SHOP' : 'PRODUCT';
    const response = await backend.patch(`/admin/reviews/${cleanId}/status?status=${status}&type=${type}`);
    return response.data;
  }

  async deleteReview(reviewId: string | number): Promise<any> {
    const isShop = String(reviewId).includes('shop-');
    const cleanId = String(reviewId).replace('shop-', '');
    const type = isShop ? 'SHOP' : 'PRODUCT';
    const response = await backend.delete(`/admin/reviews/${cleanId}?type=${type}`);
    return response.data;
  }

  async replyToReview(reviewId: string | number, reply: string): Promise<any> {
    const isShop = String(reviewId).includes('shop-');
    const cleanId = String(reviewId).replace('shop-', '');
    const type = isShop ? 'SHOP' : 'PRODUCT';
    const response = await backend.post(`/admin/reviews/${cleanId}/reply?type=${type}`, { reply });
    return response.data;
  }

  async getVendorPayouts(): Promise<VendorPaymentProfile[]> {
    const response = await backend.get('/admin/payments/vendors');
    return (response.data || []).map((v: any) => ({
      vendorId: String(v.vendorId),
      vendorName: `${v.shopName} (${v.ownerName})`,
      shopName: v.shopName,
      ownerName: v.ownerName,
      phone: v.phone || 'N/A',
      email: v.email || 'N/A',
      category: 'General',
      kycStatus: 'Verified',
      totalEarnings: v.walletBalance || 0,
      commissionDeducted: 0,
      refundsDeducted: 0,
      penalties: 0,
      tds: 0,
      netPayable: v.pendingPayout || 0,
      walletBalance: v.walletBalance || 0,
      status: v.pendingPayout > 0 ? 'Pending' : 'Completed',
      settlementCycle: 'Weekly',
      paymentMethod: 'Bank Transfer',
      lastPayoutDate: v.lastPayoutDate ? new Date(v.lastPayoutDate).toLocaleDateString() : 'N/A',
      bankDetails: {
        accountName: v.ownerName,
        bankName: 'N/A',
        accountNumber: 'N/A',
        ifsc: 'N/A'
      }
    }));
  }

  async getVendorWalletHistory(vendorId: string | number): Promise<any[]> {
    const response = await backend.get(`/admin/payments/vendors/${vendorId}/wallet-history`);
    return (response.data || []).map((tx: any) => ({
      id: String(tx.id),
      date: tx.date ? new Date(tx.date).toLocaleDateString() : new Date().toLocaleDateString(),
      amount: tx.amount,
      type: tx.type === 'credit' ? 'Credit' : 'Debit',
      reason: tx.description || 'Adjustment',
      addedBy: 'Admin',
      status: tx.status === 'completed' ? 'Success' : 'Failed'
    }));
  }

  async addWalletFunds(vendorId: string | number, amount: number, reason: string): Promise<any> {
    const response = await backend.post(`/admin/payments/vendors/${vendorId}/wallet/add`, { amount, reason });
    return response.data;
  }

  async updatePayoutStatus(vendorId: string | number, status: string, reason?: string): Promise<any> {
    const response = await backend.patch(`/admin/payments/vendors/${vendorId}/payout-status`, { status, reason });
    return response.data;
  }

  // ═══════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════
  async getCategories(): Promise<any[]> {
    const response = await backend.get('/admin/categories');
    return response.data || [];
  }

  async createCategory(category: any): Promise<any> {
    const response = await backend.post('/admin/categories', category);
    return response.data;
  }

  async updateCategory(id: string | number, updates: any): Promise<any> {
    const response = await backend.put(`/admin/categories/${id}`, updates);
    return response.data;
  }

  async deleteCategory(id: string | number): Promise<void> {
    await backend.delete(`/admin/categories/${id}`);
  }

  // ═══════════════════════════════════════════
  // BANNERS
  // ═══════════════════════════════════════════
  async getAdminBanners(position?: string): Promise<Banner[]> {
    const response = await backend.get('/admin/banners', { params: { position } });
    return (response.data || []).map((b: any) => ({
      ...b,
      id: String(b.id),
      type: b.position === 'Home' ? 'Homepage' : (b.position === 'Street' ? 'Shop' : b.position),
      status: b.isActive ? 'Active' : 'Inactive'
    }));
  }

  async createBanner(data: FormData): Promise<Banner> {
    const response = await backend.post('/admin/banners', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async updateBanner(id: string | number, data: FormData): Promise<Banner> {
    const response = await backend.put(`/admin/banners/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async deleteBanner(id: string | number): Promise<void> {
    await backend.delete(`/admin/banners/${id}`);
  }

  async updateBannerStatus(id: string | number, isActive: boolean): Promise<Banner> {
    const response = await backend.put(`/admin/banners/${id}/status`, { isActive });
    return response.data;
  }

  // ═══════════════════════════════════════════
  // COUPONS
  // ═══════════════════════════════════════════
  async getCoupons(): Promise<any[]> {
    const response = await backend.get('/admin/coupons');
    return response.data || [];
  }

  async createCoupon(coupon: any): Promise<any> {
    const response = await backend.post('/admin/coupons', coupon);
    return response.data;
  }

  async deleteCoupon(id: string | number): Promise<void> {
    await backend.delete(`/admin/coupons/${id}`);
  }

  // ═══════════════════════════════════════════
  // SUBSCRIPTIONS
  // ═══════════════════════════════════════════
  async getSubscriptionPlans(): Promise<any[]> {
    const response = await backend.get('/admin/subscription/plans');
    return response.data || [];
  }

  async createSubscriptionPlan(plan: any): Promise<any> {
    const response = await backend.post('/admin/subscription/plan', plan);
    return response.data;
  }

  async updateSubscriptionPlan(id: string | number, plan: any): Promise<any> {
    const response = await backend.put(`/admin/subscription/plan/${id}`, plan);
    return response.data;
  }

  async getSubscriptionUsers(): Promise<any[]> {
    const response = await backend.get('/admin/subscription/users');
    return response.data || [];
  }

  async getSubscriptionAnalytics(): Promise<any> {
    const response = await backend.get('/admin/subscription/analytics');
    return response.data;
  }

  // ═══════════════════════════════════════════
  // UPI QR VERIFICATION
  // ═══════════════════════════════════════════

  async getPendingUpiOrders(): Promise<any[]> {
    const response = await backend.get('/admin/orders/pending-upi');
    return response.data || [];
  }

  async verifyUpiPayment(orderId: string | number, approve: boolean): Promise<any> {
    const response = await backend.post(`/admin/orders/${orderId}/verify-upi?approve=${approve}`);
    return response.data;
  }

  // ═══════════════════════════════════════════
  // RETURNS & REPLACEMENTS
  // ═══════════════════════════════════════════
  async getAllReturnRequests(): Promise<any[]> {
    const response = await backend.get(`/admin/returns`);
    return response.data;
  }

  async updateReturnStatus(id: number | string, status: string, reason?: string): Promise<any> {
    const response = await backend.put(`/admin/returns/${id}/status`, { status, reason });
    return response.data;
  }
}

export const api = new JiffyAPI();
