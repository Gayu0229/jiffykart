import { Shop, Product, Order, Address, PaymentMethod, Wallet, Transaction, Review, ReviewSummary, CartItem, SupportTicket, TicketMessage } from '../types';
import api from './axiosConfig';

// ─── DATA MAPPING HELPERS ───
const mapBackendOrderToFrontend = (o: any): Order => {
  return {
    id: o.id?.toString() || '',
    shop_id: o.shop?.id?.toString() || '',
    shop_name: o.shop?.shopName || o.shop?.name || '',
    shop_image: o.shop?.logoUrl || o.shop?.image || '',
    shop_location: o.shop?.businessAddress || o.shop?.location || '',
    items: o.items ? o.items.map((i: any) => ({
      product: {
        id: i.product?.id?.toString() || '',
        name: i.product?.name || 'Item',
        price: i.product?.price || 0,
        image: i.product?.image || '',
        description: i.product?.description || '',
        category: i.product?.category || '',
        rating: i.product?.rating || 0,
        votes: i.product?.votes || 0
      },
      quantity: i.quantity || 1,
      priceAtOrder: i.priceAtOrder || i.product?.price || 0
    })) : [],
    total: o.total || 0,
    date: o.date ? (typeof o.date === 'string' ? o.date : new Date(o.date).toLocaleDateString()) : 'Recently',
    status: mapBackendStatusToFrontend(o.orderStatus || o.status),
    orderStatus: o.orderStatus || o.status, // For OrderTracking polling
    returnRequest: o.returnRequest ? {
      id: o.returnRequest.id,
      status: o.returnRequest.status,
      reason: o.returnRequest.reason,
      type: o.returnRequest.type,
      rejectionReason: o.returnRequest.rejectionReason,
      createdAt: o.returnRequest.createdAt
    } : undefined
  };
};

const mapBackendStatusToFrontend = (status: string | undefined): Order['status'] => {
  if (!status) return 'Order Received';
  const upper = status.toUpperCase().replace(/\s+/g, '_');
  switch (upper) {
    case 'ORDER_RECEIVED': return 'Order Received';
    case 'ORDER_CONFIRMED':
    case 'CONFIRMED': return 'Order Confirmed';
    case 'PACKED_READY':
    case 'PROCESSING': return 'Packed & Ready';
    case 'OUT_FOR_DELIVERY':
    case 'SHIPPED': return 'Out for Delivery';
    case 'DELIVERED':
    case 'RETURN_PENDING':
    case 'RETURN_APPROVED':
    case 'RETURN_REJECTED':
    case 'RETURN_COMPLETED':
    case 'REPLACEMENT_PENDING':
    case 'REPLACEMENT_APPROVED':
    case 'COMPLETED': return 'Delivered';
    case 'CANCELLED':
    case 'REJECTED': return 'Cancelled';
    default: return 'Order Received';
  }
};

const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api$/, '');

const resolveImg = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return BACKEND_URL + (url.startsWith('/') ? url : '/' + url);
};

const mapBackendProductToFrontend = (p: any): Product => {
  return {
    id: String(p.id),
    name: p.name || '',
    price: p.price || 0,
    original_price: p.mrp || p.originalPrice || p.original_price || p.price,
    description: p.description || '',
    image: resolveImg(p.image) || '',
    images: (p.images && p.images.length > 0) ? p.images.map(resolveImg) : [resolveImg(p.image)],
    category: p.category || '',
    rating: p.rating || 0,
    votes: p.votes || 0,
    is_best_seller: p.isBestSeller || p.is_best_seller || false,
    shop_id: p.shop?.id ? String(p.shop.id) : (p.shopId ? String(p.shopId) : p.shop_id),
  } as Product;
};

