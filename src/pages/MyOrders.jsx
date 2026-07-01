import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrderHistory, getMyOrderDetail, cancelOrder } from '../api/order_api'
import { createProductReview } from '../api/review_api'
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

const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'PENDING_CONFIRM', 'CONFIRMED', 'RENTING']
const CAN_CANCEL = ['PENDING_PAYMENT', 'PENDING_CONFIRM']
const CAN_REVIEW = ['COMPLETED']

const fmtPrice = p => `${Number(p ?? 0).toLocaleString('vi-VN')}đ`
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

/* ---- Review Modal (Giao diện cũ + Thêm Input Ảnh + API mới) ---- */
function ReviewModal({ order, onClose, onDone }) {
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [imageText, setImageText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const firstItem = order.items?.[0] || {}
    const costumeName = firstItem.productName || 'Sản phẩm'
    const imageUrl = firstItem.productImageUrl || firstItem.imageUrl || `https://picsum.photos/seed/${order.id}/300/400`

    const handleSubmit = async () => {
        if (!firstItem.productId) { setError('Không tìm thấy sản phẩm trong đơn'); return }
        if (!comment.trim()) { setError('Vui lòng nhập nhận xét'); return }

        setLoading(true); setError('')
        try {
            await createProductReview({
                orderId: order.id,
                productId: firstItem.productId,
                rating: Number(rating),
                content: comment,
                imageUrls: imageText.split('\n').map(v => v.trim()).filter(Boolean)
            })
            onDone(order.id)
            onClose()
        } catch (e) {
            setError(e?.message || 'Gửi đánh giá thất bại. Có thể bạn đã đánh giá đơn này rồi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Đánh Giá Đơn Hàng</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
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
                        placeholder="Chia sẻ trải nghiệm của bạn (chất lượng, giao nhận, phụ kiện)..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="modal-section">
                    <label className="form-label">Hình ảnh minh chứng (Tùy chọn)</label>
                    <textarea
                        className="review-textarea"
                        placeholder="Link ảnh minh chứng nếu có (Mỗi link một dòng)..."
                        value={imageText}
                        onChange={e => setImageText(e.target.value)}
                        rows={2}
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

/* ---- Cancel Modal ---- */
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
                    <button className="modal-close" onClick={onClose}>✕</button>
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

/* ---- Order Detail Modal (Tích hợp từ nhánh Main - Tiếng Việt có dấu) ---- */
function OrderDetailModal({ order, onClose }) {
    if (!order) return null;
    const s = STATUS_MAP[order.status] || STATUS_MAP['CONFIRMED'];

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={event => event.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">Mã đơn: {order.orderCode}</h3>
                        <p className="modal-order-id" style={{ color: s.color }}>{s.label}</p>
                    </div>
                    <button className="modal-close" type="button" onClick={onClose}>✕</button>
                </div>

                <div className="modal-section">
                    <span className="form-label">Thông tin nhận hàng</span>
                    <p className="modal-desc">
                        {order.customerName} · {order.customerPhone || '-'} · {order.customerEmail || '-'}<br />
                        {order.shippingAddress || 'Chưa có địa chỉ'}
                    </p>
                </div>

                <div className="modal-section">
                    <span className="form-label">Thời gian và thanh toán</span>
                    <p className="modal-desc">
                        Thuê từ: {fmtDate(order.rentFrom)} - {fmtDate(order.rentTo)}<br />
                        Thanh toán: {order.paymentMethod || '-'} · Đã thanh toán lúc: {order.paidAt ? new Date(order.paidAt).toLocaleString('vi-VN') : '-'}
                    </p>
                </div>

                <div className="modal-section">
                    <span className="form-label">Sản phẩm trong đơn</span>
                    {(order.items || []).map(item => (
                        <div className="modal-order-item-block" key={item.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #eee' }}>
                            <div className="modal-costume-info">
                                <img
                                    src={item.productImageUrl || item.imageUrl || `https://picsum.photos/seed/${item.productId}/120/160`}
                                    alt={item.productName}
                                    className="modal-img"
                                    style={{ width: 60, height: 80, objectFit: 'cover', borderRadius: 8 }}
                                />
                                <div>
                                    <p className="modal-costume-name">{item.productName}</p>
                                    <p className="modal-order-id">
                                        {item.categoryName || 'Sản phẩm'} · Size {item.size || '-'} · {item.quantity} x {item.days} ngày · {fmtPrice(item.unitPrice)}/ngày
                                    </p>
                                    <p className="modal-order-id">Thành tiền: {fmtPrice(item.lineTotal)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="review-display" style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Tiền thuê:</span> <span>{fmtPrice(order.rentalTotal)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Tiền cọc:</span> <span>{fmtPrice(order.depositTotal)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Bảo hành:</span> <span>{fmtPrice(order.warrantyTotal)}</span></div>
                    <hr style={{ margin: '8px 0', borderColor: '#eee' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Tổng thanh toán:</span> <span style={{ color: '#ef4444' }}>{fmtPrice(order.grandTotal)}</span></div>
                </div>
            </div>
        </div>
    )
}

/* ---- Active Order Card ---- */
function ActiveOrderCard({ order, onCancel, onDetail }) {
    const s = STATUS_MAP[order.status] || STATUS_MAP['PENDING_CONFIRM']
    const firstItem = order.items?.[0] || {}
    const costumeName = order.items?.length > 1
        ? `${firstItem.productName} (+${order.items.length - 1} sp)`
        : firstItem.productName

    const imageUrl = firstItem.productImageUrl || firstItem.imageUrl || `https://picsum.photos/seed/${order.id}/300/400`
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
                        <div><span className="info-label">Ngày nhận</span><span className="info-value">{fmtDate(order.rentFrom)}</span></div>
                    </div>
                    <div className="order-info-item">
                        <span className="info-icon">🔄</span>
                        <div><span className="info-label">Ngày trả</span><span className="info-value">{fmtDate(order.rentTo)}</span></div>
                    </div>
                    <div className="order-info-item">
                        <span className="info-icon">💰</span>
                        <div><span className="info-label">Tổng tiền</span><span className="info-value price-value">{fmtPrice(order.grandTotal)}</span></div>
                    </div>
                    <div className="order-info-item">
                        <span className="info-icon">🏷️</span>
                        <div><span className="info-label">Trạng thái</span><span className="info-value small-text">{s.label}</span></div>
                    </div>
                </div>

                {order.status === 'RENTING' && daysLeft <= 2 && daysLeft >= 0 && (
                    <div className="urgency-banner">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {daysLeft === 0 ? 'Hôm nay là ngày trả đồ!' : `Còn ${daysLeft} ngày phải trả đồ`}
                    </div>
                )}

                <div className="order-card-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-write-review" onClick={() => onDetail(order.id)} style={{ flex: 1, padding: '8px', fontSize: '13px' }}>
                        Xem chi tiết
                    </button>
                    {canCancel && (
                        <button className="btn-order-cancel" onClick={() => onCancel(order)} style={{ flex: 1, padding: '8px', fontSize: '13px' }}>
                            Hủy đơn
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ---- History Order Card ---- */
function HistoryOrderCard({ order, onReview, onDetail, reviewedIds }) {
    const s = STATUS_MAP[order.status] || STATUS_MAP['COMPLETED']
    const firstItem = order.items?.[0] || {}
    const costumeName = order.items?.length > 1
        ? `${firstItem.productName} (+${order.items.length - 1} sp)`
        : firstItem.productName
    const imageUrl = firstItem.productImageUrl || firstItem.imageUrl || `https://picsum.photos/seed/${order.id}/300/400`
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
                    <span className="info-chip price-chip">💰 {fmtPrice(order.grandTotal)}</span>
                </div>

                <div className="order-card-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn-cancel" onClick={() => onDetail(order.id)} style={{ flex: 1, padding: '8px', fontSize: '13px' }}>
                        Xem chi tiết
                    </button>

                    {isReviewed ? (
                        <div className="review-display" style={{ flex: 1, textAlign: 'center', padding: '8px', border: '1px solid #eee', borderRadius: '6px' }}>
                            <span className="review-date-label" style={{ color: '#4ade80' }}>✓ Đã đánh giá</span>
                        </div>
                    ) : canReview ? (
                        <button className="btn-write-review" onClick={() => onReview(order)} style={{ flex: 1, padding: '8px', fontSize: '13px' }}>
                            Viết đánh giá
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

/* ===== MAIN PAGE ===== */
function MyOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('active')

    const [reviewModal, setReviewModal] = useState(null)
    const [cancelModal, setCancelModal] = useState(null)
    const [detailModal, setDetailModal] = useState(null) // State cho Modal chi tiết
    const [reviewedIds, setReviewedIds] = useState(new Set())

    const fetchOrders = () => {
        setLoading(true)
        setError('')
        getMyOrderHistory()
            .then(res => setOrders(Array.isArray(res) ? res : (res.data ?? [])))
            .catch(err => setError(err?.message || 'Không tải được lịch sử mua. Hãy tải lại trang.'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const activeOrders = useMemo(() => orders.filter(o => ACTIVE_STATUSES.includes(o.status)), [orders])
    const historyOrders = useMemo(() => orders.filter(o => !ACTIVE_STATUSES.includes(o.status)), [orders])

    const openDetail = (id) => {
        setDetailModal({ loading: true })
        getMyOrderDetail(id)
            .then(data => setDetailModal(data))
            .catch(err => setDetailModal({ error: err?.message || 'Không tải được chi tiết đơn hàng' }))
    }

    const handleReviewDone = (orderId) => {
        setReviewedIds(prev => new Set([...prev, orderId]))
    }

    return (
        <div className="myorders-page">
            {/* Page Header */}
            <div className="orders-header-section">
                <div className="profile-title-row">
                    <div className="profile-title-icon">✓</div>
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
            {fmtPrice(orders.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0))}
          </span>
                    <span className="summary-label">Tổng tiền</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="orders-tabs">
                <button
                    className={`orders-tab ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Đang Xử Lý <span className="tab-count">{activeOrders.length}</span>
                </button>
                <button
                    className={`orders-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Lịch Sử <span className="tab-count">{historyOrders.length}</span>
                </button>
            </div>

            {error && !loading && <div className="empty-state"><h3 className="empty-title">{error}</h3></div>}

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
                                onDetail={openDetail}
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
                                onDetail={openDetail}
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

            {detailModal?.loading && (
                <div className="modal-backdrop" onClick={() => setDetailModal(null)}>
                    <div className="modal-box" style={{ textAlign: 'center', padding: '40px' }}><h3 className="modal-title">Đang tải chi tiết...</h3></div>
                </div>
            )}

            {detailModal?.error && (
                <div className="modal-backdrop" onClick={() => setDetailModal(null)}>
                    <div className="modal-box" style={{ textAlign: 'center', padding: '40px' }}>
                        <h3 className="modal-title" style={{ color: '#ef4444' }}>{detailModal.error}</h3>
                        <button className="btn-cancel" onClick={() => setDetailModal(null)} style={{ marginTop: 16 }}>Đóng</button>
                    </div>
                </div>
            )}

            {detailModal && !detailModal.loading && !detailModal.error && (
                <OrderDetailModal
                    order={detailModal}
                    onClose={() => setDetailModal(null)}
                />
            )}
        </div>
    )
}

export default MyOrders