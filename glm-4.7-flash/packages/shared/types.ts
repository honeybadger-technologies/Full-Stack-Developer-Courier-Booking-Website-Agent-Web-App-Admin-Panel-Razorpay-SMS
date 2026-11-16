export interface Order {
  id: string
  customer_id: string
  agent_id: string | null
  tracking_number: string | null
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  pickup_address: string
  delivery_address: string
  destination_country: string
  booking_date: string
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered'
  price: number
  margin: number
  total: number
  payment_status: 'pending' | 'paid' | 'failed'
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  created_at: string
}

export interface Agent {
  id: string
  name: string
  phone: string
  location: {
    latitude: number
    longitude: number
  }
  status: 'active' | 'inactive'
}
