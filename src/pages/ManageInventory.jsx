import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { getProducts as fetchProductsApi } from '../api/product_api'
import { useDemoStore } from '../context/DemoStore'
import '../styles/ManageInventory.css'

const STATUS_OPTIONS = [
  { value: 'available',   label: 'Có sẵn'  },
  { value: 'rented',      label: 'Đã thuê'  },
  { value: 'maintenance', label: 'Bảo trì'  },
  { value: 'sold',        label: 'Đã bán'   },
]

function ManageInventory() {
  const { sellerProducts } = useDemoStore()
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [editingId, setEditingId]   = useState(null)
  const [editData, setEditData]     = useState({ quantity: '', status: '' })
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal]           = useState(0)
  const SIZE = 20

  useEffect(() => {
    setLoading(true)
    fetchProductsApi({ page, size: SIZE })
        .then(response => {
          // FIX: getProducts tra ve PagedResponse { content:[...], totalPages, totalElements }
          // Code cu dung response.data.map() - sai vi data la object, khong phai array
          const list = response?.data?.content
              ?? response?.data
              ?? []

          const normalized = (Array.isArray(list) ? list : []).map((p, i) => ({
            ...p,
            image:       p.imageUrl,
            price:       p.pricePerDay,
            category:    p.categoryName,
            description: p.description || 'Trang phuc cosplay cao cap.',
            quantity:    (i % 3) + 1,
            status:      'available',
          }))

          setProducts(normalized)
          setTotalPages(response?.data?.totalPages ?? 1)
          setTotal(response?.data?.totalElements ?? normalized.length)
        })
        .catch(err => {
          console.error('Failed to fetch products for inventory:', err)
          setProducts([])
        })
        .finally(() => setLoading(false))
  }, [page])

  const handleEdit = (product) => {
    setEditingId(product.id)
    setEditData({ quantity: product.quantity, status: product.status })
  }

  const handleSave = (id) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...editData } : p))
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData({ quantity: '', status: '' })
  }

  const handleSell = () => { alert('San pham da duoc dang ban!') }

  return (
      <div className="manage-inventory-page">
        <header className="manage-inventory-header">
          <span className="manage-inventory-label">Quan Ly Kho</span>
          <h1 className="manage-inventory-title">Kho Trang Phuc Cosplay</h1>
          <p className="manage-inventory-subtitle">Quan ly so luong, tinh trang va dang ban cac trang phuc cua ban.</p>
          <Link to="/seller/add-product" className="btn-add-product">+ Them San Pham Moi</Link>
        </header>

        {sellerProducts.length > 0 && (
            <div className="new-products-section">
              <div className="new-products-header">
                <span className="new-products-badge">Moi dang - {sellerProducts.length}</span>
                <h2 className="new-products-title">Trang phuc vua duoc dang</h2>
              </div>
              <div className="new-products-grid">
                {sellerProducts.map(p => (
                    <div key={p.id} className="new-product-card">
                      {p.image ? (
                          <div className="new-product-img-wrap">
                            <img src={p.image} alt={p.name} className="new-product-img"
                                 onError={e => { e.target.style.display = 'none' }} />
                            <span className="new-product-label">Moi dang</span>
                          </div>
                      ) : (
                          <div className="new-product-img-placeholder">
                            <span>photo</span>
                            <span className="new-product-label">Moi dang</span>
                          </div>
                      )}
                      <div className="new-product-info">
                        <h3 className="new-product-name">{p.name}</h3>
                        <div className="new-product-meta">
                          {p.sizes?.length > 0 && <span>Size: {p.sizes.join(', ')}</span>}
                          <span>{Number(p.rentalPrice).toLocaleString('vi-VN')}d/ngay</span>
                          <span>Coc: {Number(p.deposit).toLocaleString('vi-VN')}d</span>
                        </div>
                        <div className="new-product-status">
                          <span className="status available">Co san</span>
                          <span className="new-product-qty">SL: 1</span>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        <div className="inventory-list">
          {loading ? (
              <div className="inventory-loading">Dang tai kho hang...</div>
          ) : products.length > 0 ? (
              <>
                <p className="inventory-count">Hien thi {products.length} / {total} san pham</p>
                <div className="inventory-grid">
                  {products.map(product => (
                      <div key={product.id} className="inventory-item">
                        <div className="product-preview">
                          <ProductCard product={product} isLessor={true} />
                        </div>
                        <div className="inventory-details">
                          <div className="detail-row">
                            <span className="label">So luong:</span>
                            {editingId === product.id ? (
                                <input type="number" value={editData.quantity} min="0" className="edit-input"
                                       onChange={e => setEditData(prev => ({ ...prev, quantity: e.target.value }))} />
                            ) : (
                                <span className="value">{product.quantity}</span>
                            )}
                          </div>
                          <div className="detail-row">
                            <span className="label">Tinh trang:</span>
                            {editingId === product.id ? (
                                <select value={editData.status} className="edit-select"
                                        onChange={e => setEditData(prev => ({ ...prev, status: e.target.value }))}>
                                  {STATUS_OPTIONS.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                            ) : (
                                <span className={`status ${product.status}`}>
                          {STATUS_OPTIONS.find(s => s.value === product.status)?.label}
                        </span>
                            )}
                          </div>
                          <div className="actions">
                            {editingId === product.id ? (
                                <>
                                  <button onClick={() => handleSave(product.id)} className="btn-save">Luu</button>
                                  <button onClick={handleCancel} className="btn-cancel">Huy</button>
                                </>
                            ) : (
                                <>
                                  <button onClick={() => handleEdit(product)} className="btn-edit">Chinh sua</button>
                                  <button onClick={() => handleSell(product.id)} className="btn-sell">Dang ban</button>
                                </>
                            )}
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
                {totalPages > 1 && (
                    <div className="inventory-pagination">
                      <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Truoc</button>
                      <span>Trang {page + 1} / {totalPages}</span>
                      <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Tiep</button>
                    </div>
                )}
              </>
          ) : (
              <div className="inventory-empty">
                <div className="empty-icon">box</div>
                <h3>Kho trong</h3>
                <p>Ban chua co san pham nao trong kho.</p>
                <Link to="/seller/add-product" className="btn-add-first">Them San Pham Dau Tien</Link>
              </div>
          )}
        </div>
      </div>
  )
}

export default ManageInventory
