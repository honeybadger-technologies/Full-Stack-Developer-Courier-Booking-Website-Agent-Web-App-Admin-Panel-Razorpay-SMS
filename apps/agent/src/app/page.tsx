'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AgentDashboard = () => {
  const [activeTab, setActiveTab] = useState('pickup');
  const [qrScanned, setQrScanned] = useState(false);
  const [weight, setWeight] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const router = useRouter();

  const todayPickups = [
    { id: 'PU-001', customer: 'Rahul Sharma', destination: 'USA', weight: '2.5 kg', status: 'Pending', amount: 800 },
    { id: 'PU-002', customer: 'Priya Patel', destination: 'UK', weight: '1.2 kg', status: 'Pending', amount: 550 },
    { id: 'PU-003', customer: 'Amit Kumar', destination: 'Canada', weight: '3.0 kg', status: 'Pending', amount: 950 },
    { id: 'PU-004', customer: 'Neha Singh', destination: 'Australia', weight: '1.8 kg', status: 'Pending', amount: 720 },
  ];

  const handleScanQR = () => {
    setQrScanned(true);
    setSelectedOrder(todayPickups[0]);
    setWeight('');
  };

  const handleWeightSubmit = () => {
    const w = parseFloat(weight);
    if (w > 0 && selectedOrder) {
      alert(`Weight verified: ${w} kg. Price recalculated.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Courier Agent</h1>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Online
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Agent User</p>
                <p className="text-xs text-gray-500">ID: AG-1001</p>
              </div>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm font-medium text-gray-500">Today's Pickups</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{todayPickups.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-2">12</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm font-medium text-gray-500">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">4</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm font-medium text-gray-500">Today's Earnings</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">₹2,850</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <nav className="space-y-1 px-2 py-4">
                <button
                  onClick={() => setActiveTab('pickup')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    activeTab === 'pickup' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Today's Pickups
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    activeTab === 'history' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  History
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow p-6">
              {activeTab === 'pickup' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Today's Pickups</h2>

                  {/* QR Scanner */}
                  <div className="bg-gray-100 rounded-xl p-8 text-center mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Scan Parcel QR Code</h3>
                    <div className="mx-auto w-64 h-64 bg-white rounded-lg border-4 border-gray-300 flex items-center justify-center relative mb-4">
                      <svg className="w-32 h-32 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
                      </div>
                    </div>
                    {!qrScanned ? (
                      <button
                        onClick={handleScanQR}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Scan QR Code
                      </button>
                    ) : (
                      <div className="text-green-600 font-medium">QR Code Scanned Successfully!</div>
                    )}
                  </div>

                  {/* Order Details */}
                  {selectedOrder && (
                    <div className="bg-blue-50 rounded-xl p-6 mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Selected Order: {selectedOrder.id}</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Customer</p>
                          <p className="font-medium text-gray-900">{selectedOrder.customer}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Destination</p>
                          <p className="font-medium text-gray-900">{selectedOrder.destination}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Weight (Original)</p>
                          <p className="font-medium text-gray-900">{selectedOrder.weight}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="font-medium text-gray-900">₹{selectedOrder.amount}</p>
                        </div>
                      </div>

                      {/* Weight Verification */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Verify Weight</h4>
                        <div className="flex gap-3">
                          <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="Enter weight in kg"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleWeightSubmit}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pickups List */}
                  <h3 className="text-lg font-bold text-gray-900 mb-4">All Pickups for Today</h3>
                  <div className="space-y-3">
                    {todayPickups.map((pickup) => (
                      <div key={pickup.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{pickup.id} - {pickup.customer}</p>
                          <p className="text-sm text-gray-500">Destination: {pickup.destination} | {pickup.weight}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            {pickup.status}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedOrder(pickup);
                              setQrScanned(true);
                              setWeight('');
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Pickup History</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">PU-{2000 + i}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Customer {i}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">USA</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹1,200</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Settings</h2>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                      <input
                        type="text"
                        defaultValue="Agent User"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        defaultValue="+91 98765 43210"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Notification</label>
                      <div className="flex items-center">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                        <span className="ml-2 text-sm text-gray-700">Receive SMS for payments</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
