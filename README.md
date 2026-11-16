# Courier Booking Platform

A full-stack courier booking platform for a digital agency in Delhi NCR. This monorepo contains:

- **Customer Website** - Public-facing app for pricing, booking, and tracking parcels
- **Agent Web App** - Mobile-optimized app for pickup agents to scan stickers and update deliveries
- **Admin Panel** - Dashboard for managing orders, customers, agents, and printing documents
- **Backend API** - REST API for all business logic and data access

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Razorpay (UPI, cards, net banking)
- **SMS**: MSG91 (DLT-compliant)
- **Email**: Resend
- **Styling**: Tailwind CSS + Radix UI
- **State**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Testing**: Jest + Cypress

## Project Structure

```
packages/
├── ui/              # Shared UI components
├── models/          # TypeScript models and types
├── supabase-client/ # Supabase client setup
├── payments/        # Razorpay integration
├── sms/             # MSG91 SMS integration
├── email/           # Resend email integration
├── print/           # PDF generation for stickers and forms
└── gateways/        # External API gateways

apps/
├── customer/        # Customer-facing app (port 3000)
├── agent/           # Agent web app (port 3001)
├── admin/           # Admin panel (port 3002)
└── api/             # Backend API (port 3003)
```

## Development

### Prerequisites

- Node.js 20+
- Supabase account
- Razorpay account
- MSG91 account (DLT-compliant)
- Resend account

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local
$EDITOR .env.local  # Fill in your credentials
```

### Running the apps

```bash
# Start all apps
npx nx dev:all

# Start individual app
npx nx serve customer
npx nx serve agent
npx nx serve admin
npx nx serve api
```

### Building for production

```bash
# Build all apps
npx nx run-many --target=build --all

# Build specific app
npx nx build customer
npx nx build agent
npx nx build admin
```

## Deployment

This project is designed for Vercel deployment. Each app can be deployed separately.

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# MSG91 (DLT-compliant SMS)
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_SENDER_ID=your-msg91-sender-id

# Resend (Email)
RESEND_API_KEY=re_your-resend-api-key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `nx serve customer` | Start customer app |
| `nx serve agent` | Start agent app |
| `nx serve admin` | Start admin panel |
| `nx serve api` | Start backend API |
| `nx build customer` | Build customer app |
| `nx test customer` | Run customer app tests |
| `nx lint customer` | Lint customer app |
| `nx affected:graph` | Show affected projects |
| `nx graph` | Show project dependency graph |

## Documentation

- [API Documentation](./apps/api/README.md)
- [Customer App](./apps/customer/README.md)
- [Agent App](./apps/agent/README.md)
- [Admin Panel](./apps/admin/README.md)

## License

Proprietary - Honeybadger Technologies