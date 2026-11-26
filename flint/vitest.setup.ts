// Shared test environment defaults for the Courier Booking Platform API route tests.
// Values mirror the demo/mock configuration so route modules capture a consistent
// environment before they are imported by the test files.
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:4999'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-demo-key'
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'service-demo-key'

process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo'
process.env.RAZORPAY_SECRET = process.env.RAZORPAY_SECRET || 'rzp_demo_secret'
process.env.RAZORPAY_BASE_URL = process.env.RAZORPAY_BASE_URL || 'http://localhost:4999/v1'

process.env.MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || 'msg91_demo_auth_key'
process.env.NEXT_PUBLIC_MSG91_SENDER = process.env.NEXT_PUBLIC_MSG91_SENDER || 'CNRPAYR'
process.env.MSG91_BASE_URL = process.env.MSG91_BASE_URL || 'http://localhost:4999/sms/v3/sendText'

process.env.SMTP_TRANSPORT = process.env.SMTP_TRANSPORT || 'json'
process.env.SMTP_HOST = process.env.SMTP_HOST || 'localhost'
process.env.SMTP_PORT = process.env.SMTP_PORT || '587'
process.env.SMTP_USER = process.env.SMTP_USER || ''
process.env.SMTP_PASS = process.env.SMTP_PASS || ''
process.env.SMTP_FROM = process.env.SMTP_FROM || 'noreply@courier.com'
process.env.NEXT_PUBLIC_APP_EMAIL = process.env.NEXT_PUBLIC_APP_EMAIL || 'noreply@courier.com'
process.env.NEXT_PUBLIC_APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Courier Booking Platform'
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'