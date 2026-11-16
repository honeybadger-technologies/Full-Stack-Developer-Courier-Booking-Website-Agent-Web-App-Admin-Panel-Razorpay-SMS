# Production Handoff Document

This document provides a comprehensive guide for transitioning the Honeybadger Courier Platform to production and maintaining it afterward.

## Overview

This platform has been designed for production deployment with scalability, security, and reliability as core priorities. Follow these steps carefully for successful deployment.

## Prerequisites Checklist

### Required Accounts

- [ ] **Supabase Account**: Set up with PostgreSQL database and bucket for file storage
- [ ] **Razorpay Account**: Completed KYC and payment gateway integration
- [ ] **MSG91 Account**: DLT compliant configuration with sender ID approved
- [ ] **Vercel Account**: Connected for deployment
- [ ] **GitHub Account**: Repository access for staging and production

### Required Keys & Credentials

- [ ] Supabase URL and anon key (public)
- [ ] Supabase service role key (private - for backend API)
- [ ] Razorpay key ID and secret (for webhooks)
- [ ] MSG91 auth key (for SMS)
- [ ] Environment-specific URLs and email addresses

### Domain & SSL

- [ ] Custom domain configured for production
- [ ] SSL certificate installed (auto-provided by Vercel)
- [ ] DNS records pointing to Vercel
- [ ] CNAME records configured for subdomains (if applicable)

## Deployment Steps

### 1. Database Setup (Supabase)

```bash
# Create new project in Supabase dashboard
# Run migrations in order:
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript > packages/db/types.ts
```

**Migrations Checklist**:
- [ ] Create all tables (orders, customers, agents, payments, rate_tables, notifications)
- [ ] Set up Row Level Security policies
- [ ] Configure storage buckets for uploads
- [ ] Create indexes for performance
- [ ] Set up functions for business logic

### 2. Environment Configuration

Create `.env.local` and `.env.production` files:

```bash
# Copy example and update
cp .env.example .env.local
cp .env.example .env.production

# Edit with actual credentials
nano .env.production
```

**Required Variables**:
```
NEXT_PUBLIC_SUPABASE_URL=production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=public_key
SUPABASE_SERVICE_ROLE_KEY=private_key

RAZORPAY_KEY_ID=razorpay_key_id
RAZORPAY_KEY_SECRET=razorpay_secret

MSG91_AUTH_KEY=auth_key
MSG91_SENDER_ID=YOURBRAND

NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Honeybadger Courier
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourbrand.com
```

### 3. Backend API Setup

**Razorpay Webhooks**:
1. Go to Razorpay Dashboard → Webhooks
2. Add webhook: `https://yourdomain.com/api/webhooks/razorpay`
3. Secret: Your Razorpay webhook secret
4. Events to subscribe: `payment.captured`, `payment.failed`

**MSG91 Webhooks**:
1. Go to MSG91 Dashboard → Webhooks
2. Add webhook: `https://yourdomain.com/api/webhooks/msg91`
3. Subscribe to delivery status events

### 4. Frontend Deployment (Vercel)

