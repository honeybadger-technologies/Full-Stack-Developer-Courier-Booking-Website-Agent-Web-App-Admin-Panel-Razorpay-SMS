# Courier Booking Platform — Demo

Local demo of the full Courier Booking flow using the mock backend and the
demo credentials configured in each app's `.env.local`.

## Start the demo

```bash
./scripts/demo/run-demo.sh
```

This starts:

| Service | URL |
| --- | --- |
| Mock backend (Supabase auth/REST, Razorpay, MSG91, SMTP) | http://127.0.0.1:4999 |
| Customer app | http://127.0.0.1:3000 |
| Agent app | http://127.0.0.1:3002 |
| Admin app | http://127.0.0.1:3003 |

The script aborts if any of those ports is already in use and waits until each
server answers before printing the URLs and the demo sign-ins.

## Demo sign-ins

| Role | Email | Password |
| --- | --- | --- |
| Customer | demo.courier@example.com | courier-demo |
| Agent | demo.agent@example.com | courier-demo |
| Admin | demo.admin@example.com | courier-demo |

## Walkthrough

1. **Customer books and pays**
   - Sign in as the customer at `/auth/login`.
   - On `/customer/home`, use "Book a New Parcel" (destination UK, 2 kg).
   - The price is calculated before booking (short destination codes such as
     `UK` are resolved to full country names).
   - Submit "Create Order" → the app calls `POST /api/orders` with the session
     bearer token → creates the order → redirects to `/checkout`.
   - On `/checkout`, the demo checkout is used when
     `NEXT_PUBLIC_DEMO_CHECKOUT=1` (set in the customer app's `.env.local`).
     The flow calls `POST /api/razorpay/create-order`, then the mock backend's
     `POST /v1/demo/checkout`, then `POST /api/razorpay/verify`; on success the
     order shows as paid.
   - Without the flag, the live Razorpay checkout flow is used instead.

2. **Agent sees the pickup**
   - Sign in as the agent at `/auth/login`.
   - The agent dashboard lists pickups assigned to the demo agent
     (seeded paid order awaiting pickup).

3. **Admin sees the paid order**
   - Sign in as the admin at `/auth/login`.
   - The dashboard shows the stat cards once, with real counts from the mock,
     plus the listed orders.

## Stopping

`./scripts/demo/run-demo.sh` stops the servers it started on exit. To stop
manually, stop the dev servers and the mock backend processes.