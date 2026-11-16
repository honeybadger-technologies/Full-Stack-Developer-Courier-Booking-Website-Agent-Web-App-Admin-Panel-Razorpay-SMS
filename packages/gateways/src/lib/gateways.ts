import { getSupabaseClient } from '@courier/supabase-client';
import type { Database } from '@courier/supabase-client';
import type {
  Booking,
  BookingStatus,
  Tracking,
  TrackingStatus,
} from '@courier/models';

// Gateway interfaces for external integrations
export interface IndiaPostGateway {
  /**
   * Fetch tracking information from India Post
   */
  fetchTracking(trackingNumber: string): Promise<TrackingUpdate>;

  /**
   * Update booking tracking in the database
   */
  updateBookingTracking(bookingId: string, trackingData: TrackingUpdate): Promise<void>;
}

export interface PaymentGateway {
  /**
   * Create a payment order
   */
  createPaymentOrder(amount: number, bookingId: string): Promise<PaymentOrder>;

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean;

  /**
   * Capture payment
   */
  capturePayment(paymentId: string, amount: number): Promise<Payment>;

  /**
   * Get payment details
   */
  getPayment(paymentId: string): Promise<Payment>;
}

export interface SMSGateway {
  /**
   * Send an SMS
   */
  sendSMS(phoneNumber: string, message: string): Promise<SMSResponse>;
}

export interface EmailGateway {
  /**
   * Send an email
   */
  sendEmail(to: string, subject: string, html: string): Promise<EmailResponse>;
}

// Response types
export interface TrackingUpdate {
  status: TrackingStatus;
  statusDetails?: string;
  lastUpdated: string;
}

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  notes: {
    booking_id: string;
  };
}

export interface Payment {
  id: string;
  amount: number;
  status: string;
  method: string;
}

export interface SMSResponse {
  message: string;
  type: string;
  returned_data: any;
}

export interface EmailResponse {
  id: string;
  to: string;
  subject: string;
  html: string;
  status: 'sent' | 'failed';
}

// Gateway implementations
class IndiaPostGatewayImpl implements IndiaPostGateway {
  async fetchTracking(trackingNumber: string): Promise<TrackingUpdate> {
    // India Post doesn't have a public API - this would be implemented
    // with web scraping or a third-party service that aggregates India Post data

    // For now, return a mock response
    // In production, this would call a service like:
    // -.indiaposttracker.com API
    // -trackon.in API
    // -Custom web scraper with India Post website

    return {
      status: 'booked',
      statusDetails: 'Parcel information not available yet',
      lastUpdated: new Date().toISOString(),
    };
  }

  async updateBookingTracking(
    bookingId: string,
    trackingData: TrackingUpdate
  ): Promise<void> {
    const supabase = getSupabaseClient();

    // Check if tracking record exists
    const { data: existingTracking } = await supabase
      .from('tracking')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    const updateData = {
      status: trackingData.status,
      status_details: trackingData.statusDetails,
      last_updated: trackingData.lastUpdated,
      updated_at: new Date().toISOString(),
    };

    if (existingTracking) {
      await supabase
        .from('tracking')
        .update(updateData)
        .eq('booking_id', bookingId);
    } else {
      await supabase.from('tracking').insert({
        booking_id: bookingId,
        status: trackingData.status,
        status_details: trackingData.statusDetails,
        last_updated: trackingData.lastUpdated,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }
}

class PaymentGatewayImpl implements PaymentGateway {
  async createPaymentOrder(amount: number, bookingId: string): Promise<PaymentOrder> {
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        bookingId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create payment order: ${response.statusText}`);
    }

    return response.json();
  }

  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    // This would be implemented on the server side
    // using Razorpay's signature verification
    return true; // Mock implementation
  }

  async capturePayment(paymentId: string, amount: number): Promise<Payment> {
    const response = await fetch('/api/payments/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId,
        amount,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to capture payment: ${response.statusText}`);
    }

    return response.json();
  }

  async getPayment(paymentId: string): Promise<Payment> {
    const response = await fetch(`/api/payments/${paymentId}`);

    if (!response.ok) {
      throw new Error(`Failed to get payment: ${response.statusText}`);
    }

    return response.json();
  }
}

class SMSGatewayImpl implements SMSGateway {
  async sendSMS(phoneNumber: string, message: string): Promise<SMSResponse> {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send SMS: ${response.statusText}`);
    }

    return response.json();
  }
}

class EmailGatewayImpl implements EmailGateway {
  async sendEmail(to: string, subject: string, html: string): Promise<EmailResponse> {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    return response.json();
  }
}

// Gateway instances (singletons)
let indiaPostGateway: IndiaPostGateway | null = null;
let paymentGateway: PaymentGateway | null = null;
let smsGateway: SMSGateway | null = null;
let emailGateway: EmailGateway | null = null;

export function getIndiaPostGateway(): IndiaPostGateway {
  if (!indiaPostGateway) {
    indiaPostGateway = new IndiaPostGatewayImpl();
  }
  return indiaPostGateway;
}

export function getPaymentGateway(): PaymentGateway {
  if (!paymentGateway) {
    paymentGateway = new PaymentGatewayImpl();
  }
  return paymentGateway;
}

export function getSMSGateway(): SMSGateway {
  if (!smsGateway) {
    smsGateway = new SMSGatewayImpl();
  }
  return smsGateway;
}

export function getEmailGateway(): EmailGateway {
  if (!emailGateway) {
    emailGateway = new EmailGatewayImpl();
  }
  return emailGateway;
}