# Honeybadger Courier Platform

Branded international courier booking platform with India Post backend.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

A fully-featured courier booking platform where customers see your brand at every step, but parcels are actually shipped through India Post. This provides the reliability of India Post with a premium branded experience for your customers.

## Features

### Customer Website
- ✅ Mobile-first responsive design
- ✅ Intelligent pricing calculator
- ✅ Single parcel or bulk booking (Excel upload)
- ✅ Pickup scheduling
- ✅ Secure online payments via Razorpay
- ✅ Customer account with booking history
- ✅ Branded tracking page with real-time updates

### Pickup Agent Web App
- ✅ Mobile-optimized interface
- ✅ QR code scanning via camera
- ✅ Search by name or phone number
- ✅ Weight verification and photo capture
- ✅ Auto-recalculation for weight differences
- ✅ SMS payment links for balance
- ✅ Status marking (picked up / handed over)

### Admin Panel
- ✅ Dashboard with order overview
- ✅ Order management and filtering
- ✅ Customer and agent management
- ✅ Payment reconciliation
- ✅ A6 sticker printing with QR codes
- ✅ CN22/CN23 customs form generation (PDF)
- ✅ GST invoice generation (PDF)
- ✅ India Post tracking integration
- ✅ Rate table configuration
- ✅ SMS and email notification system

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14+ | React framework with App Router |
| React | 18+ | UI library |
| TypeScript | 5+ | Type safety |
| Supabase | Latest | PostgreSQL database & authentication |
| Tailwind CSS | 3+ | Utility-first CSS |
| Razorpay | Latest | Payment gateway integration |
| MSG91 | Latest | DLT-compliant SMS notifications |
| PDFKit | Latest | Document generation (customs & invoices) |
| QRCode.react | Latest | QR code generation |
| Leaflet | Latest | Interactive maps |
| Turborepo | 2.0 | Monorepo management |

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account
- Razorpay account
- MSG91 account
- Vercel account

### Installation

```bash
# Clone the repository
git clone git@github.com:honeybadger-technologies/Full-Stack-Developer-Courier-Booking-Website-Agent-Web-App-Admin-Panel-Razorpay-SMS.git
cd Full-Stack-Developer-Courier-Booking-Website-Agent-Web-App-Admin-Panel-Razorpay-SMS

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

## Development

```bash
# Run all apps
npm run dev

# Run specific app
npm run dev --workspace=apps/customer-web
npm run dev --workspace=apps/agent-web
npm run dev --workspace=admin-panel

# Build for production
npm run build

# Run tests
npm run test

# Database migrations
npx supabase db push
npx supabase gen types typescript > packages/db/types.ts
```

## Project Structure

```
honeybadger-courier-platform/
├── apps/
│   ├── customer-web/          # Customer-facing app
│   ├── agent-web/             # Agent web app
│   └── admin-panel/           # Admin dashboard
├── packages/
│   ├── db/                    # Supabase client & types
│   ├── shared/                # Shared utilities & types
│   └── ui/                    # Shared UI components
├── supabase/
│   └── migrations/            # Database schema
├── docs/
│   ├── handover.md            # Production deployment
│   └── api-spec.md            # API documentation
└── CLAUDE.md                  # Development guidelines
```

## Environment Variables

Create `.env.local` in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# MSG91
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=your_sender_id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Your Brand
```

## Documentation

- [Architecture & Development Guide](./CLAUDE.md)
- [API Documentation](./docs/api-spec.md)
- [Production Handoff](./docs/handover.md)
- [Contributing Guide](./CONTRIBUTING.md)

## Deployment

The application is designed to be deployed on Vercel for maximum performance and simplicity:

```bash
# Deploy all apps
vercel --prod

# Or deploy individual apps
vercel --prod --scope=customer-web
vercel --prod --scope=agent-web
vercel --prod --scope=admin-panel
```

## Branching Strategy

- `main`: Production-ready code
- `glm-4.7-flash`: Current development branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `docs/*`: Documentation updates
- `hotfix/*`: Critical production fixes

## Development Workflow

1. Create a feature branch from `glm-4.7-flash`
2. Make your changes following the project structure
3. Write tests for new features
4. Ensure all tests pass
5. Commit with conventional commits format
6. Open a pull request for review

## Acceptance Criteria

This project aims to achieve:

- [ ] End-to-end customer flow on mobile and desktop
- [ ] QR scanning and weight verification
- [ ] Print functionality for stickers and documents
- [ ] Live payment integration
- [ ] SMS/email notifications
- [ ] Production deployment
- [ ] Complete handoff documentation

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

- India Post for reliable shipping infrastructure
- Next.js team for the framework
- Supabase for the database and auth solutions
- Razorpay for payment processing
- MSG91 for SMS notifications

---

**Built with ❤️ for Honeybadger Technologies**