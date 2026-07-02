import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProductById } from '../api/product_api'
import { deleteProductReview, likeProductReview, unlikeProductReview } from '../api/review_api'
import { normalizeSizeGuide } from '../data/sizeGuide'
import { useAuth } from '../context/AuthContext'
import { useDemoStore } from '../context/DemoStore'
import './ProductDetail.css'
import {getPublicPlans} from "../api/insurance_api.js";

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useDemoStore()
  const { user } = useAuth()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedWarranty, setSelectedWarranty] = useState('none')
  const [errors, setErrors] = useState({})
  const [added, setAdded] = useState(false)

  const [warrantyPackages, setWarrantyPackages] = useState([
    { key: 'none', label: 'Không bảo hiểm', fee: 0, refundNote: 'Tự chịu trách nhiệm nếu hư hỏng.' }
  ])

  useEffect(() => {
    getProductById(id)
      .then(response => {
        const p = response.data
        // Normalize
        setProduct({
          ...p,
          image: p.imageUrl,
          price: p.pricePerDay,
          category: p.categoryName,
          description: p.description || 'Trang phục cosplay cao cấp, chất lượng tốt.',
          images: p.imageUrl ? [p.imageUrl] : [],
          sizes: ['S', 'M', 'L', 'XL'], // Mock sizes as they are not in backend yet
          tags: [p.categoryName, 'Cosplay'],
          includes: ['Trang phục đầy đủ như hình']
        })
      })
      .catch(err => console.error("Failed to fetch product:", err))
      .finally(() => setLoading(false))

    getPublicPlans().then(response => {
      const backendPlans = (response.data || []).map(plan => ({
        key: plan.id, // Dùng ID từ DB làm key
        label: plan.name,
        fee: plan.feeAmount,
        refundNote: plan.description || `Bảo vệ tối đa ${plan.coverPercent}% cọc`
      }))

      // Gộp tùy chọn "Không bảo hiểm" với dữ liệu từ DB
      setWarrantyPackages([
        { key: 'none', label: 'Không bảo hiểm', fee: 0, refundNote: 'Tự chịu trách nhiệm nếu hư hỏng.' },
        ...backendPlans
      ])
    }).catch(err => console.error("Lỗi tải gói bảo hiểm:", err))


  }, [id])

  if (loading) {
    return <div className="pd-page"><p style={{ textAlign: 'center', color: 'var(--text-primary)' }}>Đang tải thông tin trang phục...</p></div>
  }

  if (!product) {
    return (
      <div className="pd-notfound">
        <div className="pd-notfound-icon">🔍</div>
        <h2>Không tìm thấy trang phục</h2>
        <p>Trang phục bạn đang tìm không tồn tại hoặc đã bị gỡ.</p>
        <Link to="/products" className="btn-pd-primary">← Quay lại danh sách</Link>
      </div>
    )
  }

  const images = product.images?.length ? product.images : [product.image]
  const today = new Date().toISOString().split('T')[0]
  const sizeGuideRows = normalizeSizeGuide(product.sizes, product.sizeGuide)

  const calcDays = () => {
    if (!startDate || !endDate) return 0
    const diff = (new Date(endDate) - new Date(startDate)) / 86400000
    return diff > 0 ? Math.round(diff) : 0
  }

  const days = calcDays()
  const unitPrice = product.pricePerDay ?? product.price ?? 0
  const rentalPrice = days * unitPrice
  const warrantyFee = warrantyPackages.find(item => item.key === selectedWarranty)?.fee ?? 0
  const totalPrice = rentalPrice + warrantyFee
  const maxQuantity = Number(product.quantity ?? product.stock ?? product.availableQuantity ?? 1)

  const validate = () => {
    const nextErrors = {}
    if (!selectedSize && product.sizes?.length) nextErrors.size = 'Vui lòng chọn kích thước.'
    if (!startDate) nextErrors.startDate = 'Vui lòng chọn ngày nhận.'
    if (!endDate) nextErrors.endDate = 'Vui lòng chọn ngày trả.'
    if (startDate && endDate && days <= 0) nextErrors.endDate = 'Ngày trả phải sau ngày nhận.'
    if (maxQuantity <= 0) nextErrors.stock = 'San pham dang het hang.'
    return nextErrors
  }

  const buildCartItem = () => ({
    productId: product.id,
    name: product.name,
    image: images[0],
    category: product.category,
    size: selectedSize,
    startDate,
    endDate,
    days,
    pricePerDay: unitPrice,
    rentalPrice,
    deposit: product.deposit ?? 0,
    maxQuantity,
    warranty: selectedWarranty,
    warrantyFee,
    accessories: product.includes ?? [],
    sizeGuide: product.sizeGuide ?? {},
  })

  const handleAddToCart = () => {
    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    addToCart(buildCartItem())
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      navigate('/cart')
    }, 1000)
  }

  const handleToggleReviewLike = async (review) => {
    try {
      const updated = review.likedByCurrentUser
        ? await unlikeProductReview(review.id)
        : await likeProductReview(review.id)
      setProduct(current => ({
        ...current,
        reviews: (current.reviews || []).map(item => item.id === updated.id ? updated : item),
      }))
    } catch (err) {
      setErrors(current => ({
        ...current,
        reviewLike: err?.message || 'Can dang nhap de thich danh gia.',
      }))
    }
  }

  const handleDeleteReview = async (review) => {
    const ok = window.confirm('Xoa danh gia nay?')
    if (!ok) return

    try {
      await deleteProductReview(review.id)
      setProduct(current => ({
        ...current,
        reviews: (current.reviews || []).filter(item => item.id !== review.id),
        reviewCount: Math.max(Number(current.reviewCount || 0) - 1, 0),
      }))
    } catch (err) {
      setErrors(current => ({
        ...current,
        reviewLike: err?.message || 'Khong xoa duoc danh gia nay.',
      }))
    }
  }

  return (
    <div className="pd-page">
      <div className="pd-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="pd-bc-sep">›</span>
        <Link to="/products">Sản phẩm</Link>
        <span className="pd-bc-sep">›</span>
        <span>{product.name}</span>
      </div>

      <div className="pd-container">
        <div className="pd-gallery">
          <div className="pd-main-img-wrap">
            {product.isNew && <span className="pd-badge pd-badge-new">Mới</span>}
            {product.isHot && <span className="pd-badge pd-badge-hot">Hot</span>}
            <img src={images[activeImg]} alt={product.name} className="pd-main-img" />
          </div>

          {images.length > 1 && (
            <div className="pd-thumbs">
              {images.map((img, index) => (
                <button key={index} className={`pd-thumb ${activeImg === index ? 'active' : ''}`} onClick={() => setActiveImg(index)}>
                  <img src={img} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}

          <div className="pd-tags">
            {product.tags?.map(tag => <span key={tag} className="pd-tag">{tag}</span>)}
          </div>
        </div>

        <div className="pd-info">
          <p className="pd-category">{product.category}</p>
          <h1 className="pd-name">{product.name}</h1>

          <div className="pd-rating-row">
            <div className="pd-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={star <= Math.round(product.avgRating ?? 0) ? 'star filled' : 'star'}>★</span>
              ))}
            </div>
            <span className="pd-rating-num">{product.avgRating?.toFixed(1)}</span>
            <span className="pd-reviews">({product.reviewCount ?? 0} đánh giá)</span>
          </div>

          <div className="pd-price-box">
            <div className="pd-price-main">
              {unitPrice.toLocaleString('vi-VN')}
              <span className="pd-price-unit">đ / ngày</span>
            </div>

            {product.pricePerWeek && (
              <div className="pd-price-alt">
                Thuê 7 ngày: <strong>{product.pricePerWeek.toLocaleString('vi-VN')}đ</strong>
              </div>
            )}

            <div className="pd-deposit">
              Đặt cọc: <strong>{(product.deposit ?? 0).toLocaleString('vi-VN')}đ</strong>
              <span className="pd-deposit-note"> (hoàn lại khi trả đồ nguyên vẹn)</span>
            </div>
          </div>

          <p className="pd-desc">{product.description}</p>

          <div className="pd-divider" />

          {product.sizes?.length > 0 && (
            <div className="pd-field-group">
              <div className="pd-field-top">
                <label className="pd-field-label">Kích thước</label>
                <span className="pd-size-guide-hint">Có bảng size chi tiết cho từng size</span>
              </div>

              <div className="pd-size-row">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    className={`pd-size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSize(size)
                      setErrors(current => ({ ...current, size: '' }))
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {errors.size && <p className="pd-error">{errors.size}</p>}


            </div>
          )}

          <div className="pd-date-grid">
            <div className="pd-field-group">
              <label className="pd-field-label" htmlFor="startDate">📅 Ngày nhận</label>
              <input
                id="startDate"
                className={`pd-date-input ${errors.startDate ? 'input-error' : ''}`}
                type="date"
                min={today}
                value={startDate}
                onChange={event => {
                  setStartDate(event.target.value)
                  setErrors(current => ({ ...current, startDate: '' }))
                }}
              />
              {errors.startDate && <p className="pd-error">{errors.startDate}</p>}
            </div>

            <div className="pd-field-group">
              <label className="pd-field-label" htmlFor="endDate">📅 Ngày trả</label>
              <input
                id="endDate"
                className={`pd-date-input ${errors.endDate ? 'input-error' : ''}`}
                type="date"
                min={startDate || today}
                value={endDate}
                onChange={event => {
                  setEndDate(event.target.value)
                  setErrors(current => ({ ...current, endDate: '' }))
                }}
              />
              {errors.endDate && <p className="pd-error">{errors.endDate}</p>}
            </div>
          </div>

          <div className="pd-field-group">
            <label className="pd-field-label">🛡️ Gói bảo hiểm (tùy chọn)</label>
            <div className="pd-warranty-grid">
              {warrantyPackages.map(pkg => (
                <button
                  key={pkg.key}
                  type="button"
                  className={`pd-warranty-btn ${selectedWarranty === pkg.key ? 'active' : ''}`}
                  onClick={() => setSelectedWarranty(pkg.key)}
                >
                  <div className="pd-warranty-top">
                    <span className="pd-warranty-name">{pkg.label}</span>
                    {pkg.fee > 0 && <span className="pd-warranty-fee">+{pkg.fee.toLocaleString('vi-VN')}đ</span>}
                  </div>
                  <p className="pd-warranty-note">{pkg.refundNote}</p>
                </button>
              ))}
            </div>
          </div>

          {days > 0 && (
            <div className="pd-summary">
              <div className="pd-summary-lines">
                <span>🗓 {days} ngày thuê</span>
                {selectedSize && <span className="pd-summary-size">Size đã chọn: {selectedSize}</span>}
                {warrantyFee > 0 && (
                  <span className="pd-summary-warranty">
                    🛡️ Bảo hành {warrantyPackages.find(item => item.key === selectedWarranty)?.label}
                  </span>
                )}
              </div>

              <div className="pd-summary-right">
                {warrantyFee > 0 && (
                  <span className="pd-summary-breakdown">
                    {rentalPrice.toLocaleString('vi-VN')}đ + {warrantyFee.toLocaleString('vi-VN')}đ
                  </span>
                )}
                <span className="pd-summary-price">{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          )}

          <div className="pd-actions">
            {errors.stock && <p className="pd-error">{errors.stock}</p>}
            <button className={`btn-pd-primary ${added ? 'btn-success' : ''}`} onClick={handleAddToCart}>
              {added ? '✓ Đã thêm vào giỏ' : '🛒 Thêm vào giỏ hàng'}
            </button>
            <button
              className="btn-pd-secondary"
              onClick={() => {
                const nextErrors = validate()
                if (Object.keys(nextErrors).length) {
                  setErrors(nextErrors)
                  return
                }

                setErrors({})
                addToCart(buildCartItem())
                navigate('/checkout')
              }}
            >
              Đặt thuê ngay →
            </button>
          </div>

          <div className="pd-policy-row">
            <div className="pd-policy-item">🚚 Ship toàn quốc</div>
            <div className="pd-policy-item">🔄 Hủy miễn phí 48h</div>
            <div className="pd-policy-item">📏 Có bảng size chi tiết</div>
          </div>
        </div>
      </div>

      {errors.reviewLike && <p className="pd-error">{errors.reviewLike}</p>}
      <DetailTabs
        product={product}
        sizeGuideRows={sizeGuideRows}
        currentUser={user}
        onToggleReviewLike={handleToggleReviewLike}
        onDeleteReview={handleDeleteReview}
      />
    </div>
  )
}

function DetailTabs({ product, sizeGuideRows, currentUser, onToggleReviewLike, onDeleteReview }) {
  const [tab, setTab] = useState('desc')

  const tabs = [
    { key: 'desc', label: 'Mô tả' },
    { key: 'specs', label: 'Thông số' },
    { key: 'sizes', label: `Bảng size (${sizeGuideRows.length})` },
    { key: 'reviews', label: `Đánh giá (${product.reviewCount ?? 0})` },
    { key: 'policy', label: 'Chính sách thuê' },
  ]

  return (
    <div className="pd-tabs-section">
      <div className="pd-tabs-nav">
        {tabs.map(item => (
          <button key={item.key} className={`pd-tab-btn ${tab === item.key ? 'active' : ''}`} onClick={() => setTab(item.key)}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="pd-tab-content">
        {tab === 'desc' && (
          <div className="pd-tab-body">
            <p>{product.description}</p>
            {product.includes?.length > 0 && (
              <>
                <h4>Bộ trang phục bao gồm:</h4>
                <ul>
                  {product.includes.map(item => <li key={item}>{item}</li>)}
                </ul>
              </>
            )}
          </div>
        )}

        {tab === 'specs' && (
          <div className="pd-tab-body">
            <table className="pd-specs-table">
              <tbody>
                {product.specs && Object.entries(product.specs).map(([key, value]) => (
                  <tr key={key}>
                    <td className="spec-key">{key}</td>
                    <td className="spec-val">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'sizes' && (
          <div className="pd-tab-body">
            <p>Bảng size này do người cho thuê cung cấp để khách đối chiếu số đo trước khi đặt.</p>
            <div className="pd-size-guide-table-wrap">
              <table className="pd-size-guide-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Ngực</th>
                    <th>Eo</th>
                    <th>Mông</th>
                    <th>Chiều cao</th>
                    <th>Cân nặng</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeGuideRows.map(row => (
                    <tr key={`tab-${row.size}`}>
                      <td>{row.size}</td>
                      <td>{row.bust}</td>
                      <td>{row.waist}</td>
                      <td>{row.hip}</td>
                      <td>{row.height}</td>
                      <td>{row.weight}</td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="pd-tab-body">
            {product.reviews?.length ? product.reviews.map((review, index) => (
              <div key={index} className="pd-review-card">
                <div className="pd-reviewer">
                  <div className="pd-avatar">{(review.buyerName || review.name || 'K').charAt(0)}</div>
                  <div>
                    <p className="pd-reviewer-name">{review.buyerName || review.name || 'Khach hang'}</p>
                    <p className="pd-reviewer-date">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : review.date}
                    </p>
                  </div>
                  <div className="pd-review-stars">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                <p className="pd-review-text">{review.content || review.comment}</p>
                {review.sellerResponse && (
                  <div className="pd-review-response">
                    <strong>Phan hoi tu shop</strong>
                    <p>{review.sellerResponse}</p>
                  </div>
                )}
                <div className="pd-review-actions">
                  <button
                    type="button"
                    className={`pd-review-like ${review.likedByCurrentUser ? 'active' : ''}`}
                    onClick={() => onToggleReviewLike?.(review)}
                  >
                    {review.likedByCurrentUser ? 'Unlike' : 'Like'} ({review.likeCount ?? 0})
                  </button>
                  {currentUser?.id && Number(currentUser.id) === Number(review.buyerId) && (
                    <button
                      type="button"
                      className="pd-review-delete"
                      onClick={() => onDeleteReview?.(review)}
                    >
                      Xoa danh gia
                    </button>
                  )}
                </div>
              </div>
            )) : <p className="pd-tab-empty">Chưa có đánh giá nào.</p>}
          </div>
        )}

        {tab === 'policy' && (
          <div className="pd-tab-body">
            <ul>
              <li>Đặt cọc khi nhận đồ, hoàn cọc đầy đủ khi trả nguyên vẹn.</li>
              <li>Trả muộn tính thêm <strong>50.000đ / ngày</strong>.</li>
              <li>Hư hỏng hoặc mất mát bồi thường theo giá trị thực tế.</li>
              <li>Hủy đặt thuê trước <strong>48 giờ</strong> không mất phí.</li>
              <li>Khách nên đối chiếu bảng size trước khi chốt đơn để tránh nhầm size.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetail
