import axios from 'axios';

// MSG91 SMS client
export interface SMSOptions {
  authkey: string;
  sender: string;
  route?: '4' | '1'; // 4 = promotional, 1 = transactional
}

export interface SMSPaymentLinkParams {
  phoneNumber: string;
  amount: number;
  bookingReference: string;
  callbackUrl: string;
}

export interface SMSParams {
  phoneNumber: string;
  message: string;
  route?: '4' | '1';
  sender?: string;
}

// MSG91 API endpoints
const MSG91_API_BASE = 'https://control.msg91.com/api';

export class SMSClient {
  private authkey: string;
  private defaultSender: string;
  private defaultRoute: string;

  constructor(options: SMSOptions) {
    this.authkey = options.authkey;
    this.defaultSender = options.sender;
    this.defaultRoute = options.route || '1'; // Default to transactional
  }

  /**
   * Send a text SMS
   */
  async sendSMS(params: SMSParams): Promise<{ message: string; type: string; returned_data: any }> {
    const url = `${MSG91_API_BASE}/v2/http/sendsms`;

    const response = await axios.post(url, {
      authkey: this.authkey,
      mobiles: params.phoneNumber,
      message: params.message,
      route: params.route || this.defaultRoute,
      sender: params.sender || this.defaultSender,
    });

    return response.data;
  }

  /**
   * Send a payment link SMS (DLT-compliant template)
   * This uses a pre-registered DLT template for payment links
   */
  async sendPaymentLinkSMS(params: SMSPaymentLinkParams): Promise<{ message: string; type: string; returned_data: any }> {
    // For DLT-compliant SMS, we need to use a pre-registered template
    // Template should contain: {{1}} for amount, {{2}} for booking reference, {{3}} for link

    const url = `${MSG91_API_BASE}/v2/http/sendSMS`;

    // First, create the payment link
    const paymentLink = `${params.callbackUrl}?amount=${params.amount}&booking=${params.bookingReference}`;

    // Message with payment link (for non-DLT or when DLT template not available)
    const message = `Your payment link for booking ${params.bookingReference}: ${paymentLink}`;

    const response = await axios.post(url, {
      authkey: this.authkey,
      mobiles: params.phoneNumber,
      message: message,
      sender: this.defaultSender,
      route: '4', // Promotional route for payment links
    });

    return response.data;
  }

  /**
   * Send a booking confirmation SMS
   */
  async sendBookingConfirmation(
    phoneNumber: string,
    bookingReference: string,
    pickupDate: string
  ): Promise<{ message: string; type: string; returned_data: any }> {
    const message = `Your booking ${bookingReference} is confirmed for pickup on ${pickupDate}. Thank you for choosing our service!`;

    return this.sendSMS({
      phoneNumber,
      message,
      route: '1', // Transactional
    });
  }

  /**
   * Send a pickup notification to customer
   */
  async sendPickupNotification(
    phoneNumber: string,
    bookingReference: string,
    agentName?: string,
    agentPhone?: string
  ): Promise<{ message: string; type: string; returned_data: any }> {
    const message = agentName
      ? `Your parcel for booking ${bookingReference} will be picked up soon. Contact agent ${agentName} (${agentPhone}) if needed.`
      : `Your parcel for booking ${bookingReference} will be picked up soon. We'll notify when collected.`;

    return this.sendSMS({
      phoneNumber,
      message,
      route: '1', // Transactional
    });
  }

  /**
   * Send a weight adjustment notification
   */
  async sendWeightAdjustmentSMS(
    phoneNumber: string,
    bookingReference: string,
    originalWeight: number,
    actualWeight: number,
    balanceAmount: number
  ): Promise<{ message: string; type: string; returned_data: any }> {
    const message = `Weight updated for booking ${bookingReference}: ${originalWeight}kg → ${actualWeight}kg. Please pay balance: ₹${balanceAmount}. Link sent via SMS.`;

    return this.sendSMS({
      phoneNumber,
      message,
      route: '1', // Transactional
    });
  }

  /**
   * Send a delivery confirmation SMS
   */
  async sendDeliveryConfirmation(
    phoneNumber: string,
    bookingReference: string
  ): Promise<{ message: string; type: string; returned_data: any }> {
    const message = `Your parcel for booking ${bookingReference} has been delivered. Thank you for choosing our service!`;

    return this.sendSMS({
      phoneNumber,
      message,
      route: '1', // Transactional
    });
  }

  /**
   * Get SMS balance
   */
  async getBalance(): Promise<{ type: string; remaining_balance: string }> {
    const url = `${MSG91_API_BASE}/v2/balance`;

    const response = await axios.get(url, {
      params: { authkey: this.authkey },
    });

    return response.data;
  }

  /**
   * Validate phone number format (India format)
   */
  static validatePhoneNumber(phone: string): boolean {
    // India phone numbers: +91XXXXXXXXXX or 91XXXXXXXXXX orXXXXXXXXXX
    const indiaPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    return indiaPhoneRegex.test(phone.replace(/[\s-]/g, ''));
  }
}

// Singleton instance
let smsClient: SMSClient | null = null;

export function getSMSClient(): SMSClient {
  if (!smsClient) {
    const authKey = process.env['MSG91_AUTH_KEY'];
    const senderId = process.env['MSG91_SENDER_ID'];

    if (!authKey || !senderId) {
      throw new Error('MSG91_AUTH_KEY and MSG91_SENDER_ID must be set');
    }

    smsClient = new SMSClient({
      authkey: authKey,
      sender: senderId,
      route: '1', // Transactional
    });
  }

  return smsClient;
}