# Courier Booking Platform - Project Guide

This is a monorepo for a full-stack courier booking platform built with Next.js and Supabase.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Start all apps
npx nx dev:all
```

## Project Structure

```
courier-booking-platform/
├── apps/
│   ├── customer/     # Customer web app (price calculator, booking, tracking)
│   ├── agent/        # Agent web app (pickup management, QR scanning)
│   ├── admin/        # Admin panel (orders, customers, printing)
│   └── api/          # Backend API routes
├── packages/
│   ├── ui/           # Shared UI components
│   ├── models/       # TypeScript models and types
│   ├── supabase-client/  # Supabase client setup
│   ├── payments/     # Razorpay payment integration
│   ├── sms/          # MSG91 SMS integration
│   ├── email/        # Resend email integration
│   ├── print/        # PDF generation
│   └── gateways/     # External API gateways
└── supabase/
    └── migrations/   # Database migrations
```

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Razorpay
- **SMS**: MSG91 (DLT-compliant)
- **Email**: Resend
- **Styling**: Tailwind CSS + Radix UI
- **Testing**: Jest + Cypress

## Key Features

### Customer Website
- Price calculator by destination and weight
- Booking with customer/recipient details
- Online payment via Razorpay (UPI, cards, net banking)
- Tracking page with India Post integration

### Agent Web App
- Login and today's pickups
- QR code scanning for parcels
- Weight verification with price recalculation
- Photo capture for proof of pickup
- SMS payment link for balance due

### Admin Panel
- Order management
- Customer and agent management
- Sticker printing (A6 format)
- Customs forms (CN22/CN23) and invoices as PDF
- India Post tracking number entry
- Rate tables and margin settings

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# MSG91
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_SENDER_ID=your-msg91-sender-id

# Resend
RESEND_API_KEY=re_your-resend-api-key
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npx nx dev:all` | Start all apps |
| `npx nx serve customer` | Start customer app |
| `npx nx serve agent` | Start agent app |
| `npx nx serve admin` | Start admin panel |
| `npx nx build customer` | Build customer app |
| `npx nx test customer` | Run customer tests |
| `npx nx lint customer` | Lint customer code |
| `npx nx graph` | Show project dependencies |

## Database Setup

Run the migration to set up the Supabase database:

```bash
# Run this in Supabase SQL Editor
# File: supabase/migrations/0001_create_schema.sql
```

## Deployment

This project is designed for Vercel deployment. Each app can be deployed separately.

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

## License

Proprietary - Honeybadger Technologies