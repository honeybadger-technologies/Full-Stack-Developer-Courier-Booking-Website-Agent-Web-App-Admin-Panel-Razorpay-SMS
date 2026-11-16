export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="text-center space-y-8">
        <h1 className="text-5xl font-bold text-gray-900">
          Welcome to Honeybadger Courier
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Your branded international courier booking platform. Fast, reliable, and secure shipping through India Post.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-2">Easy Booking</h3>
            <p className="text-gray-600">Book your parcel in minutes with our simple interface</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-2">Track Live</h3>
            <p className="text-gray-600">Real-time tracking of your shipment</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-2">Secure Payments</h3>
            <p className="text-gray-600">Powered by Razorpay for secure transactions</p>
          </div>
        </div>
      </main>
    </div>
  )
}