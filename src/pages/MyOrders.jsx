import { useEffect, useMemo, useState } from 'react'
import { getMyOrderDetail, getMyOrderHistory } from '../api/order_api'
import { createProductReview } from '../api/review_api'
import '../styles/MyOrders.css'

const STATUS_LABELS = {
  PENDING_PAYMENT: 'Cho thanh toan',
  PENDING_CONFIRM: 'Cho xac nhan',
  CONFIRMED: 'Da xac nhan',
  RENTING: 'Dang thue',
  COMPLETED: 'Hoan thanh',
  CANCELLED: 'Da huy',
}

const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'PENDING_CONFIRM', 'CONFIRMED', 'RENTING']

const STATUS_COLORS = {
  PENDING_PAYMENT: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  PENDING_CONFIRM: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  CONFIRMED: { bg: 'rgba(96,165,250,0.12)', color: '#93c5fd', border: 'rgba(96,165,250,0.3)' },
  RENTING: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  COMPLETED: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
  CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
}

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}d`
}

function date(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('vi-VN')
}

function firstItem(order) {
  return order.items?.[0] ?? {}
}

function OrderCard({ order, onDetail }) {
  const item = firstItem(order)
  const statusStyle = STATUS_COLORS[order.status] ?? STATUS_COLORS.CONFIRMED
  const itemCount = order.items?.length ?? 0

  return (
    <div className="order-card history-card">
      <div className="order-card-img-wrap history-img-wrap">
        <img
          src={item.productImageUrl || `https://picsum.photos/seed/${order.id}/300/400`}
          alt={item.productName || order.orderCode}
          className="order-card-img"
          onError={event => { event.currentTarget.src = `https://picsum.photos/seed/${order.id}/300/400` }}
        />
        <div className="order-img-overlay" />
      </div>

      <div className="order-card-body">
        <div className="order-card-top">
          <div>
            <h3 className="order-costume-name">{item.productName || `Don ${order.orderCode}`}</h3>
            <p className="order-id-label">{order.orderCode} · {itemCount} san pham</p>
          </div>
          <span className="order-status-badge" style={statusStyle}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        <div className="order-info-row">
          <span className="info-chip">Thue: {date(order.rentFrom)} - {date(order.rentTo)}</span>
          <span className="info-chip">Dat: {date(order.createdAt)}</span>
          <span className="info-chip price-chip">Tong: {money(order.grandTotal)}</span>
        </div>

        <div className="order-info-row">
          <span className="info-chip">Tien thue: {money(order.rentalTotal)}</span>
          <span className="info-chip">Tien coc: {money(order.depositTotal)}</span>
          <span className="info-chip">Bao hanh: {money(order.warrantyTotal)}</span>
        </div>

        <button className="btn-write-review" type="button" onClick={() => onDetail(order.id)}>
          Xem chi tiet don hang
        </button>
      </div>
    </div>
  )
}

function ReviewForm({ order, item, onSubmitted }) {
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [imageText, setImageText] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await createProductReview({
        orderId: order.id,
        productId: item.productId,
        rating: Number(rating),
        content,
        imageUrls: imageText.split('\n').map(value => value.trim()).filter(Boolean),
      })
      setMessage('Da gui danh gia thanh cong.')
      setContent('')
      setImageText('')
      onSubmitted?.()
    } catch (err) {
      setMessage(err?.message || 'Khong gui duoc danh gia. Co the ban da danh gia san pham nay trong don.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="order-review-form" onSubmit={submit}>
      <div className="review-form-row">
        <label>
          So sao
          <select value={rating} onChange={event => setRating(event.target.value)}>
            {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} sao</option>)}
          </select>
        </label>
      </div>
      <textarea
        value={content}
        onChange={event => setContent(event.target.value)}
        placeholder="Nhap noi dung danh gia ve chat luong, giao nhan, phu kien..."
        required
        minLength={5}
      />
      <textarea
        value={imageText}
        onChange={event => setImageText(event.target.value)}
        placeholder="Link anh minh chung neu co, moi link mot dong"
      />
      <div className="review-form-actions">
        <button className="btn-write-review" type="submit" disabled={saving}>
          {saving ? 'Dang gui...' : 'Gui danh gia'}
        </button>
        {message && <span className="review-form-message">{message}</span>}
      </div>
    </form>
  )
}

