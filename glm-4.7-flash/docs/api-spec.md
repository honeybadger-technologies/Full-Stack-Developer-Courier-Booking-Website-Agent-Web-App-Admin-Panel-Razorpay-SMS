# API Specification

Complete API documentation for Honeybadger Courier Platform.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

## Authentication

Most endpoints require authentication using JWT tokens:

```typescript
Authorization: Bearer <your_jwt_token>
```

---

## Booking API

### Calculate Price

**Endpoint**: `POST /api/booking/calculate-price`

**Description**: Calculate price for a parcel based on destination country and weight.

**Request**:
```typescript
{
  "destination_country": "USA",
  "weight": 2.5,
  "dimensions": {
    "length": 30,
    "width": 20,
    "height": 10
  }
}
```

**Response**:
```typescript
{
  "success": true,
  "data": {
    "price": 450,
    "base_rate": 400,
    "margin": 50,
    "weight_rate": 0
  }
}
```

### Create Booking

**Endpoint**: `POST /api/booking/create`

**Description**: Create a new booking.

**Request**:
```typescript
{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 98765 43210",
    "address": {
      "street": "123 Main St",
      "city": "New Delhi",
      "state": "Delhi",
      "postal_code": "110001",
      "country": "India"
    }
  },
  "parcel": {
    "destination_country": "USA",
    "weight": 2.5,
    "dimensions": {
      "length": 30,
      "width": 20,
      "height": 10
    },
    "description": "Electronics"
  },
  "pickup_address": {
    "street": "456 Market St",
    "city": "New Delhi",
    "state": "Delhi",
    "postal_code": "110001",
    "country": "India"
  },
  "pickup_date": "2026-11-20"
}
```

**Response**:
```typescript
{
  "success": true,
  "data": {
    "order_id": "HBC-123456",
    "tracking_number": null,
    "price": 450,
    "payment_link": "https://razorpay.com/...",
    "qr_code": "data:image/png;base64,..."
  }
}
```

### Upload Excel (Bulk Booking)

**Endpoint**: `POST /api/booking/upload`

**Description**: Upload Excel file for bulk bookings.

**Request**: `multipart/form-data`
- `file`: Excel file (CSV/Excel format)

**Response**:
```typescript
{
  "success": true,
  "data": {
    "total_bookings": 10,
    "success_count": 9,
    "failed_count": 1,
    "bookings": [...],
    "errors": [...]
  }
}
```

### Track Order

**Endpoint**: `GET /api/booking/track/:trackingId`

**Description**: Get order tracking information.

**Response**:
```typescript
{
  "success": true,
  "data": {
    "tracking_id": "HBC-123456",
    "status": "in_transit",
    "current_location": "New Delhi, India",
    "estimated_delivery": "2026-11-30",
    "tracking_number": "JP123456789IN",
    "timeline": [
      {
        "status": "booked",
        "date": "2026-11-20",
        "location": "New Delhi, India"
      },
      {
        "status": "picked_up",
        "date": "2026-11-21",
        "location": "New Delhi, India"
      }
    ]
  }
}
```

---

## Pickup Agent API

### Agent Login

**Endpoint**: `POST /api/pickup/login`

**Description**: Agent authentication.

**Request**:
```typescript
{
  "phone": "+91 98765 43210",
  "otp": "123456"
}
```

**Response**:
```typescript
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "agent_id": "agent-001",
    "name": "Agent Name"
  }
}
```

### Search Parcel

**Endpoint**: `GET /api/pickup/search?q=phone_number`

**Description**: Search for parcel by phone number.

**Response**:
```typescript
{
  "success": true,
  "data": {
    "order_id": "HBC-123456",
    "receiver_name": "John Doe",
    "receiver_phone": "+91 98765 43210",
    "destination": "USA",
    "weight": 2.5,
    "price": 450,
    "status": "booked"
  }
}
```

### Scan QR

**Endpoint**: `POST /api/pickup/scan`

**Description**: Process QR code scan.

