import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useDemoStore } from '../context/DemoStore'
import { getSellerOrders, updateSellerOrderStatus } from '../api/seller_api'
import '../styles/Schedule.css'

// ─── Constants ───────────────────────────────────────────────────────────────

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const CONDITION_CHECKS = [
  'Không có vết bẩn cứng đầu',
  'Không bị rách hoặc sờn vải',
  'Đầy đủ phụ kiện đi kèm',
  'Không bị phai màu hoặc ố vàng',
  'Khóa / nút / dây đai còn nguyên',
]

const WARRANTY_META = {
  none:     { label: 'Không bảo hành', color: 'wbadge-none' },
  basic:    { label: 'Cơ bản',         color: 'wbadge-basic' },
  standard: { label: 'Tiêu chuẩn',    color: 'wbadge-standard' },
  premium:  { label: 'Cao cấp',        color: 'wbadge-premium' },
}

const STATUS_META = {
  pending:        { label: 'Chờ duyệt',    tone: 'pending' },
  confirmed:      { label: 'Đã xác nhận',  tone: 'confirmed' },
  pickup_soon:    { label: 'Sắp nhận đồ',  tone: 'pickup_soon' },
  active:         { label: 'Đang thuê',    tone: 'active' },
  waiting_return: { label: 'Chờ trả đồ',  tone: 'waiting_return' },
  returned:       { label: 'Đã trả đồ',   tone: 'returned' },
  rejected:       { label: 'Đã từ chối',  tone: 'rejected' },
}

const BACKEND_STATUS_TO_KEY = {
  PENDING_PAYMENT: 'pending',
  PENDING_CONFIRM: 'pending',
  CONFIRMED:       'confirmed',
  RENTING:         'active',
  COMPLETED:       'returned',
  CANCELLED:       'rejected',
}

const FILTER_OPTIONS = [
  { key: 'ALL',            label: 'Tất cả' },
  { key: 'pending',        label: 'Chờ duyệt' },
  { key: 'confirmed',      label: 'Đã xác nhận' },
  { key: 'active',         label: 'Đang thuê' },
  { key: 'waiting_return', label: 'Cần trả đồ' },
  { key: 'returned',       label: 'Đã trả' },
  { key: 'rejected',       label: 'Từ chối' },
]

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseISODate(value) { return new Date(`${value}T00:00:00`) }
function startOfDay(date) { const d = new Date(date); d.setHours(0,0,0,0); return d }
function addDays(date, n)  { const d = new Date(date); d.setDate(d.getDate() + n); return d }
function isSameDay(a, b)   { return startOfDay(a).getTime() === startOfDay(b).getTime() }

function diffCalendarDays(a, b) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000)
}

function formatDateVN(dateLike, options = {}) {
  const date = typeof dateLike === 'string' ? parseISODate(dateLike) : dateLike
  return new Intl.DateTimeFormat('vi-VN', options).format(date)
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date)
}

function getBookingDays(booking) {
  if (booking.days) return booking.days
  return Math.max(1, diffCalendarDays(parseISODate(booking.rentFrom), parseISODate(booking.rentTo)) + 1)
}

function calcSuggestedRefund(warranty, uncheckedCount) {
  if (uncheckedCount === 0) return 100
  const table = {
    none:     [100, 40, 20, 5, 0, 0],
    basic:    [100, 80, 60, 40, 20, 5],
    standard: [100, 90, 75, 60, 40, 20],
    premium:  [100, 100, 90, 80, 70, 50],
  }
  const row = table[warranty] ?? table.none
  return row[Math.min(uncheckedCount, 5)]
}

function deriveStatus(order, today) {
  if (order.statusKey === 'rejected') return 'rejected'
  if (order.statusKey === 'returned') return 'returned'
  if (order.statusKey === 'pending_confirm') return 'pending'

  const startDate = parseISODate(order.rentFrom)
  const endDate   = parseISODate(order.rentTo)

  if (today < startDate) {
    return diffCalendarDays(today, startDate) <= 2 ? 'pickup_soon' : 'confirmed'
  }
  if (today >= endDate) return 'waiting_return'
  return 'active'
}

