// Customer types
export interface Customer {
  customer_id: string;
  phone: string;
  name: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// Booking types
export type BookingStatus = 'pending' | 'paid' | 'cancelled' | 'completed';

export interface Booking {
  booking_id: string;
  booking_reference: string;
  customer_id: string;
  status: BookingStatus;
  pickup_date: string;
  pickup_address: PickupAddress;
  total_weight_kg: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface PickupAddress {
  address: string;
  landmark?: string;
  instructions?: string;
  city: string;
  state: string;
  pincode: string;
}

// Parcel types
export interface Parcel {
  parcel_id: string;
  booking_id: string;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  description: string;
  value_inr: number;
  created_at: string;
}

// Payment types
export type PaymentStatus = 'initiated' | 'captured' | 'failed' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

export interface Payment {
  payment_id: string;
  booking_id: string;
  razorpay_payment_id: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  created_at: string;
  updated_at: string;
  captured_at?: string;
}

// Pickup types
export type PickupStatus =
  | 'assigned'
  | 'scanned'
  | 'weight_verified'
  | 'photo_captured'
  | 'completed';

export interface Pickup {
  pickup_id: string;
  booking_id: string;
  agent_id?: string;
  status: PickupStatus;
  scheduled_at: string;
  completed_at?: string;
  actual_weight_kg?: number;
  balance_amount?: number;
  created_at: string;
  updated_at: string;
}

// Agent types
export interface Agent {
  agent_id: string;
  phone: string;
  name: string;
  email?: string;
  assigned_area?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tracking types
export type TrackingStatus =
  | 'booked'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed';

export interface Tracking {
  tracking_id: string;
  booking_id: string;
  india_post_tracking_number: string;
  status: TrackingStatus;
  status_details?: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

// Document types
export type DocumentType = 'sticker' | 'cn22' | 'cn23' | 'invoice';

export interface Document {
  document_id: string;
  booking_id: string;
  document_type: DocumentType;
  storage_url: string;
  created_at: string;
}

// Photo types
export interface ParcelPhoto {
  photo_id: string;
  pickup_id: string;
  storage_url: string;
  uploaded_at: string;
}

// Rate types
export interface RateTable {
  region: string;
  weight_bracket: string;
  base_rate: number;
  per_kg_rate: number;
  currency: string;
  updated_at: string;
}

export interface MarginSettings {
  percentage: number;
  type: 'percentage' | 'fixed';
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}