const mapBackendShopToFrontend = (s: any): Shop => {
  const shopName = s.name || 'Shop';
  const nameForAvatar = encodeURIComponent(shopName);
  const defaultAvatar = `https://ui-avatars.com/api/?name=${nameForAvatar}&background=random&size=200`;

  const banner = resolveImg(s.bannerUrl || s.banner_url) || resolveImg(s.image) || '';
  const logo = resolveImg(s.logoUrl || s.logo_url) || defaultAvatar;

  return {
    id: String(s.id),
    name: shopName,
    rating: s.rating || 0,
    rating_count: s.ratingCount || s.rating_count || '0',
    delivery_time: s.deliveryTime || s.delivery_time || '30-45 min',
    cost_for_two: s.costForTwo || s.cost_for_two || '',
    // 'image' is used for listing cards (should show banner/representative image)
    image: banner,
    // 'logo' is the profile icon inside the shop page
    logo: logo,
    banner_url: banner,
    tags: Array.isArray(s.tags) ? s.tags : [],
    distance: s.distance || '2.5 km',
    location: s.location || s.address || '',
    city: s.city || '',
    area: s.area || '',
    category: s.category || '',
    offers: Array.isArray(s.offers) ? s.offers : [],
    active_coupons: Array.isArray(s.activeCoupons) ? s.activeCoupons.map((c: any) => ({
      id: String(c.id),
      code: c.code,
      discountType: c.discountType,
      value: c.value,
      description: c.discountType === 'Percentage' ? `${c.value}% OFF` : `&#8377;${c.value} OFF`
    })) : [],
    shop_type: s.shopType || s.shop_type || 'Official',
    isOpen: s.isActive !== undefined ? s.isActive : true,
    approvalStatus: s.approvalStatus,
    kycStatus: s.kycStatus,
    vendorType: s.vendorType,
  };
};

// In-memory session state with localStorage persistence
let authToken: string | null = localStorage.getItem('jiffykart_token');
let authUser: any | null = JSON.parse(localStorage.getItem('jiffykart_user') || 'null');

