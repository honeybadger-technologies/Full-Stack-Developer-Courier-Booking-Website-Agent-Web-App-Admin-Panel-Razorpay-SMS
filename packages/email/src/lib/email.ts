import axios from 'axios';

// Email types
export type EmailTemplate =
  | 'booking_confirmation'
  | 'pickup_notification'
  | 'delivery_confirmation'
  | 'payment_receipt'
  | 'weight_adjustment'
  | 'custom';

export interface EmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface EmailResponse {
  id: string;
  to: string[];
  from: string;
  subject: string;
  html: string;
  text: string;
  status: 'sent' | 'failed' | 'scheduled';
  created_at: string;
}

// Email client using Resend API
export async function sendEmail(params: EmailParams): Promise<EmailResponse> {
  const apiKey = process.env['RESEND_API_KEY'];

  if (!apiKey) {
    throw new Error('RESEND_API_KEY must be set');
  }

  const response = await axios.post(
    'https://api.resend.com/emails',
    {
      to: Array.isArray(params.to) ? params.to : [params.to],
      from: params.from || 'noreply@courier.booking',
      subject: params.subject,
      html: params.html,
      text: params.text,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    id: response.data.id || '',
    to: Array.isArray(params.to) ? params.to : [params.to],
    from: params.from || 'noreply@courier.booking',
    subject: params.subject,
    html: params.html || '',
    text: params.text || '',
    status: 'sent',
    created_at: new Date().toISOString(),
  };
}

/**
 * Send a booking confirmation email
 */
export async function sendBookingConfirmation(
  to: string,
  bookingReference: string,
  pickupDate: string,
  customerName: string
): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #0066cc;">Booking Confirmed!</h1>
      <p>Dear ${customerName},</p>
      <p>Your booking has been confirmed successfully.</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Booking Details</h3>
        <p><strong>Booking Reference:</strong> ${bookingReference}</p>
        <p><strong>Pickup Date:</strong> ${pickupDate}</p>
      </div>
      <p>A confirmation SMS has been sent to your registered phone number.</p>
      <p>Thank you for choosing our courier service!</p>
      <p>Best regards,<br>The Courier Team</p>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Booking ${bookingReference} - Confirmed`,
    html,
  });
}

/**
 * Send a pickup notification email
 */
export async function sendPickupNotification(
  to: string,
  bookingReference: string,
  customerName: string
): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pickup Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #0066cc;">Pickup Scheduled</h1>
      <p>Dear ${customerName},</p>
      <p>Your parcel for booking <strong>${bookingReference}</strong> is scheduled for pickup.</p>
      <p>Our agent will contact you shortly to confirm the pickup time.</p>
      <p>You can track your parcel using the booking reference.</p>
      <p>Thank you for choosing our courier service!</p>
      <p>Best regards,<br>The Courier Team</p>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Pickup Scheduled for Booking ${bookingReference}`,
    html,
  });
}

/**
 * Send a delivery confirmation email
 */
export async function sendDeliveryConfirmation(
  to: string,
  bookingReference: string,
  customerName: string
): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Delivery Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #28a745;">Parcel Delivered!</h1>
      <p>Dear ${customerName},</p>
      <p>Great news! Your parcel for booking <strong>${bookingReference}</strong> has been delivered successfully.</p>
      <p>Thank you for choosing our courier service!</p>
      <p>Best regards,<br>The Courier Team</p>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Parcel Delivered - Booking ${bookingReference}`,
    html,
  });
}

/**
 * Send a payment receipt email
 */
export async function sendPaymentReceipt(
  to: string,
  bookingReference: string,
  amount: number,
  customerName: string
): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #28a745;">Payment Receipt</h1>
      <p>Dear ${customerName},</p>
      <p>Thank you for your payment! Here are the details:</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Payment Details</h3>
        <p><strong>Booking Reference:</strong> ${bookingReference}</p>
        <p><strong>Amount Paid:</strong> ₹${amount.toFixed(2)}</p>
        <p><strong>Status:</strong> Completed</p>
      </div>
      <p>A copy of this receipt has been sent to your email.</p>
      <p>Thank you for choosing our courier service!</p>
      <p>Best regards,<br>The Courier Team</p>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Payment Receipt - Booking ${bookingReference}`,
    html,
  });
}

/**
 * Send a weight adjustment email with payment link
 */
export async function sendWeightAdjustment(
  to: string,
  bookingReference: string,
  originalWeight: number,
  actualWeight: number,
  balanceAmount: number,
  customerName: string
): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Weight Adjustment - Payment Required</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #ffc107;">Weight Adjustment Required</h1>
      <p>Dear ${customerName},</p>
      <p>The actual weight of your parcel differs from the declared weight.</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Weight Details</h3>
        <p><strong>Original Weight:</strong> ${originalWeight} kg</p>
        <p><strong>Actual Weight:</strong> ${actualWeight} kg</p>
        <p><strong>Additional Amount Due:</strong> ₹${balanceAmount.toFixed(2)}</p>
      </div>
      <p>Please complete the payment to proceed with your shipment.</p>
      <p>Thank you for choosing our courier service!</p>
      <p>Best regards,<br>The Courier Team</p>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Weight Adjustment - Payment Required for Booking ${bookingReference}`,
    html,
  });
}