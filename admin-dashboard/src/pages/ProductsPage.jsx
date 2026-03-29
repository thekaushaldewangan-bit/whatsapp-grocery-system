import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { api } from '../App'
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', description: '', category: 'fruits', price: '', unit: 'kg', stock: '' }

export default function ProductsPage({ onLogout }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/admin/products?limit=100')
      setProducts(response.data.data)
    } catch (error) {
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.patch(`/products/${editingId}`, formData)
        toast.success('Product updated')
      } else {
        await api.post('/products', formData)
        toast.success('Product added')
      }
      setFormData(EMPTY_FORM)
      setShowForm(false)
      setEditingId(null)
      fetchProducts()
    } catch (error) {
      toast.error(editingId ? 'Failed to update product' : 'Failed to add product')
    }
  }

  const startEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price,
      unit: product.unit,
      stock: product.stock
    })
    setEditingId(product._id)
    setShowForm(true)
  }

  const cancelForm = () => {
    setFormData(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const deleteProduct = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`)
        toast.success('Product deleted')
        fetchProducts()
      } catch (error) {
        toast.error('Failed to delete product')
      }
    }
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <button
            onClick={() => { cancelForm(); setShowForm(!showForm); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? <><FiX /> Cancel</> : <><FiPlus /> Add Product</>}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2"
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="fruits">Fruits</option>
                <option value="vegetables">Vegetables</option>
                <option value="dairy">Dairy</option>
                <option value="grains">Grains</option>
                <option value="bakery">Bakery</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
              </select>
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2"
                required
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
                <option value="piece">piece</option>
                <option value="liter">liter</option>
                <option value="dozen">dozen</option>
              </select>
              <input
                type="number"
                placeholder="Stock"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2"
                required
              />
              <button
                type="submit"
                className="col-span-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                {editingId ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map(product => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 capitalize">{product.category}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{product.price}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{product.stock} {product.unit}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-3">
                        <button
                          onClick={() => startEdit(product)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => deleteProduct(product._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
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