export const ApiService = {
  getAuthToken: () => authToken,
  getAuthUser: () => authUser,

  _saveSession: (token: string, user: any) => {
    authToken = token;
    authUser = user;
    localStorage.setItem('jiffykart_token', token);
    localStorage.setItem('jiffykart_user', JSON.stringify(user));
  },

  _clearSession: () => {
    authToken = null;
    authUser = null;
    localStorage.removeItem('jiffykart_token');
    localStorage.removeItem('jiffykart_user');
  },

  // ─── LOGIN FLOW (Mobile OTP) ───
  sendLoginOtp: async (phone: string) => {
    try {
      const response = await api.post('/auth/login/send-otp', { phone });
      return response.data;
    } catch (e) {
      console.error("Login OTP send failed", e);
      throw e;
    }
  },

  verifyLoginOtp: async (phone: string, otp: string) => {
    try {
      const response = await api.post('/auth/login/verify-otp', { phone, otp });
      if (response.data?.token) {
        ApiService._saveSession(response.data.token, response.data.user);
      }
      return response.data;
    } catch (e) {
      console.error("Login OTP verification failed", e);
      throw e;
    }
  },

  // ─── LOGIN FLOW (Email OTP) ───
  sendEmailLoginOtp: async (email: string) => {
    try {
      const response = await api.post('/auth/login/email/send-otp', { email });
      return response.data;
    } catch (e) {
      console.error("Login Email OTP send failed", e);
      throw e;
    }
  },

  verifyEmailLoginOtp: async (email: string, otp: string) => {
    try {
      const response = await api.post('/auth/login/email/verify-otp', { email, otp });
      if (response.data?.token) {
        ApiService._saveSession(response.data.token, response.data.user);
      }
      return response.data;
    } catch (e) {
      console.error("Login Email OTP verification failed", e);
      throw e;
    }
  },

  // ─── REGISTRATION FLOW (Email OTP) ───
  signup: async (userData: any) => {
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (e) {
      console.error("Signup failed", e);
      throw e;
    }
  },

  verifyEmailOtp: async (email: string, otp: string) => {
    try {
      const response = await api.post('/auth/verify-email-otp', { email, otp });
      return response.data;
    } catch (e) {
      console.error("Email OTP verification failed", e);
      throw e;
    }
  },

  resendEmailOtp: async (email: string) => {
    try {
      const response = await api.post('/auth/resend-email-otp', { email });
      return response.data;
    } catch (e) {
      console.error("Email OTP resend failed", e);
      throw e;
    }
  },

  login: async (credentials: any) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data?.token) {
        ApiService._saveSession(response.data.token, response.data.user);
      }
      return response.data;
    } catch (e) {
      console.error("Login failed", e);
      throw e;
    }
  },

  logout: () => {
    ApiService._clearSession();
  },

  getProfile: async () => {
    if (!authUser?.id) return authUser || null;
    try {
      console.debug("Fetching profile for ID:", authUser.id);
      const response = await api.get(`/users/profile`);
      if (response.data) {
        ApiService._saveSession(authToken || '', response.data);
      }
      return response.data;
    } catch (e) {
      console.error("Get profile failed", e);
      return authUser || null;
    }
  },

  updateProfileImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await api.post('/users/profile-image', formData);
      if (response.data?.avatarUrl && authUser) {
        authUser.avatar = response.data.avatarUrl;
        ApiService._saveSession(authToken || '', authUser);
      }
      return response.data;
    } catch (e) {
      console.error("Failed to upload profile image", e);
      throw e;
    }
  },

  updateProfile: async (userData: any) => {
    if (!authUser?.id) throw new Error("Not authenticated");
    try {
      console.debug("Updating profile (safe fields) for ID:", authUser.id, userData);
      // SECURITY: Only send safe fields. Email/phone require OTP verification.
      const payload = {
        name: userData.name,
        gender: userData.gender
      };
      const response = await api.put(`/users/update`, payload);
      const data = response.data;
      const updatedUser = data.user || data;
      ApiService._saveSession(authToken || '', updatedUser);
      return data;
    } catch (e) {
      console.error("Update profile failed", e);
      throw e;
    }
  },

  // ─── SECURE CONTACT CHANGE (OTP-verified) ───

  requestEmailChange: async (newEmail: string) => {
    if (!authUser?.id) throw new Error("Not authenticated");
    try {
      const response = await api.post(`/users/change-email`, { newValue: newEmail });
      return response.data;
    } catch (e) {
      console.error("Request email change failed", e);
      throw e;
    }
  },

  requestPhoneChange: async (newPhone: string) => {
    if (!authUser?.id) throw new Error("Not authenticated");
    try {
      const response = await api.post(`/users/change-phone`, { newValue: newPhone });
      return response.data;
    } catch (e) {
      console.error("Request phone change failed", e);
      throw e;
    }
  },

  verifyContactChange: async (otp: string, type: string) => {
    if (!authUser?.id) throw new Error("Not authenticated");
    try {
      const response = await api.post(`/users/verify-contact-change`, { otp, type });
      const data = response.data;
      const updatedUser = data.user || data;
      const newToken = data.newToken;
      // If phone changed, backend issues fresh JWT — swap it
      ApiService._saveSession(newToken || authToken || '', updatedUser);
      return data;
    } catch (e) {
      console.error("Verify contact change failed", e);
      throw e;
    }
  },

  syncProfile: async (user: any) => {
    if (!user || !user.id) return;
    try {
      await api.put(`/users/${user.id}`, user);
    } catch (e) { }
  },

  // Shops
  getShops: async (filters?: { category?: string; city?: string; area?: string; vendorType?: string }): Promise<Shop[]> => {
    try {
      const response = await api.get('/shops', { params: filters });
      const raw = response.data || [];
      return raw.map(mapBackendShopToFrontend);
    } catch (err) {
      return [];
    }
  },

  getZones: async (cityId: string): Promise<any[]> => {
    try {
      const response = await api.get('/public/locations/zones', { params: { cityId } });
      return response.data || [];
    } catch (e) {
      return [];
    }
  },

  getShopById: async (shopId: string): Promise<Shop | null> => {
    try {
      const response = await api.get(`/customer/shops/${shopId}`);
      return response.data ? mapBackendShopToFrontend(response.data) : null;
    } catch (e) {
      return null;
    }
  },

  // Products
  getAllProducts: async (filters?: any): Promise<Product[]> => {
    try {
      const response = await api.get('/customer/products', { params: filters });
      const raw = response.data || [];
      return raw.map(mapBackendProductToFrontend);
    } catch (e) {
      return [];
    }
  },

  getProductById: async (id: string, zoneId?: string | null): Promise<Product | null> => {
    try {
      const response = await api.get(`/customer/products/${id}`, { params: { zoneId } });
      const data = response.data;
      return data ? mapBackendProductToFrontend(data) : null;
    } catch (e) {
      return null;
    }
  },

  getProductsByShop: async (shopId: string, zoneId?: string | null): Promise<Product[]> => {
    try {
      const response = await api.get(`/shops/${shopId}/products`, { params: { zoneId } });
      const raw = response.data || [];
      return raw.map(mapBackendProductToFrontend);
    } catch (e) {
      return [];
    }
  },

  getReviews: async (shopId: string): Promise<Review[]> => {
    try {
      const response = await api.get(`/shops/${shopId}/reviews`);
      const raw = response.data || [];
      return raw.map((r: any) => ({
        id: String(r.id),
        user: r.userName || 'User',
        rating: r.rating || 0,
        comment: r.comment || '',
        title: r.title || '',
        images: r.images || [],
        videoUrl: r.videoUrl || '',
        criteriaRatings: r.criteriaRatings || {},
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent',
        isVerified: r.isVerified || false
      }));
    } catch (e) {
      console.error("Fetch reviews failed", e);
      return [];
    }
  },

  addShopReview: async (shopId: string, reviewData: any): Promise<Review> => {
    try {
      const response = await api.post(`/customer/shops/${shopId}/reviews`, reviewData);
      const r = response.data;
      return {
        id: String(r.id),
        user: r.userName || 'User',
        rating: r.rating || 0,
        comment: r.comment || '',
        title: r.title || '',
        images: r.images || [],
        videoUrl: r.videoUrl || '',
        criteriaRatings: r.criteriaRatings || {},
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent',
        isVerified: r.isVerified || false
      };
    } catch (e) {
      console.error("Add shop review failed", e);
      throw e;
    }
  },

  addReview: async (reviewData: any): Promise<Review> => {
    try {
      const payload = {
        ...reviewData,
        shopId: Number(reviewData.shopId)
      };
      const response = await api.post(`/customer/reviews`, payload);
      const r = response.data;
      return {
        id: String(r.id),
        user: r.userName || 'User',
        userId: r.userId,
        rating: r.rating || 0,
        comment: r.comment || '',
        title: r.title || '',
        images: r.images || [],
        videoUrl: r.videoUrl || '',
        criteriaRatings: r.criteriaRatings || {},
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Just now',
        isVerified: r.isVerified || false
      };
    } catch (e) {
      console.error("Failed to add review", e);
      throw e;
    }
  },

  getProductReviews: async (productId: string): Promise<Review[]> => {
    try {
      const response = await api.get(`/customer/reviews/product/${productId}`);
      const raw = response.data || [];
      return raw.map((r: any) => ({
        id: String(r.id),
        user: r.userName || 'User',
        userId: r.userId,
        rating: r.rating || 0,
        comment: r.comment || '',
        title: r.title || '',
        images: r.images || [],
        videoUrl: r.videoUrl || '',
        criteriaRatings: r.criteriaRatings || {},
        date: r.date ? new Date(r.date).toLocaleDateString() : 'Recent',
        isVerified: r.isVerified || false
      }));
    } catch (e) {
      console.error("Fetch product reviews failed", e);
      return [];
    }
  },

  getShopProductReviews: async (shopId: string | number): Promise<Review[]> => {
    try {
      const response = await api.get(`/customer/reviews/product/shop/${shopId}`);
      const raw = response.data || [];
      return raw.map((r: any) => ({
        id: String(r.id),
        user: r.userName || 'User',
        userId: r.userId,
        rating: r.rating || 0,
        comment: r.comment || '',
        title: r.title || '',
        productName: r.product?.name || 'Product',
        productImage: r.product?.image || '',
        images: r.images || [],
        videoUrl: r.videoUrl || '',
        criteriaRatings: r.criteriaRatings || {},
        date: r.date ? new Date(r.date).toLocaleDateString() : 'Recent',
        isVerified: r.isVerified || false
      }));
    } catch (e) {
      console.error("Fetch shop product reviews failed", e);
      return [];
    }
  },

  addProductReview: async (productId: string, reviewData: any): Promise<Review> => {
    try {
      const payload = {
        productId: Number(productId),
        rating: reviewData.rating,
        comment: reviewData.comment,
        title: reviewData.title,
        videoUrl: reviewData.videoUrl,
        images: reviewData.images,
        criteriaRatings: reviewData.criteriaRatings
      };
      const response = await api.post(`/customer/reviews/product`, payload);
      const r = response.data;
      return {
        id: String(r.id),
        user: r.userName || 'User',
        userId: r.userId,
        rating: r.rating || 0,
        comment: r.comment || '',
        title: r.title || '',
        images: r.images || [],
        videoUrl: r.videoUrl || '',
        criteriaRatings: r.criteriaRatings || {},
        date: r.date ? new Date(r.date).toLocaleDateString() : 'Just now',
        isVerified: r.isVerified || false
      };
    } catch (e) {
      console.error("Failed to add product review", e);
      throw e;
    }
  },

  editProductReview: async (reviewId: string, reviewData: any): Promise<Review> => {
    try {
      const response = await api.put(`/customer/reviews/product/${reviewId}`, reviewData);
      const r = response.data;
      return {
        id: String(r.id),
        user: r.userName || 'User',
        userId: r.userId,
        rating: r.rating || 0,
        comment: r.comment || '',
        title: r.title || '',
        images: r.images || [],
        videoUrl: r.videoUrl || '',
        criteriaRatings: r.criteriaRatings || {},
        date: r.date ? new Date(r.date).toLocaleDateString() : 'Updated',
        isVerified: r.isVerified || false
      };
    } catch (e) {
      console.error("Failed to edit product review", e);
      throw e;
    }
  },

  getProductReviewSummary: async (productId: string): Promise<ReviewSummary> => {
    try {
      const response = await api.get(`/customer/reviews/product/${productId}/summary`);
      return response.data;
    } catch (e) {
      console.error("Fetch product review summary failed", e);
      throw e;
    }
  },

  getJiffyStreetProducts: async (zoneId?: string | null): Promise<Product[]> => {
    try {
      const response = await api.get('/customer/products/jiffy-street', { params: { zoneId } });
      const raw = response.data || [];
      return raw.map(mapBackendProductToFrontend);
    } catch (e) {
      return [];
    }
  },

  getJiffyCafeProducts: async (zoneId?: string | null): Promise<Product[]> => {
    try {
      const response = await api.get('/customer/products/jiffy-cafe', { params: { zoneId } });
      const raw = response.data || [];
      return raw.map(mapBackendProductToFrontend);
    } catch (e) {
      return [];
    }
  },

  // Cart API
  getCart: async (): Promise<CartItem[]> => {
    try {
      const userId = authUser?.id;
      if (!userId) return [];
      const response = await api.get('/customer/cart', { params: { userId } });
      const raw = response.data || [];
      return raw.map((item: any) => ({
        ...item,
        product: mapBackendProductToFrontend(item.product)
      }));
    } catch (e) {
      return [];
    }
  },

  addToCartApi: async (productId: string, quantity: number) => {
    try {
      const response = await api.post('/customer/cart/add', { productId, quantity });
      return response.data;
    } catch (e) {
      return { success: false };
    }
  },

  updateCartItem: async (productId: string, quantity: number) => {
    try {
      const response = await api.put('/customer/cart/update', { productId, quantity });
      return response.data;
    } catch (e) {
      return { success: false };
    }
  },

  removeFromCartApi: async (itemId: string) => {
    try {
      const response = await api.delete(`/customer/cart/remove/${itemId}`);
      return response.data;
    } catch (e) {
      return { success: false };
    }
  },

  // Order Placement
  placeOrder: async (orderData: any): Promise<Order> => {
    try {
      const payload = {
        userId: authUser?.id,
        shopId: orderData.shop_id ? Number(orderData.shop_id) : null,
        address: orderData.shipping_address || 'Default Address',
        paymentMethod: orderData.payment_method || 'COD',
        items: orderData.cart_data ? (orderData.cart_data as any[]).map((item: any) => ({
          productId: Number(item.product.id),
          quantity: item.quantity
        })) : []
      };
      const response = await api.post('/customer/orders/create', payload);
      return response.data;
    } catch (e) {
      throw e;
    }
  },

  initiatePhonePePayment: async (orderData: any): Promise<any> => {
    try {
      const payload = {
        userId: authUser?.id,
        shopId: orderData.shop_id ? Number(orderData.shop_id) : null,
        address: orderData.shipping_address || 'Default Address',
        paymentMethod: orderData.payment_method || 'COD',
        items: orderData.cart_data ? (orderData.cart_data as any[]).map((item: any) => ({
          productId: Number(item.product.id),
          quantity: item.quantity
        })) : []
      };
      const response = await api.post('/checkout/phonepe/initiate', payload);
      return response.data; // contains data.instrumentResponse.redirectInfo.url
    } catch (e) {
      throw e;
    }
  },

  checkPhonePeStatus: async (merchantTransactionId: string): Promise<any> => {
    try {
      const response = await api.get(`/api/payment/phonepe/status/${merchantTransactionId}`);
      return response.data;
    } catch (e) {
      console.error("Status check failed", e);
      throw e;
    }
  },

  initiateUpiPayment: async (orderData: any): Promise<any> => {
    try {
      const payload = {
        userId: authUser?.id,
        shopId: orderData.shop_id ? Number(orderData.shop_id) : null,
        address: orderData.shipping_address || 'Default Address',
        paymentMethod: 'UPI_QR',
        zoneId: orderData.zone_id || null,
        items: orderData.cart_data ? (orderData.cart_data as any[]).map((item: any) => ({
          productId: Number(item.product.id),
          quantity: item.quantity
        })) : []
      };
      const response = await api.post('/customer/checkout/upi/initiate', payload);
      return response.data;
    } catch (e) {
      throw e;
    }
  },

  submitUpiTransactionId: async (merchantTransactionId: string, transactionId: string): Promise<any> => {
    try {
      const response = await api.post('/customer/checkout/upi/submit-txn', { merchantTransactionId, transactionId });
      return response.data;
    } catch (e) {
      throw e;
    }
  },

  getOrders: async (): Promise<Order[]> => {
    if (!authUser?.id) return [];
    try {
      const response = await api.get(`/customer/orders`);
      const data = response.data || [];
      return Array.isArray(data) ? data.map(mapBackendOrderToFrontend) : [];
    } catch (e) {
      console.error("Fetch orders failed", e);
      return [];
    }
  },

  getOrder: async (orderId: string): Promise<Order> => {
    try {
      const response = await api.get(`/customer/orders/${orderId}`);
      return mapBackendOrderToFrontend(response.data);
    } catch (e) {
      console.error("Fetch order detail failed", e);
      throw e;
    }
  },

  createReturnRequest: async (data: any): Promise<any> => {
    try {
      const response = await api.post('/customer/returns/request', data);
      return response.data;
    } catch (e) {
      console.error("Failed to create return request", e);
      throw e;
    }
  },

  getAddresses: async (userId: string): Promise<Address[]> => {
    try {
      const response = await api.get(`/users/${userId}/addresses`);
      const data = response.data || [];
      return data.map((addr: any) => ({
        id: addr.id,
        type: addr.type,
        address_line1: addr.addressLine1 || addr.address_line1,
        address_line2: addr.addressLine2 || addr.address_line2,
        is_default: addr.isDefault || addr.is_default
      }));
    } catch (e) {
      return [];
    }
  },

  addAddress: async (userId: string, addressData: any): Promise<Address> => {
    try {
      const response = await api.post(`/users/${userId}/addresses`, addressData);
      return response.data;
    } catch (e) {
      throw e;
    }
  },

  updateAddress: async (userId: string, addressId: string, addressData: any): Promise<Address> => {
    try {
      const response = await api.put(`/users/${userId}/addresses/${addressId}`, addressData);
      return response.data;
    } catch (e) {
      throw e;
    }
  },

  deleteAddress: async (userId: string, addressId: string): Promise<boolean> => {
    try {
      await api.delete(`/users/${userId}/addresses/${addressId}`);
      return true;
    } catch (e) {
      return false;
    }
  },

  getPaymentMethods: async (userId: string): Promise<PaymentMethod[]> => {
    try {
      const response = await api.get(`/customer/payments`);
      return response.data || [];
    } catch (e) {
      return [];
    }
  },

  addPaymentMethod: async (methodData: any): Promise<PaymentMethod> => {
    try {
      const response = await api.post(`/customer/payments`, methodData);
      return response.data;
    } catch (e) {
      throw e;
    }
  },

  getWallet: async (userId: string): Promise<Wallet> => {
    try {
      const response = await api.get(`/wallet/${userId}`);
      return response.data;
    } catch (e) {
      return { balance: 0, user_id: userId, transactions: [] };
    }
  },

  updateWallet: async (userId: string, amount: number, type: 'credit' | 'debit', description: string): Promise<Wallet> => {
    try {
      const response = await api.post(`/wallet/transaction`, { userId, amount, type, description });
      return response.data;
    } catch (e) {
      return { balance: 0, user_id: userId, transactions: [] };
    }
  },

  getCurrentLocation: async (): Promise<{ lat: number, lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null)
      );
    });
  },

  // ─── SUPPORT API ───
  fetchTickets: async (): Promise<SupportTicket[]> => {
    try {
      const response = await api.get('/support/tickets/my');
      return response.data || [];
    } catch (e) {
      console.error("Fetch support tickets failed", e);
      return [];
    }
  },

  getTicketDetails: async (id: string): Promise<SupportTicket | null> => {
    try {
      const response = await api.get(`/support/tickets/${id}`);
      return response.data || null;
    } catch (e) {
      console.error("Get ticket details failed", e);
      return null;
    }
  },

  createTicket: async (data: any): Promise<SupportTicket> => {
    try {
      const response = await api.post('/support/tickets', data);
      return response.data;
    } catch (e) {
      console.error("Create ticket failed", e);
      throw e;
    }
  },

  addReply: async (ticketId: string, message: string): Promise<TicketMessage> => {
    try {
      const response = await api.post(`/support/tickets/${ticketId}/reply`, { message });
      return response.data;
    } catch (e) {
      console.error("Add reply failed", e);
      throw e;
    }
  },

  // ─── NOTIFICATIONS ───
  getNotifications: async (userId: number) => {
    try {
      const response = await api.get(`/notifications/user/${userId}`);
      return response.data;
    } catch (e) {
      console.error("Failed to fetch notifications", e);
      return [];
    }
  },

  markNotificationAsRead: async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      return true;
    } catch (e) {
      console.error("Failed to mark notification as read", e);
      return false;
    }
  },

  deleteProfileImage: async () => {
    try {
      await api.delete('/users/profile-image');
      return true;
    } catch (e) {
      console.error("Failed to delete profile image", e);
      return false;
    }
  },


  markAllNotificationsRead: async (userId: number) => {
    try {
      await api.post(`/notifications/user/${userId}/read-all`);
      return true;
    } catch (e) {
      console.error("Failed to mark all as read", e);
      return false;
    }
  },

  // ─── COUPONS ───
  getShopCoupons: async (shopId: string | number) => {
    try {
      const response = await api.get(`/public/coupons/shop/${shopId}`);
      return response.data || [];
    } catch (e) {
      console.error("Failed to fetch shop coupons", e);
      return [];
    }
  },

  validateCoupon: async (code: string, orderTotal: number, shopId?: string | number) => {
    try {
      const response = await api.post('/public/coupons/validate', { code, orderTotal, shopId });
      return response.data;
    } catch (e: any) {
      throw new Error(e.response?.data?.error || "Failed to validate coupon");
    }
  },

  // ─── SUBSCRIPTIONS ───
  getSubscriptionPlans: async () => {
    try {
      const response = await api.get('/subscriptions/plans');
      return response.data || [];
    } catch (e) {
      console.error("Failed to fetch subscription plans", e);
      return [];
    }
  },

  purchaseSubscription: async (planId: number) => {
    const response = await api.post('/subscriptions/purchase', { planId });
    return response.data;
  },

  getMySubscription: async () => {
    try {
      const response = await api.get('/subscriptions/my');
      return response.data;
    } catch (e) {
      console.error("Failed to fetch subscription", e);
      return { planName: 'Free', status: 'NONE' };
    }
  },

  cancelSubscription: async () => {
    const response = await api.post('/subscriptions/cancel');
    return response.data;
  },

  getSubscriptionStatus: async () => {
    try {
      const response = await api.get('/subscriptions/status');
      return response.data;
    } catch (e) {
      console.error("Failed to fetch subscription status", e);
      return { active: false, planName: 'Free' };
    }
  },

  // ─── HYPERLOCAL & BLOGS ───
  getLocations: async () => {
    try {
      const response = await api.get('/public/locations/cities');
      return response.data || [];
    } catch (e) {
      console.error("Failed to fetch locations", e);
      return [];
    }
  },

  getFeaturedLocations: async () => {
    try {
      const response = await api.get('/public/locations/cities/featured');
      return response.data || [];
    } catch (e) {
      console.error("Failed to fetch featured locations", e);
      return [];
    }
  },

  getBlogPosts: async (cityId?: string, zoneId?: string | null) => {
    try {
      const response = await api.get('/public/blogs', { params: { cityId, zoneId } });
      return response.data || [];
    } catch (e) {
      console.error("Failed to fetch blog posts", e);
      return [];
    }
  },

  // ─── RETURNS & REPLACEMENTS ───
  getUserReturnRequests: async (userId: number) => {
    try {
      const response = await api.get(`/customer/returns/user/${userId}`);
      return response.data || [];
    } catch (e) {
      console.error("Failed to fetch return requests", e);
      return [];
    }
  }
};
