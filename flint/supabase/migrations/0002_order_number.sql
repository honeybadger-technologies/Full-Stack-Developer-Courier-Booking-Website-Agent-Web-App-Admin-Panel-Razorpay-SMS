-- Add customer-facing order numbers (e.g. HBC-1A2B3C)
alter table orders add column if not exists order_number text not null default ('HBC-' || substr(md5(gen_random_uuid()::text), 1, 8));
create unique index if not exists orders_order_number_key on orders (order_number);