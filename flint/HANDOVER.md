# Courier Booking Platform - Handover Document

## Overview

This document provides a handover guide for the Courier Booking Platform built for the
international courier service using India Post. Parcels ship through India Post (booked at the
post office counter) while customers only ever see the client's brand.

- **Client**: Digital agency for international courier services (Delhi NCR)
- **Purpose**: Branded international courier booking platform with customer, agent and admin
  interfaces
- **Tech Stack**: Next.js 14 (App Router) + Turborepo + pnpm + Supabase + Razorpay + MSG91 + Nodemailer
- **Timeline**: 5 weeks (build completed in a single sprint)

## What Was Built

### 1. Customer Website (`apps/customer`, port 3000)

- **Price Calculator**: destination country + weight lookup through `/api/prices` and
  `/api/rates/price`, returning base rate, margin and total
- **Booking Form**: receiver details, destination, weight, pickup date, phone, notes; creates an
  order via `POST /api/orders` and redirects to checkout
- **Payment Integration**: Razorpay order creation (`/api/razorpay/create-order`, `/api/razorpay/verify`)
  and webhook reconciliation (`/api/payments/webhook`); manual bank transfer / cash recording via
  `/api/payments/manual`
- **Order History**: customer orders via authenticated `GET /api/orders`
- **Tracking Page**: public `GET /tracking` with status timeline and India Post tracking link

### 2. Pickup Agent Web App (`apps/agent`, port 3002)

- **Dashboard**: today's pickups
- **QR Scanner**: camera scan via `html5-qrcode`, fallback search by name or phone
- **Weight Entry**: actual weight, photo upload, status transitions
- **Balance Payment**: weight-difference charge via Razorpay order + SMS payment link
  (`/api/razorpay/create-order`, `/api/sms/send`)

### 3. Admin Panel (`apps/admin`, port 3003, served under `/admin`)

- **Dashboard**: order/customer/agent/pending stats
- **Order Management**: status updates, tracking number entry
- **Rate Tables**: destination + weight ranges with margin
- **Documents**: A6 sticker, CN22/CN23 customs form, GST invoice (printable pages)
- **Payments**: Razorpay reconciliation + manual bank transfer / cash recording

### 4. Notifications

- SMS via MSG91 (`/api/notifications/sms`)
- Email via SMTP/Nodemailer (`/api/notifications/email`)
- Order status notifications via `POST /api/notifications/order`

### 5. API Layer

All routes live under each app's `app/api`:

| Route | Purpose |
|---|---|
| `GET /api/prices`, `GET /api/rates/price` | price lookup |
| `GET/POST /api/orders`, `GET/PATCH /api/orders/[id]` | orders |
| `POST /api/razorpay/create-order`, `POST /api/razorpay/verify` | Razorpay |
| `POST /api/payments/webhook`, `POST /api/payments/manual` | payment reconciliation |
| `POST /api/notifications/{sms,email,order}` | notifications |

Shared helpers: `apps/*/lib/api-auth.ts` (auth user resolution from Bearer token, service client).

## Database

Migrations in `supabase/migrations/`:

- `0001_initial_schema.sql` — profiles, orders, shipments, agent_pickups, rates, payments,
  notifications, RLS policies, indexes, updated_at triggers
- `0002_order_number.sql` — customer-facing order numbers (`HBC-…`)

## Running Locally

```bash
pnpm install
pnpm build        # all three apps compile, lint and type-check
pnpm dev          # customer :3000, agent :3002, admin :3003

pnpm dev:customer
pnpm dev:agent
pnpm dev:admin
```

Admin routes are served under the `/admin` prefix (e.g. `/admin/orders` → `/orders`).

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_SECRET=your-razorpay-secret

MSG91_AUTH_KEY=your-msg91-auth-key
NEXT_PUBLIC_MSG91_SENDER=CNRPAYR

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-smtp-pass
SMTP_FROM=noreply@courier.com
```

## Acceptance Criteria Status

| # | Criterion | Status |
|---|---|---|
| 1 | Customer can price, book, pay and track end to end | Implemented (API + UI); runtime needs Supabase + Razorpay keys |
| 2 | Agent can scan, update weight/photo, trigger balance payment | Implemented (APIs + pages); runtime needs Supabase |
| 3 | Admin can print stickers/customs PDFs, add tracking; notifications sent | Implemented (pages + APIs); needs configured providers |
| 4 | Razorpay payments work and reconcile | Implemented; needs Razorpay keys |
| 5 | Deployable with source and handover doc | Build green; handover doc |

## Known Limitations

1. No live Supabase, Razorpay, MSG91 or SMTP credentials in this environment — all external
   calls return structured errors when unconfigured.
2. Excel bulk upload for many-at-once bookings was not implemented in this pass.
3. Native mobile app not built (phone-browser agent app only, as specified).
4. Refund workflow not implemented in this pass.

## Security Notes

- Auth is resolved server-side from the Bearer token in API routes.
- Row level security policies live in migrations.
- No secrets committed; `.env.example` holds placeholders only.