function OrderDetailModal({ order, onClose, onReviewSubmitted }) {
  if (!order) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{order.orderCode}</h3>
            <p className="modal-order-id">{STATUS_LABELS[order.status] ?? order.status}</p>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>x</button>
        </div>

        <div className="modal-section">
          <span className="form-label">Thong tin nhan hang</span>
          <p className="modal-desc">
            {order.customerName} · {order.customerPhone || '-'} · {order.customerEmail || '-'}<br />
            {order.shippingAddress || 'Chua co dia chi'}
          </p>
        </div>

        <div className="modal-section">
          <span className="form-label">Thoi gian va thanh toan</span>
          <p className="modal-desc">
            Thue: {date(order.rentFrom)} - {date(order.rentTo)}<br />
            Thanh toan: {order.paymentMethod || '-'} · Paid at: {order.paidAt ? new Date(order.paidAt).toLocaleString('vi-VN') : '-'}
          </p>
        </div>

        <div className="modal-section">
          <span className="form-label">San pham trong don</span>
          {(order.items || []).map(item => (
            <div className="modal-order-item-block" key={item.id}>
            <div className="modal-costume-info">
              <img
                src={item.productImageUrl || `https://picsum.photos/seed/${item.productId}/120/160`}
                alt={item.productName}
                className="modal-img"
              />
              <div>
                <p className="modal-costume-name">{item.productName}</p>
                <p className="modal-order-id">
                  {item.categoryName} · Size {item.size || '-'} · {item.quantity} x {item.days} ngay · {money(item.unitPrice)}/ngay
                </p>
                <p className="modal-order-id">Thanh tien: {money(item.lineTotal)}</p>
              </div>
            </div>
            {order.status === 'COMPLETED' && item.productId && (
              <ReviewForm order={order} item={item} onSubmitted={onReviewSubmitted} />
            )}
            </div>
          ))}
        </div>

        <div className="review-display">
          <p className="review-comment-text">Tien thue: {money(order.rentalTotal)}</p>
          <p className="review-comment-text">Tien coc: {money(order.depositTotal)}</p>
          <p className="review-comment-text">Bao hanh: {money(order.warrantyTotal)}</p>
          <p className="review-comment-text">Tong thanh toan: {money(order.grandTotal)}</p>
        </div>
      </div>
    </div>
  )
}

function MyOrders() {
  const [activeTab, setActiveTab] = useState('active')
  const [orders, setOrders] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    setLoading(true)
    getMyOrderHistory()
      .then(data => {
        if (!ignore) setOrders(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        if (!ignore) setError(err?.message || 'Khong tai duoc lich su mua. Hay dang nhap lai.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => { ignore = true }
  }, [])

  const activeOrders = useMemo(
    () => orders.filter(order => ACTIVE_STATUSES.includes(order.status)),
    [orders]
  )
  const historyOrders = useMemo(
    () => orders.filter(order => !ACTIVE_STATUSES.includes(order.status)),
    [orders]
  )

  const openDetail = (id) => {
    setDetail({ loading: true })
    getMyOrderDetail(id)
      .then(data => setDetail(data))
      .catch(err => setDetail({ error: err?.message || 'Khong tai duoc chi tiet don hang' }))
  }

  const visibleOrders = activeTab === 'active' ? activeOrders : historyOrders

  return (
    <div className="myorders-page">
      <div className="orders-header-section">
        <div className="profile-title-row">
          <div className="profile-title-icon">✓</div>
          <div>
            <h1 className="profile-title">Don thue cua toi</h1>
            <p className="profile-subtitle">Theo doi lich su mua, chi tiet don, thoi gian va tien bac.</p>
          </div>
        </div>
      </div>

      <div className="orders-summary-bar">
        <div className="summary-item">
          <span className="summary-num">{activeOrders.length}</span>
          <span className="summary-label">Dang xu ly</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-num">{historyOrders.filter(o => o.status === 'COMPLETED').length}</span>
          <span className="summary-label">Hoan thanh</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-num">{money(orders.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0))}</span>
          <span className="summary-label">Tong tien</span>
        </div>
      </div>

      <div className="orders-tabs">
        <button className={`orders-tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          Dang xu ly <span className="tab-count">{activeOrders.length}</span>
        </button>
        <button className={`orders-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          Lich su <span className="tab-count">{historyOrders.length}</span>
        </button>
      </div>

      {loading && <div className="empty-state"><h3 className="empty-title">Dang tai don hang...</h3></div>}
      {error && !loading && <div className="empty-state"><h3 className="empty-title">{error}</h3></div>}

      {!loading && !error && (
        <div className={activeTab === 'active' ? 'orders-grid' : 'orders-list'}>
          {visibleOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">□</div>
              <h3 className="empty-title">Chua co don hang</h3>
              <p className="empty-desc">Don hang se hien thi tai day sau khi backend tra ve du lieu.</p>
            </div>
          ) : visibleOrders.map(order => (
            <OrderCard key={order.id} order={order} onDetail={openDetail} />
          ))}
        </div>
      )}

      {detail?.loading && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal-box"><h3 className="modal-title">Dang tai chi tiet...</h3></div>
        </div>
      )}
      {detail?.error && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal-box"><h3 className="modal-title">{detail.error}</h3></div>
        </div>
      )}
      {detail && !detail.loading && !detail.error && (
        <OrderDetailModal order={detail} onClose={() => setDetail(null)} onReviewSubmitted={() => openDetail(detail.id)} />
      )}
    </div>
  )
}

export default MyOrders
