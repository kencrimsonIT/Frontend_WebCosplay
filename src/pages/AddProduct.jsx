import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDemoStore } from '../context/DemoStore'
import { getActiveCategories } from '../api/category_api'
import { SIZE_GUIDE_FIELDS, SIZE_OPTIONS, createSizeGuide } from '../data/sizeGuide'
import '../styles/AddProduct.css'

const WARRANTY_TIERS = [
  { label: 'Cơ bản', price: '30.000đ', desc: 'Bảo vệ vết bẩn nhẹ, sờn vải. Hoàn tối đa 80% cọc.' },
  { label: 'Tiêu chuẩn', price: '60.000đ', desc: 'Cơ bản + rách nhỏ, mất phụ kiện đơn lẻ. Hoàn tối đa 90% cọc.' },
  { label: 'Cao cấp', price: '100.000đ', desc: 'Toàn diện. Hoàn 100% cọc với mọi hư hỏng thông thường.' },
]

const SPEC_FIELDS = [
  { key: 'material', label: 'Chất liệu', placeholder: 'VD: Lụa nhân tạo + cotton' },
  { key: 'color', label: 'Màu sắc', placeholder: 'VD: Đỏ, đen, vàng' },
  { key: 'pieces', label: 'Bộ gồm', placeholder: 'VD: 4 món' },
  { key: 'origin', label: 'Xuất xứ', placeholder: 'VD: Việt Nam (may thủ công)' },
  { key: 'suitable', label: 'Phù hợp', placeholder: 'VD: Nữ, cao 155-170cm' },
]

