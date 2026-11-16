# Glossary - Courier Booking Platform

| Term | Means | Does not mean | First seen |
|---|---|---|---|
| **Parcel** | A single item being shipped with weight, dimensions, and description | A booking (which can contain multiple parcels) | domain.md |
| **Booking** | A customer's request to ship one or more parcels, with pickup details and payment | A single parcel or shipment | domain.md |
| **Rate** | India Post shipping cost + fixed margin percentage/amount | A variable price that changes per order | domain.md |
| **Pickup** | An agent-assigned task to collect parcels from a customer | The action of picking up (used as noun for the scheduled task) | domain.md |
| **QR sticker** | A printed label with unique order ID and receiver address, scanned by agent | A tracking barcode from India Post | domain.md |
| **DLT** | Direct Layout Text - India's SMS registration and template system | Email template | domain.md |
| **CN22/CN23** | International customs declaration forms (CN22 for ≤1kg, CN23 for >1kg) | Internal tracking numbers | domain.md |
| **Razorpay** | Indian payment gateway for UPI, cards, net banking, wallets | International payment processor | domain.md |
| **India Post tracking** | Official tracking from India Post, entered manually by admin | Automated carrier integration | domain.md |
| **Branch** | A development branch in git, named per convention (feature/, fix/, etc.) | A physical office location | rules/git-workflow.md |
| **Trunk** | The `main` branch, the single integration branch | A release branch or feature branch | rules/git-workflow.md |

## Acronyms

| Acronym | Meaning | Context |
|---|---|---|
| DLT | Direct Layout Text | SMS compliance in India |
| QR | Quick Response | Barcode on sticker |
| UPI | Unified Payments Interface | Indian mobile payment system |
| PDF | Portable Document Format | Document format for invoices |
| API | Application Programming Interface | Backend interface |
| PWA | Progressive Web App | Web app installable like native app |