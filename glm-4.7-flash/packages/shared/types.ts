// Row shapes mirror supabase/migrations. Keep the status lists in sync with
// the CHECK constraints in 002_status_constraints.sql.

export const ORDER_STATUSES = [
  'booked',
  'picked_up',
  'handed_to_office',
  'in_transit',
  'delivered',
  'cancelled',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ['pending', 'paid', 'balance_due', 'failed'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const AGENT_STATUSES = ['active', 'inactive'] as const
export type AgentStatus = (typeof AGENT_STATUSES)[number]

export interface Address {
  street: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  agent_id: string | null
  tracking_number: string | null
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  description: string | null
  pickup_address: Address
  delivery_address: Address
  destination_country: string
  status: OrderStatus
  booking_date: string
  pickup_date: string | null
  delivery_date: string | null
  base_rate: number
  margin: number
  total: number
  payment_status: PaymentStatus
  payment_id: string | null
  payment_link: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: Address
  profile_photo: string | null
  is_verified: boolean
  verification_method: string | null
  created_at: string
  updated_at: string
}

export interface Agent {
  id: string
  name: string
  phone: string
  email: string | null
  location: {
    latitude: number
    longitude: number
  } | null
  status: AgentStatus
  active_bookings: number
  total_bookings: number
  created_at: string
  updated_at: string
}
