import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

let razorpay: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
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

/**
 * POST /api/payments/create-order
 * Create a new Razorpay order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, bookingId, receipt } = body;

    if (!amount || !bookingId) {
      return NextResponse.json(
        { error: 'amount and bookingId are required' },
        { status: 400 }
      );
    }

    const rzpay = getRazorpayInstance();

    const options = {
      amount: amount, // amount in paise
      currency: 'INR',
      receipt: receipt || `hb-${bookingId}`,
      notes: {
        booking_id: bookingId,
      },
      payment_capture: 1, // Auto-capture payment
    };

    const order = await rzpay.orders.create(options);

    return NextResponse.json(
      {
        id: order.id,
        entity: order.entity,
        amount: order.amount,
        amount_paid: order.amount_paid,
        amount_due: order.amount_due,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        attempts: order.attempts,
        notes: order.notes,
        created_at: order.created_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature } = body;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'orderId, paymentId, and signature are required' },
        { status: 400 }
      );
    }

    const rzpay = getRazorpayInstance();

    const verification = rzpay.orders.verifyPaymentSignature({
      'razorpay_order_id': orderId,
      'razorpay_payment_id': paymentId,
      'razorpay_signature': signature,
    });

    if (verification) {
      return NextResponse.json(
        { verified: true, message: 'Payment verified successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { verified: false, message: 'Invalid payment signature' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}