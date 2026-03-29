import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { api } from '../App'
import toast from 'react-hot-toast'

export default function UsersPage({ onLogout }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      setUsers(response.data.data)
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => new Date(date).toLocaleDateString()

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Last Interaction</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.phoneNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.email || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.lastInteractionAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
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

