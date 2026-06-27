import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { getProducts as fetchProductsApi } from '../api/product_api'
import { useDemoStore } from '../context/DemoStore'
import '../styles/ManageInventory.css'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Có sẵn' },
  { value: 'rented', label: 'Đã thuê' },
  { value: 'maintenance', label: 'Bảo trì' },
  { value: 'sold', label: 'Đã bán' }
]

function ManageInventory() {
  const { sellerProducts } = useDemoStore()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({ quantity: '', status: '' })

  useEffect(() => {
    fetchProductsApi()
      .then(response => {
        const normalized = response.data.map((p, i) => ({
          ...p,
          image: p.imageUrl,
          price: p.pricePerDay,
          category: p.categoryName,
          description: p.description || 'Trang phục cosplay cao cấp.',
          quantity: (i % 3) + 1, // Mock quantity as not in backend yet
          status: 'available',
        }))
        setProducts(normalized)
      })
      .catch(err => console.error("Failed to fetch products for inventory:", err))
      .finally(() => setLoading(false))
  }, [])

  const handleEdit = (product) => {
    setEditingId(product.id)
    setEditData({
      quantity: product.quantity,
      status: product.status
    })
  }

  const handleSave = (id) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, ...editData } : p
    ))
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData({ quantity: '', status: '' })
  }

  const handleSell = (id) => {
    // TODO: Mark as sold
    alert('Sản phẩm đã được đăng bán!')
  }

  return (
    <div className="manage-inventory-page">
      {/* ═════ HEADER ═════ */}
      <header className="manage-inventory-header">
        <span className="manage-inventory-label">✦ Quản Lý Kho</span>
        <h1 className="manage-inventory-title">Kho Trang Phục Cosplay</h1>
        <p className="manage-inventory-subtitle">
          Quản lý số lượng, tình trạng và đăng bán các trang phục của bạn.
        </p>
        <Link to="/seller/add-product" className="btn-add-product">
          + Thêm Sản Phẩm Mới
        </Link>
      </header>

      {/* ═════ SẢN PHẨM VỪA ĐĂNG (từ context) ═════ */}
      {sellerProducts.length > 0 && (
        <div className="new-products-section">
          <div className="new-products-header">
            <span className="new-products-badge">Mới đăng · {sellerProducts.length}</span>
            <h2 className="new-products-title">Trang phục vừa được đăng</h2>
          </div>
          <div className="new-products-grid">
            {sellerProducts.map(p => (
              <div key={p.id} className="new-product-card">
                {p.image ? (
                  <div className="new-product-img-wrap">
                    <img src={p.image} alt={p.name} className="new-product-img"
                      onError={e => { e.target.style.display = 'none' }} />
                    <span className="new-product-label">Mới đăng</span>
                  </div>
                ) : (
                  <div className="new-product-img-placeholder">
                    <span>📷</span>
                    <span className="new-product-label">Mới đăng</span>
                  </div>
                )}
                <div className="new-product-info">
                  <h3 className="new-product-name">{p.name}</h3>
                  <div className="new-product-meta">
                    {p.sizes?.length > 0 && <span>Size: {p.sizes.join(', ')}</span>}
                    <span>{Number(p.rentalPrice).toLocaleString('vi-VN')}đ/ngày</span>
                    <span>Cọc: {Number(p.deposit).toLocaleString('vi-VN')}đ</span>
                  </div>
                  {p.accessories?.length > 0 && (
                    <div className="new-product-accessories">
                      <span className="acc-label">Phụ kiện:</span>
                      {p.accessories.map((a, i) => (
                        <span key={i} className="acc-chip">{a}</span>
                      ))}
                    </div>
                  )}
                  {p.allowWarranty && (
                    <span className="new-product-warranty">🛡️ Hỗ trợ bảo hành</span>
                  )}
                  <div className="new-product-status">
                    <span className="status available">Có sẵn</span>
                    <span className="new-product-qty">SL: 1</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════ INVENTORY LIST ═════ */}
      <div className="inventory-list">
        {products.length > 0 ? (
          <div className="inventory-grid">
            {products.map(product => (
              <div key={product.id} className="inventory-item">
                <div className="product-preview">
                  <ProductCard product={product} isLessor={true}  />
                </div>

                <div className="inventory-details">
                  <div className="detail-row">
                    <span className="label">Số lượng:</span>
                    {editingId === product.id ? (
                      <input
                        type="number"
                        value={editData.quantity}
                        onChange={(e) => setEditData(prev => ({ ...prev, quantity: e.target.value }))}
                        min="0"
                        className="edit-input"
                      />
                    ) : (
                      <span className="value">{product.quantity}</span>
                    )}
                  </div>

                  <div className="detail-row">
                    <span className="label">Tình trạng:</span>
                    {editingId === product.id ? (
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                        className="edit-select"
                      >
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
                        <button onClick={() => handleSave(product.id)} className="btn-save">
                          Lưu
                        </button>
                        <button onClick={handleCancel} className="btn-cancel">
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(product)} className="btn-edit">
                          Chỉnh sửa
                        </button>
                        <button onClick={() => handleSell(product.id)} className="btn-sell">
                          Đăng bài
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
            <div className="empty-icon">📦</div>
            <h3>Kho trống</h3>
            <p>Bạn chưa có sản phẩm nào trong kho.</p>
            <Link to="/add-product" className="btn-add-first">
              Thêm Sản Phẩm Đầu Tiên
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageInventory
