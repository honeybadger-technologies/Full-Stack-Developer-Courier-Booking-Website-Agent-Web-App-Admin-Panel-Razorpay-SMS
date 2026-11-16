# Courier Booking Platform - CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with Nx monorepo
- Customer web app with price calculator and booking flow
- Agent web app for pickup management
- Admin panel for operations management
- Backend API with RESTful routes
- Shared packages for UI, models, Supabase client, payments, SMS, email, print
- Tailwind CSS configuration
- GitHub Actions CI/CD workflow
- Supabase database schema

## Project Structure

### Applications
- `apps/customer` - Customer-facing web app
- `apps/agent` - Pickup agent web app
- `apps/admin` - Admin panel
- `apps/api` - Backend API

### Packages
- `packages/ui` - Shared UI components
- `packages/models` - TypeScript models and types
- `packages/supabase-client` - Supabase client setup
- `packages/payments` - Razorpay integration
- `packages/sms` - MSG91 SMS integration
- `packages/email` - Resend email integration
- `packages/print` - PDF generation
- `packages/gateways` - External API gateways

## Setup Instructions

See the [README.md](README.md) for setup instructions.