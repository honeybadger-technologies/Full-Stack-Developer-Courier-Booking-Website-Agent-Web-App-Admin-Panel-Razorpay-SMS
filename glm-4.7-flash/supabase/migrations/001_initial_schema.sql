-- Create custom types for easier type definition in JavaScript/TypeScript

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address JSONB NOT NULL,
  profile_photo TEXT,

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_method TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  location JSONB,

  -- Status
  status TEXT DEFAULT 'active',
  active_bookings INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table (after customers/agents, which it references)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  tracking_number TEXT UNIQUE,

  -- Parcel details
  weight DECIMAL(10, 2) NOT NULL,
  dimensions JSONB NOT NULL,
  description TEXT,

  -- Addresses
  pickup_address JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  destination_country TEXT NOT NULL,

  -- Status and timestamps
  status TEXT NOT NULL DEFAULT 'pending',
  booking_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pickup_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,

  -- Pricing
  base_rate DECIMAL(10, 2) NOT NULL,
  margin DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- Payment
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  payment_link TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',

  -- Razorpay details
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,

  -- Payment method
  payment_method TEXT,
  payment_link TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate tables
CREATE TABLE IF NOT EXISTS rate_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_country TEXT UNIQUE NOT NULL,
  base_rate DECIMAL(10, 2) NOT NULL,
  weight_multiplier DECIMAL(10, 4) DEFAULT 0,
  description TEXT
);

-- Notifications queue
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB,

  -- Status
  status TEXT DEFAULT 'pending',

  -- Triggered by
  triggered_by TEXT,
  related_id UUID,

  -- Sent tracking
  sent_at TIMESTAMPTZ,
  sent_method TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_tables ENABLE ROW LEVEL SECURITY;

-- Orders RLS policies
-- Public tracking goes through an API route using the service-role client,
-- never through anon reads of this table.
CREATE POLICY "Customers can view their own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = customer_id
    AND status != 'cancelled'
  );

-- Customers RLS policies
CREATE POLICY "Customers can view their own profile"
  ON customers FOR SELECT
  USING (auth.uid() = id);

-- Insert customer on registration
CREATE POLICY "Insert own customer"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Rate tables: public read for the price calculator; writes via service role only
CREATE POLICY "Public can view rates"
  ON rate_tables FOR SELECT
  USING (true);