**Option A: Deploy All Apps**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy all apps with scopes
vercel --scope=customer-web --prod
vercel --scope=agent-web --prod
vercel --scope=admin-panel --prod
```

**Option B: Deploy Individually via Dashboard**

1. For each app (customer-web, agent-web, admin-panel):
   - Open app directory
   - Run `vercel --prod`
   - Configure environment variables in Vercel dashboard
   - Enable deployment previews

**Environment Variables in Vercel**:
- Create separate variables for each app
- Add `.env.production` content to Vercel dashboard
- Add secret keys with `vercel env add`

### 5. Verification Checklist

Before going live:

- [ ] All apps accessible at their domains
- [ ] Database schema applied correctly
- [ ] Authentication working for all three apps
- [ ] Razorpay payment flow functional (test payment)
- [ ] MSG91 SMS delivery working (test SMS)
- [ ] Order creation flow works end-to-end
- [ ] Agent pickup flow works
- [ ] Admin panel can create orders
- [ ] Document generation works (stickers, customs forms, invoices)
- [ ] QR codes generate correctly
- [ ] Tracking page displays order status
- [ ] Error handling works
- [ ] All console errors resolved
- [ ] Mobile responsive on common devices
- [ ] Performance tested (load times < 3s)

### 6. Monitoring Setup

**Alerts to Configure**:
- [ ] Supabase uptime
- [ ] Vercel deployment status
- [ ] Razorpay payment failures
- [ ] SMS delivery failures
- [ ] API error rate > 5%
- [ ] Response time > 3 seconds

**Logging**:
- [ ] Configure error logging in Vercel dashboard
- [ ] Set up Sentry for frontend errors (optional)
- [ ] Configure Supabase logging
- [ ] Monitor webhook delivery logs

### 7. Backup Strategy

**Database Backups**:
- Enable Supabase automatic backups (daily, 7 days)
- Set up manual backup command: `npx supabase db dump`
- Document restore procedure

**File Backups**:
- Public folder is static, no database backup needed
- Image uploads are in Supabase storage, also backed up

## Post-Deployment

### Daily Tasks

- Monitor error logs
- Check payment status
- Verify SMS delivery
- Review customer feedback
- Check agent performance

### Weekly Tasks

- Review analytics (order volume, conversion rate)
- Check payment reconciliation
- Update rate tables if needed
- Review and clean up test data

### Monthly Tasks

- Review analytics and growth metrics
- Update dependencies
- Review security patches
- Update documentation
- Plan new features

### Quarterly Tasks

- Performance optimization
- Security audit
- Infrastructure review
- Cost optimization
- Feature planning

## Team Handoff

### Team Members Access

**Customer Team**:
- [ ] Frontend developer for customer website
- [ ] Support team trained on tracking page

**Agent Team**:
- [ ] Agent training materials provided
- [ ] Troubleshooting guide shared

**Admin Team**:
- [ ] Admin panel training completed
- [ ] Customization guide documented

### Documentation Archive

All documentation located in `docs/`:
- `CLAUDE.md` - Architecture and development guide
- `api-spec.md` - API documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `HANDBOOK.md` - Project handbook
- `handover.md` - This document

## Troubleshooting

### Common Issues

**Payment Issues**:
- Verify Razorpay webhook configuration
- Check logs for payment failures
- Confirm test mode vs live mode

**SMS Not Sent**:
- Verify MSG91 credits
- Check DLT compliance status
- Verify sender ID

**Database Errors**:
- Check Supabase status page
- Verify connection strings
- Check RLS policies

**Deployment Issues**:
- Check Vercel build logs
- Verify environment variables
- Check for build errors in terminal

### Emergency Contacts

- Development Lead: [email/phone]
- Technical Support: [email/phone]
- Vendor Support: [Razorpay/MSG91/Supabase support]

## Performance Optimization

### Critical Metrics

- Page load time: < 3 seconds
- API response time: < 1 second
- Payment processing: < 30 seconds
- SMS delivery: < 30 seconds

### Optimization Tips

- Enable Next.js image optimization
- Implement caching strategies
- Use CDN for static assets
- Optimize database queries
- Monitor and cache API responses

## Security Checklist

- [ ] All secrets stored securely (Vercel environment variables)
- [ ] HTTPS enforced (SSL certificate)
- [ ] CSP headers configured
- [ ] Rate limiting implemented
- [ ] XSS and CSRF protection active
- [ ] SQL injection prevention (Supabase RLS)
- [ ] Input validation on all endpoints
- [ ] Regular security audits scheduled

## Contact & Support

For questions or issues:
- **GitHub Issues**: Open a new issue in the repository
- **Email Support**: support@yourbrand.com
- **Vendor Support**:
  - Razorpay: https://razorpay.com/docs
  - MSG91: https://docs.msg91.com/
  - Supabase: https://supabase.com/docs

---

**Document Version**: 1.0
**Last Updated**: 2026-11-16
**Next Review**: 2027-02-16