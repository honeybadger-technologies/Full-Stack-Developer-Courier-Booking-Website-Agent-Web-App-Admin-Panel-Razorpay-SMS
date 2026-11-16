-- Courier Booking Platform - Database Schema
-- Run this script to set up the Supabase database

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Customers table
create table if not exists customers (
  customer_id uuid default uuid_generate_v4() primary key,
  phone text not null unique,
  name text not null,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bookings table
create table if not exists bookings (
  booking_id uuid default uuid_generate_v4() primary key,
  booking_reference text not null unique,
  customer_id uuid references customers(customer_id) not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'completed')),
  pickup_date date not null,
  pickup_address jsonb not null,
  total_weight_kg numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Parcels table
create table if not exists parcels (
  parcel_id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(booking_id) not null,
  weight_kg numeric(10, 2) not null,
  length_cm numeric(10, 2) not null default 0,
  width_cm numeric(10, 2) not null default 0,
  height_cm numeric(10, 2) not null default 0,
  description text not null,
  value_inr numeric(10, 2) not null default 0,
  created_at timestamptz default now()
);

-- Payments table
create table if not exists payments (
  payment_id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(booking_id) not null unique,
  razorpay_payment_id text not null unique,
  amount_cents integer not null,
  currency text not null default 'INR',
  status text not null default 'initiated' check (status in ('initiated', 'captured', 'failed', 'refunded')),
  payment_method text check (payment_method in ('upi', 'card', 'netbanking', 'wallet')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  captured_at timestamptz
);

-- Pickups table
create table if not exists pickups (
  pickup_id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(booking_id) not null unique,
  agent_id uuid,
  status text not null default 'assigned' check (status in ('assigned', 'scanned', 'weight_verified', 'photo_captured', 'completed')),
  scheduled_at timestamptz not null,
  completed_at timestamptz,
  actual_weight_kg numeric(10, 2),
  balance_amount numeric(10, 2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agents table
create table if not exists agents (
  agent_id uuid default uuid_generate_v4() primary key,
  phone text not null unique,
  name text not null,
  email text,
  assigned_area text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tracking table
create table if not exists tracking (
  tracking_id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(booking_id) not null unique,
  india_post_tracking_number text not null unique,
  status text not null default 'booked' check (status in ('booked', 'in_transit', 'out_for_delivery', 'delivered', 'failed')),
  status_details text,
  last_updated timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents table
create table if not exists documents (
  document_id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(booking_id) not null,
  document_type text not null check (document_type in ('sticker', 'cn22', 'cn23', 'invoice')),
  storage_url text not null,
  created_at timestamptz default now()
);

-- Parcel photos table
create table if not exists parcel_photos (
  photo_id uuid default uuid_generate_v4() primary key,
  pickup_id uuid references pickups(pickup_id) not null,
  storage_url text not null,
  uploaded_at timestamptz default now()
);

-- Rate tables table
create table if not exists rate_tables (
  region text not null,
  weight_bracket text not null,
  base_rate numeric(10, 2) not null,
  per_kg_rate numeric(10, 2) not null,
  currency text not null default 'INR',
  updated_at timestamptz default now(),
  primary key (region, weight_bracket)
);

-- Margin settings table
create table if not exists margin_settings (
  id uuid default uuid_generate_v4() primary key,
  percentage numeric(5, 2) not null default 10,
  type text not null default 'percentage' check (type in ('percentage', 'fixed')),
  updated_at timestamptz default now()
);

-- Insert default margin settings
insert into margin_settings (percentage, type) values (10, 'percentage');

-- Insert default rate tables
insert into rate_tables (region, weight_bracket, base_rate, per_kg_rate, currency) values
  ('USA/Canada', '0-1', 200, 150, 'INR'),
  ('USA/Canada', '1-5', 350, 100, 'INR'),
  ('USA/Canada', '5+', 850, 150, 'INR'),
  ('UK', '0-1', 250, 180, 'INR'),
  ('UK', '1-5', 430, 120, 'INR'),
  ('UK', '5+', 1030, 150, 'INR'),
  ('Europe', '0-1', 300, 200, 'INR'),
  ('Europe', '1-5', 500, 150, 'INR'),
  ('Europe', '5+', 1250, 200, 'INR'),
  ('Australia', '0-1', 350, 220, 'INR'),
  ('Australia', '1-5', 570, 170, 'INR'),
  ('Australia', '5+', 1420, 220, 'INR'),
  ('Asia', '0-1', 150, 100, 'INR'),
  ('Asia', '1-5', 250, 75, 'INR'),
  ('Asia', '5+', 625, 100, 'INR'),
  ('Other', '0-1', 400, 250, 'INR'),
  ('Other', '1-5', 650, 200, 'INR'),
  ('Other', '5+', 1650, 250, 'INR');

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_customers_updated_at
  before update on customers
  for each row execute function update_updated_at_column();

create trigger update_bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at_column();

create trigger update_payments_updated_at
  before update on payments
  for each row execute function update_updated_at_column();

create trigger update_pickups_updated_at
  before update on pickups
  for each row execute function update_updated_at_column();

create trigger update_agents_updated_at
  before update on agents
  for each row execute function update_updated_at_column();

create trigger update_tracking_updated_at
  before update on tracking
  for each row execute function update_updated_at_column();

create trigger update_rate_tables_updated_at
  before update on rate_tables
  for each row execute function update_updated_at_column();

create trigger update_margin_settings_updated_at
  before update on margin_settings
  for each row execute function update_updated_at_column();

-- Enable Row Level Security
alter table customers enable row level security;
alter table bookings enable row level security;
alter table parcels enable row level security;
alter table payments enable row level security;
alter table pickups enable row level security;
alter table agents enable row level security;
alter table tracking enable row level security;
alter table documents enable row level security;
alter table parcel_photos enable row level security;

-- RLS Policies
create policy "Customers can view own data" on customers
  for select using (auth.uid() = customer_id);

create policy "Admin full access to customers" on customers
  for all using (auth.role() = 'authenticated');

create policy "Users can view own bookings" on bookings
  for select using (auth.uid() = customer_id);

create policy "Admin full access to bookings" on bookings
  for all using (auth.role() = 'authenticated');

create policy "Users can view own payments" on payments
  for select using (auth.uid() = customer_id);

create policy "Admin full access to payments" on payments
  for all using (auth.role() = 'authenticated');