**Request**:
```typescript
{
  "qr_data": "HBC-123456",
  "actual_weight": 3.0,
  "photo": "base64_encoded_image",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

**Response**:
```typescript
{
  "success": true,
  "data": {
    "order_id": "HBC-123456",
    "status": "picked_up",
    "weight_difference": 0.5,
    "balance_amount": 75,
    "payment_link": "https://razorpay.com/...",
    "sms_link": "https://msg91.com/sms/..."
  }
}
```

### Update Parcel

**Endpoint**: `PATCH /api/pickup/update/:order_id`

**Description**: Update parcel details after pickup.

**Request**:
```typescript
{
  "status": "handed_to_office",
  "agent_notes": "Parcel delivered to post office"
}
```

---

## Admin API

### Get Orders

**Endpoint**: `GET /api/admin/orders`

**Description**: Get all orders with filtering.

**Query Parameters**:
- `status`: Filter by status
- `date_from`: Start date
- `date_to`: End date
- `agent_id`: Filter by agent
- `page`: Pagination page
- `limit`: Items per page

**Response**:
```typescript
{
  "success": true,
  "data": {
    "orders": [...],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Generate Stickers

**Endpoint**: `POST /api/admin/stickers/generate`

**Description**: Generate A6 sticker with QR code.

**Request**:
```typescript
{
  "order_ids": ["HBC-123456", "HBC-123457"],
  "copies": 1
}
```

**Response**: PDF file

### Generate Customs Form

**Endpoint**: `POST /api/admin/customs/generate`

**Description**: Generate CN22/CN23 customs form.

**Request**:
```typescript
{
  "order_id": "HBC-123456",
  "type": "CN23", // or "CN22"
  "exporter": {
    "name": "Honeybadger Courier",
    "address": "..."
  }
}
```

**Response**: PDF file

### Generate Invoice

**Endpoint**: `POST /api/admin/invoice/generate`

**Description**: Generate GST invoice.

**Request**:
```typescript
{
  "order_id": "HBC-123456"
}
```

**Response**: PDF file

### Add Tracking Number

**Endpoint**: `POST /api/admin/track/add`

**Description**: Add India Post tracking number to order.

**Request**:
```typescript
{
  "order_id": "HBC-123456",
  "tracking_number": "JP123456789IN"
}
```

### Update Status

**Endpoint**: `PATCH /api/admin/track/:tracking_number`

**Description**: Update order status.

**Request**:
```typescript
{
  "status": "delivered",
  "delivery_notes": "Delivered to recipient"
}
```

---

## Webhooks

### Razorpay Webhook

**Endpoint**: `POST /api/webhooks/razorpay`

**Headers**:
- `x-razorpay-signature`: Razorpay signature

**Body**: Razorpay payment webhook payload

**Response**: `200 OK`

### MSG91 Webhook

**Endpoint**: `POST /api/webhooks/msg91`

**Headers**:
- `x-msg91-signature`: MSG91 signature

**Body**: MSG91 status webhook payload

**Response**: `200 OK`

---

## Error Responses

All endpoints return consistent error format:

```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {} // Optional additional details
  }
}
```

### Common Error Codes

- `INVALID_INPUT`: Request validation failed
- `AUTH_FAILED`: Authentication failed
- `PAYMENT_FAILED`: Payment processing failed
- `ORDER_NOT_FOUND`: Specified order not found
- `TRACKING_NOT_FOUND`: Tracking number not found
- `INSUFFICIENT_BALANCE`: Payment balance insufficient
- `RATE_LIMIT`: API rate limit exceeded

---

## Rate Limits

- Public endpoints: 100 requests per minute per IP
- Authenticated endpoints: 1000 requests per minute per token
- File upload endpoints: 10 requests per minute per IP

---

## Versioning

Current API version: `v1`

API endpoints may be prefixed with `/v1/` in future versions.

## Support

For API-related questions or issues:
- Open an issue on GitHub
- Contact: support@yourbrand.com