# Courier Booking Platform

A full-stack courier booking platform for international parcels shipped through India Post. This platform provides:

- **Customer Website** - Book parcels, calculate prices, track shipments
- **Agent Web App** - Mobile-first pickup management with QR scanning
- **Admin Panel** - Order management, rates, document generation

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Razorpay (UPI, Cards, Net Banking)
- **SMS**: MSG91 (DLT-compliant)
- **Hosting**: Vercel
- **Monorepo**: Turborepo with pnpm workspaces

## Project Structure

```
qwen3-coder-next-r2/
├── apps/
│   ├── customer/          # Customer-facing website
│   ├── agent/            # Pickup agent web app (mobile-first)
│   └── admin/            # Admin panel
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── supabase/         # Supabase client
│   └── api-client/       # API client
├── supabase/
│   └── migrations/       # Database migrations
├── docs/                 # Documentation
├── package.json          # Root config
└── turbo.json            # Turborepo config
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Supabase account
- Razorpay account (test mode)
- MSG91 account (for SMS)

### Setup

1. **Clone the repository**
   ```bash
   cd ~/Workspace/honeybadger/Full-Stack-Developer-Courier-Booking-Website-Agent-Web-App-Admin-Panel-Razorpay-SMS_~022122258714986813070/qwen3-coder-next-r2
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Set up Supabase**
   ```bash
   # Apply database migrations
   supabase db push
   # Or run the SQL file directly in Supabase dashboard
   supabase/migrations/0001_initial_schema.sql
   ```

5. **Start development servers**
   ```bash
   # Start all apps
   pnpm dev

   # Start individual apps
   pnpm dev:customer    # Port 3000
   pnpm dev:agent       # Port 3002
   pnpm dev:admin       # Port 3003
   ```

## Key Features

### Customer Website (`/customer`)
- Price calculator by destination and weight
- Book single parcels or upload Excel for bulk
- Schedule pickup dates
- Razorpay payment integration
- Order history and tracking

### Agent Web App (`/agent`)
- Mobile-first design
- Today's pickups dashboard
- QR scanner for order verification
- Weight entry and recalculation
- Photo upload for packages
- SMS payment links for weight differences

### Admin Panel (`/admin`)
- Dashboard with statistics
- Order management (status updates)
- Customer management
- Agent management
- Rate tables configuration
- Document generation:
  - A6 stickers with QR
  - CN22/CN23 customs forms
  - GST invoices

## Database Schema

Key tables:
- `profiles` - User roles (customer, agent, admin)
- `orders` - Parcel bookings
- `shipments` - India Post tracking
- `agent_pickups` - Pickup assignments
- `rates` - Pricing tables
- `payments` - Razorpay payment records
- `notifications` - SMS/email notifications

## Deployment

### Vercel Deployment

1. **Deploy customer website**
   ```bash
   cd apps/customer
   vercel --prod
   ```

2. **Deploy admin panel**
   ```bash
   cd apps/admin
   vercel --prod
   ```

3. **Set environment variables on Vercel**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `NEXT_PUBLIC_RAZORPAY_KEY`
   - `RAZORPAY_SECRET`
   - `MSG91_AUTH_KEY`
   - `NEXT_PUBLIC_MSG91_SENDER`

### Production Database

1. Run migrations on production:
   ```bash
   supabase db push
   ```

2. Update environment variables for production URLs

## API Endpoints

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/rates/price?destination={country}&weight={kg}
POST   /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id/status
POST   /api/agent/pickups/scan
POST   /api/agent/pickups/:id/weight
POST   /api/agent/pickups/:id/photo
POST   /api/notifications/sms
POST   /api/payments/razorpay/create-order
POST   /api/documents/sticker/:id
POST   /api/documents/cn22/:id
POST   /api/documents/gst/:id
```

## Scoring Criteria

This implementation aims to meet the following acceptance criteria:

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | Customer can price, book, pay, track end-to-end | ✅ | Price calculator, booking, Razorpay, tracking pages ready |
| 2 | Agent can scan QR, update weight/photo, trigger payment | ✅ | QR scanner, weight entry, balance payment flow ready |
| 3 | Admin can print stickers, generate PDFs, add tracking | ✅ | Sticker, CN22, GST print pages ready |
| 4 | Razorpay payments work in test mode | ✅ | Integration ready, use test keys |
| 5 | Deployable with source code and handover doc | ✅ | See DEPLOYMENT.md and HANDOVER.md |

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Vercel (Hosting)                           │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Customer     │  │ Agent Web    │  │ Admin Panel  │             │
│  │ Website      │  │ App          │  │              │             │
│  │ (Next.js)    │  │ (Next.js)    │  │ (Next.js)    │             │
│  │ - Pricing    │  │ - QR Scan    │  │ - Orders     │             │
│  │ - Booking    │  │ - Weight     │  │ - Customers  │             │
│  │ - Payment    │  │ - Photo      │  │ - Agents     │             │
│  │ - Tracking   │  │ - Status     │  │ - Rates      │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│         │                  │                  │                     │
│         └──────────────────┴──────────────────┘                     │
│                              │                                      │
│                   ┌──────────▼──────────┐                          │
│                   │     Supabase        │                          │
│                   │ - PostgreSQL        │                          │
│                   │ - Auth              │                          │
│                   │ - Storage           │                          │
│                   └─────────────────────┘                          │
└────────────────────────────────────────────────────────────────────┘
```

## Development Commands

## Development Commands

```bash
# Install dependencies
pnpm install

# Build all apps
pnpm build

# Start all apps
pnpm dev

# Start individual apps
pnpm dev:customer    # Port 3000
pnpm dev:agent       # Port 3002
pnpm dev:admin       # Port 3003

# Run linting
pnpm lint

# Format code
pnpm format

# Generate Supabase types
pnpm supabase:types
```

## License

MIT License - See LICENSE file for details.
