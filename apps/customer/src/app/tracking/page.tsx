'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatINR } from '@courier/ui/primitives';

interface TrackingStatus {
  status: 'booked' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  timestamp: string;
  description: string;
}

const TRACKING_STEPS: TrackingStatus[] = [
  { status: 'booked', timestamp: '', description: 'Order Placed' },
  { status: 'in_transit', timestamp: '', description: 'Picked Up' },
  { status: 'out_for_delivery', timestamp: '', description: 'In Transit' },
  { status: 'delivered', timestamp: '', description: 'Delivered' },
];

export default function TrackingPage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [booking, setBooking] = useState<{
    reference: string;
    status: TrackingStatus['status'];
    weight: number;
    destination: string;
    receiverName: string;
    receiverAddress: string;
    createdDate: string;
    trackingHistory: TrackingStatus[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a booking reference');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In production, this would call the backend API
      // For now, we'll simulate a response
      const response = await fetch(`/api/tracking?bookingId=${trackingNumber}`);

      if (response.ok) {
        const data = await response.json();
        setBooking({
          reference: trackingNumber.toUpperCase(),
          status: data.tracking?.status || 'booked',
          weight: 1.5,
          destination: 'USA',
          receiverName: 'John Doe',
          receiverAddress: '123 Main Street, New York, NY 10001',
          createdDate: new Date().toLocaleDateString('en-IN'),
          trackingHistory: TRACKING_STEPS.map((step) => ({
            ...step,
            timestamp: step.status === 'booked' ? new Date().toLocaleString() : '',
          })),
        });
      } else {
        // Simulate not found
        setError('Booking not found. Please check the reference number.');
      }
    } catch (err) {
      setError('Failed to fetch tracking information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: TrackingStatus['status']) => {
    const indices = ['booked', 'in_transit', 'out_for_delivery', 'delivered'];
    return indices.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Track Your Parcel
          </h1>
          <p className="text-lg text-gray-600">
            Enter your booking reference to track your shipment
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-md mx-auto mb-12">
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter booking reference (e.g., HB-CUR-ABC123)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
            />
            <button
              onClick={handleTrack}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}
          <p className="mt-4 text-sm text-gray-500">
            Don't have a reference? <a href="/" className="text-blue-600 hover:underline">Book a parcel</a>
          </p>
        </div>

        {/* Results */}
        {booking && (
          <div className="max-w-4xl mx-auto">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Booking: {booking.reference}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Created on {booking.createdDate}
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-full font-bold ${
                    booking.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {booking.status === 'delivered'
                    ? 'Delivered'
                    : booking.status === 'failed'
                    ? 'Failed'
                    : booking.status === 'booked'
                    ? 'Pending'
                    : booking.status === 'in_transit'
                    ? 'In Transit'
                    : 'Out for Delivery'}
                </div>
              </div>

              {/* Progress Steps */}
              <div className="relative mb-8">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2" />
                <div
                  className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2"
                  style={{
                    width: `${((getStepIndex(booking.status) + 1) / TRACKING_STEPS.length) * 100}%`,
                  }}
                />
                <div className="flex justify-between relative z-10">
                  {TRACKING_STEPS.map((step, index) => {
                    const isCompleted = index <= getStepIndex(booking.status);
                    const isCurrent = index === getStepIndex(booking.status);

                    return (
                      <div key={step.status} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${
                            isCompleted
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {step.status === 'delivered' && isCompleted && (
                            <svg
                              className="w-6 h-6 text-white"
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
                          )}
                          {step.status !== 'delivered' && (
                            <span
                              className={`${
                                isCompleted ? 'text-white' : 'text-gray-400'
                              }`}
                            >
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <span
                          className={`mt-2 text-sm font-medium ${
                            isCurrent ? 'text-blue-600' : 'text-gray-600'
                          }`}
                        >
                          {step.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Parcel Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-3">Parcel Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Weight</span>
                      <span className="font-medium">{booking.weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Destination</span>
                      <span className="font-medium">{booking.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping Rate</span>
                      <span className="font-medium">
                        {formatINR(calculatePrice(booking.weight, booking.destination))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-3">Receiver Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">{booking.receiverName}</div>
                    <div className="text-gray-600">{booking.receiverAddress}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function calculatePrice(weight: number, destination: string): number {
  // Mock rate calculation
  let baseRate = 200;
  let perKgRate = 150;

  switch (destination.toLowerCase()) {
    case 'uk':
      baseRate = 250;
      perKgRate = 180;
      break;
    case 'usa':
    case 'canada':
      baseRate = 200;
      perKgRate = 150;
      break;
    case 'europe':
      baseRate = 300;
      perKgRate = 200;
      break;
    default:
      break;
  }

  const billableWeight = Math.max(weight, 0.5);
  return baseRate + (billableWeight - 1) * perKgRate;
}