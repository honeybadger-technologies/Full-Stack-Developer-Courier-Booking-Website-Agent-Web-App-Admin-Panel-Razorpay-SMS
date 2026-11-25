-- Create profiles table for user roles
create table if not exists profiles (
  id uuid references auth.users not null,
  role text not null check (role in ('customer', 'agent', 'admin')),
  full_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id),
  unique (id)
);

-- Enable row level security
alter table profiles enable row level security;

-- Create orders table
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references auth.users not null,
  receiver_name text not null,
  receiver_address text not null,
  destination_country text not null,
  weight decimal(10, 2) not null,
  scheduled_pickup_date date,
  status text default 'pending' check (status in ('pending', 'picked_up', 'shipped', 'delivered', 'cancelled')),
  razorpay_order_id text,
  razorpay_payment_id text,
  total_amount decimal(10, 2) not null,
  phone text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for orders
alter table orders enable row level security;

-- Create shipments table
create table if not exists shipments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders not null,
  india_post_tracking_number text,
  status text default 'booked' check (status in ('booked', 'in_transit', 'delivered')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (order_id)
);

-- Enable RLS for shipments
alter table shipments enable row level security;

-- Create agent_pickups table
create table if not exists agent_pickups (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders not null,
  agent_id uuid references auth.users not null,
  pickup_location text,
  actual_weight decimal(10, 2),
  photo_url text,
  status text default 'scheduled' check (status in ('scheduled', 'picked_up', 'handed_over')),
  scanned_qr text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for agent_pickups
alter table agent_pickups enable row level security;

-- Create rates table
create table if not exists rates (
  id uuid default gen_random_uuid() primary key,
  destination_country text not null,
  weight_range_min decimal(10, 2) not null,
  weight_range_max decimal(10, 2) not null,
  base_rate decimal(10, 2) not null,
  margin_percent decimal(5, 2) not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for rates
alter table rates enable row level security;

-- Create payments table
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders not null,
  razorpay_order_id text not null,
  razorpay_payment_id text,
  amount decimal(10, 2) not null,
  status text default 'pending' check (status in ('pending', 'completed', 'refunded')),
  payment_method text check (payment_method in ('upi', 'card', 'netbanking', 'bank_transfer', 'cash')),
  reference text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for payments
alter table payments enable row level security;

-- Create notifications table
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders not null,
  type text not null check (type in ('email', 'sms')),
  template text not null check (template in ('order_confirmed', 'pickup_scheduled', 'pickup_completed', 'shipped', 'delivered', 'payment_due')),
  status text default 'pending' check (status in ('pending', 'sent', 'failed')),
  msg91_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for notifications
alter table notifications enable row level security;

-- Create indexes for better performance
create index if not exists idx_orders_customer_id on orders(customer_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_shipments_order_id on shipments(order_id);
create index if not exists idx_agent_pickups_agent_id on agent_pickups(agent_id);
create index if not exists idx_agent_pickups_order_id on agent_pickups(order_id);
create index if not exists idx_agent_pickups_status on agent_pickups(status);
create index if not exists idx_rates_destination on rates(destination_country);

-- RLS Policies
create policy "Customers can view own orders" on orders for select using (auth.uid() = customer_id);
create policy "Customers can insert own orders" on orders for insert with check (auth.uid() = customer_id);

create policy "Agents can view assigned pickups" on agent_pickups for select using (auth.uid() = agent_id);
create policy "Agents can update own pickups" on agent_pickups for update using (auth.uid() = agent_id);

create policy "Admins can view all data" on profiles for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can view all orders" on orders for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can view all shipments" on shipments for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can view all agent pickups" on agent_pickups for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can manage rates" on rates for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can view all payments" on payments for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can view all notifications" on notifications for all using (auth.uid() in (select id from profiles where role = 'admin'));

-- Insert default admin user (for demo purposes - should be handled separately in production)
-- insert into auth.users (email, role, full_name, phone) values ('admin@courier.com', 'admin', 'Admin User', '0000000000') returning id;

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger set_timestamp_orders before update on orders for each row execute function update_updated_at_column();
create trigger set_timestamp_shipments before update on shipments for each row execute function update_updated_at_column();
create trigger set_timestamp_agent_pickups before update on agent_pickups for each row execute function update_updated_at_column();
