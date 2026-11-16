# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Build a branded international courier booking platform where parcels ship through India Post, but customers only see the client's brand. Full-stack application with three main interfaces:

- **Customer Website** (mobile-first): Pricing, booking, payment, tracking
- **Pickup Agent Web App**: QR scanning, weight/photo capture, status updates
- **Admin Panel**: Order management, printing, customs forms, reconciliation

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript
- **Backend**: Next.js API routes, Supabase (PostgreSQL)
- **Hosting**: Vercel (frontend + API)
- **Payments**: Razorpay (UPI, cards, net banking)
- **SMS**: MSG91 (DLT-compliant)
- **Document Generation**: PDFKit for customs forms (CN22/CN23) and GST invoices
- **QR Codes**: qrcode.react
- **Maps**: Leaflet (for pickup agent maps)
- **Testing**: Jest + React Testing Library

## Project Structure

```
honeybadger-courier-platform/
├── apps/
│   ├── customer-web/          # Main customer-facing app (mobile-first)
│   ├── agent-web/             # Pickup agent web app (phone browser)
│   └── admin-panel/           # Admin dashboard
├── packages/
│   ├── db/                    # Supabase client & migrations
│   ├── shared/                # Shared types, utilities, constants
│   └── ui/                    # Shared UI components (Tailwind CSS)
├── supabase/
│   └── migrations/            # Database schema migrations
├── public/
│   └── uploads/               # Uploaded parcel photos, documents
├── docs/
│   ├── handover.md            # Production deployment handoff
│   └── api-spec.md            # API documentation
└── CLAUDE.md
```

## Development Commands

```bash
# Install dependencies
npm install

# Run all apps in development
npm run dev

# Run individual apps
npm run dev --workspace=apps/customer-web
npm run dev --workspace=apps/agent-web
npm run dev --workspace=admin-panel

# Build for production
npm run build

# Run tests
npm run test
npm run test:client
npm run test:api

# Lint
npm run lint
npm run lint:fix

# Database migrations
npx supabase db push
npx supabase gen types typescript > packages/db/types.ts

# Generate QR codes (for development)
npm run generate:qr <order-id>
```

## Key Features by Interface

### Customer Website
- Price calculator by destination country and weight
- Single parcel booking or bulk Excel upload
- Pickup scheduling
- Razorpay payment integration
- Customer account with booking history
- Branded tracking page with order status

### Agent Web App
- Login and view today's pickups with map location
- Scan pre-printed QR stickers via camera
- Fallback search by name/phone
- Enter actual weight and capture parcel photo
- Auto-recalculate charges for weight differences
- SMS payment links for balance owed
- Mark as picked up/handed to office

### Admin Panel
- Order, customer, agent, payment management
- Print A6 stickers (order ID, address, package info, QR)
- Auto-generate CN22/CN23 customs forms (PDF)
- Auto-generate GST invoices (PDF)
- India Post tracking number input with tracking links
- Manual status updates (including "Delivered")
- Rate tables and margin configuration
- Bank transfer and cash payment recording

## Database Schema

Key tables (defined in Supabase migrations):
- `orders` - Core order data with tracking info
- `customers` - Customer profiles and addresses
- `agents` - Pickup agent accounts
- `payments` - Payment records and Razorpay links
- `rate_tables` - Pricing by country/weight
- `custom_forms` - CN22/CN23 template data
- `notifications` - SMS and email queue

## API Routes

```
/api/booking/calculate-price
/api/booking/create
/api/booking/upload
/api/booking/track/:trackingId

/api/pickup/login
/api/pickup/search
/api/pickup/scan
/api/pickup/update

/api/admin/orders
/api/admin/stickers/generate
/api/admin/customs/generate
/api/admin/track/shipments
```

## Security & Configuration

- Environment variables (`.env.local`, `.env.production`) stored in project root
- Never commit `.env` files or secrets to git
- Use Supabase Row Level Security (RLS) policies
- Razorpay Webhooks verified with secret key
- SMS DLT compliance with proper sender IDs
- Image uploads with size limits and type validation

## Development Workflow

1. **Plan features** using this specification as the source of truth
2. **Create database migrations** in `supabase/migrations/`
3. **Build backend APIs** in Next.js API routes (shared code in `packages/shared`)
4. **Develop frontend components** with TypeScript and Tailwind CSS
5. **Write tests** for critical flows (booking, payments, status updates)
6. **Deploy to Vercel** with CI/CD pipeline
7. **Reconcile payments** and SMS logs in production

## External Integrations

- **Razorpay**: Payment gateway - webhook endpoints for payment confirmation
- **MSG91**: SMS gateway - DLT-compliant with sender ID configuration
- **Supabase**: Database, auth, storage, real-time subscriptions
- **India Post**: External tracking API for delivery updates

## Key Files to Understand

- `apps/customer-web/app/layout.tsx` - Root layout with navigation
- `apps/customer-web/app/page.tsx` - Home/price calculator
- `packages/db/client.ts` - Supabase client configuration
- `supabase/migrations/*.sql` - Complete database schema
- `apps/admin-panel/app/orders/page.tsx` - Admin order management

## Acceptance Criteria

- [ ] End-to-end customer flow (price → book → pay → track) on mobile and desktop
- [ ] Agent can scan QR, update weight/photo, trigger balance payment
- [ ] Admin can print stickers/customs PDFs, add tracking numbers, update statuses
- [ ] Razorpay payments live and reconciled in admin
- [ ] SMS/email notifications at key events
- [ ] Production deployment with full handoff documentation

## Branch Strategy

- `main`: Production-ready code
- `glm-4.7-flash`: Current development branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `docs/*`: Documentation changes
- `hotfix/*`: Critical production fixes

## Git Commit Guidelines

Use conventional commits:
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Example:**
```
feat(customer-web): Add price calculator by destination

Implement pricing logic that calculates India Post rates + margin based on
weight and destination country.

Closes #123
```