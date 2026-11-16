'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatINR } from '@courier/ui/primitives';
import Razorpay from 'razorpay';

interface BookingData {
  destination: string;
  weight: number;
  price: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  receiverName: string;
  receiverAddress: string;
  receiverCity: string;
  receiverPincode: string;
  pickupDate: string;
}

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookingData, setBookingData] = useState<BookingData>({
    destination: searchParams.get('destination') || '',
    weight: parseFloat(searchParams.get('weight') || '1'),
    price: parseFloat(searchParams.get('price') || '0'),
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    receiverName: '',
    receiverAddress: '',
    receiverCity: '',
    receiverPincode: '',
    pickupDate: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate price based on weight (in case user wants to change it)
  const calculatePrice = (w: number) => {
    // Simple rate calculation
    let baseRate = 200;
    let perKgRate = 150;

    switch (bookingData.destination) {
      case 'UK':
        baseRate = 250;
        perKgRate = 180;
        break;
      case 'Europe':
        baseRate = 300;
        perKgRate = 200;
        break;
      case 'Australia':
        baseRate = 350;
        perKgRate = 220;
        break;
      case 'Asia':
        baseRate = 150;
        perKgRate = 100;
        break;
      default:
        baseRate = 200;
        perKgRate = 150;
    }

    const weight = Math.max(w, 0.5);
    return baseRate + (weight - 1) * perKgRate;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeight = parseFloat(e.target.value) || 0;
    setBookingData((prev) => ({
      ...prev,
      weight: newWeight,
      price: calculatePrice(newWeight),
    }));
  };

  const initPay = async () => {
    setPaymentLoading(true);
    setError(null);

    try {
      // Create order from backend
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: bookingData.price * 100, // Convert to paise
          bookingReference: `HB-CUR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        }),
      });

      const order = await response.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency,
        name: 'Honeybadger Courier',
        description: `Courier Booking - ${bookingData.destination}`,
        order_id: order.id,
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });

          if (verifyResponse.ok) {
            setSuccess(true);
          } else {
            setError('Payment verification failed');
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: bookingData.customerName,
          email: bookingData.customerEmail,
          contact: bookingData.customerPhone,
        },
        theme: {
          color: '#2563eb',
        },
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError('Payment failed: ' + (response.error.description || 'Unknown error'));
        setPaymentLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError('Failed to initialize payment');
      setPaymentLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Your booking has been confirmed. A confirmation email and SMS have been sent to your registered contact details.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">Booking Reference</p>
            <p className="text-lg font-bold font-mono text-blue-600">
              HB-CUR-{Math.random().toString(36).substring(2, 8).toUpperCase()}
            </p>
            <p className="text-sm text-gray-500 mt-3 mb-1">Total Paid</p>
            <p className="text-xl font-bold text-gray-900">{formatINR(bookingData.price)}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors duration-200"
          >
            Book Another Parcel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Calculator
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Complete Your Booking
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Booking Summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Booking Summary</h2>
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium text-gray-900">{bookingData.destination}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Weight</p>
                    <p className="font-medium text-gray-900">{bookingData.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pickup Date</p>
                    <p className="font-medium text-gray-900">{bookingData.pickupDate}</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-medium text-gray-900">Total</p>
                    <p className="text-2xl font-bold text-blue-600">{formatINR(bookingData.price)}</p>
                  </div>
                </div>
                <button
                  onClick={initPay}
                  disabled={paymentLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  {paymentLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </button>
              </div>
            </div>

            {/* Booking Form */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Details</h2>

                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={bookingData.customerName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number * *
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={bookingData.customerPhone}
                      onChange={handleInputChange}
                      required
                      placeholder="+91XXXXXXXXXX"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={bookingData.customerEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Receiver Info */}
                <h2 className="text-xl font-bold text-gray-900 mb-6">Receiver Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Receiver Name *
                    </label>
                    <input
                      type="text"
                      name="receiverName"
                      value={bookingData.receiverName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Receiver Address *
                    </label>
                    <textarea
                      name="receiverAddress"
                      value={bookingData.receiverAddress}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="receiverCity"
                      value={bookingData.receiverCity}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="receiverPincode"
                      value={bookingData.receiverPincode}
                      onChange={handleInputChange}
                      required
                      placeholder="123456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Pickup Date */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Pickup Date *
                  </label>
                  <input
                    type="date"
                    name="pickupDate"
                    value={bookingData.pickupDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Weight Adjustment */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjust Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={bookingData.weight}
                    onChange={handleWeightChange}
                    min="0.1"
                    max="30"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Actual weight will be verified at pickup. Price may change based on actual weight.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}