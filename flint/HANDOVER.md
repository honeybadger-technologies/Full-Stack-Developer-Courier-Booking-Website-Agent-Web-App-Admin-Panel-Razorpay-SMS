# Courier Booking Platform - Handover Document

## Overview

This document provides a comprehensive handover guide for the Courier Booking Platform built for the international courier service using India Post.

## Project Summary

- **Client**: Digital agency for international courier services (Delhi NCR)
- **Purpose**: Branded courier booking platform with customer, agent, and admin interfaces
- **Tech Stack**: Next.js + Supabase + Razorpay + MSG91
- **Timeline**: 5 weeks (completed)

## What Was Built

### 1. Customer Website (`apps/customer`)
- **Price Calculator**: Calculates shipping costs based on destination country and weight
- **Booking Form**: Collects receiver details, pickup scheduling, and parcel information
- **Payment Integration**: Razorpay for UPI, cards, and net banking
- **Order History**: View past orders with tracking information
- **Tracking Page**: Real-time tracking using India Post tracking numbers

### 2. Pickup Agent Web App (`apps/agent`)
- **Mobile-First Design**: Optimized for phone browsers
- **Dashboard**: Shows today's pickups with addresses and map links
- **QR Scanner**: Pre-printed QR stickers for order identification
- **Manual Search**: Fallback search by name or phone number
- **Weight Entry**: Actual weight entry with automatic price recalculation
- **Photo Upload**: Package condition documentation
- **Balance Payment**: SMS payment links for weight-based price adjustments

### 3. Admin Panel (`apps/admin`)
- **Dashboard**: Statistics overview (orders, customers, agents, pending orders)
- **Order Management**: View all orders, update status (pending → picked_up → shipped → delivered)
- **Customer Management**: View customer list
- **Agent Management**: View agent list
- **Rate Tables**: Configure India Post rates with margin percentages
- **Document Generation**:
  - A6 stickers with order ID and QR codes
  - CN22/CN23 customs forms for international shipments
  - GST invoices for Indian customers
- **Tracking Numbers**: Enter India Post tracking numbers for shipments

## Database Schema

### Key Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts with roles (customer, agent, admin) |
| `orders` | Parcel booking details |
| `shipments` | India Post tracking information |
| `agent_pickups` | Pickup assignments and status |
| `rates` | Pricing by destination and weight |
| `payments` | Razorpay payment records |
| `notifications` | SMS/email notification records |

### Relationships

```
profiles (users)
    ↓ (customer_id)
orders
    ↓ (order_id)
shipments
    ↓ (order_id)
agent_pickups
    ↓ (agent_id)
profiles (agents)
```

## Configuration Required

### 1. Supabase Setup
- Create new project at https://supabase.com
- Run migrations from `supabase/migrations/0001_initial_schema.sql`
- Copy project URL and API keys to environment variables

### 2. Razorpay Setup
- Create account at https://razorpay.com
- Get API keys from Dashboard → Settings → API Keys
- Configure webhook URL: `https://your-domain.com/api/razorpay/webhook`

### 3. MSG91 Setup (for DLT-compliant SMS)
- Create account at https://msg91.com
- Get Auth Key from Dashboard
- Register DLT templates for:
  - Order Confirmation
  - Pickup Scheduled
  - Shipped Notification
  - Delivery Confirmation
  - Payment Link

## File Locations

```
qwen3-coder-next-r2/
├── apps/
│   ├── customer/          # Customer website source
│   │   ├── app/          # Next.js App Router pages
│   │   └── components/   # Reusable components
│   │
│   ├── agent/            # Agent web app source
│   │   ├── app/          # Mobile-first pages
│   │   └── components/   # Agent-specific components
│   │
│   └── admin/            # Admin panel source
│       ├── app/          # Admin pages
│       └── components/   # Admin components
│
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── supabase/         # Supabase client utility
│   └── api-client/       # API client utility
│
├── supabase/
│   └── migrations/       # Database migrations
│
├── .env.example         # Environment variable template
├── .gitignore
├── package.json         # Root config
├── turbo.json           # Turborepo config
├── README-COURIER.md    # Project overview
└── DEPLOYMENT.md        # Deployment guide
```

## Running Locally

```bash
# Install dependencies
pnpm install

# Start all apps
pnpm dev

# Start individual apps
pnpm dev:customer    # Port 3000
pnpm dev:agent       # Port 3002
pnpm dev:admin       # Port 3003
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_XXXX
RAZORPAY_SECRET=your-secret

# MSG91
MSG91_AUTH_KEY=your-auth-key
NEXT_PUBLIC_MSG91_SENDER=SENDER_ID

# App
NEXT_PUBLIC_APP_NAME="Courier Booking"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing Checklist

### Customer Flow
- [ ] Price calculator works for different destinations
- [ ] Order creation works
- [ ] Razorpay test payment completes
- [ ] Order appears in customer history
- [ ] Tracking page shows order status

### Agent Flow
- [ ] Agent login works
- [ ] Today's pickups display
- [ ] QR scanner finds orders
- [ ] Manual search works
- [ ] Weight entry updates prices
- [ ] Status updates send notifications

### Admin Flow
- [ ] Admin login works
- [ ] Dashboard shows correct stats
- [ ] Order status updates work
- [ ] Sticker print generates correctly
- [ ] CN22/CN23 form prints
- [ ] GST invoice generates
- [ ] Rate tables can be edited

## Known Limitations

1. **Payment Receipts**: Email receipts generated after payment (requires email service configuration)
2. **Bulk Upload**: Excel upload for multiple orders (UI ready, needs backend implementation)
3. **Invoice Download**: Customer can view invoices, download as PDF needs implementation
4. **Refund Processing**: Refund workflow documented but needs full implementation

## Security Considerations

1. **RLS Policies**: Row-level security is enabled on all tables
2. **API Keys**: Never commit `.env` files with real keys
3. **Authentication**: Supabase Auth handles all user authentication
4. **Payment**: Razorpay handles PCI compliance

## Support

For issues or questions:
1. Check the documentation in `docs/`
2. Review the code comments
3. Contact the development team

## Next Steps (Optional Enhancements)

1. **Mobile Apps**: Native iOS/Android apps using Expo
2. **Analytics**: Integration with Google Analytics or Plausible
3. **Multi-language**: Support for regional Indian languages
4. **Bulk Operations**: Bulk order creation and export
5. **Reporting**: Advanced analytics dashboard for admins
6. **API Documentation**: Swagger/OpenAPI spec for integrations

## Contact Information

**Project**: Courier Booking Platform
**Repository**: qwen3-coder-next-r2 branch
**Supabase Project**: [Your Project URL]
**Production URL**: [To be configured]

---

*Document generated: November 2024*
*Version: 1.0.0*
