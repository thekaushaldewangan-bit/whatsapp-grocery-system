import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import OrdersPage from './pages/OrdersPage'
import ProductsPage from './pages/ProductsPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('admin')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    setIsAuthenticated(false)
  }

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
          } />
          {isAuthenticated ? (
            <>
              <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
              <Route path="/orders" element={<OrdersPage onLogout={handleLogout} />} />
              <Route path="/products" element={<ProductsPage onLogout={handleLogout} />} />
              <Route path="/users" element={<UsersPage onLogout={handleLogout} />} />
              <Route path="/settings" element={<SettingsPage onLogout={handleLogout} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </Router>
    </>
  )
}

export default App
