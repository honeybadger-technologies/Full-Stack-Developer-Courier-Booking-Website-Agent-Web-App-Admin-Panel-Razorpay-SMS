import Razorpay from 'razorpay';

// Razorpay instance
let razorpay: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay Key ID and Key Secret must be set');
    }

    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpay;
}

// Payment types
export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi';

export interface PaymentCreateParams {
  amount: number; // Amount in paise (multiply by 100 for INR)
  currency: string;
  receipt: string;
  payment_capture?: number;
  notes?: Record<string, string>;
  customer_id?: string;
  method?: PaymentMethod;
}

export interface Payment {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_refunded: number;
  currency: string;
  receipt: string;
  status: PaymentStatus;
  method: PaymentMethod;
  description: string;
  capture_method: string;
  capture_order_id: string;
  receipt: string;
  notes: {
    booking_id: string;
  };
  fee: number;
  tax: number;
  amount_refunded: number;
  source: string;
  refund_status: string;
  captured: boolean;
  created_at: number;
}

export interface Order {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: {
    booking_id: string;
  };
  created_at: number;
}

// Create a payment order
export async function createPaymentOrder(params: {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<Order> {
  const rzpay = getRazorpayInstance();

  const order = await rzpay.orders.create({
    amount: params.amount,
    currency: 'INR',
    receipt: params.receipt,
    notes: params.notes || {},
  });

  return order as Order;
}

// Capture a payment
export async function capturePayment(paymentId: string, amount: number): Promise<Payment> {
  const rzpay = getRazorpayInstance();

  const payment = await rzpay.payments.capture(paymentId, amount);
  return payment as Payment;
}

// Verify payment signature
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const razorpay = getRazorpayInstance();

  try {
    razorpay.orders.verifyPaymentSignature({
      'razorpay_order_id': razorpayOrderId,
      'razorpay_payment_id': razorpayPaymentId,
      'razorpay_signature': razorpaySignature,
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Refund a payment
export async function refundPayment(
  paymentId: string,
  amount?: number
): Promise<{ id: string; entity: string; amount: number }> {
  const rzpay = getRazorpayInstance();

  const refund = await rzpay.payments.refund(paymentId, amount);
  return refund as { id: string; entity: string; amount: number };
}

// Get payment details
export async function getPayment(paymentId: string): Promise<Payment> {
  const rzpay = getRazorpayInstance();

  const payment = await rzpay.payments.fetch(paymentId);
  return payment as Payment;
}

// Create payment link
export async function createPaymentLink(params: {
  amount: number;
  currency: string;
  receipt: string;
  reference_id: string;
  customer: {
    name?: string;
    email?: string;
    contact?: string;
  };
  callback_url: string;
  callback_method: 'post' | 'get';
}): Promise<{ id: string; short_url: string }> {
  const rzpay = getRazorpayInstance();

  const link = await rzpay.payments.createPaymentLink({
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    reference_id: params.reference_id,
    customer: params.customer,
    callback_url: params.callback_url,
    callback_method: params.callback_method,
  });

  return { id: link.id, short_url: link.short_url };
}