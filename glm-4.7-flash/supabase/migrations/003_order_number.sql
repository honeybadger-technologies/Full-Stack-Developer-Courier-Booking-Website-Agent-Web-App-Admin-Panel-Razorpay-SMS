-- Customer-facing order ID (QR stickers, tracking URLs, agent search), e.g. HBC-3F9A1C7B2E04.
-- 12 hex chars from gen_random_uuid() = 48 random bits: unguessable for public
-- tracking, collision-free at this scale (UNIQUE rejects the rare clash).
-- Hex has no O/I, so it reads unambiguously when typed by agents.
-- The volatile default gives each existing row its own value.
ALTER TABLE orders ADD COLUMN order_number TEXT NOT NULL UNIQUE
  DEFAULT 'HBC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
