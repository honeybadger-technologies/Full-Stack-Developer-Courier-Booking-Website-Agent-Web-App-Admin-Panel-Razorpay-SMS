# Domain - Courier Booking Platform

## The Problem

A digital agency needs a branded international courier booking platform for a client in Delhi NCR. Parcels ship through India Post (booked at the post office counter), but customers only ever see the client's brand. The platform needs to handle:

1. **Customer bookings** - Price calculation, booking, payment, tracking
2. **Agent pickups** - QR scanning, weight verification, photo capture
3. **Admin management** - Orders, customers, agents, payments, document printing

## Actors

| Actor | Who they are | What they do | What they must never be able to do |
|---|---|---|---|
| **Customer** | Public users shipping parcels | Price calculators, book parcels, pay online, track shipments | View other customers' bookings, modify rates |
| **Pickup Agent** | Field staff collecting parcels | Scan stickers, verify weight, take photos, complete pickups | Access admin functions, modify customer data |
| **Admin** | Agency staff managing operations | Manage orders, print stickers, add tracking, process payments | View agent's camera photos, delete delivery data |
| **System** | Automated processes | Send notifications, reconcile payments, generate PDFs | Override manual status updates |

## Core Concepts

The system revolves around these key entities:

1. **Parcel** - The core object being shipped
2. **Booking** - A customer's request to ship one or more parcels
3. **Payment** - Razorpay transaction for booking cost
4. **Pickup** - Agent-assigned task to collect parcels
5. **Tracking** - India Post tracking information
6. **Customer** - Person making the booking
7. **Agent** - Field staff performing pickups

## Key Workflows

### Customer Booking Flow

- **Trigger**: Customer enters destination and weight on price calculator
- **Actors**: Customer
- **Steps**:
  1. Enter destination country and parcel weight
  2. View calculated price (India Post rate + margin)
  3. Create booking account if needed
  4. Enter receiver details
  5. Schedule pickup date/time
  6. Pay online via Razorpay (UPI, cards, net banking)
  7. Receive booking confirmation with QR sticker
- **Outcome**: Booking confirmed, payment captured, pickup scheduled
- **Failure modes**: Payment fails → booking not created; India Post rejects → refund issued

### Agent Pickup Flow

- **Trigger**: Agent assigned pickups for the day
- **Actors**: Pickup Agent, Customer
- **Steps**:
  1. Agent views today's pickups with addresses and map links
  2. Scan QR sticker with phone camera (or search by name/phone)
  3. Enter actual parcel weight
  4. System recalculates price if weight differs
  5. Take photo of parcel as proof
  6. If balance due → SMS payment link sent
  7. Mark parcel picked up/handed to office
- **Outcome**: Parcel collected, any balance payment initiated
- **Failure modes**: QR scan fails → fallback search; weight mismatch → payment required

### Admin Tracking Flow

- **Trigger**: Admin enters India Post tracking number
- **Actors**: Admin, Customer
- **Steps**:
  1. Admin enters India Post tracking number
  2. System generates tracking link visible to customer
  3. Admin manually updates status (In Transit, Delivered)
  4. Customer receives notification
- **Outcome**: Tracking visible to customer, status updated
- **Failure modes**: Invalid tracking number → error shown

## Business Rules

| Rule | Why it exists | Where it is enforced |
|---|---|---|
| Price = India Post rate + fixed margin | Client's revenue model | Price calculator, booking |
| Weight verification at pickup | India Post charges by actual weight | Agent app, booking recalculation |
| DLT-compliant SMS | Regulatory compliance for India | SMS service |
| Razorpay payment reconciliation | Accurate financial records | Admin panel, payments library |
| QR sticker with unique ID | Traceability from booking to pickup | Sticker generation, agent scan |
| Customer only sees branded experience | Client's brand requirements | All customer-facing apps |

## Out of Scope

- Physical post office counter integration (manual entry only)
- International customs clearance (CN22/CN23 forms provided, not filed)
- Multi-carrier support (India Post only)
- Cash-on-delivery payments (pre-payment only via Razorpay)
- Mobile native apps (PWA for customer, phone browser for agents)