function normalizeOrder(order, today) {
  const startDate = parseISODate(order.rentFrom)
  const endDate   = parseISODate(order.rentTo)
  const statusKey = deriveStatus(order, today)
  const status    = STATUS_META[statusKey]?.label ?? order.status ?? 'Đơn thuê'
  const days      = getBookingDays(order)

  return {
    ...order,
    startDate,
    endDate,
    statusKey,
    status,
    days,
    shortName:  order.costume?.length > 14 ? `${order.costume.slice(0, 12)}…` : order.costume,
    actionDate: statusKey === 'waiting_return' ? endDate : startDate,
  }
}

function normalizeBackendOrder(order) {
  const item = order.items?.[0] ?? {}
  return {
    id:           order.id,
    orderCode:    order.orderCode,
    backendStatus: order.status,
    statusKey:    BACKEND_STATUS_TO_KEY[order.status] ?? 'confirmed',
    costume:      item.productName || order.orderCode,
    customer:     order.customerName || 'Khách hàng',
    phone:        order.customerPhone || '—',
    email:        order.customerEmail || '—',
    address:      order.shippingAddress || '—',
    rentFrom:     order.rentFrom,
    rentTo:       order.rentTo,
    days:         item.days,
    deposit:      Number(order.sellerDepositTotal ?? order.orderDepositTotal ?? order.depositTotal ?? 0),
    grandTotal:   Number(order.grandTotal ?? 0),
    warranty:     'none',
    paymentMethod: order.paymentMethod,
  }
}

function intersectsMonth(booking, monthDate) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const monthEnd   = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  return booking.startDate <= monthEnd && booking.endDate >= monthStart
}

function pickFocusMonth(bookings, today) {
  const cur = new Date(today.getFullYear(), today.getMonth(), 1)
  if (bookings.some(b => intersectsMonth(b, cur))) return cur
  const sorted = [...bookings].sort((a, b) => a.startDate - b.startDate)
  if (!sorted.length) return cur
  return new Date(sorted[0].startDate.getFullYear(), sorted[0].startDate.getMonth(), 1)
}

function buildCalendarDays(bookings, monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7
  const startCellDate = addDays(firstDay, -leading)

  return Array.from({ length: totalCells }, (_, i) => {
    const date = addDays(startCellDate, i)
    const pickups = bookings.filter(b => isSameDay(b.startDate, date))
    const returns = bookings.filter(b => isSameDay(b.endDate, date))
    return {
      key: date.toISOString(),
      date,
      day: date.getDate(),
      muted: date.getMonth() !== month,
      pickups,
      returns,
      hasEvent: pickups.length > 0 || returns.length > 0,
    }
  })
}

function getReturnPriority(days) {
  if (days < 0) return 'Quá hạn'
  if (days === 0) return 'Hôm nay'
  if (days === 1) return 'Ngày mai'
  return `${days} ngày nữa`
}

function fmtMoney(v) { return Number(v || 0).toLocaleString('vi-VN') }

// ─── Sub-components ──────────────────────────────────────────────────────────

function CalendarDay({ item, onDayClick }) {
  const cls = ['calendar-day', item.muted ? 'muted' : '', item.hasEvent ? 'has-event' : ''].filter(Boolean).join(' ')
  return (
      <button type="button" className={cls} onClick={() => item.hasEvent && onDayClick(item)}>
        <span className="calendar-date">{item.day}</span>
        {item.hasEvent && (
            <div className="calendar-events">
              {item.pickups.length > 0 && <span className="cal-tag cal-tag-pickup">Nhận {item.pickups.length}</span>}
              {item.returns.length > 0 && <span className="cal-tag cal-tag-return">Trả {item.returns.length}</span>}
            </div>
        )}
      </button>
  )
}

function RentalTimeline({ bookings, monthDate }) {
  const items = bookings.filter(b => intersectsMonth(b, monthDate) && b.statusKey !== 'rejected')
  if (!items.length) return null

  const monthStart  = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const marks = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(d => d === 1 || d % 5 === 0 || d === daysInMonth)
  const pct = i => `${(i / daysInMonth) * 100}%`

  return (
      <div className="rental-timeline">
        <div className="timeline-head">
          <h3 className="section-title-sm">Dòng thời gian thuê</h3>
          <span>{formatMonthYear(monthDate)}</span>
        </div>
        <div className="tl-row tl-header-row">
          <span className="tl-label">Trang phục</span>
          <div className="tl-track tl-track-header">
            {marks.map(d => <span key={d} className="tl-day-mark" style={{ left: pct(d - 1) }}>{d}</span>)}
          </div>
        </div>
        {items.map(b => {
          const start = Math.max(0, diffCalendarDays(monthStart, b.startDate))
          const end   = Math.min(daysInMonth - 1, diffCalendarDays(monthStart, b.endDate))
          const width = Math.max(1, end - start + 1)
          return (
              <div key={b.id} className="tl-row">
                <span className="tl-label" title={`${b.costume} · ${b.customer}`}>{b.shortName}</span>
                <div className="tl-track">
                  <div
                      className={`tl-bar tl-bar-${b.statusKey}`}
                      style={{ left: pct(start), width: pct(width) }}
                      title={`${b.costume}: ${formatDateVN(b.startDate)} → ${formatDateVN(b.endDate)}`}
                  >
                    <span className="tl-bar-name">{b.costume}</span>
                  </div>
                </div>
              </div>
          )
        })}
      </div>
  )
}

