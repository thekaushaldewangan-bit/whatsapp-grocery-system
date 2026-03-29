import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiHome, FiShoppingCart, FiPackage, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi'

export default function Layout({ children, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const admin = JSON.parse(localStorage.getItem('admin') || '{}')

  const handleLogout = () => {
    if (onLogout) onLogout()
    navigate('/login')
  }

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/' },
    { icon: FiShoppingCart, label: 'Orders', path: '/orders' },
    { icon: FiPackage, label: 'Products', path: '/products' },
    { icon: FiUsers, label: 'Users', path: '/users' },
    { icon: FiSettings, label: 'Settings', path: '/settings' }
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold">Grocery</h2>
          <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'
                }`}
              >
                <Icon className="text-lg" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-sm font-medium">{admin.fullName || 'Admin'}</p>
            <p className="text-xs text-gray-400">{admin.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
