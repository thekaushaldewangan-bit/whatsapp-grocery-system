import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { api } from '../App'
import { FiPackage, FiShoppingCart, FiDollarSign, FiUsers } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats')
      setStats(response.data.data)
    } catch (error) {
      toast.error('Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Layout onLogout={onLogout}><div className="flex justify-center items-center h-96">Loading...</div></Layout>
  }

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <Icon className="text-3xl text-gray-400" />
      </div>
    </div>
  )

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your store overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FiShoppingCart}
            label="Total Orders"
            value={stats?.totalOrders || 0}
            color="border-blue-500"
          />
          <StatCard
            icon={FiPackage}
            label="Pending Orders"
            value={stats?.pendingOrders || 0}
            color="border-yellow-500"
          />
          <StatCard
            icon={FiDollarSign}
            label="Total Revenue"
            value={`₹${(stats?.totalRevenue || 0).toFixed(0)}`}
            color="border-green-500"
          />
          <StatCard
            icon={FiUsers}
            label="Total Users"
            value={stats?.totalUsers || 0}
            color="border-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Products</h2>
            <div className="text-4xl font-bold text-blue-600">{stats?.totalProducts || 0}</div>
            <p className="text-gray-600 mt-2">Active products in catalog</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Orders</h2>
            <div className="text-4xl font-bold text-green-600">{stats?.completedOrders || 0}</div>
            <p className="text-gray-600 mt-2">Successfully delivered</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
