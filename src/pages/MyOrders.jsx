import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders, cancelOrder } from '../api/order_api'
import { submitReview } from '../api/review_api'
import '../styles/MyOrders.css'

/* ---- Status Map kết hợp màu sắc cũ và logic Backend ---- */
const STATUS_MAP = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', bg: 'rgba(251,191,36,0.12)',  color: '#f59e0b', border: 'rgba(251,191,36,0.3)' },
  PENDING_CONFIRM: { label: 'Chờ xác nhận',  bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  CONFIRMED:       { label: 'Đã xác nhận',   bg: 'rgba(96,165,250,0.12)',  color: '#93c5fd', border: 'rgba(96,165,250,0.3)' },
  RENTING:         { label: 'Đang thuê',     bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  COMPLETED:       { label: 'Hoàn thành',    bg: 'rgba(168,85,247,0.12)',  color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
  CANCELLED:       { label: 'Đã hủy',        bg: 'rgba(239,68,68,0.1)',    color: '#f87171', border: 'rgba(239,68,68,0.25)' },
}

const CAN_CANCEL = ['PENDING_PAYMENT', 'PENDING_CONFIRM']
const CAN_REVIEW = ['COMPLETED']

const fmtPrice = p => Number(p ?? 0).toLocaleString('vi-VN')
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

/* ---- Star Rating ---- */
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(s => (
            <button
                key={s}
                type="button"
                className={`star-btn ${s <= (hovered || value) ? 'active' : ''}`}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => onChange(s)}
            >★</button>
        ))}
      </div>
  )
}

/* ---- Review Modal (Giao diện cũ + API mới) ---- */
function ReviewModal({ order, onClose, onDone }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const firstItem = order.items?.[0] || {}
  const costumeName = firstItem.productName || 'Sản phẩm'
  const imageUrl = firstItem.imageUrl || `https://picsum.photos/seed/${order.id}/300/400`

  const handleSubmit = async () => {
    if (!firstItem.productId) { setError('Không tìm thấy sản phẩm trong đơn'); return }
    if (!comment.trim()) { setError('Vui lòng nhập nhận xét'); return }

    setLoading(true); setError('')
    try {
      await submitReview({ orderId: order.id, productId: firstItem.productId, rating, comment })
      onDone(order.id)
      onClose()
    } catch (e) {
      setError(e?.message || 'Gửi đánh giá thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Đánh Giá Đơn Hàng</h3>
            <button className="modal-close" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="modal-costume-info">
            <img src={imageUrl} alt={costumeName} className="modal-img" />
            <div>
              <p className="modal-costume-name">{costumeName}</p>
              <p className="modal-order-id">#{order.orderCode}</p>
            </div>
          </div>

          <div className="modal-section">
            <label className="form-label">Chất lượng trang phục</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="modal-section">
            <label className="form-label">Nhận xét của bạn</label>
            <textarea
                className="review-textarea"
                placeholder="Chia sẻ trải nghiệm của bạn..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 16 }}>{error}</p>}

          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose} disabled={loading}>Hủy</button>
            <button className="btn-save-primary" onClick={handleSubmit} disabled={loading || !comment.trim()}>
              {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </div>
      </div>
  )
}

/* ---- Cancel Modal (Giao diện Confirm cũ + Input + API mới) ---- */
function CancelModal({ order, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCancel = async () => {
    setLoading(true); setError('')
    try {
      await cancelOrder(order.id, reason)
      onDone()
      onClose()
    } catch (e) {
      setError(e?.message || 'Hủy đơn thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-box modal-confirm" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Xác Nhận Hủy Đơn</h3>
            <button className="modal-close" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <p className="modal-desc" style={{ marginBottom: 12 }}>
            Bạn đang yêu cầu hủy đơn hàng <strong>#{order.orderCode}</strong>.
          </p>

          <textarea
              className="review-textarea"
              rows={3}
              placeholder="Lý do hủy đơn (Tùy chọn)..."
              value={reason}
              onChange={e => setReason(e.target.value)}
          />

          {error && <p style={{ color: '#ef4444', fontSize: 14, marginTop: 8 }}>{error}</p>}

          <div className="modal-actions" style={{ marginTop: 24 }}>
            <button className="btn-cancel" onClick={onClose} disabled={loading}>Đóng</button>
            <button className="btn-danger" onClick={handleCancel} disabled={loading}>
              {loading ? 'Đang hủy...' : 'Xác nhận hủy'}
            </button>
          </div>
        </div>
      </div>
  )
}

/* ---- Active Order Card (Data từ Backend) ---- */
function ActiveOrderCard({ order, onCancel }) {
  const s = STATUS_MAP[order.status] || STATUS_MAP['PENDING_CONFIRM']
  const firstItem = order.items?.[0] || {}
  const costumeName = order.items?.length > 1
      ? `${firstItem.productName} (+${order.items.length - 1} sp)`
      : firstItem.productName

  const imageUrl = firstItem.imageUrl || `https://picsum.photos/seed/${order.id}/300/400`
  const daysLeft = Math.max(0, Math.ceil((new Date(order.rentTo) - new Date()) / (1000 * 60 * 60 * 24)))
  const canCancel = CAN_CANCEL.includes(order.status)

  return (
      <div className="order-card active-card">
        <div className="order-card-img-wrap">
          <img src={imageUrl} alt={costumeName} className="order-card-img" />
          <div className="order-img-overlay" />
        </div>

        <div className="order-card-body">
          <div className="order-card-top">
            <div>
              <h3 className="order-costume-name">{costumeName}</h3>
              <p className="order-id-label">#{order.orderCode}</p>
            </div>
            <span className="order-status-badge" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
            {s.label}
          </span>
          </div>

          <div className="order-info-grid">
            <div className="order-info-item">
              <span className="info-icon">📅</span>
              <div>
                <span className="info-label">Ngày nhận</span>
                <span className="info-value">{fmtDate(order.rentFrom)}</span>
              </div>
            </div>
            <div className="order-info-item">
              <span className="info-icon">🔄</span>
              <div>
                <span className="info-label">Ngày trả</span>
                <span className="info-value">{fmtDate(order.rentTo)}</span>
              </div>
            </div>
            <div className="order-info-item">
              <span className="info-icon">💰</span>
              <div>
                <span className="info-label">Tổng tiền</span>
                <span className="info-value price-value">{fmtPrice(order.grandTotal)}đ</span>
              </div>
            </div>
            <div className="order-info-item">
              <span className="info-icon">🏷️</span>
              <div>
                <span className="info-label">Trạng thái</span>
                <span className="info-value small-text">{s.label}</span>
              </div>
            </div>
          </div>

          {order.status === 'RENTING' && daysLeft <= 2 && daysLeft >= 0 && (
              <div className="urgency-banner">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {daysLeft === 0 ? 'Hôm nay là ngày trả đồ!' : `Còn ${daysLeft} ngày phải trả đồ`}
              </div>
          )}

          <div className="order-card-actions">
            {canCancel ? (
                <button className="btn-order-cancel" onClick={() => onCancel(order)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Hủy đơn
                </button>
            ) : (
                <div style={{ padding: '8px 0' }} /> // Spacer để giữ layout
            )}
          </div>
        </div>
      </div>
  )
}

/* ---- History Order Card (Data từ Backend) ---- */
function HistoryOrderCard({ order, onReview, reviewedIds }) {
  const s = STATUS_MAP[order.status] || STATUS_MAP['COMPLETED']
  const firstItem = order.items?.[0] || {}
  const costumeName = order.items?.length > 1
      ? `${firstItem.productName} (+${order.items.length - 1} sp)`
      : firstItem.productName
  const imageUrl = firstItem.imageUrl || `https://picsum.photos/seed/${order.id}/300/400`
  const days = firstItem.days || 0

  const isReviewed = reviewedIds.has(order.id)
  const canReview = CAN_REVIEW.includes(order.status) && !isReviewed

  return (
      <div className="order-card history-card">
        <div className="order-card-img-wrap history-img-wrap">
          <img src={imageUrl} alt={costumeName} className="order-card-img" />
          <div className="order-img-overlay" />
        </div>

        <div className="order-card-body">
          <div className="order-card-top">
            <div>
              <h3 className="order-costume-name">{costumeName}</h3>
              <p className="order-id-label">#{order.orderCode}</p>
            </div>
            <span className="order-status-badge" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
            {s.label}
          </span>
          </div>

          <div className="order-info-row">
            <span className="info-chip">📅 {fmtDate(order.rentFrom)} – {fmtDate(order.rentTo)}</span>
            <span className="info-chip">📦 {days} ngày</span>
            <span className="info-chip price-chip">💰 {fmtPrice(order.grandTotal)}đ</span>
          </div>

          {isReviewed ? (
              <div className="review-display">
                <div className="review-stars-row">
                  <span className="review-star filled">★</span>
                  <span className="review-star filled">★</span>
                  <span className="review-star filled">★</span>
                  <span className="review-star filled">★</span>
                  <span className="review-star filled">★</span>
                  <span className="review-date-label">Đã đánh giá</span>
                </div>
              </div>
          ) : canReview ? (
              <button className="btn-write-review" onClick={() => onReview(order)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Viết đánh giá
              </button>
          ) : null}
        </div>
      </div>
  )
}

/* ===== MAIN PAGE ===== */
function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')

  const [reviewModal, setReviewModal] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)
  const [reviewedIds, setReviewedIds] = useState(new Set())

  const fetchOrders = () => {
    setLoading(true)
    getMyOrders()
        .then(res => setOrders(res.data ?? []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Phân loại đơn hàng
  const activeOrders = orders.filter(o => !['COMPLETED','CANCELLED'].includes(o.status))
  const historyOrders = orders.filter(o => ['COMPLETED','CANCELLED'].includes(o.status))

  const handleReviewDone = (orderId) => {
    setReviewedIds(prev => new Set([...prev, orderId]))
  }

  return (
      <div className="myorders-page">
        {/* Page Header */}
        <div className="orders-header-section">
          <div className="profile-title-row">
            <div className="profile-title-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div>
              <h1 className="profile-title">Đơn Thuê Của Tôi</h1>
              <p className="profile-subtitle">Theo dõi trang phục đang thuê và lịch sử đặt hàng</p>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="orders-summary-bar">
          <div className="summary-item">
            <span className="summary-num">{activeOrders.length}</span>
            <span className="summary-label">Đang xử lý</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
            <span className="summary-num">{historyOrders.filter(o => o.status === 'COMPLETED').length}</span>
            <span className="summary-label">Hoàn thành</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
          <span className="summary-num">
             {historyOrders.filter(o => o.status === 'COMPLETED' && !reviewedIds.has(o.id)).length}
          </span>
            <span className="summary-label">Chờ đánh giá</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="orders-tabs">
          <button
              className={`orders-tab ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Đang Xử Lý
            <span className="tab-count">{activeOrders.length}</span>
          </button>
          <button
              className={`orders-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v10l4 2"/><path d="M3.05 11a9 9 0 1 0 .5-4"/><path d="M3 3v5h5"/></svg>
            Lịch Sử
            <span className="tab-count">{historyOrders.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="orders-content">
          {loading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
          ) : activeTab === 'active' ? (
              <div className="orders-grid">
                {activeOrders.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">👘</div>
                      <h3 className="empty-title">Bạn chưa có đơn thuê nào</h3>
                      <p className="empty-desc">Khám phá kho trang phục cosplay của chúng tôi</p>
                      <Link to="/products" className="btn-browse">Xem trang phục</Link>
                    </div>
                ) : activeOrders.map(order => (
                    <ActiveOrderCard
                        key={order.id}
                        order={order}
                        onCancel={setCancelModal}
                    />
                ))}
              </div>
          ) : (
              <div className="orders-list">
                {historyOrders.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📦</div>
                      <h3 className="empty-title">Chưa có lịch sử thuê</h3>
                      <p className="empty-desc">Các đơn thuê đã hoàn thành sẽ xuất hiện ở đây</p>
                    </div>
                ) : historyOrders.map(order => (
                    <HistoryOrderCard
                        key={order.id}
                        order={order}
                        reviewedIds={reviewedIds}
                        onReview={setReviewModal}
                    />
                ))}
              </div>
          )}
        </div>

        {/* Modals */}
        {reviewModal && (
            <ReviewModal
                order={reviewModal}
                onClose={() => setReviewModal(null)}
                onDone={handleReviewDone}
            />
        )}

        {cancelModal && (
            <CancelModal
                order={cancelModal}
                onClose={() => setCancelModal(null)}
                onDone={fetchOrders}
            />
        )}
      </div>
  )
}

export default MyOrders