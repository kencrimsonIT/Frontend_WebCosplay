import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteSellerProduct,
  getSellerProducts,
  toggleSellerProduct,
  updateSellerProduct,
} from '../api/seller_api'
import '../styles/ManageInventory.css'

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Co san' },
  { value: 'RENTED', label: 'Da thue' },
  { value: 'MAINTENANCE', label: 'Bao tri' },
  { value: 'SOLD', label: 'Da ban' },
]

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}d`
}

function statusClass(status) {
  return String(status || 'AVAILABLE').toLowerCase()
}

function ManageInventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({ quantity: 0, inventoryStatus: 'AVAILABLE', visible: true })
  const [savingId, setSavingId] = useState(null)

  const loadProducts = () => {
    setLoading(true)
    setError('')
    getSellerProducts()
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(err => setError(err?.message || 'Khong tai duoc danh sach san pham'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleEdit = (product) => {
    setEditingId(product.id)
    setEditData({
      quantity: product.quantity ?? 0,
      inventoryStatus: product.inventoryStatus ?? 'AVAILABLE',
      visible: product.visible ?? true,
    })
  }

  const handleSave = async (product) => {
    setSavingId(product.id)
    try {
      const payload = {
        name: product.name,
        categoryId: product.categoryId,
        description: product.description,
        pricePerDay: product.pricePerDay,
        deposit: product.deposit,
        imageUrl: product.imageUrl,
        visible: editData.visible,
        quantity: Number(editData.quantity),
        inventoryStatus: editData.inventoryStatus,
      }
      const saved = await updateSellerProduct(product.id, payload)
      setProducts(prev => prev.map(item => item.id === product.id ? saved : item))
      setEditingId(null)
    } catch (err) {
      alert(err?.message || 'Khong luu duoc san pham')
    } finally {
      setSavingId(null)
    }
  }

  const handleToggle = async (product) => {
    setSavingId(product.id)
    try {
      const saved = await toggleSellerProduct(product.id)
      setProducts(prev => prev.map(item => item.id === product.id ? saved : item))
    } catch (err) {
      alert(err?.message || 'Khong doi duoc trang thai hien thi')
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (product) => {
    if (!confirm(`Xoa/An san pham "${product.name}"? Backend se giu lich su neu san pham da co don.`)) return
    setSavingId(product.id)
    try {
      await deleteSellerProduct(product.id)
      setProducts(prev => prev.filter(item => item.id !== product.id))
    } catch (err) {
      alert(err?.message || 'Khong xoa duoc san pham')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="manage-inventory-page">
      <header className="manage-inventory-header">
        <span className="manage-inventory-label">Quan ly kho</span>
        <h1 className="manage-inventory-title">Kho trang phuc cosplay</h1>
        <p className="manage-inventory-subtitle">
          Quan ly so luong, trang thai ton kho, gia thue, tien coc va hien thi san pham.
        </p>
        <Link to="/seller/add-product" className="btn-add-product">+ Them san pham moi</Link>
      </header>

      {loading && <div className="inventory-empty"><h3>Dang tai kho...</h3></div>}
      {error && !loading && <div className="inventory-empty"><h3>{error}</h3></div>}

      {!loading && !error && (
        <div className="inventory-list">
          {products.length > 0 ? (
            <div className="inventory-grid">
              {products.map(product => (
                <div key={product.id} className="inventory-item">
                  <div className="product-preview">
                    <div className="new-product-card">
                      {product.imageUrl ? (
                        <div className="new-product-img-wrap">
                          <img src={product.imageUrl} alt={product.name} className="new-product-img" />
                          <span className="new-product-label">{product.visible ? 'Dang hien' : 'Dang an'}</span>
                        </div>
                      ) : (
                        <div className="new-product-img-placeholder"><span>No image</span></div>
                      )}
                      <div className="new-product-info">
                        <h3 className="new-product-name">{product.name}</h3>
                        <div className="new-product-meta">
                          <span>{product.categoryName}</span>
                          <span>{money(product.pricePerDay)}/ngay</span>
                          <span>Coc: {money(product.deposit)}</span>
                        </div>
                        <p>{product.description || 'Chua co mo ta'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="inventory-details">
                    <div className="detail-row">
                      <span className="label">So luong:</span>
                      {editingId === product.id ? (
                        <input
                          type="number"
                          value={editData.quantity}
                          onChange={event => setEditData(prev => ({ ...prev, quantity: event.target.value }))}
                          min="0"
                          className="edit-input"
                        />
                      ) : (
                        <span className="value">{product.quantity ?? 0}</span>
                      )}
                    </div>

                    <div className="detail-row">
                      <span className="label">Tinh trang:</span>
                      {editingId === product.id ? (
                        <select
                          value={editData.inventoryStatus}
                          onChange={event => setEditData(prev => ({ ...prev, inventoryStatus: event.target.value }))}
                          className="edit-select"
                        >
                          {STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`status ${statusClass(product.inventoryStatus)}`}>
                          {STATUS_OPTIONS.find(option => option.value === product.inventoryStatus)?.label || product.inventoryStatus}
                        </span>
                      )}
                    </div>

                    {editingId === product.id && (
                      <div className="detail-row">
                        <span className="label">Hien thi:</span>
                        <select
                          value={String(editData.visible)}
                          onChange={event => setEditData(prev => ({ ...prev, visible: event.target.value === 'true' }))}
                          className="edit-select"
                        >
                          <option value="true">Hien thi</option>
                          <option value="false">An san pham</option>
                        </select>
                      </div>
                    )}

                    <div className="actions">
                      {editingId === product.id ? (
                        <>
                          <button onClick={() => handleSave(product)} className="btn-save" disabled={savingId === product.id}>
                            {savingId === product.id ? 'Dang luu...' : 'Luu'}
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn-cancel">Huy</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(product)} className="btn-edit">Chinh sua</button>
                          <button onClick={() => handleToggle(product)} className="btn-sell" disabled={savingId === product.id}>
                            {product.visible ? 'An' : 'Hien'}
                          </button>
                          <button onClick={() => handleDelete(product)} className="btn-cancel" disabled={savingId === product.id}>
                            Xoa
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="inventory-empty">
              <div className="empty-icon">□</div>
              <h3>Kho trong</h3>
              <p>Ban chua co san pham nao trong kho.</p>
              <Link to="/seller/add-product" className="btn-add-first">Them san pham dau tien</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ManageInventory