function AddProduct() {
  const { addProduct } = useDemoStore()
  const [addedProduct, setAddedProduct] = useState(null)
  const [apiCategories, setApiCategories] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    image: '',
    rentalPrice: '',
    deposit: '',
  })
  const [selectedSizes, setSelectedSizes] = useState([])
  const [sizeGuide, setSizeGuide] = useState({})
  const [accessories, setAccessories] = useState([''])
  const [specs, setSpecs] = useState({ material: '', color: '', pieces: '', origin: '', suitable: '' })
  const [allowWarranty, setAllowWarranty] = useState(false)

  useEffect(() => {
    getActiveCategories()
      .then(res => setApiCategories(res.data))
      .catch(err => console.error("Failed to fetch categories:", err))
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleSize = (size) => {
    setSelectedSizes(prev => {
      if (prev.includes(size)) {
        return prev.filter(item => item !== size)
      }

      setSizeGuide(current => ({
        ...current,
        [size]: current[size] ?? createSizeGuide(size),
      }))
      return [...prev, size]
    })
  }

  const handleSizeGuideChange = (size, key, value) => {
    setSizeGuide(prev => ({
      ...prev,
      [size]: {
        ...(prev[size] ?? createSizeGuide(size)),
        [key]: value,
      },
    }))
  }

  const handleAccessoryChange = (index, value) => {
    setAccessories(prev => prev.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  const addAccessory = () => setAccessories(prev => [...prev, ''])

  const removeAccessory = (index) => {
    setAccessories(prev => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleSpecChange = (key, value) => {
    setSpecs(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const product = {
      ...formData,
      sizes: selectedSizes,
      sizeGuide: Object.fromEntries(selectedSizes.map(size => [size, sizeGuide[size] ?? createSizeGuide(size)])),
      accessories: accessories.filter(item => item.trim() !== ''),
      specs,
      allowWarranty,
    }

    addProduct(product)
    setAddedProduct(product)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddMore = () => {
    setAddedProduct(null)
    setFormData({ name: '', description: '', category: '', image: '', rentalPrice: '', deposit: '' })
    setSelectedSizes([])
    setSizeGuide({})
    setAccessories([''])
    setSpecs({ material: '', color: '', pieces: '', origin: '', suitable: '' })
    setAllowWarranty(false)
  }

  if (addedProduct) {
    return (
      <div className="add-product-page">
        <div className="ap-done-screen">
          <div className="ap-done-icon">✓</div>
          <h1 className="ap-done-title">Đăng trang phục thành công</h1>
          <p className="ap-done-sub">Sản phẩm đã được thêm vào kho và sẵn sàng hiển thị cho khách thuê.</p>

          <div className="ap-done-card">
            {addedProduct.image && (
              <img
                src={addedProduct.image}
                alt={addedProduct.name}
                className="ap-done-img"
                onError={event => { event.target.style.display = 'none' }}
              />
            )}

            <div className="ap-done-info">
              <h2 className="ap-done-name">{addedProduct.name}</h2>
              <div className="ap-done-meta">
                <span>{CATEGORIES.find(category => category.key === addedProduct.category)?.label ?? addedProduct.category}</span>
                {addedProduct.sizes?.length > 0 && <span>Size: {addedProduct.sizes.join(', ')}</span>}
                <span>{Number(addedProduct.rentalPrice).toLocaleString('vi-VN')}đ/ngày</span>
                <span>Cọc: {Number(addedProduct.deposit).toLocaleString('vi-VN')}đ</span>
              </div>

              {addedProduct.sizes?.length > 0 && (
                <div className="ap-done-size-summary">
                  <span className="ap-done-section-label">Bảng size:</span>
                  <span>{addedProduct.sizes.length} size đã có thông số chi tiết</span>
                </div>
              )}

              {addedProduct.accessories?.length > 0 && (
                <div className="ap-done-accessories">
                  <span className="ap-done-section-label">Phụ kiện:</span>
                  <span>{addedProduct.accessories.join(' · ')}</span>
                </div>
              )}

              {addedProduct.allowWarranty && (
                <div className="ap-done-warranty">Khách có thể mua thêm gói bảo hiểm khi đặt thuê.</div>
              )}
            </div>
          </div>

          <div className="ap-done-actions">
            <Link to="/seller/manage-inventory" className="btn-ap-done-primary">Xem kho trang phục →</Link>
            <button type="button" className="btn-ap-done-secondary" onClick={handleAddMore}>+ Đăng thêm trang phục</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="add-product-page">
      <header className="add-product-header">
        <span className="add-product-label">✦ Đăng sản phẩm</span>
        <h1 className="add-product-title">Đăng Trang Phục Cho Thuê</h1>
        <p className="add-product-subtitle">
          Thêm trang phục cosplay mới vào kho của bạn. Điền đầy đủ thông tin để khách hàng dễ tìm và chọn đúng size hơn.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="add-product-form">
        <div className="ap-section">
          <h2 className="ap-section-title">Thông tin cơ bản</h2>

          <div className="form-group">
            <label htmlFor="name">Tên sản phẩm *</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="VD: Naruto - Uzumaki Naruto" required />
          </div>

          <div className="form-group">
            <label htmlFor="description">Mô tả</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả chi tiết về trang phục, phong cách, nguồn gốc nhân vật..." rows="4" />
          </div>

          <div className="form-group">
            <label htmlFor="category">Danh mục *</label>
            <select id="category" name="category" value={formData.category} onChange={handleChange} required>
              <option value="">Chọn danh mục</option>
              {apiCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="image">Hình ảnh (URL)</label>
            <input type="url" id="image" name="image" value={formData.image} onChange={handleChange} placeholder="https://example.com/image.jpg" />
            {formData.image && (
              <div className="ap-image-preview">
                <img src={formData.image} alt="Preview" onError={event => { event.target.style.display = 'none' }} />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rentalPrice">Giá thuê (VNĐ/ngày) *</label>
              <input type="number" id="rentalPrice" name="rentalPrice" value={formData.rentalPrice} onChange={handleChange} placeholder="50000" min="0" required />
            </div>

            <div className="form-group">
              <label htmlFor="deposit">Tiền cọc (VNĐ) *</label>
              <input type="number" id="deposit" name="deposit" value={formData.deposit} onChange={handleChange} placeholder="200000" min="0" required />
            </div>
          </div>
        </div>

        <div className="ap-section">
          <h2 className="ap-section-title">Kích thước có sẵn</h2>
          <p className="ap-section-desc">Chọn các size mà trang phục này hỗ trợ, sau đó nhập số đo chi tiết cho từng size để khách dễ chọn đúng.</p>

          <div className="size-grid">
            {SIZE_OPTIONS.map(size => (
              <button
                key={size}
                type="button"
                className={`size-chip ${selectedSizes.includes(size) ? 'size-chip--active' : ''}`}
                onClick={() => toggleSize(size)}
              >
                {size}
              </button>
            ))}
          </div>

          {selectedSizes.length > 0 && (
            <>
              <p className="ap-selected-hint">Đã chọn: {selectedSizes.join(', ')}</p>

              <div className="size-guide-editor">
                {selectedSizes.map(size => (
                  <div key={size} className="size-guide-card">
                    <div className="size-guide-card-head">
                      <h3>Size {size}</h3>
                      <span>Điền số đo chi tiết</span>
                    </div>

                    <div className="size-guide-grid">
                      {SIZE_GUIDE_FIELDS.map(field => (
                        <div className={`form-group ${field.key === 'note' ? 'full-width' : ''}`} key={`${size}-${field.key}`}>
                          <label>{field.label}</label>
                          <input
                            type="text"
                            value={sizeGuide[size]?.[field.key] ?? ''}
                            onChange={event => handleSizeGuideChange(size, field.key, event.target.value)}
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="ap-section">
          <h2 className="ap-section-title">Thông số kỹ thuật</h2>
          <p className="ap-section-desc">Giúp khách hàng hiểu rõ hơn về chất liệu và đặc điểm sản phẩm.</p>
          <div className="specs-grid">
            {SPEC_FIELDS.map(field => (
              <div className="form-group" key={field.key}>
                <label>{field.label}</label>
                <input type="text" value={specs[field.key]} onChange={event => handleSpecChange(field.key, event.target.value)} placeholder={field.placeholder} />
              </div>
            ))}
          </div>
        </div>

        <div className="ap-section">
          <h2 className="ap-section-title">Phụ kiện đi kèm</h2>
          <p className="ap-section-desc">Liệt kê các phụ kiện bao gồm trong bộ cho thuê như kiếm, mũ, dây lưng.</p>

          <div className="accessories-list">
            {accessories.map((item, index) => (
              <div key={index} className="accessory-row">
                <input
                  type="text"
                  value={item}
                  onChange={event => handleAccessoryChange(index, event.target.value)}
                  placeholder={`Phụ kiện ${index + 1} - VD: Kiếm gỗ, mũ ninja`}
                />
                {accessories.length > 1 && (
                  <button type="button" className="btn-remove-acc" onClick={() => removeAccessory(index)} title="Xóa phụ kiện này">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="button" className="btn-add-acc" onClick={addAccessory}>+ Thêm phụ kiện</button>
        </div>

        <div className="ap-section">
          <h2 className="ap-section-title">Gói bảo hiểm cho thuê</h2>
          <p className="ap-section-desc">
            Bật để cho phép khách hàng mua gói bảo hiểm khi đặt thuê. Phí bảo hiểm do khách trả và giúp họ yên tâm hơn khi thuê.
          </p>

          <div className="warranty-toggle-row">
            <div>
              <p className="warranty-toggle-label">{allowWarranty ? 'Đang cho phép bảo hiểm' : 'Chưa cho phép bảo hiểm'}</p>
              <p className="warranty-toggle-sub">
                {allowWarranty ? 'Khách có thể chọn 1 trong 3 gói khi đặt thuê.' : 'Khách tự chịu trách nhiệm nếu hư hỏng.'}
              </p>
            </div>

            <button
              type="button"
              className={`warranty-switch ${allowWarranty ? 'warranty-switch--on' : ''}`}
              onClick={() => setAllowWarranty(value => !value)}
              aria-label="Bật tắt bảo hiểm"
            >
              <span className="warranty-switch-thumb" />
            </button>
          </div>

          {allowWarranty && (
            <div className="warranty-info-grid">
              {WARRANTY_TIERS.map(tier => (
                <div key={tier.label} className="warranty-info-card">
                  <div className="warranty-info-top">
                    <span className="warranty-info-name">{tier.label}</span>
                    <span className="warranty-info-price">{tier.price} / lần</span>
                  </div>
                  <p className="warranty-info-desc">{tier.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn-submit">Đăng Trang Phục Cho Thuê</button>
      </form>
    </div>
  )
}

export default AddProduct
