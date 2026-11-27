'use client'

import Link from 'next/link'
import { PriceCalculator } from '../../../components/price-calculator'
import { BookingForm } from '../../../components/booking-form'
import OrderHistory from '../../../components/order-history'

export default function CustomerHome() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="contents lg:flex lg:flex-col lg:gap-8 lg:col-span-2">
          <section className="order-1 lg:order-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Book a New Parcel</h2>
            <BookingForm />
          </section>

          <section className="order-3 lg:order-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Calculate Your Shipping Cost</h2>
            <PriceCalculator />
          </section>
        </div>

        <section className="order-2 lg:col-span-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Orders</h2>
          <OrderHistory />

          <div className="mt-8 bg-primary-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Need Help?</h3>
            <p className="text-primary-800 text-sm mb-4">
              Contact our support team for assistance with your shipment.
            </p>
            <a href="mailto:support@courier.com" className="text-primary-600 hover:underline text-sm">
              support@courier.com
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}