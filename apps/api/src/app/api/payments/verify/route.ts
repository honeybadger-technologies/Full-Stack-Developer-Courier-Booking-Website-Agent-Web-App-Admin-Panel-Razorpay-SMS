import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/payments/verify
 * Verify Razorpay payment signature (server-side)
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

    const razorpay = require('razorpay')(
      process.env.RAZORPAY_KEY_ID,
      process.env.RAZORPAY_KEY_SECRET
    );

    const verification = razorpay.orders.verifyPaymentSignature({
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