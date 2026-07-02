import { useState, useEffect, useCallback } from 'react'
import {
    getSellerOrders,
    getSellerOrderDetail,
    updateSellerOrderStatus,
    cancelSellerOrder
} from '../api/seller_api'
import '../styles/SellerOrders.css'

// ─── Constants ───────────────────────────────────────────────────────────────
const fmt = n => Number(n ?? 0).toLocaleString('vi-VN') + 'đ'
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'

const STATUS_META = {
    PENDING_PAYMENT:  { label: 'Chờ thanh toán', color: '#94a3b8', next: null },
    PENDING_CONFIRM:  { label: 'Chờ xác nhận',   color: '#f59e0b', next: 'CONFIRMED' },
    CONFIRMED:        { label: 'Đã xác nhận',     color: '#38bdf8', next: 'RENTING'   },
    RENTING:          { label: 'Đang thuê',        color: '#4ade80', next: 'COMPLETED' },
    COMPLETED:        { label: 'Hoàn thành',       color: '#a78bfa', next: null        },
    CANCELLED:        { label: 'Đã hủy',           color: '#f87171', next: null        },
}

const NEXT_LABEL = {
    CONFIRMED: 'Xác nhận đơn',
    RENTING:   'Chuyển sang Đang thuê',
    COMPLETED: 'Hoàn thành đơn',
}

