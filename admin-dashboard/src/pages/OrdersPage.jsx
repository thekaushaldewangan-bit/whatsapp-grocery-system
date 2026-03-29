import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { api } from '../App'
import toast from 'react-hot-toast'

export default function OrdersPage({ onLogout }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      const url = filter === 'all' ? '/admin/orders' : `/admin/orders?status=${filter}`
      const response = await api.get(url)
      setOrders(response.data.data)
    } catch (error) {
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { orderStatus: status })
      toast.success('Order updated')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update order')
    }
  }

  const updatePaymentStatus = async (orderId, status) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { paymentStatus: status })
      toast.success('Payment status updated')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update payment status')
    }
  }

  const formatDate = (date) => new Date(date).toLocaleDateString()

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'out_for_delivery' ? 'Out for Delivery' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(order => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">{order.orderId}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{order.customerName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.phoneNumber}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{order.totalAmount?.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="packed">Packed</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.paymentStatus}
                          onChange={(e) => updatePaymentStatus(order._id, e.target.value)}
                          className={`px-3 py-1 rounded text-sm font-medium border ${
                            order.paymentStatus === 'completed'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
