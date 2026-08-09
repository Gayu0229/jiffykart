
import axios from 'axios';
import { Order, Product, Ticket, OrderItem, TicketMessage, Wallet, Transaction, Shop } from './types';

const backend = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
});

backend.interceptors.request.use((config) => {
  const token = localStorage.getItem('vendor_token');
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
      // Force logout on token expiration, invalid token, or account restriction
      console.warn(`[AUTH] Session invalidated (${status}). Clearing local storage.`);
      localStorage.removeItem('vendor_token');
      localStorage.removeItem('vendor_user');
      
      // Use window.location.href to ensure a clean state and trigger auth guards
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


/**
 * VendorAPI Service
 * Consolidates all backend communication.
 * Product endpoints use real backend; others use simulated data until backend is ready.
 */
class VendorAPI {
  private async request<T>(method: string, url: string, data?: any, config?: any): Promise<T> {
    const headers: any = config?.headers || {};
    if (data instanceof FormData) {
      // Let the browser set Content-Type with boundary for multipart
      headers['Content-Type'] = undefined;
    }
    const response = await backend.request({
      method,
      url,
      data,
      ...config,
      headers: { ...headers, ...config?.headers }
    });
    return response.data;
  }

  private async simulateRequest<T>(data: T, ms: number = 600): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(data), ms));
  }

  /* =========================
     DASHBOARD & ANALYTICS
     ========================= */
  async getDashboardStats() {
    return this.simulateRequest({
      salesTotal: 0,
      avgOrderValue: 0,
      totalOrders: 0,
      activeOrders: 0,
      openTickets: 0
    }, 100);
  }

  /* =========================
     SHOP MANAGEMENT
     ========================= */
  async getShop(): Promise<any> {
    // Uses the real /vendor/profile endpoint which returns { user, vendorProfile }
    const data: any = await this.request('GET', '/vendor/profile');
    const vp = data.vendorProfile;
    if (!vp) return null;
    return {
      id: 'shop',
      name: vp.shopName || '',
      status: vp.status === 'ACTIVE' ? 'Open' : 'Under Review',
      rating: 0,
      location: [vp.businessAddress, vp.city, vp.state].filter(Boolean).join(', '),
      joinedDate: '',
      // Pass through all vendor profile fields
      vendorProfile: vp
    };
  }

  async getVendorProfile(): Promise<any> {
    return this.request('GET', '/vendor/profile');
  }

  async updateShop(shopData: any) {
    const formData = new FormData();

    // Map frontend fields to backend expected fields
    if (shopData.title) formData.append('shopName', shopData.title);
    if (shopData.bio) formData.append('description', shopData.bio);
    if (shopData.deliveryTime) formData.append('deliveryTime', shopData.deliveryTime);
    if (shopData.costForTwo) formData.append('costForTwo', shopData.costForTwo);
    
    // Add missing address and category fields
    if (shopData.address) formData.append('address', shopData.address);
    if (shopData.area) formData.append('area', shopData.area);
    if (shopData.city) formData.append('city', shopData.city);
    if (shopData.postalCode) formData.append('pincode', shopData.postalCode);
    if (shopData.category) formData.append('category', shopData.category);
    if (shopData.businessType) formData.append('businessType', shopData.businessType);

    // Handle Files
    if (shopData.bannerFile) {
      formData.append('banner', shopData.bannerFile);
    }
    if (shopData.logoFile) {
      formData.append('logo', shopData.logoFile);
    }

    return this.request('PUT', '/vendor/shop', formData);
  }

  async uploadShopMedia(file: File) {
    console.log('[API] Uploading shop media:', file.name);
    // Return a placeholder or ideally perform a real upload if the endpoint exists
    return this.simulateRequest({ url: 'https://ui-avatars.com/api/?name=Shop+Logo&background=random&size=800' }, 500);
  }

  /* =========================
     PRODUCT CATALOG (REAL BACKEND)
     ========================= */
  async fetchProducts(): Promise<any[]> {
    return this.request('GET', '/vendor/products');
  }

  async fetchProductsByStatus(status: string): Promise<any[]> {
    return this.request('GET', `/vendor/products?status=${status}`);
  }

  async createProduct(productData: any) {
    if (!(productData instanceof FormData)) {
      const formData = new FormData();
      Object.keys(productData).forEach(key => {
        if (productData[key] !== null && productData[key] !== undefined) {
          formData.append(key, productData[key]);
        }
      });
      productData = formData;
    }
    return this.request('POST', '/vendor/products', productData);
  }

  async updateProduct(id: string | number, productData: any) {
    if (!(productData instanceof FormData)) {
      const formData = new FormData();
      Object.keys(productData).forEach(key => {
        if (productData[key] !== null && productData[key] !== undefined) {
          formData.append(key, productData[key]);
        }
      });
      productData = formData;
    }
    return this.request('PUT', `/vendor/products/${id}`, productData);
  }

  async deleteProduct(id: string | number) {
    return this.request('DELETE', `/vendor/products/${id}`);
  }

  async publishProduct(id: string | number) {
    return this.request('PUT', `/vendor/products/${id}/publish`);
  }

  async unpublishProduct(id: string | number) {
    return this.request('PUT', `/vendor/products/${id}/unpublish`);
  }

  async createProducts(products: any[]) {
    // Sequential or parallel creation
    return Promise.all(products.map(p => this.createProduct(p)));
  }

  async updateStock(id: string | number, newStock: number) {
    const formData = new FormData();
    formData.append('stockQuantity', newStock.toString());
    return this.request('PUT', `/vendor/products/${id}`, formData);
  }

  async fetchProductReviews(productId: string | number): Promise<any[]> {
    return this.request('GET', `/customer/reviews/product/${productId}`);
  }

  async fetchShopReviews(): Promise<any[]> {
    return this.request('GET', '/vendor/reviews');
  }

  async updateVariationStock(productId: string | number, variationId: string | number, newStock: number) {
    // Placeholder for variation stock update logic if backend supports it
    console.log(`[API] Updating variation ${variationId} of product ${productId} to stock ${newStock}`);
    return this.simulateRequest(true, 400);
  }

  /* =========================
     ORDER MANAGEMENT
     ========================= */
  async fetchOrders(): Promise<Order[]> {
    try {
      const orders = await this.request<any[]>('GET', '/vendor/orders');
      if (!orders || orders.length === 0) return [];

      return orders.map(o => ({
        id: `ORD-${o.id}`,
        date: o.date ? new Date(o.date).toLocaleDateString() : 'N/A',
        customerName: o.user?.name || 'Customer',
        customerEmail: o.user?.email || 'N/A',
        customerPhone: o.user?.phone || 'N/A',
        customerId: o.user?.id ? `C-${o.user.id}` : 'C-NEW',
        customerAvatar: o.user?.avatar,
        address: o.address || 'Saved Address',
        paymentStatus: o.paymentStatus || 'Pending',
        paymentProvider: o.paymentProvider || 'N/A',
        transactionId: o.transactionId || o.merchantTransactionId || 'N/A',
        orderStatus: o.status || o.orderStatus || 'Pending',
        itemsCount: o.items ? o.items.length : 0,
        totalPrice: o.total || 0,
        items: o.items ? o.items.map((i: any) => ({
          id: i.id.toString(),
          name: i.product?.name || 'Item',
          price: i.priceAtOrder || 0,
          quantity: i.quantity || 0,
          image: i.product?.image || '',
          sku: i.product?.id?.toString() || ''
        })) : []
      }));
    } catch (e) {
      console.error("Failed to fetch orders");
      return [];
    }
  }

  async acceptOrder(id: string): Promise<boolean> {
    const rawId = id.replace('ORD-', '');
    try {
      await this.request('PUT', `/vendor/orders/${rawId}/accept`);
      return true;
    } catch (e) {
      console.error("Link accept failed", e);
      return false;
    }
  }

  async rejectOrder(id: string): Promise<boolean> {
    const rawId = id.replace('ORD-', '');
    try {
      await this.request('PUT', `/vendor/orders/${rawId}/reject`);
      return true;
    } catch (e) {
      console.error("Link reject failed", e);
      return false;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<boolean> {
    const rawId = id.replace('ORD-', '');
    try {
      await this.request('PUT', `/vendor/orders/${rawId}/status`, null, { params: { status } });
      return true;
    } catch (e) {
      console.error("Status update failed", e);
      return false;
    }
  }

  async exportOrders(): Promise<Blob> {
    const response = await backend.get('/vendor/orders/export', {
      responseType: 'blob'
    });
    return response.data;
  }

  async updateTracking(id: string, carrier: string, trackingNumber: string): Promise<boolean> {
    console.log(`[API] Tracking updated for ${id}: ${carrier} - ${trackingNumber}`);
    return this.simulateRequest(true, 100);
  }

  async fetchCustomers(): Promise<any[]> {
    return this.request('GET', '/vendor/orders/customers');
  }

  /* =========================
     COUPON MANAGEMENT (REAL BACKEND)
     ========================= */
  async fetchCoupons(): Promise<any[]> {
    return this.request('GET', '/vendor/coupons');
  }

  async createCoupon(couponData: any) {
    return this.request('POST', '/vendor/coupons', couponData);
  }

  async deleteCoupon(id: number | string) {
    return this.request('DELETE', `/vendor/coupons/${id}`);
  }

  /* =========================
     WALLET & PAYOUTS
     ========================= */
  async getWalletStats(): Promise<Wallet> {
    return this.simulateRequest({
      balance: 0,
      pending: 0,
      currency: 'INR'
    });
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.simulateRequest([]);
  }

  async requestPayout(amount: number) {
    return this.simulateRequest({ success: true, reference: `PAY-${Date.now()}` }, 200);
  }

  /* =========================
     SUPPORT & TICKETS
     ========================= */
  async fetchTickets(): Promise<Ticket[]> {
    return this.request('GET', '/support/tickets/my');
  }

  async createTicket(request: { subject: string; category: string; description: string; orderId?: number; priority?: string }): Promise<Ticket> {
    return this.request('POST', '/support/tickets', request);
  }

  async addReply(ticketId: string, message: string, attachmentUrl?: string): Promise<TicketMessage> {
    return this.request('POST', `/support/tickets/${ticketId}/reply`, { message, attachmentUrl });
  }

  async fetchTicketDetails(ticketId: string): Promise<Ticket> {
    return this.request('GET', `/support/tickets/${ticketId}`);
  }

  /* =========================
     PROFILE & ACCOUNT
     ========================= */
  async getProfile() {
    return this.request('GET', '/vendor/profile');
  }

  async updateProfile(data: any) {
    return this.request('PUT', '/vendor/profile', data);
  }

  async updateProfileImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await backend.post('/users/profile-image', formData);
      if (response.data?.avatarUrl) {
        const storedUser = localStorage.getItem('vendor_user');
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.avatar = response.data.avatarUrl;
          localStorage.setItem('vendor_user', JSON.stringify(userObj));
        }
      }
      return response.data;
    } catch (e) {
      console.error("Failed to upload profile image", e);
      throw e;
    }
  }

  async deleteProfileImage() {
    try {
      const response = await backend.delete('/users/profile-image');

      // Update local storage
      const storedUser = localStorage.getItem('vendor_user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        delete userObj.avatar;
        localStorage.setItem('vendor_user', JSON.stringify(userObj));
      }

      return response.data;
    } catch (e) {
      console.error("Failed to delete profile image", e);
      throw e;
    }
  }


  async updateAvailability(isAvailable: boolean) {
    return this.request('PUT', '/vendor/profile/availability', { isAvailable });
  }

  /* =========================
     NOTIFICATIONS
     ========================= */
  async getNotifications(userId: number) {
    return this.request<any[]>('GET', `/notifications/user/${userId}`);
  }

  async markNotificationAsRead(id: number) {
    return this.request('POST', `/notifications/${id}/read`);
  }

  async markAllNotificationsRead(userId: number) {
    return this.request('POST', `/notifications/user/${userId}/read-all`);
  }

  /* =========================
     AI ASSISTANT
     ========================= */
  async generateAiDescription(productName: string): Promise<string> {
    const data: any = await this.request('POST', '/vendor/ai/product-description', { productName });
    return data.description;
  }

  async getAiPriceRecommendation(productName: string, currentPrice: number): Promise<string> {
    const data: any = await this.request('POST', '/vendor/ai/price-recommendation', { productName, currentPrice });
    return data.recommendation;
  }

  async getAiReplySuggestion(message: string): Promise<string> {
    const data: any = await this.request('POST', '/vendor/ai/reply-suggestion', { message });
    return data.suggestion;
  }

  async getAiSalesInsights(): Promise<string> {
    const data: any = await this.request('GET', '/vendor/ai/sales-insights');
    return data.insights;
  }

  async getAiInventoryAlerts(): Promise<string> {
    const data: any = await this.request('GET', '/vendor/ai/inventory-alerts');
    return data.alerts;
  }

  /* =========================
     HYPERLOCAL MANAGEMENT
     ========================= */
  async fetchCities(): Promise<any[]> {
    return this.request('GET', '/public/locations/cities');
  }

  async fetchLocationProductDetails(productId: string | number): Promise<any[]> {
    return this.request('GET', `/api/location-products/product/${productId}`);
  }

  async updateLocationProductDetail(productId: string | number, cityId: string, data: any) {
    return this.request('POST', `/api/location-products`, {
      product: { id: productId },
      city: { id: cityId },
      ...data
    });
  }

  /* =========================
     RETURNS & REPLACEMENTS
     ========================= */
  async fetchReturnRequests(vendorId: string | number): Promise<any[]> {
    return this.request('GET', `/vendor/returns?vendorId=${vendorId}`);
  }

  async updateReturnStatus(id: number | string, status: string, reason?: string): Promise<any> {
    return this.request('PUT', `/vendor/returns/${id}/status`, { status, reason });
  }
}

