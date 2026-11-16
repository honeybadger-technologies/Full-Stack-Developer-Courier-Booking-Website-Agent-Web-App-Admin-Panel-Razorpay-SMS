# Project Handbook

This handbook contains information about the Honeybadger Courier Platform project.

## Project Overview

Honeybadger Courier Platform is a branded international courier booking platform that leverages India Post's infrastructure while delivering a premium customer experience. The platform consists of three distinct interfaces designed for different user personas.

## Architecture

### Three Main Interfaces

1. **Customer Website** (apps/customer-web)
   - Mobile-first design for customer booking
   - Pricing calculator, booking flow, payment integration
   - Branded tracking page

2. **Pickup Agent Web App** (apps/agent-web)
   - Mobile-optimized for field agents
   - QR scanning, weight verification, photo capture
   - Status updates and payment links

3. **Admin Panel** (apps/admin-panel)
   - Comprehensive order and resource management
   - Document generation (stickers, customs forms, invoices)
   - Tracking integration and reporting

### Technology Architecture

- **Frontend**: Next.js 14+ with App Router for server-side rendering and API routes
- **Database**: Supabase (PostgreSQL) with Row Level Security for data isolation
- **State Management**: React Context API + Supabase client for real-time data
- **Styling**: Tailwind CSS for utility-first, responsive design
- **Deployment**: Vercel for serverless, edge-first deployment

## Development Workflow

### Phase 1: Foundation
1. Set up Supabase database schema
2. Configure authentication and authorization
3. Build shared packages (types, utilities)
4. Set up API routes structure

### Phase 2: Customer Website
1. Implement pricing calculator
2. Build booking form and flow
3. Integrate Razorpay payment
4. Create customer account system
5. Develop tracking page

### Phase 3: Agent Web App
1. Build agent authentication
2. Implement QR scanner
3. Add pickup management
4. Integrate weight verification
5. Enable photo capture

### Phase 4: Admin Panel
1. Build order dashboard
2. Implement printing functionality
3. Add document generation
4. Configure tracking integration
5. Set up reporting

### Phase 5: Integrations
1. Configure Razorpay webhooks
2. Set up MSG91 SMS notifications
3. Connect India Post tracking API
4. Build notification system
5. Test end-to-end flows

## Database Design

### Core Tables

**orders**: Primary booking data
- id, customer_id, agent_id, weight, dimensions
- pickup_address, delivery_address, destination_country
- booking_date, status, tracking_number
- payment_id, charges, margin

**customers**: User profiles
- id, name, email, phone, address
- profile_photo, verification_status

**agents**: Pickup agent accounts
- id, name, phone, location
- status, active_bookings

**payments**: Transaction records
- id, order_id, amount, status, payment_method
- razorpay_payment_id, created_at

**rate_tables**: Pricing configuration
- destination_country, base_rate, weight_multiplier

**notifications**: Queue for SMS/email
- id, recipient, type, message, status, sent_at

### Supabase Specifics

- Use Row Level Security (RLS) for all tables
- Enable Realtime subscriptions for order status
- Use Storage for uploaded photos and documents
- Create appropriate database functions for complex queries

## API Design

### REST API Structure

```
/api/booking/
  /calculate-price  - Get pricing
  /create           - Create order
  /upload           - Upload Excel

/api/pickup/
  /login            - Agent authentication
  /search           - Find parcel
  /scan             - QR scan
  /update           - Update weight/status

/api/admin/
  /orders           - Get all orders
  /stickers         - Generate stickers
  /customs          - Generate forms
  /track            - Get tracking info
```

### Webhook Endpoints

```
/api/webhooks/razorpay  - Payment status updates
/api/webhooks/msg91     - SMS delivery confirmations
```

## Security Guidelines

### Authentication & Authorization
- JWT tokens for all API requests
- Role-based access control (customer, agent, admin)
- Protected routes in Next.js middleware
- Secure Supabase API keys with client-side only access

### Data Protection
- Never expose service role keys to client
- Hash sensitive data (email, phone numbers)
- Use HTTPS for all communications
- Validate all user inputs

### Payment Security
- Verify Razorpay webhook signatures
- Implement payment confirmation workflow
- Log all payment transactions
- Separate production keys from development

## Code Organization

### Monorepo Structure

- **apps/**: Three separate Next.js applications
- **packages/**: Shared code and utilities
- **supabase/**: Database migrations
- **public/**: Static assets
- **docs/**: Documentation

### Naming Conventions

- Components: PascalCase (e.g., `PriceCalculator`)
- Hooks: camelCase with 'use' prefix (e.g., `useBooking`)
- Functions: camelCase (e.g., `calculatePrice`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- Types/Interfaces: PascalCase (e.g., `Order`, `BookingStatus`)

### File Structure Pattern

```
app/
  page.tsx           # Route page
  layout.tsx         # Layout wrapper
  api/
    route.ts         # API endpoint
  components/
    ui/              # Reusable components
    features/        # Feature-specific components
  lib/               # Utility functions
  hooks/             # Custom React hooks
```

## Deployment Strategy

### Stages

1. **Development**: Vercel preview deployments
2. **Staging**: Production-like environment
3. **Production**: Live customer-facing services

### CI/CD Pipeline

- Automated testing on every commit
- Build validation before deployment
- Pre-production deployment for review
- Blue-green deployment strategy

### Environment Variables

- **development**: Local keys, development URLs
- **production**: Production keys, live URLs
- **secrets**: Never committed, stored in Vercel dashboard

## Monitoring & Analytics

### Key Metrics

- Order completion rate
- Payment success rate
- Agent pickup rate
- Delivery success rate
- Average booking time

### Error Tracking

- Capture console errors and exceptions
- Monitor API failures
- Track payment failures
- Monitor webhook delivery

## Support & Maintenance

### Maintenance Tasks

- Regular dependency updates
- Database migration planning
- Security patching
- Performance monitoring

### Support Channels

- Internal issue tracking
- Team chat for quick questions
- Code reviews before merge
- Documentation updates

---

**Last Updated**: 2026-11-16
**Maintainer**: Development Team
**Version**: 0.1.0