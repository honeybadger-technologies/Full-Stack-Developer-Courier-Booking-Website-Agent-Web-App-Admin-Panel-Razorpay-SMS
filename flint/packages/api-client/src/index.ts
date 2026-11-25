import axios from 'axios';
import type {
  Rate,
  Order,
  OrderStatus,
  BookingFormData,
  PriceResult,
  AgentPickup,
  AgentPickupStatus,
} from '@cbp/types';

// Get API base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined'
    ? window.localStorage.getItem('auth_token')
    : process.env.SUPABASE_SERVICE_KEY;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Rate API
export const rateApi = {
  // Get rate for destination and weight
  async getPrice(destination: string, weight: number): Promise<PriceResult> {
    const response = await apiClient.get<PriceResult>('/rates/price', {
      params: { destination, weight },
    });
    return response.data;
  },

  // Get all active rates
  async getAllRates(): Promise<Rate[]> {
    const response = await apiClient.get<Rate[]>('/rates');
    return response.data;
  },

  // Create new rate (admin only)
  async createRate(rate: Omit<Rate, 'id' | 'created_at'>): Promise<Rate> {
    const response = await apiClient.post<Rate>('/rates', rate);
    return response.data;
  },

  // Update rate (admin only)
  async updateRate(id: string, rate: Partial<Rate>): Promise<Rate> {
    const response = await apiClient.put<Rate>(`/rates/${id}`, rate);
    return response.data;
  },
};

// Order API
export const orderApi = {
  // Create new order
  async createOrder(formData: BookingFormData): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', formData);
    return response.data;
  },

  // Get order by ID
  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // Get orders by customer ID
  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const response = await apiClient.get<Order[]>(`/orders/customer/${customerId}`);
    return response.data;
  },

  // Get all orders (admin only)
  async getAllOrders(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/orders');
    return response.data;
  },

  // Update order status
  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await apiClient.put<Order>(`/orders/${id}/status`, { status });
    return response.data;
  },

  // Enter India Post tracking number (admin only)
  async enterTrackingNumber(id: string, trackingNumber: string): Promise<Order> {
    const response = await apiClient.put<Order>(`/orders/${id}/tracking`, {
      trackingNumber,
    });
    return response.data;
  },
};

// Agent Pickup API
export const agentPickupApi = {
  // Get today's pickups for agent
  async getTodayPickups(agentId: string): Promise<AgentPickup[]> {
    const response = await apiClient.get<AgentPickup[]>(`/agent/pickups/today`, {
      params: { agentId },
    });
    return response.data;
  },

  // Scan QR for pickup
  async scanQr(qrData: string): Promise<{ orderId: string; order: Order }> {
    const response = await apiClient.post<{ orderId: string; order: Order }>('/agent/pickups/scan', {
      qrData,
    });
    return response.data;
  },

  // Update pickup weight
  async updateWeight(pickupId: string, weight: number): Promise<AgentPickup> {
    const response = await apiClient.post<AgentPickup>(`/agent/pickups/${pickupId}/weight`, {
      weight,
    });
    return response.data;
  },

  // Upload pickup photo
  async uploadPhoto(pickupId: string, photoUrl: string): Promise<AgentPickup> {
    const response = await apiClient.post<AgentPickup>(`/agent/pickups/${pickupId}/photo`, {
      photoUrl,
    });
    return response.data;
  },

  // Update pickup status
  async updateStatus(pickupId: string, status: AgentPickupStatus): Promise<AgentPickup> {
    const response = await apiClient.post<AgentPickup>(`/agent/pickups/${pickupId}/status`, {
      status,
    });
    return response.data;
  },
};

// Payment API
export const paymentApi = {
  // Create Razorpay order
  async createRazorpayOrder(orderId: string, amount: number): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
  }> {
    const response = await apiClient.post<{
      razorpayOrderId: string;
      amount: number;
      currency: string;
    }>('/payments/razorpay/order', {
      orderId,
      amount,
    });
    return response.data;
  },

  // Verify Razorpay payment
  async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string): Promise<boolean> {
    const response = await apiClient.post<{ verified: boolean }>(
      '/payments/razorpay/verify',
      {
        razorpayOrderId,
        razorpayPaymentId,
      }
    );
    return response.data.verified;
  },

  // Record manual payment (admin only)
  async recordManualPayment(
    orderId: string,
    amount: number,
    method: 'bank_transfer' | 'cash',
    reference: string
  ): Promise<{ success: boolean }> {
    const response = await apiClient.post('/payments/manual', {
      orderId,
      amount,
      method,
      reference,
    });
    return response.data;
  },
};

// Notification API
export const notificationApi = {
  // Send SMS notification
  async sendSms(phone: string, message: string): Promise<{ success: boolean; msg91Id: string }> {
    const response = await apiClient.post('/notifications/sms', { phone, message });
    return response.data;
  },

  // Send email notification
  async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean }> {
    const response = await apiClient.post('/notifications/email', { to, subject, body });
    return response.data;
  },

  // Send notification for order status change
  async sendOrderNotification(
    orderId: string,
    template: 'order_confirmed' | 'pickup_scheduled' | 'pickup_completed' | 'shipped' | 'delivered'
  ): Promise<{ success: boolean }> {
    const response = await apiClient.post('/notifications/order', {
      orderId,
      template,
    });
    return response.data;
  },
};

// Document API (admin only)
export const documentApi = {
  // Generate sticker PDF
  async generateSticker(orderId: string): Promise<{ url: string }> {
    const response = await apiClient.post<{ url: string }>(`/documents/sticker/${orderId}`);
    return response.data;
  },

  // Generate CN22 PDF
  async generateCn22(orderId: string): Promise<{ url: string }> {
    const response = await apiClient.post<{ url: string }>(`/documents/cn22/${orderId}`);
    return response.data;
  },

  // Generate GST invoice PDF
  async generateGstInvoice(orderId: string): Promise<{ url: string }> {
    const response = await apiClient.post<{ url: string }>(`/documents/gst/${orderId}`);
    return response.data;
  },

  // Print sticker (returns HTML for printing)
  async printSticker(orderId: string): Promise<{ html: string }> {
    const response = await apiClient.post<{ html: string }>(`/documents/print-sticker/${orderId}`);
    return response.data;
  },
};

// Agent API
export const agentApi = {
  // Get today's pickups (admin)
  async getTodayPickups(): Promise<AgentPickup[]> {
    const response = await apiClient.get<AgentPickup[]>('/admin/pickups/today');
    return response.data;
  },

  // Assign agent to order (admin)
  async assignAgent(orderId: string, agentId: string): Promise<AgentPickup> {
    const response = await apiClient.post<AgentPickup>('/admin/assign-agent', {
      orderId,
      agentId,
    });
    return response.data;
  },
};

export default apiClient;
