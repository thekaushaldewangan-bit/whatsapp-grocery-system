import React, { useState, useEffect } from 'react'
import { FiSave, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { api } from '../App'
import Layout from '../components/Layout'

const GROUPS = {
  whatsapp: { label: 'WhatsApp Configuration', icon: '📱' },
  payment: { label: 'Payment Settings', icon: '💳' },
  general: { label: 'General Settings', icon: '⚙️' }
}

export default function SettingsPage({ onLogout }) {
  const [settings, setSettings] = useState([])
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/settings')
      const data = res.data.data || []
      setSettings(data)
      const formState = {}
      data.forEach(s => { formState[s.key] = s.value })
      setForm(formState)
    } catch (err) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSettings() }, [])

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.put('/settings', { settings: form })
      toast.success('Settings saved successfully!')
      fetchSettings()
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const grouped = {}
  settings.forEach(s => {
    const g = s.group || 'general'
    if (!grouped[g]) grouped[g] = []
    grouped[g].push(s)
  })

  return (
    <Layout onLogout={onLogout}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure WhatsApp, payment, and store settings</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <FiSave />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading settings...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(GROUPS).map(([groupKey, groupMeta]) => {
            const items = grouped[groupKey]
            if (!items || items.length === 0) return null
            return (
              <div key={groupKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {groupMeta.icon} {groupMeta.label}
                  </h2>
                </div>
                <div className="p-6 space-y-5">
                  {items.map(s => (
                    <div key={s.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {s.label || s.key}
                      </label>
                      <input
                        type="text"
                        value={form[s.key] || ''}
                        onChange={e => handleChange(s.key, e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                        placeholder={`Enter ${(s.label || s.key).toLowerCase()}`}
                      />
                      {s.key === 'twilio_whatsapp_number' && (
                        <p className="text-xs text-gray-400 mt-1">
                          Twilio WhatsApp Sandbox number (include country code, e.g. +14155238886)
                        </p>
                      )}
                      {s.key === 'upi_id' && (
                        <p className="text-xs text-gray-400 mt-1">
                          Your UPI ID for receiving payments (e.g. yourname@upi)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