const STATUS_TABS = [
    { key: '',                label: 'Tất cả'          },
    { key: 'PENDING_CONFIRM', label: 'Chờ xác nhận'    },
    { key: 'CONFIRMED',       label: 'Đã xác nhận'     },
    { key: 'RENTING',         label: 'Đang thuê'        },
    { key: 'COMPLETED',       label: 'Hoàn thành'       },
    { key: 'CANCELLED',       label: 'Đã hủy'           },
]

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ orderId, onClose, onStatusChange }) {
    const [order, setOrder]       = useState(null)
    const [loading, setLoading]   = useState(true)
    const [confirming, setConfirming] = useState(false)
    const [cancelMode, setCancelMode] = useState(false)
    const [cancelReason, setCancelReason] = useState('')
    const [err, setErr]           = useState('')

    useEffect(() => {
        if (!orderId) return;
        setLoading(true);
        getSellerOrderDetail(orderId)
            .then(orderData => {
                // seller_api đã unwrap sẵn, nên orderData chính là object đơn hàng
                setOrder(orderData);
            })
            .catch(err => {
                console.error("API Error:", err);
                setErr('Không tải được đơn hàng');
            })
            .finally(() => setLoading(false));
    }, [orderId]);

    const handleNextStatus = async () => {
        if (!order) return
        const next = STATUS_META[order.status]?.next
        if (!next) return
        setConfirming(true); setErr('')
        try {
            await updateSellerOrderStatus(order.id, next)
            onStatusChange()
            onClose()
        } catch (e) {
            setErr(e?.message || 'Cập nhật thất bại')
        } finally { setConfirming(false) }
    }

    const handleCancel = async () => {
        if (!cancelReason.trim()) { setErr('Nhập lý do hủy'); return }
        setConfirming(true); setErr('')
        try {
            await cancelSellerOrder(order.id, cancelReason)
            onStatusChange()
            onClose()
        } catch (e) {
            setErr(e?.message || 'Hủy đơn thất bại')
        } finally { setConfirming(false) }
    }

    const meta = order ? STATUS_META[order.status] : null
    const canCancel = order && !['COMPLETED','CANCELLED','RENTING'].includes(order.status)

    return (
        <div className="so-modal-overlay" onClick={onClose}>
            <div className="so-modal" onClick={e => e.stopPropagation()}>
                {loading ? (
                    <div className="so-modal-loading">Đang tải...</div>
                ) : err && !order ? (
                    <div className="so-modal-error">{err}</div>
                ) : order ? (
                    <>
                        <div className="so-modal-head">
                            <div>
                                <h3 className="so-modal-title">Đơn hàng #{order.orderCode}</h3>
                                <span className="so-modal-date">📅 {fmtDate(order.createdAt)}</span>
                            </div>
                            <span className="so-status-badge"
                                  style={{ background: meta?.color + '22', color: meta?.color, border: `1px solid ${meta?.color}44` }}>
                                {meta?.label}
                            </span>
                        </div>

                        {/* Thông tin khách */}
                        <div className="so-section">
                            <h4 className="so-section-title">👤 Khách hàng</h4>
                            <div className="so-info-grid">
                                <div><span>Tên</span><strong>{order.customerName}</strong></div>
                                <div><span>SĐT</span><strong>{order.customerPhone}</strong></div>
                                <div><span>Email</span><strong>{order.customerEmail}</strong></div>
                                <div><span>Địa chỉ</span><strong>{order.shippingAddress || '—'}</strong></div>
                            </div>
                        </div>

                        {/* Thời gian thuê */}
                        <div className="so-section">
                            <h4 className="so-section-title">📆 Thời gian thuê</h4>
                            <div className="so-info-grid">
                                <div><span>Từ ngày</span><strong>{fmtDate(order.rentFrom)}</strong></div>
                                <div><span>Đến ngày</span><strong>{fmtDate(order.rentTo)}</strong></div>
                                <div><span>Thanh toán</span><strong>{order.paymentMethod}</strong></div>
                                <div><span>Đã thanh toán lúc</span><strong>{fmtDate(order.paidAt)}</strong></div>
                            </div>
                        </div>

                        {/* Danh sách sản phẩm */}
                        <div className="so-section">
                            <h4 className="so-section-title">📦 Sản phẩm ({order.items?.length ?? 0})</h4>
                            <div className="so-items">
                                {(order.items ?? []).map((item, i) => (
                                    <div key={i} className="so-item-row">
                                        <div className="so-item-info">
                                            <span className="so-item-name">{item.productName}</span>
                                            <span className="so-item-meta">
                                                Size {item.size} · {item.days} ngày · SL {item.quantity}
                                                {item.categoryName && ` · ${item.categoryName}`}
                                            </span>
                                        </div>
                                        <span className="so-item-price">{fmt(item.lineTotal)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tổng tiền */}
                        <div className="so-totals">
                            <div><span>Tiền thuê</span><span>{fmt(order.orderRentalTotal)}</span></div>
                            <div><span>Tiền cọc</span><span>{fmt(order.orderDepositTotal)}</span></div>
                            {Number(order.orderWarrantyTotal) > 0 &&
                                <div><span>Bảo hành</span><span>{fmt(order.orderWarrantyTotal)}</span></div>}
                            <div className="so-total-final">
                                <span>Tổng cộng</span><strong>{fmt(order.orderGrandTotal)}</strong></div>
                        </div>

                        {err && <p className="so-err">{err}</p>}

                        {/* Actions */}
                        {!cancelMode ? (
                            <div className="so-modal-actions">
                                <button className="so-btn-close" onClick={onClose}>Đóng</button>
                                {canCancel && (
                                    <button className="so-btn-cancel-order" onClick={() => setCancelMode(true)}>
                                        Hủy đơn
                                    </button>
                                )}
                                {meta?.next && (
                                    <button
                                        className="so-btn-next"
                                        onClick={handleNextStatus}
                                        disabled={confirming}
                                    >
                                        {confirming ? 'Đang xử lý...' : `✓ ${NEXT_LABEL[meta.next]}`}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="so-cancel-block">
                                <textarea
                                    className="so-cancel-input"
                                    rows={2}
                                    placeholder="Lý do hủy đơn (bắt buộc)..."
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                />
                                <div className="so-modal-actions">
                                    <button className="so-btn-close" onClick={() => setCancelMode(false)}>Quay lại</button>
                                    <button className="so-btn-cancel-order" onClick={handleCancel} disabled={confirming}>
                                        {confirming ? 'Đang hủy...' : 'Xác nhận hủy'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    )
}

// ─── Quick Confirm Button ─────────────────────────────────────────────────────
function QuickConfirm({ order, onDone }) {
    const [loading, setLoading] = useState(false)
    const next = STATUS_META[order.status]?.next
    if (!next) return null

    const handleClick = async (e) => {
        e.stopPropagation()
        setLoading(true)
        try {
            await updateSellerOrderStatus(order.id, next)
            onDone()
        } catch {
            alert('Cập nhật thất bại')
        } finally { setLoading(false) }
    }

    return (
        <button className="so-quick-btn confirm" onClick={handleClick} disabled={loading} title={NEXT_LABEL[next]}>
            {loading ? '...' : '✓'}
        </button>
    )
}

// ─── Summary Cards ────────────────────────────────────────────────────────────
function SummaryCards({ orders }) {
    const total    = orders.length
    const pending  = orders.filter(o => o.status === 'PENDING_CONFIRM').length
    const renting  = orders.filter(o => o.status === 'RENTING').length
    const done     = orders.filter(o => o.status === 'COMPLETED').length
    const revenue = orders
        .filter(o => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + Number(o.grandTotal ?? 0), 0)

    const cards = [
        { label: 'Tổng đơn',         value: total,   accent: '#06b6d4' },
        { label: 'Chờ xác nhận',     value: pending, accent: '#f59e0b', highlight: pending > 0 },
        { label: 'Đang thuê',         value: renting, accent: '#4ade80' },
        { label: 'Hoàn thành',        value: done,    accent: '#a78bfa' },
        { label: 'Doanh thu hiển thị', value: revenue >= 1e6
                ? (revenue / 1e6).toFixed(1) + ' tr'
                : revenue.toLocaleString('vi-VN') + 'đ',
            accent: '#7c3aed' },
    ]

    return (
        <div className="so-cards">
            {cards.map((c, i) => (
                <div key={i} className={`so-card ${c.highlight ? 'highlight' : ''}`}
                     style={{ borderColor: c.accent + '44' }}>
                    <span className="so-card-value" style={{ color: c.accent }}>{c.value}</span>
                    <span className="so-card-label">{c.label}</span>
                </div>
            ))}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SellerOrders() {
    const [orders, setOrders]         = useState([])
    const [loading, setLoading]       = useState(true)
    const [statusTab, setStatusTab]   = useState('')
    const [keyword, setKeyword]       = useState('')
    const [keywordInput, setKeywordInput] = useState('')
    const [page, setPage]             = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [total, setTotal]           = useState(0)
    const [detailId, setDetailId]     = useState(null)
    const SIZE = 15

    const fetchOrders = useCallback(() => {
        setLoading(true)
        getSellerOrders({
            page,
            size: SIZE,
            sortBy: 'createdAt',
            sortDir: 'desc',
            status: statusTab || null,
            keyword: keyword || null
        })
            .then(responseData => {
                const list = responseData?.content ?? (Array.isArray(responseData) ? responseData : []);
                setOrders(list);
                setTotalPages(responseData?.totalPages ?? 1);
                setTotal(responseData?.totalElements ?? list.length);
            })
            .catch(err => {
                console.error(err);
                setOrders([]);
            })
            .finally(() => setLoading(false));
    }, [page, statusTab, keyword])

    useEffect(() => { fetchOrders() }, [fetchOrders])

    const handleTabChange = (key) => {
        setStatusTab(key);
        setPage(0);
    }

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setKeyword(keywordInput.trim());
            setPage(0);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [keywordInput]);

    return (
        <div className="so-page">
            {/* Header */}
            <div className="so-header">
                <div>
                    <span className="so-kicker">Gian hàng của tôi</span>
                    <h1 className="so-title">Quản lý đơn hàng</h1>
                    <p className="so-subtitle">Xem danh sách, xác nhận và theo dõi tất cả đơn thuê của bạn.</p>
                </div>
            </div>

            {/* Summary cards */}
            <SummaryCards orders={orders} />

            {/* Search + filter */}
            <div className="so-toolbar">
                <form className="so-search-form" onSubmit={(e) => e.preventDefault()}>
                    <input
                        className="so-search-input"
                        placeholder="Tìm mã đơn, tên, SĐT, email..."
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                    />
                    {keyword && (
                        <button type="button" className="so-search-clear"
                                onClick={() => {
                                    setKeyword('');
                                    setKeywordInput('');
                                    setPage(0)
                                }}>
                            ✕ Xóa
                        </button>
                    )}
                </form>
                <span className="so-total-count">
                    {total} đơn hàng
                </span>
            </div>

            {/* Status tabs */}
            <div className="so-tabs">
                {STATUS_TABS.map(t => (
                    <button
                        key={t.key}
                        className={`so-tab ${statusTab === t.key ? 'active' : ''}`}
                        onClick={() => handleTabChange(t.key)}
                    >
                        {t.label}
                        {t.key === 'PENDING_CONFIRM' && orders.filter(o => o.status === 'PENDING_CONFIRM').length > 0 && (
                            <span className="so-tab-badge">
                                {orders.filter(o => o.status === 'PENDING_CONFIRM').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className="so-loading">Đang tải đơn hàng...</div>
            ) : orders.length === 0 ? (
                <div className="so-empty">
                    <span>📭</span>
                    <p>Không có đơn hàng nào</p>
                </div>
            ) : (
                <>
                    <div className="so-table-wrap">
                        <table className="so-table">
                            <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Khách hàng</th>
                                <th>Sản phẩm</th>
                                <th>Tổng tiền</th>
                                <th>Thanh toán</th>
                                <th>Ngày đặt</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.map(order => {
                                const meta = STATUS_META[order.status] ?? { label: order.status, color: '#94a3b8' }
                                const itemCount = order.items?.length ?? 0
                                const firstName = order.items?.[0]?.productName ?? '—'
                                return (
                                    <tr key={order.id} className="so-row" onClick={() => setDetailId(order.id)}>
                                        <td>
                                            <span className="so-order-code">#{order.orderCode}</span>
                                        </td>
                                        <td>
                                            <div className="so-customer">
                                                <strong>{order.customerName}</strong>
                                                <span>{order.customerPhone}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="so-product-cell">
                                                <span>{firstName}</span>
                                                {itemCount > 1 && (
                                                    <span className="so-more">+{itemCount - 1} sản phẩm</span>
                                                )}
                                            </div>
                                        </td>
                                        <td><strong className="so-price">{fmt(order.orderGrandTotal)}</strong></td>
                                        <td>
                                                <span className="so-payment-method">
                                                    {order.paymentMethod === 'VNPAY' ? '💳 VNPay'
                                                        : order.paymentMethod === 'MOMO' ? '📱 MoMo'
                                                            : order.paymentMethod === 'COD' ? '💵 COD'
                                                                : order.paymentMethod ?? '—'}
                                                </span>
                                        </td>
                                        <td className="so-date">{fmtDate(order.createdAt)}</td>
                                        <td>
                                                <span className="so-status-badge"
                                                      style={{
                                                          background: meta.color + '22',
                                                          color: meta.color,
                                                      }}>
                                                    {meta.label}
                                                </span>
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <div className="so-row-actions">
                                                <button
                                                    className="so-quick-btn detail"
                                                    onClick={() => setDetailId(order.id)}
                                                    title="Xem chi tiết"
                                                >
                                                    👁
                                                </button>
                                                <QuickConfirm order={order} onDone={fetchOrders}/>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="so-pagination">
                            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Trước</button>
                            <span>Trang {page + 1} / {totalPages}</span>
                            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Tiếp →</button>
                        </div>
                    )}
                </>
            )}

            {/* Detail modal */}
            {detailId && (
                <DetailModal
                    orderId={detailId}
                    onClose={() => setDetailId(null)}
                    onStatusChange={() => { setDetailId(null); fetchOrders() }}
                />
            )}
        </div>
    )
}