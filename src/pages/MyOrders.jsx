import { useState } from 'react'
import { useDemoStore } from '../context/DemoStore'
import '../styles/MyOrders.css'

/* ---- Mock Data ---- */
const ACTIVE_ORDERS = [
  {
    id: 'ORD-2024-001',
    costume: 'Demon Slayer Tanjiro',
    category: 'Anime',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=400&fit=crop',
    rentFrom: '2024-07-10',
    rentTo: '2024-07-14',
    price: 170000,
    days: 4,
    status: 'Đang thuê',
    returnAddress: '123 Nguyễn Huệ, Q.1, TP.HCM',
  },
  {
    id: 'ORD-2024-002',
    costume: 'Iron Man Mark 50',
    category: 'Siêu Anh Hùng',
    image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=300&h=400&fit=crop',
    rentFrom: '2024-07-08',
    rentTo: '2024-07-13',
    price: 250000,
    days: 5,
    status: 'Chờ trả',
    returnAddress: '88 Lê Lợi, Q.3, TP.HCM',
  },
  {
    id: 'ORD-2024-003',
    costume: 'Princess Elsa',
    category: 'Fantasy',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=400&fit=crop',
    rentFrom: '2024-07-12',
    rentTo: '2024-07-15',
    price: 175000,
    days: 3,
    status: 'Đang thuê',
    returnAddress: '123 Nguyễn Huệ, Q.1, TP.HCM',
  },
]

const HISTORY_ORDERS = [
  {
    id: 'ORD-2024-005',
    costume: 'Naruto Uzumaki',
    category: 'Anime',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&h=400&fit=crop',
    rentFrom: '2024-06-01',
    rentTo: '2024-06-03',
    price: 150000,
    days: 2,
    status: 'Hoàn thành',
    reviewed: false,
  },
  {
    id: 'ORD-2024-004',
    costume: 'Witcher Geralt',
    category: 'Game',
    image: 'https://images.unsplash.com/photo-1579033127963-fab4c4604f00?w=300&h=400&fit=crop',
    rentFrom: '2024-06-15',
    rentTo: '2024-06-18',
    price: 210000,
    days: 3,
    status: 'Hoàn thành',
    reviewed: true,
    review: { rating: 5, comment: 'Trang phục rất đẹp, chất lượng tốt, giao nhanh. Sẽ thuê lại lần sau!' },
  },
  {
    id: 'ORD-2024-003',
    costume: 'Batman',
    category: 'Siêu Anh Hùng',
    image: 'https://images.unsplash.com/photo-1599599810694-b3b147e5a8c4?w=300&h=400&fit=crop',
    rentFrom: '2024-05-20',
    rentTo: '2024-05-22',
    price: 200000,
    days: 2,
    status: 'Đã hủy',
    reviewed: false,
  },
  {
    id: 'ORD-2024-002',
    costume: 'Fairy Elf Queen',
    category: 'Fantasy',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=300&h=400&fit=crop',
    rentFrom: '2024-05-05',
    rentTo: '2024-05-08',
    price: 185000,
    days: 3,
    status: 'Hoàn thành',
    reviewed: false,
  },
]

