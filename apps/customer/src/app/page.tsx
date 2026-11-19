'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Format a number as Indian Rupee
function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Calculate shipping price based on weight and rate
function calculateShippingPrice(weightKg: number, baseRate: number, perKgRate: number): number {
  const billableWeight = Math.max(weightKg, 0.5);
  return baseRate + (billableWeight - 1) * perKgRate;
}

interface RateTable {
  region: string;
  baseRate: number;
  perKgRate: number;
}

const RATE_TABLES: RateTable[] = [
  { region: 'USA/Canada', baseRate: 200, perKgRate: 150 },
  { region: 'UK', baseRate: 250, perKgRate: 180 },
  { region: 'Europe', baseRate: 300, perKgRate: 200 },
  { region: 'Australia', baseRate: 350, perKgRate: 220 },
  { region: 'Asia', baseRate: 150, perKgRate: 100 },
  { region: 'Other', baseRate: 400, perKgRate: 250 },
];

export default function PriceCalculator() {
  const [destination, setDestination] = useState('USA/Canada');
  const [weight, setWeight] = useState<string>('1');
  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const calculatePrice = () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) {
      setError('Please enter a valid weight');
      setPrice(null);
      return;
    }

    if (w > 30) {
      setError('Maximum weight per parcel is 30kg');
      setPrice(null);
      return;
    }

    const rate = RATE_TABLES.find((r) => r.region === destination);
    if (!rate) {
      setError('Invalid destination');
      return;
    }

    const calculatedPrice = calculateShippingPrice(w, rate.baseRate, rate.perKgRate);
    setPrice(calculatedPrice);
    setError(null);
  };

  const bookNow = () => {
    if (price === null) return;
    router.push(`/booking?destination=${destination}&weight=${weight}&price=${price}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            International Courier Services
          </h1>
          <p className="text-lg text-gray-600">
            Fast, reliable shipping to over 200 countries
          </p>
        </div>

        {/* Calculator */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Calculate Shipping Price
            </h2>

            {/* Destination Select */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Country/Region
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                {RATE_TABLES.map((rate) => (
                  <option key={rate.region} value={rate.region}>
                    {rate.region}
                  </option>
                ))}
              </select>
            </div>

            {/* Weight Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parcel Weight (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="0.1"
                  max="30"
                  step="0.1"
                  placeholder="Enter weight in kg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  kg
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Maximum weight per parcel: 30kg
              </p>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculatePrice}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors duration-200 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Calculate Price
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Price Result */}
            {price !== null && (
              <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-800 text-sm font-medium mb-2">
                  Total Shipping Price
                </p>
                <p className="text-4xl font-bold text-green-900">
                  {formatINR(price)}
                </p>
                <p className="text-green-600 text-sm mt-2">
                  Includes India Post rate + fixed margin
                </p>
                <button
                  onClick={bookNow}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors duration-200"
                >
                  Book Now
                </button>
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900 mb-1">Delivery Time</p>
                <p>7-14 business days</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Tracking</p>
                <p>Real-time India Post tracking</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Insurance</p>
                <p>Available up to ₹50,000</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Customs</p>
                <p>DN22/DN23 forms included</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Fast Delivery</h3>
            <p className="text-gray-600">
              Express shipping to over 200 countries with real-time tracking
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Secure Shipping</h3>
            <p className="text-gray-600">
              Your parcels are handled with care and fully insured
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Best Rates</h3>
            <p className="text-gray-600">
              Competitive pricing with India Post + fixed margin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}