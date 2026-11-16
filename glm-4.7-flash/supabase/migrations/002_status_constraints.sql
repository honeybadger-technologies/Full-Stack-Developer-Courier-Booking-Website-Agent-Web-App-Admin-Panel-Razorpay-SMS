-- Canonical status values. Keep in sync with packages/shared/types.ts.

-- Orders: lifecycle follows docs/api-spec.md; 'pending' (old default) becomes 'booked'
UPDATE orders SET status = 'booked' WHERE status = 'pending';
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'booked';
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('booked', 'picked_up', 'handed_to_office', 'in_transit', 'delivered', 'cancelled'));

-- 'balance_due': agent reweigh found extra charge, payment link sent
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'balance_due', 'failed'));

ALTER TABLE agents ADD CONSTRAINT agents_status_check
  CHECK (status IN ('active', 'inactive'));