function DayDetailPanel({ day, onClose }) {
  const total = day.pickups.length + day.returns.length
  return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="day-detail-box" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2 className="modal-title">{formatDateVN(day.date, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</h2>
              <p className="modal-sub">{total} hoạt động trong ngày</p>
            </div>
            <button type="button" className="modal-close" onClick={onClose}>×</button>
          </div>
          {day.pickups.length > 0 && (
              <div className="day-detail-section">
                <h3 className="day-detail-section-title pickup-title">Nhận đồ</h3>
                {day.pickups.map(b => (
                    <div key={`pickup-${b.id}`} className="day-detail-row">
                      <div className="day-detail-info">
                        <strong>{b.costume}</strong>
                        <span>{b.customer} · {b.id}</span>
                      </div>
                      <div className="day-detail-meta">
                        <span>{b.phone}</span>
                        <span>{b.status}</span>
                      </div>
                    </div>
                ))}
              </div>
          )}
          {day.returns.length > 0 && (
              <div className="day-detail-section">
                <h3 className="day-detail-section-title return-title">Trả đồ</h3>
                {day.returns.map(b => (
                    <div key={`return-${b.id}`} className="day-detail-row">
                      <div className="day-detail-info">
                        <strong>{b.costume}</strong>
                        <span>{b.customer} · {b.id}</span>
                      </div>
                      <div className="day-detail-meta">
                        <span>{b.phone}</span>
                        <span>{b.status}</span>
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  )
}

function ReturnModal({ booking, onClose, onConfirm }) {
  const [checks, setChecks] = useState(Object.fromEntries(CONDITION_CHECKS.map(l => [l, false])))
  const [damage, setDamage] = useState('')

  const uncheckedCount = Object.values(checks).filter(v => !v).length
  const suggestedPct   = calcSuggestedRefund(booking.warranty, uncheckedCount)
  const refundAmount   = Math.round((booking.deposit ?? 0) * suggestedPct / 100)
  const keepAmount     = (booking.deposit ?? 0) - refundAmount
  const warrantyInfo   = WARRANTY_META[booking.warranty] ?? WARRANTY_META.none

  return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2 className="modal-title">Kiểm tra tình trạng trả đồ</h2>
              <p className="modal-sub">{booking.costume} · {booking.customer} · #{booking.id}</p>
            </div>
            <button type="button" className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-warranty-row">
            <span className="modal-warranty-label">Gói bảo hành:</span>
            <span className={`warranty-badge ${warrantyInfo.color}`}>{warrantyInfo.label}</span>
          </div>

          <div className="modal-section">
            <h3 className="modal-section-title">Checklist tình trạng</h3>
            <div className="condition-list">
              {CONDITION_CHECKS.map(label => (
                  <label key={label} className="condition-item">
                    <input
                        type="checkbox"
                        checked={checks[label]}
                        onChange={() => setChecks(prev => ({ ...prev, [label]: !prev[label] }))}
                    />
                    <span className={checks[label] ? 'cond-ok' : ''}>{label}</span>
                  </label>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <h3 className="modal-section-title">Ghi chú hư hỏng</h3>
            <textarea
                className="damage-note"
                rows="3"
                placeholder="Mô tả thêm nếu có hư hỏng, thiếu phụ kiện hoặc cần giữ lại một phần tiền cọc."
                value={damage}
                onChange={e => setDamage(e.target.value)}
            />
          </div>

          <div className="modal-section">
            <h3 className="modal-section-title">
              Đề xuất hoàn cọc
              <span className="deposit-badge">{fmtMoney(booking.deposit)}đ</span>
            </h3>
            <div className="refund-result">
              <div className="refund-result-pct">
                <span className="refund-pct-value">{suggestedPct}%</span>
                <span className="refund-pct-label">đề xuất hoàn cọc</span>
              </div>
              <div className="refund-result-amounts">
                <div className="refund-amount-row refund-green">
                  <span>Hoàn khách</span>
                  <strong>{fmtMoney(refundAmount)}đ</strong>
                </div>
                <div className="refund-amount-row refund-red">
                  <span>Giữ lại</span>
                  <strong>{fmtMoney(keepAmount)}đ</strong>
                </div>
              </div>
            </div>

            {uncheckedCount === 0 && <p className="modal-hint-ok">Trang phục nguyên vẹn, hoàn 100% cọc.</p>}
            {uncheckedCount > 0 && booking.warranty === 'none' && (
                <p className="modal-warning">Khách không mua bảo hành, mức giữ cọc nên bám theo thiệt hại thực tế.</p>
            )}
            {uncheckedCount > 0 && booking.warranty !== 'none' && (
                <p className="modal-hint-warranty">
                  Gói <strong>{warrantyInfo.label}</strong> giúp tăng tỷ lệ hoàn cọc cho khách nếu hư hỏng ở mức nhẹ.
                </p>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>Hủy</button>
            <button
                type="button"
                className="btn-modal-confirm"
                onClick={() => onConfirm({ refundAmount, suggestedPct, damage })}
            >
              Xác nhận trả đồ
            </button>
          </div>
        </div>
      </div>
  )
}

function OrderDetailModal({ booking, onClose }) {
  const meta = STATUS_META[booking.statusKey] ?? STATUS_META.confirmed
  return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="order-detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2 className="modal-title">Chi tiết đơn thuê</h2>
              <p className="modal-sub">#{booking.orderCode || booking.id}</p>
            </div>
            <button type="button" className="modal-close" onClick={onClose}>×</button>
          </div>

          <div style={{ marginTop: 14, marginBottom: 6 }}>
            <span className={`booking-status status-${meta.tone}`}>{meta.label}</span>
          </div>

          <div className="order-detail-grid">
            <div className="order-detail-field">
              <span>Trang phục</span>
              <strong>{booking.costume}</strong>
            </div>
            <div className="order-detail-field">
              <span>Khách hàng</span>
              <strong>{booking.customer}</strong>
            </div>
            <div className="order-detail-field">
              <span>Điện thoại</span>
              <strong>{booking.phone}</strong>
            </div>
            <div className="order-detail-field">
              <span>Email</span>
              <strong>{booking.email || '—'}</strong>
            </div>
            <div className="order-detail-field">
              <span>Ngày nhận</span>
              <strong>{booking.rentFrom ? formatDateVN(booking.startDate) : '—'}</strong>
            </div>
            <div className="order-detail-field">
              <span>Ngày trả</span>
              <strong>{booking.rentTo ? formatDateVN(booking.endDate) : '—'}</strong>
            </div>
            <div className="order-detail-field">
              <span>Số ngày thuê</span>
              <strong>{booking.days} ngày</strong>
            </div>
            <div className="order-detail-field">
              <span>Tiền cọc</span>
              <strong style={{ color: 'var(--color-gold)' }}>{fmtMoney(booking.deposit)}đ</strong>
            </div>
            {booking.grandTotal > 0 && (
                <div className="order-detail-field">
                  <span>Tổng đơn</span>
                  <strong>{fmtMoney(booking.grandTotal)}đ</strong>
                </div>
            )}
            {booking.paymentMethod && (
                <div className="order-detail-field">
                  <span>Phương thức TT</span>
                  <strong>{booking.paymentMethod}</strong>
                </div>
            )}
            {booking.address && booking.address !== '—' && (
                <div className="order-detail-field field-full">
                  <span>Địa chỉ giao hàng</span>
                  <strong>{booking.address}</strong>
                </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
  )
}

function Toast({ message, onDone }) {
  return <div className="schedule-toast" onAnimationEnd={onDone}>{message}</div>
}

function BookingRow({ booking, onApprove, onReject, onOpenReturn, onViewDetail }) {
  const meta = STATUS_META[booking.statusKey] ?? STATUS_META.confirmed
  return (
      <article className="booking-row">
        <div className="booking-row-main">
          <div>
            <h3 className="booking-title">{booking.costume}</h3>
            <p className="booking-sub">{booking.customer} · #{booking.id}</p>
          </div>
          <span className={`booking-status status-${meta.tone}`}>{meta.label}</span>
        </div>

        <div className="booking-meta">
          <span>📅 {formatDateVN(booking.startDate)} → {formatDateVN(booking.endDate)}</span>
          <span>⏳ {booking.days} ngày</span>
          <span>📞 {booking.phone}</span>
        </div>

        <div className="booking-actions">
          {booking.statusKey === 'pending' && (
              <>
                <button type="button" className="btn-approve" onClick={() => onApprove(booking.id)}>Duyệt đơn</button>
                <button type="button" className="btn-reject"  onClick={() => onReject(booking.id)}>Từ chối</button>
              </>
          )}
          {booking.statusKey === 'pickup_soon'    && <span className="action-note">Sắp nhận vào {formatDateVN(booking.startDate)}</span>}
          {booking.statusKey === 'confirmed'      && <span className="action-note">Đơn đã chốt lịch, chờ đến ngày nhận đồ.</span>}
          {booking.statusKey === 'active'         && <span className="action-note">Đơn đang trong kỳ thuê.</span>}
          {booking.statusKey === 'waiting_return' && (
              <button type="button" className="btn-return-check" onClick={() => onOpenReturn(booking)}>
                Kiểm tra và xác nhận trả đồ
              </button>
          )}
          {booking.statusKey === 'returned'  && <span className="returned-label">Đã hoàn tất trả đồ</span>}

          {onViewDetail && (
              <button type="button" className="btn-approve" style={{ marginLeft: 'auto' }} onClick={() => onViewDetail(booking)}>
                Chi tiết
              </button>
          )}
        </div>
      </article>
  )
}

// ─── Full list card ──────────────────────────────────────────────────────────

function OrderFullCard({ booking, onApprove, onReject, onOpenReturn, onViewDetail }) {
  const meta = STATUS_META[booking.statusKey] ?? STATUS_META.confirmed
  return (
      <article className="order-full-card">
        <div className="order-full-card-head">
          <div>
            <div className="order-full-card-title">{booking.costume}</div>
            <div className="order-full-card-code">#{booking.orderCode || booking.id}</div>
          </div>
          <span className={`booking-status status-${meta.tone}`}>{meta.label}</span>
        </div>

        <div className="order-full-card-meta">
          <span className="order-meta-chip">👤 {booking.customer}</span>
          <span className="order-meta-chip">📞 {booking.phone}</span>
          <span className="order-meta-chip">📅 {formatDateVN(booking.startDate)} – {formatDateVN(booking.endDate)}</span>
          <span className="order-meta-chip">⏳ {booking.days} ngày</span>
          {booking.deposit > 0 && (
              <span className="order-meta-chip" style={{ color: 'var(--color-gold)' }}>
            💰 Cọc {fmtMoney(booking.deposit)}đ
          </span>
          )}
        </div>

        <div className="order-full-card-actions">
          {booking.statusKey === 'pending' && (
              <>
                <button type="button" className="btn-approve" onClick={() => onApprove(booking.id)}>✓ Duyệt đơn</button>
                <button type="button" className="btn-reject"  onClick={() => onReject(booking.id)}>✕ Từ chối</button>
              </>
          )}
          {booking.statusKey === 'pickup_soon'    && <span className="action-note">📦 Sắp nhận vào {formatDateVN(booking.startDate)}</span>}
          {booking.statusKey === 'confirmed'      && <span className="action-note">✅ Đơn đã chốt lịch, chờ đến ngày nhận đồ.</span>}
          {booking.statusKey === 'active'         && <span className="action-note">🔵 Đơn đang trong kỳ thuê.</span>}
          {booking.statusKey === 'waiting_return' && (
              <button type="button" className="btn-return-check" onClick={() => onOpenReturn(booking)}>
                🔍 Kiểm tra & xác nhận trả đồ
              </button>
          )}
          {booking.statusKey === 'returned'  && <span className="returned-label">✓ Đã hoàn tất trả đồ</span>}
          {booking.statusKey === 'rejected'  && <span style={{ color: '#fca5a5', fontSize: 12 }}>✕ Đã từ chối</span>}

          <button
              type="button"
              className="btn-approve"
              style={{ marginLeft: 'auto' }}
              onClick={() => onViewDetail(booking)}
          >
            Chi tiết
          </button>
        </div>
      </article>
  )
}

// ─── Main Schedule component ─────────────────────────────────────────────────

function Schedule() {
  const { orders, approveOrder, rejectOrder, completeOrderReturn } = useDemoStore()
  const location = useLocation()
  const sellerMode = location.pathname.startsWith('/seller')

  const [sellerOrders, setSellerOrders] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [activeModal, setActiveModal]   = useState(null)   // booking for return confirm
  const [selectedDay, setSelectedDay]   = useState(null)   // calendar day detail
  const [viewDetail, setViewDetail]     = useState(null)   // booking for detail modal
  const [toast, setToast]         = useState(null)
  const [activeTab, setActiveTab] = useState('calendar')   // 'calendar' | 'list'
  const [searchQ, setSearchQ]     = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const today = useMemo(() => startOfDay(new Date()), [])

  // ── Load data ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!sellerMode) return
    let ignore = false
    setLoading(true)
    setError('')
    getSellerOrders()
        .then(data => {
          if (!ignore) setSellerOrders((Array.isArray(data) ? data : []).map(normalizeBackendOrder))
        })
        .catch(err => {
          if (!ignore) setError(err?.message || 'Không tải được lịch đơn người bán')
        })
        .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [sellerMode])

  const sourceOrders = sellerMode ? (sellerOrders ?? []) : orders

  const normalizedBookings = useMemo(
      () => sourceOrders.map(o => normalizeOrder(o, today)).sort((a, b) => a.actionDate - b.actionDate),
      [sourceOrders, today]
  )

  const activeBookings = normalizedBookings.filter(b => b.statusKey !== 'rejected')

  const focusMonth  = useMemo(() => pickFocusMonth(activeBookings, today), [activeBookings, today])
  const calendarDays = useMemo(() => buildCalendarDays(activeBookings, focusMonth), [activeBookings, focusMonth])

  const pendingBookings         = normalizedBookings.filter(b => b.statusKey === 'pending')
  const todayBookings           = activeBookings.filter(b => isSameDay(b.startDate, today) || isSameDay(b.endDate, today))
  const returnsNeedingAttention = activeBookings.filter(b => b.statusKey === 'waiting_return').sort((a, b) => a.endDate - b.endDate)
  const upcomingBookings        = activeBookings.filter(b => b.statusKey !== 'returned').sort((a, b) => a.startDate - b.startDate).slice(0, 8)

  const stats = {
    today:        todayBookings.length,
    active:       activeBookings.filter(b => b.statusKey === 'active').length,
    pending:      pendingBookings.length,
    waitingReturn: returnsNeedingAttention.length,
  }

  // ── Filtered list (for list tab) ────────────────────────────────────────────

  const filteredList = useMemo(() => {
    let list = normalizedBookings
    if (statusFilter !== 'ALL') list = list.filter(b => b.statusKey === statusFilter)
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase()
      list = list.filter(b =>
          b.costume?.toLowerCase().includes(q) ||
          b.customer?.toLowerCase().includes(q) ||
          b.phone?.includes(q) ||
          String(b.orderCode || b.id).toLowerCase().includes(q)
      )
    }
    return list
  }, [normalizedBookings, statusFilter, searchQ])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleApprove = async (orderId) => {
    if (sellerMode) {
      try {
        const saved = await updateSellerOrderStatus(orderId, 'CONFIRMED')
        setSellerOrders(prev => prev.map(o => o.id === orderId ? normalizeBackendOrder(saved) : o))
        showToast('✅ Đã duyệt đơn và đưa vào lịch thuê.')
      } catch (err) { showToast(err?.message || 'Không duyệt được đơn') }
      return
    }
    approveOrder(orderId)
    showToast('Đã duyệt đơn và đưa vào lịch thuê.')
  }

  const handleReject = async (orderId) => {
    if (sellerMode) {
      try {
        const saved = await updateSellerOrderStatus(orderId, 'CANCELLED')
        setSellerOrders(prev => prev.map(o => o.id === orderId ? normalizeBackendOrder(saved) : o))
        showToast('Đã từ chối đơn thuê.')
      } catch (err) { showToast(err?.message || 'Không từ chối được đơn') }
      return
    }
    rejectOrder(orderId)
    showToast('Đã từ chối đơn thuê.')
  }

  const handleConfirmReturn = async ({ refundAmount }) => {
    if (sellerMode) {
      try {
        const saved = await updateSellerOrderStatus(activeModal.id, 'COMPLETED')
        setSellerOrders(prev => prev.map(o => o.id === activeModal.id ? normalizeBackendOrder(saved) : o))
        setActiveModal(null)
        showToast(`✅ Đã xác nhận trả đồ – Hoàn ${fmtMoney(refundAmount)}đ`)
      } catch (err) { showToast(err?.message || 'Không cập nhật được đơn') }
      return
    }
    completeOrderReturn(activeModal.id)
    setActiveModal(null)
    showToast(`Đã xác nhận trả đồ · Hoàn ${fmtMoney(refundAmount)}đ`)
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
      <div className="schedule-page">
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}

        {/* ── Hero ── */}
        <section className="schedule-hero">
          <div className="hero-copy">
            <span className="page-kicker">Quản lý lịch thuê</span>
            <h1 className="page-title">Lịch vận hành người cho thuê</h1>
            <p className="page-subtitle">
              Theo dõi đơn mới, lịch nhận đồ, trạng thái đang thuê và các đơn cần hoàn cọc trong cùng một màn hình.
            </p>
          </div>

          <div className="schedule-hero-stats">
            <div className="hero-stat-card">
              <span className="hero-stat-value">{stats.today}</span>
              <span className="hero-stat-label">Việc hôm nay</span>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-value">{stats.pending}</span>
              <span className="hero-stat-label">Chờ duyệt</span>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-value">{stats.active}</span>
              <span className="hero-stat-label">Đang thuê</span>
            </div>
            <div className="hero-stat-card warning">
              <span className="hero-stat-value">{stats.waitingReturn}</span>
              <span className="hero-stat-label">Cần trả đồ</span>
            </div>
          </div>
        </section>

        {/* Loading / error */}
        {sellerMode && loading && <div className="schedule-card compact-card">⏳ Đang tải lịch đơn…</div>}
        {sellerMode && error   && <div className="schedule-card compact-card" style={{ color: '#fca5a5' }}>⚠ {error}</div>}

        {/* ── Tab switcher ── */}
        <div className="schedule-tab-bar">
          <button
              className={`schedule-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
          >
            📅 Lịch tổng quan
            <span className="schedule-tab-badge">{activeBookings.length}</span>
          </button>
          <button
              className={`schedule-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
          >
            📋 Danh sách đơn
            <span className="schedule-tab-badge">{normalizedBookings.length}</span>
          </button>
        </div>

        {/* ── TAB: Calendar ── */}
        {activeTab === 'calendar' && (
            <section className="schedule-grid">
              <div className="schedule-card calendar-card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">Lịch tổng quan</h2>
                    <p className="card-desc">{formatMonthYear(focusMonth)} · Bấm vào ngày có sự kiện để xem chi tiết</p>
                  </div>
                  <div className="calendar-legend">
                    <span><i className="legend-dot has-event-dot" />Có lịch nhận hoặc trả</span>
                    <span><i className="legend-dot pickup-dot" />Nhận đồ</span>
                    <span><i className="legend-dot return-dot" />Trả đồ</span>
                  </div>
                </div>

                <div className="calendar-weekdays">
                  {WEEK_DAYS.map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="calendar-grid">
                  {calendarDays.map(d => <CalendarDay key={d.key} item={d} onDayClick={setSelectedDay} />)}
                </div>

                <RentalTimeline bookings={activeBookings} monthDate={focusMonth} />
              </div>

              <aside className="schedule-sidebar">
                {/* Cần xử lý ngay */}
                <div className="schedule-card compact-card attention-card">
                  <div className="card-head compact-head">
                    <div>
                      <h2 className="card-title">Cần xử lý ngay</h2>
                      <p className="card-desc">Ưu tiên các đơn mới và đơn đến hạn trả</p>
                    </div>
                  </div>
                  <div className="attention-list">
                    {pendingBookings.length === 0 && returnsNeedingAttention.length === 0 && (
                        <div className="empty-mini-state">Hiện chưa có việc gấp nào cần xử lý.</div>
                    )}
                    {pendingBookings.map(b => (
                        <BookingRow key={b.id} booking={b} onApprove={handleApprove} onReject={handleReject} onOpenReturn={setActiveModal} onViewDetail={setViewDetail} />
                    ))}
                    {returnsNeedingAttention.map(b => (
                        <BookingRow key={b.id} booking={b} onApprove={handleApprove} onReject={handleReject} onOpenReturn={setActiveModal} onViewDetail={setViewDetail} />
                    ))}
                  </div>
                </div>

                {/* Lịch sắp tới */}
                <div className="schedule-card compact-card">
                  <div className="card-head compact-head">
                    <div>
                      <h2 className="card-title">Lịch sắp tới</h2>
                      <p className="card-desc">Những đơn đã vào guồng trong thời gian gần nhất</p>
                    </div>
                  </div>
                  <div className="booking-list">
                    {upcomingBookings.length === 0 && <div className="empty-mini-state">Chưa có đơn nào trong lịch thuê.</div>}
                    {upcomingBookings.map(b => (
                        <BookingRow key={b.id} booking={b} onApprove={handleApprove} onReject={handleReject} onOpenReturn={setActiveModal} onViewDetail={setViewDetail} />
                    ))}
                  </div>
                </div>

                {/* Nhắc trả đồ */}
                <div className="schedule-card compact-card highlight-card">
                  <div className="card-head compact-head">
                    <div>
                      <h2 className="card-title">Nhắc trả đồ</h2>
                      <p className="card-desc">Danh sách khách cần theo dõi sát ngày trả</p>
                    </div>
                  </div>
                  <div className="return-list">
                    {returnsNeedingAttention.slice(0, 4).map(b => {
                      const daysUntilReturn = diffCalendarDays(today, b.endDate)
                      return (
                          <div className="return-item" key={`ret-${b.id}`}>
                            <div>
                              <h3>{b.costume}</h3>
                              <p>{b.customer} · {b.phone}</p>
                            </div>
                            <div className="return-meta">
                              <span>{formatDateVN(b.endDate)}</span>
                              <strong>{getReturnPriority(daysUntilReturn)}</strong>
                            </div>
                          </div>
                      )
                    })}
                    {returnsNeedingAttention.length === 0 && (
                        <div className="empty-mini-state">Không có đơn nào sắp trả trong lúc này.</div>
                    )}
                  </div>
                </div>
              </aside>
            </section>
        )}

        {/* ── TAB: List ── */}
        {activeTab === 'list' && (
            <div>
              {/* Search & filter */}
              <div className="schedule-search-bar">
                <input
                    type="text"
                    className="schedule-search-input"
                    placeholder="🔍  Tìm theo tên trang phục, khách hàng, mã đơn, số điện thoại…"
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                />
                {FILTER_OPTIONS.map(f => (
                    <button
                        key={f.key}
                        className={`sched-filter-btn ${statusFilter === f.key ? 'active' : ''}`}
                        onClick={() => setStatusFilter(f.key)}
                    >
                      {f.label}
                      {f.key !== 'ALL' && (
                          <span style={{ marginLeft: 4, opacity: 0.7 }}>
                    ({normalizedBookings.filter(b => b.statusKey === f.key).length})
                  </span>
                      )}
                    </button>
                ))}
              </div>

              {/* List */}
              {loading ? (
                  <div className="schedule-list-loading">⏳ Đang tải danh sách đơn thuê…</div>
              ) : filteredList.length === 0 ? (
                  <div className="schedule-list-empty">
                    <span>📋</span>
                    <p>Không có đơn nào{searchQ ? ` khớp với "${searchQ}"` : ''}{statusFilter !== 'ALL' ? ` trong trạng thái này` : ''}.</p>
                  </div>
              ) : (
                  <div className="schedule-list-view">
                    {filteredList.map(b => (
                        <OrderFullCard
                            key={b.id}
                            booking={b}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onOpenReturn={setActiveModal}
                            onViewDetail={setViewDetail}
                        />
                    ))}
                  </div>
              )}
            </div>
        )}

        {/* ── Modals ── */}
        {activeModal && (
            <ReturnModal
                booking={activeModal}
                onClose={() => setActiveModal(null)}
                onConfirm={handleConfirmReturn}
            />
        )}

        {selectedDay && (
            <DayDetailPanel
                day={selectedDay}
                onClose={() => setSelectedDay(null)}
            />
        )}

        {viewDetail && (
            <OrderDetailModal
                booking={viewDetail}
                onClose={() => setViewDetail(null)}
            />
        )}
      </div>
  )
}

export default Schedule
