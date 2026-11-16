# Courier Booking Platform: LLM Benchmark

This repo tests how well **5 LLMs** handle a real freelance job. Each model gets the same brief,
an actual Upwork posting, and tries to build the product. We then compare the results against
the job's own acceptance criteria.

- **Source job:** [Full-Stack Developer: Courier Booking Website + Agent Web App + Admin Panel (Razorpay, SMS)](https://www.upwork.com/freelance-jobs/apply/Full-Stack-Developer-Courier-Booking-Website-Agent-Web-App-Admin-Panel-Razorpay-SMS_~022122258714986813070/)
- **Why a real job:** a toy prompt says little about how a model copes with a real spec. This one
  has payments, SMS, PDFs, camera scanning, three user roles and a fixed deadline.

---

## Contestants

| # | Model | Runtime | Size on disk | Workspace |
|---|-------|---------|-------------:|-----------|
| 1 | `flint` | Ollama (local) | 22 GB | `flint/` |
| 2 | `glm-4.7-flash` | Ollama (local) | 19 GB | `glm-4.7-flash/` |
| 3 | `qwen3-coder-next` | Ollama (local) | 51 GB | `qwen3-coder-next/` |
| 4 | `qwen3.8` | Ollama (local) | 18 GB | `qwen3.8/` |
| 5 | _TBD_ | | | |

Each model's attempt lives in its own folder and branch, named after the model.

### Hardware (local models)

| | |
|---|---|
| Machine | MacBook Pro, Apple M4 Max |
| CPU | 16 cores (12 performance + 4 efficiency) |
| GPU | 40 cores, Metal 4 |
| Memory | 128 GB unified |
| Inference | [Ollama](https://ollama.com) |

---

## The brief

A digital agency is building a branded international courier booking platform for a client in
Delhi NCR. Parcels ship through India Post (booked at the post office counter), but customers
only ever see the client's brand. Timeline: 5 weeks, one developer.

### 1. Customer website (mobile-first)
- Price calculator by destination country and weight (India Post rate + fixed margin, set in admin)
- Book single parcels, or many at once by Excel upload
- Schedule a pickup
- Pay online with Razorpay (UPI, cards, net banking)
- Customer account with booking history, downloadable invoices and a branded tracking page

### 2. Pickup agent web app (phone browser, no native app)
- Login and today's pickups, with address and map link
- Scan the pre-printed sticker QR with the phone camera; fall back to search by name or phone
- Enter the actual weight and take a parcel photo
- If the weight differs, recalculate: the customer pays the balance through an SMS payment
  link, or gets a credit/refund
- Mark picked up / handed to office

### 3. Admin panel
- Orders, customers, agents and payments
- Print A6 stickers (order ID, receiver address, package info, QR)
- Auto-filled CN22/CN23 customs forms and GST invoices as PDF
- Enter the India Post tracking number, which shows a tracking link to the customer; manual
  status updates including "Delivered"
- Rate tables and margin settings
- Record bank transfer and cash payments

### 4. Notifications
- SMS (DLT-compliant, e.g. MSG91) and email at booked, picked up, shipped and delivered

### Tech
React/Next.js + Supabase (or similar), hosted on Vercel.

---

## Scoring

Each attempt is scored against the job's acceptance criteria:

| # | Acceptance criterion | flint | glm-4.7-flash | qwen3-coder-next | qwen3.8 | #5 |
|---|----------------------|:-----:|:-------------:|:----------------:|:-------:|:--:|
| 1 | A customer can price, book, pay and track a parcel end-to-end on mobile and desktop | | | | | |
| 2 | The agent can scan a sticker, update the weight and photo, and trigger a balance payment | | | | | |
| 3 | The admin can print stickers and customs PDFs and add tracking numbers; customer statuses update and SMS/email are sent | | | | | |
| 4 | Razorpay payments work (test mode) and are reconciled in admin | | | | | |
| 5 | Deployable, with source code and a short handover doc | | | | | |

Also recorded per model:

- Wall-clock time and number of prompts or turns needed
- Whether the build, lint and tests pass
- How much human fixing was needed to reach a working demo
- Notable failures: hallucinated APIs, unfinished features, security problems

The original milestones (40% design + customer website, 30% agent + admin demo, 30% launch
and handover) can be used as checkpoints for partial credit.

> Payments, SMS and email run against **sandbox/test accounts only**. No live keys are
> committed to this repo.

---

## License

See [LICENSE](LICENSE).
