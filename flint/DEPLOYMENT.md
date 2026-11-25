# Deployment Guide

## Prerequisites

- Vercel CLI installed (`npm install -g vercel`)
- Supabase CLI installed (`npm install -g supabase`)
- Access to the Supabase dashboard
- Access to Razorpay dashboard
- Access to MSG91 dashboard

## Step 1: Deploy to Vercel

### Deploy Customer Website

```bash
cd apps/customer
vercel --prod
```

When prompted:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No**
- What's your project's name? **courier-website**
- In which directory is your code located? **./**

### Deploy Admin Panel

```bash
cd apps/admin
vercel --prod
```

When prompted:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No**
- What's your project's name? **courier-admin**
- In which directory is your code located? **./**

## Step 2: Configure Environment Variables

### Customer Website

Go to Vercel Dashboard → courier-website → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_XXXX
NEXT_PUBLIC_API_URL=https://your-api.vercel.app/api
```

### Admin Panel

Go to Vercel Dashboard → courier-admin → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_XXXX
NEXT_PUBLIC_API_URL=https://your-api.vercel.app/api
```

## Step 3: Set Up Supabase

### 1. Create New Project

Go to https://supabase.com → Create New Project

### 2. Get Credentials

Project Settings → API → Copy:
- Project URL
- anon public key
- service_role key (keep secret!)

### 3. Run Migrations

Option A - Using Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `supabase/migrations/0001_initial_schema.sql`
3. Paste and run

Option B - Using Supabase CLI:
```bash
supabase db push
```

## Step 4: Configure Razorpay

### 1. Get API Keys

Go to https://razorpay.com → Dashboard → Settings → API Keys

### 2. Configure Webhook

Webhook URL: `https://your-customer-domain.vercel.app/api/razorpay/webhook`

Configure for events:
- `payment.captured`
- `payment.failed`

## Step 5: Configure MSG91

### 1. Get Auth Key

Go to https://msg91.com → Dashboard → SMS → Auth Key

### 2. Create DLT Template

Register templates for:
- Order Confirmation
- Pickup Scheduled
- Shipped Notification
- Delivery Confirmation
- Payment Link

### 3. Add Sender ID

Register a 6-character sender ID for transactional SMS.

## Step 6: Configure Domain

### Customer Website

1. Go to Vercel → Settings → Domains
2. Add custom domain
3. Update DNS records

### Admin Panel

Same process for admin subdomain.

## Step 7: Test Everything

1. **Customer Flow**
   - Visit customer website
   - Test price calculator
   - Test order creation
   - Test Razorpay test payment

2. **Agent Flow**
   - Login as agent
   - Verify pickups appear
   - Test QR scanner
   - Test weight entry

3. **Admin Flow**
   - Login as admin
   - Verify dashboard stats
   - Test order status updates
   - Test sticker print

## Step 8: Update Documentation

Run:
```bash
# Generate API docs
pnpm docs:generate

# Export environment template
cp .env.example .env.production.example
```

## Troubleshooting

### Database Connection Issues

- Verify Supabase URL and keys
- Check database is running
- Verify RLS policies

### Razorpay Payment Issues

- Verify test mode keys
- Check webhook configuration
- Review Razorpay dashboard logs

### SMS Not Sending

- Verify MSG91 auth key
- Check DLT template approval
- Verify sender ID registration

## Rollback

If issues occur:
```bash
cd apps/customer
vercel rollback
```

## Maintenance

### Database Backups

```bash
supabase db dump -f backup.sql
supabase db restore -f backup.sql
```

### Logs

```bash
# Customer app logs
vercel logs courier-website

# Admin app logs
vercel logs courier-admin
```