/**
 * AUTHENTICATION SERVICE
 */
export const VendorAuthApi = {
  sendOtp: async (phone: string) => {
    const response = await backend.post('/auth/vendor/send-otp', { phone });
    return response.data;
  },
  sendEmailOtp: async (email: string) => {
    const response = await backend.post('/auth/vendor/email/send-otp', { email });
    return response.data;
  },
  verifyOtp: async (phone: string, otp: string) => {
    const response = await backend.post('/auth/login/verify-otp', { phone, otp });
    if (response.data?.token) {
      // Only allow VENDOR role to access the vendor dashboard
      const userRole = response.data.user?.role;
      if (userRole !== 'VENDOR') {
        throw { response: { data: { message: 'Access denied. Only vendor accounts can log in to the Vendor Dashboard.' } } };
      }
      localStorage.removeItem('vendor_token');
      localStorage.removeItem('vendor_user');
      localStorage.setItem('vendor_token', response.data.token);
      localStorage.setItem('vendor_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  verifyEmailOtp: async (email: string, otp: string) => {
    const response = await backend.post('/auth/vendor/email/verify-otp', { email, otp });
    if (response.data?.token) {
      // Only allow VENDOR role to access the vendor dashboard
      const userRole = response.data.user?.role;
      if (userRole !== 'VENDOR') {
        throw { response: { data: { message: 'Access denied. Only vendor accounts allowed.' } } };
      }
      localStorage.removeItem('vendor_token');
      localStorage.removeItem('vendor_user');
      localStorage.setItem('vendor_token', response.data.token);
      localStorage.setItem('vendor_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  passwordLogin: async (identifier: string, password: string) => {
    const response = await backend.post('/auth/vendor/login/password', { identifier, password });
    if (response.data?.token) {
      // Only allow VENDOR role to access the vendor dashboard
      const userRole = response.data.user?.role;
      if (userRole !== 'VENDOR') {
        throw { response: { data: { message: 'Access denied. Only vendor accounts can log in to the Vendor Dashboard.' } } };
      }
      localStorage.removeItem('vendor_token');
      localStorage.removeItem('vendor_user');
      localStorage.setItem('vendor_token', response.data.token);
      localStorage.setItem('vendor_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  resetPassword: async (email: string, password: string) => {
    const response = await backend.post('/auth/password-reset', { email, password });
    return response.data;
  },
  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await backend.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  }
};

export const api = new VendorAPI();
