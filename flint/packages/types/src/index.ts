// User Roles
export type UserRole = 'customer' | 'agent' | 'admin';

// User Interface
export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string;
  created_at: string;
}

// Customer Interface
export interface Customer extends User {
  // Additional customer-specific fields if needed
}

// Agent Interface
export interface Agent extends User {
  assigned_orders?: string[];
}

// Admin Interface
export interface Admin extends User {
  // Additional admin-specific fields if needed
}

// Rate Interface
export interface Rate {
  id: string;
  destination_country: string;
  weight_range_min: number;
  weight_range_max: number;
  base_rate: number;
  margin_percent: number;
  active: boolean;
  created_at: string;
}

// Order Status
export type OrderStatus = 'pending' | 'picked_up' | 'shipped' | 'delivered' | 'cancelled';

// Order Interface
export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  receiver_name: string;
  receiver_address: string;
  destination_country: string;
  weight: number;
  scheduled_pickup_date: string;
  status: OrderStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  total_amount: number;
  notes: string | null;
  created_at: string;
}

// Shipment Status
export type ShipmentStatus = 'booked' | 'in_transit' | 'delivered';

// Shipment Interface
export interface Shipment {
  id: string;
  order_id: string;
  india_post_tracking_number: string | null;
  status: ShipmentStatus;
  updated_at: string;
}

// Payment Status
export type PaymentStatus = 'pending' | 'completed' | 'refunded';

// Payment Method
export type PaymentMethod = 'upi' | 'card' | 'netbanking';

// Payment Interface
export interface Payment {
  id: string;
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  created_at: string;
}

// Agent Pickup Status
export type AgentPickupStatus = 'scheduled' | 'picked_up' | 'handed_over';

// Agent Pickup Interface
export interface AgentPickup {
  id: string;
  order_id: string;
  agent_id: string;
  pickup_location: string;
  actual_weight: number;
  photo_url: string | null;
  status: AgentPickupStatus;
  scanned_qr: string | null;
  created_at: string;
}

// Price Calculation Result
export interface PriceResult {
  destination: string;
  weight: number;
  base_rate: number;
  margin: number;
  total: number;
}

// Booking Form Data
export interface BookingFormData {
  receiverName: string;
  receiverAddress: string;
  destinationCountry: string;
  weight: number;
  scheduledPickupDate: string;
  phone: string;
  notes?: string;
}

// Notification Type
export type NotificationType = 'email' | 'sms';

// Notification Template
export type NotificationTemplate =
  | 'order_confirmed'
  | 'pickup_scheduled'
  | 'pickup_completed'
  | 'shipped'
  | 'delivered'
  | 'payment_due';

// Notification Interface
export interface Notification {
  id: string;
  order_id: string;
  type: NotificationType;
  template: NotificationTemplate;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
}