/* ---- Status colors ---- */
const STATUS_COLORS = {
  'Chờ xác nhận':  { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  'Đã xác nhận':   { bg: 'rgba(96,165,250,0.12)',  color: '#93c5fd', border: 'rgba(96,165,250,0.3)' },
  'Đang thuê':     { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  'Chờ trả':       { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  'Chờ trả đồ':    { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  'Hoàn thành':    { bg: 'rgba(168,85,247,0.12)',  color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
  'Đã từ chối':    { bg: 'rgba(239,68,68,0.1)',    color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  'Đã hủy':        { bg: 'rgba(239,68,68,0.1)',    color: '#f87171', border: 'rgba(239,68,68,0.25)' },
}

/* ---- Star Rating ---- */
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          className={`star-btn ${s <= (hovered || value) ? 'active' : ''}`}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
        >★</button>
      ))}
    </div>
  )
}

/* ---- Review Modal ---- */
function ReviewModal({ order, onClose, onSubmit }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const handleSubmit = () => {
    if (!comment.trim()) return
    onSubmit(order.id, { rating, comment })
    onClose()
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Đánh Giá Trang Phục</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-costume-info">
          <img src={order.image} alt={order.costume} className="modal-img" />
          <div>
            <p className="modal-costume-name">{order.costume}</p>
            <p className="modal-order-id">{order.id}</p>
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
            placeholder="Chia sẻ trải nghiệm của bạn về trang phục này..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Hủy</button>
          <button className="btn-save-primary" onClick={handleSubmit} disabled={!comment.trim()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            Gửi đánh giá
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---- Confirm Modal ---- */
function ConfirmModal({ title, desc, onConfirm, onClose, danger }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-confirm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <p className="modal-desc">{desc}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Không, hủy bỏ</button>
          <button className={danger ? 'btn-danger' : 'btn-save-primary'} onClick={onConfirm}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---- Active Order Card ---- */
function ActiveOrderCard({ order, onExtend, onCancel }) {
  const fmtPrice = p => p.toLocaleString('vi-VN')
  const fmtDate = d => new Date(d).toLocaleDateString('vi-VN')
  const s = STATUS_COLORS[order.status] || STATUS_COLORS['Đang thuê']

  const daysLeft = Math.max(0, Math.ceil((new Date(order.rentTo) - new Date()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="order-card active-card">
      <div className="order-card-img-wrap">
        <img src={order.image} alt={order.costume} className="order-card-img"
          onError={e => { e.target.src = `https://picsum.photos/seed/${order.id}/300/400` }} />
        <div className="order-img-overlay" />
      </div>

      <div className="order-card-body">
        <div className="order-card-top">
          <div>
            <h3 className="order-costume-name">{order.costume}</h3>
            <p className="order-id-label">{order.id}</p>
          </div>
          <span className="order-status-badge" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
            {order.status}
          </span>
        </div>

        <div className="order-info-grid">
          <div className="order-info-item">
            <span className="info-icon">📅</span>
            <div>
              <span className="info-label">Ngày thuê</span>
              <span className="info-value">{fmtDate(order.rentFrom)}</span>
            </div>
          </div>
          <div className="order-info-item">
            <span className="info-icon">🔄</span>
            <div>
              <span className="info-label">Trả đồ</span>
              <span className="info-value">{fmtDate(order.rentTo)}</span>
            </div>
          </div>
          <div className="order-info-item">
            <span className="info-icon">💰</span>
            <div>
              <span className="info-label">Tổng tiền</span>
              <span className="info-value price-value">{fmtPrice(order.price * order.days)}đ</span>
            </div>
          </div>
          <div className="order-info-item">
            <span className="info-icon">📍</span>
            <div>
              <span className="info-label">Địa chỉ trả</span>
              <span className="info-value small-text">{order.returnAddress}</span>
            </div>
          </div>
        </div>

        {daysLeft <= 2 && daysLeft >= 0 && (
          <div className="urgency-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {daysLeft === 0 ? 'Hôm nay là ngày trả đồ!' : `Còn ${daysLeft} ngày phải trả đồ`}
          </div>
        )}

        <div className="order-card-actions">
          <button className="btn-extend" onClick={() => onExtend(order)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Gia hạn
          </button>
          <button className="btn-order-cancel" onClick={() => onCancel(order)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Hủy đơn
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---- History Order Card ---- */
function HistoryOrderCard({ order, onReview }) {
  const fmtPrice = p => p.toLocaleString('vi-VN')
  const fmtDate = d => new Date(d).toLocaleDateString('vi-VN')
  const s = STATUS_COLORS[order.status] || STATUS_COLORS['Hoàn thành']

  return (
    <div className="order-card history-card">
      <div className="order-card-img-wrap history-img-wrap">
        <img src={order.image} alt={order.costume} className="order-card-img"
          onError={e => { e.target.src = `https://picsum.photos/seed/${order.id}/300/400` }} />
        <div className="order-img-overlay" />
      </div>

      <div className="order-card-body">
        <div className="order-card-top">
          <div>
            <h3 className="order-costume-name">{order.costume}</h3>
            <p className="order-id-label">{order.id}</p>
          </div>
          <span className="order-status-badge" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
            {order.status}
          </span>
        </div>

        <div className="order-info-row">
          <span className="info-chip">📅 {fmtDate(order.rentFrom)} – {fmtDate(order.rentTo)}</span>
          <span className="info-chip">📦 {order.days} ngày</span>
          <span className="info-chip price-chip">💰 {fmtPrice(order.price * order.days)}đ</span>
        </div>

        {order.reviewed && order.review ? (
          <div className="review-display">
            <div className="review-stars-row">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`review-star ${s <= order.review.rating ? 'filled' : ''}`}>★</span>
              ))}
              <span className="review-date-label">Đã đánh giá</span>
            </div>
            <p className="review-comment-text">"{order.review.comment}"</p>
          </div>
        ) : order.status === 'Hoàn thành' ? (
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
  const { orders: contextOrders } = useDemoStore()
  const [activeTab, setActiveTab] = useState('active')
  const [history, setHistory] = useState(HISTORY_ORDERS)
  const [reviewModal, setReviewModal] = useState(null)
  const [extendModal, setExtendModal] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)

  /* Merge context orders vào danh sách hiển thị */
  const activeStatusKeys = ['pending_confirm', 'confirmed', 'active', 'waiting_return', 'pending_return']
  const contextActive = contextOrders.filter(o => activeStatusKeys.includes(o.statusKey))
  const allActive = [
    ...contextActive,
    ...ACTIVE_ORDERS.filter(o => !contextOrders.find(c => c.id === o.id)),
  ]

  const handleReviewSubmit = (orderId, review) => {
    setHistory(prev => prev.map(o => o.id === orderId ? { ...o, reviewed: true, review } : o))
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
          <span className="summary-num">{allActive.length}</span>
          <span className="summary-label">Đang xử lý</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-num">{history.filter(o => o.status === 'Hoàn thành').length}</span>
          <span className="summary-label">Hoàn thành</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-num">{history.filter(o => !o.reviewed && o.status === 'Hoàn thành').length}</span>
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
          <span className="tab-count">{allActive.length}</span>
        </button>
        <button
          className={`orders-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v10l4 2"/><path d="M3.05 11a9 9 0 1 0 .5-4"/><path d="M3 3v5h5"/></svg>
          Lịch Sử
          <span className="tab-count">{history.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="orders-content">
        {activeTab === 'active' && (
          <div className="orders-grid">
            {allActive.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👘</div>
                <h3 className="empty-title">Bạn chưa có đơn thuê nào</h3>
                <p className="empty-desc">Khám phá kho trang phục cosplay của chúng tôi</p>
                <a href="/products" className="btn-browse">Xem trang phục</a>
              </div>
            ) : allActive.map(order => (
              <ActiveOrderCard
                key={order.id}
                order={order}
                onExtend={setExtendModal}
                onCancel={setCancelModal}
              />
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="orders-list">
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3 className="empty-title">Chưa có lịch sử thuê</h3>
                <p className="empty-desc">Các đơn thuê đã hoàn thành sẽ xuất hiện ở đây</p>
              </div>
            ) : history.map(order => (
              <HistoryOrderCard
                key={order.id}
                order={order}
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
          onSubmit={handleReviewSubmit}
        />
      )}

      {extendModal && (
        <ConfirmModal
          title="Yêu Cầu Gia Hạn"
          desc={`Bạn muốn gia hạn đơn "${extendModal.costume}"? Chúng tôi sẽ liên hệ xác nhận và thông báo phụ phí (nếu có).`}
          onConfirm={() => { alert('Đã gửi yêu cầu gia hạn!'); setExtendModal(null) }}
          onClose={() => setExtendModal(null)}
          danger={false}
        />
      )}

      {cancelModal && (
        <ConfirmModal
          title="Xác Nhận Hủy Đơn"
          desc={`Bạn có chắc muốn hủy đơn "${cancelModal.costume}"? Hành động này không thể hoàn tác và có thể áp dụng phí hủy.`}
          onConfirm={() => { alert('Đã hủy đơn!'); setCancelModal(null) }}
          onClose={() => setCancelModal(null)}
          danger={true}
        />
      )}
    </div>
  )
}

export default MyOrders
