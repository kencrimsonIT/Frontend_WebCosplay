import { useMemo, useState } from 'react'
import { useDemoStore } from '../context/DemoStore'
import '../styles/Schedule.css'

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const CONDITION_CHECKS = [
  'Không có vết bẩn cứng đầu',
  'Không bị rách hoặc sờn vải',
  'Đầy đủ phụ kiện đi kèm',
  'Không bị phai màu hoặc ố vàng',
  'Khóa / nút / dây đai còn nguyên',
]

const WARRANTY_META = {
  none: { label: 'Không bảo hành', color: 'wbadge-none' },
  basic: { label: 'Cơ bản', color: 'wbadge-basic' },
  standard: { label: 'Tiêu chuẩn', color: 'wbadge-standard' },
  premium: { label: 'Cao cấp', color: 'wbadge-premium' },
}

const STATUS_META = {
  pending: { label: 'Chờ duyệt', tone: 'pending' },
  confirmed: { label: 'Đã xác nhận', tone: 'confirmed' },
  pickup_soon: { label: 'Sắp nhận đồ', tone: 'pickup_soon' },
  active: { label: 'Đang thuê', tone: 'active' },
  waiting_return: { label: 'Chờ trả đồ', tone: 'waiting_return' },
  returned: { label: 'Đã trả đồ', tone: 'returned' },
  rejected: { label: 'Đã từ chối', tone: 'rejected' },
}

function parseISODate(value) {
  return new Date(`${value}T00:00:00`)
}

function startOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

function diffCalendarDays(a, b) {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime()
  return Math.round(ms / 86400000)
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
    none: [100, 40, 20, 5, 0, 0],
    basic: [100, 80, 60, 40, 20, 5],
    standard: [100, 90, 75, 60, 40, 20],
    premium: [100, 100, 90, 80, 70, 50],
  }

  const row = table[warranty] ?? table.none
  return row[Math.min(uncheckedCount, 5)]
}

function deriveStatus(order, today) {
  if (order.statusKey === 'rejected') return 'rejected'
  if (order.statusKey === 'returned') return 'returned'
  if (order.statusKey === 'pending_confirm') return 'pending'

  const startDate = parseISODate(order.rentFrom)
  const endDate = parseISODate(order.rentTo)

  if (today < startDate) {
    const daysUntilPickup = diffCalendarDays(today, startDate)
    return daysUntilPickup <= 2 ? 'pickup_soon' : 'confirmed'
  }

  if (today >= endDate) return 'waiting_return'
  return 'active'
}

function normalizeOrder(order, today) {
  const startDate = parseISODate(order.rentFrom)
  const endDate = parseISODate(order.rentTo)
  const statusKey = deriveStatus(order, today)
  const status = STATUS_META[statusKey]?.label ?? order.status ?? 'Đơn thuê'
  const days = getBookingDays(order)

  return {
    ...order,
    startDate,
    endDate,
    statusKey,
    status,
    days,
    shortName: order.costume?.length > 14 ? `${order.costume.slice(0, 12)}…` : order.costume,
    actionDate: statusKey === 'waiting_return' ? endDate : startDate,
  }
}

function intersectsMonth(booking, monthDate) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  return booking.startDate <= monthEnd && booking.endDate >= monthStart
}

function pickFocusMonth(bookings, today) {
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const currentMonthBookings = bookings.filter(booking => intersectsMonth(booking, currentMonth))
  if (currentMonthBookings.length > 0) return currentMonth

  const sorted = [...bookings].sort((a, b) => a.startDate - b.startDate)
  if (sorted.length === 0) return currentMonth

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

  return Array.from({ length: totalCells }, (_, index) => {
    const date = addDays(startCellDate, index)
    const pickups = bookings.filter(booking => isSameDay(booking.startDate, date))
    const returns = bookings.filter(booking => isSameDay(booking.endDate, date))

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

function getReturnPriority(daysUntilReturn) {
  if (daysUntilReturn < 0) return 'Quá hạn'
  if (daysUntilReturn === 0) return 'Hôm nay'
  if (daysUntilReturn === 1) return 'Ngày mai'
  return `${daysUntilReturn} ngày nữa`
}

function CalendarDay({ item, onDayClick }) {
  const className = [
    'calendar-day',
    item.muted ? 'muted' : '',
    item.hasEvent ? 'has-event' : '',
  ].filter(Boolean).join(' ')

  return (
    <button type="button" className={className} onClick={() => item.hasEvent && onDayClick(item)}>
      <span className="calendar-date">{item.day}</span>
      {item.hasEvent && (
        <div className="calendar-events">
          {item.pickups.length > 0 && (
            <span className="cal-tag cal-tag-pickup">Nhận {item.pickups.length}</span>
          )}
          {item.returns.length > 0 && (
            <span className="cal-tag cal-tag-return">Trả {item.returns.length}</span>
          )}
        </div>
      )}
    </button>
  )
}

function RentalTimeline({ bookings, monthDate }) {
  const items = bookings.filter(booking => intersectsMonth(booking, monthDate) && booking.statusKey !== 'rejected')
  if (!items.length) return null

  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const marks = Array.from({ length: daysInMonth }, (_, index) => index + 1).filter(day => day === 1 || day % 5 === 0 || day === daysInMonth)

  const pct = (dayIndex) => `${(dayIndex / daysInMonth) * 100}%`

  return (
    <div className="rental-timeline">
      <div className="timeline-head">
        <h3 className="section-title-sm">Dòng thời gian thuê</h3>
        <span>{formatMonthYear(monthDate)}</span>
      </div>

      <div className="tl-row tl-header-row">
        <span className="tl-label">Trang phục</span>
        <div className="tl-track tl-track-header">
          {marks.map(day => (
            <span key={day} className="tl-day-mark" style={{ left: pct(day - 1) }}>{day}</span>
          ))}
        </div>
      </div>

      {items.map(booking => {
        const start = Math.max(0, diffCalendarDays(monthStart, booking.startDate))
        const end = Math.min(daysInMonth - 1, diffCalendarDays(monthStart, booking.endDate))
        const width = Math.max(1, end - start + 1)

        return (
          <div key={booking.id} className="tl-row">
            <span className="tl-label" title={`${booking.costume} · ${booking.customer}`}>{booking.shortName}</span>
            <div className="tl-track">
              <div
                className={`tl-bar tl-bar-${booking.statusKey}`}
                style={{ left: pct(start), width: pct(width) }}
                title={`${booking.costume}: ${formatDateVN(booking.startDate)} → ${formatDateVN(booking.endDate)}`}
              >
                <span className="tl-bar-name">{booking.costume}</span>
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
      <div className="day-detail-box" onClick={event => event.stopPropagation()}>
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
            {day.pickups.map(booking => (
              <div key={`pickup-${booking.id}`} className="day-detail-row">
                <div className="day-detail-info">
                  <strong>{booking.costume}</strong>
                  <span>{booking.customer} · {booking.id}</span>
                </div>
                <div className="day-detail-meta">
                  <span>{booking.phone}</span>
                  <span>{booking.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {day.returns.length > 0 && (
          <div className="day-detail-section">
            <h3 className="day-detail-section-title return-title">Trả đồ</h3>
            {day.returns.map(booking => (
              <div key={`return-${booking.id}`} className="day-detail-row">
                <div className="day-detail-info">
                  <strong>{booking.costume}</strong>
                  <span>{booking.customer} · {booking.id}</span>
                </div>
                <div className="day-detail-meta">
                  <span>{booking.phone}</span>
                  <span>{booking.status}</span>
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
  const [checks, setChecks] = useState(
    Object.fromEntries(CONDITION_CHECKS.map(label => [label, false]))
  )
  const [damage, setDamage] = useState('')

  const uncheckedCount = Object.values(checks).filter(value => !value).length
  const suggestedPct = calcSuggestedRefund(booking.warranty, uncheckedCount)
  const refundAmount = Math.round((booking.deposit ?? 0) * suggestedPct / 100)
  const keepAmount = (booking.deposit ?? 0) - refundAmount
  const warrantyInfo = WARRANTY_META[booking.warranty] ?? WARRANTY_META.none

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Kiểm tra tình trạng trả đồ</h2>
            <p className="modal-sub">{booking.costume} · {booking.customer} · {booking.id}</p>
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
            onChange={event => setDamage(event.target.value)}
          />
        </div>

        <div className="modal-section">
          <h3 className="modal-section-title">
            Đề xuất hoàn cọc
            <span className="deposit-badge">{(booking.deposit ?? 0).toLocaleString('vi-VN')}đ</span>
          </h3>

          <div className="refund-result">
            <div className="refund-result-pct">
              <span className="refund-pct-value">{suggestedPct}%</span>
              <span className="refund-pct-label">đề xuất hoàn cọc</span>
            </div>
            <div className="refund-result-amounts">
              <div className="refund-amount-row refund-green">
                <span>Hoàn khách</span>
                <strong>{refundAmount.toLocaleString('vi-VN')}đ</strong>
              </div>
              <div className="refund-amount-row refund-red">
                <span>Giữ lại</span>
                <strong>{keepAmount.toLocaleString('vi-VN')}đ</strong>
              </div>
            </div>
          </div>

          {uncheckedCount === 0 && (
            <p className="modal-hint-ok">Trang phục nguyên vẹn, hoàn 100% cọc.</p>
          )}
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

function Toast({ message, onDone }) {
  return (
    <div className="schedule-toast" onAnimationEnd={onDone}>
      {message}
    </div>
  )
}

function BookingRow({ booking, onApprove, onReject, onOpenReturn }) {
  const meta = STATUS_META[booking.statusKey] ?? STATUS_META.confirmed

  return (
    <article className="booking-row">
      <div className="booking-row-main">
        <div>
          <h3 className="booking-title">{booking.costume}</h3>
          <p className="booking-sub">{booking.customer} · {booking.id}</p>
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
            <button type="button" className="btn-approve" onClick={() => onApprove(booking.id)}>
              Duyệt đơn
            </button>
            <button type="button" className="btn-reject" onClick={() => onReject(booking.id)}>
              Từ chối
            </button>
          </>
        )}

        {booking.statusKey === 'pickup_soon' && (
          <span className="action-note">Sắp nhận vào {formatDateVN(booking.startDate)}</span>
        )}

        {booking.statusKey === 'confirmed' && (
          <span className="action-note">Đơn đã chốt lịch, chờ đến ngày nhận đồ.</span>
        )}

        {booking.statusKey === 'active' && (
          <span className="action-note">Đơn đang trong kỳ thuê.</span>
        )}

        {booking.statusKey === 'waiting_return' && (
          <button type="button" className="btn-return-check" onClick={() => onOpenReturn(booking)}>
            Kiểm tra và xác nhận trả đồ
          </button>
        )}

        {booking.statusKey === 'returned' && (
          <span className="returned-label">Đã hoàn tất trả đồ</span>
        )}
      </div>
    </article>
  )
}

function Schedule() {
  const { orders, approveOrder, rejectOrder, completeOrderReturn } = useDemoStore()
  const [activeModal, setActiveModal] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [toast, setToast] = useState(null)

  const today = useMemo(() => startOfDay(new Date()), [])

  const normalizedBookings = useMemo(
    () => orders.map(order => normalizeOrder(order, today)).sort((a, b) => a.actionDate - b.actionDate),
    [orders, today]
  )

  const activeBookings = normalizedBookings.filter(booking => booking.statusKey !== 'rejected')
  const focusMonth = useMemo(() => pickFocusMonth(activeBookings, today), [activeBookings, today])
  const calendarDays = useMemo(() => buildCalendarDays(activeBookings, focusMonth), [activeBookings, focusMonth])

  const pendingBookings = normalizedBookings.filter(booking => booking.statusKey === 'pending')
  const todayBookings = activeBookings.filter(
    booking => isSameDay(booking.startDate, today) || isSameDay(booking.endDate, today)
  )
  const returnsNeedingAttention = activeBookings
    .filter(booking => booking.statusKey === 'waiting_return')
    .sort((a, b) => a.endDate - b.endDate)
  const upcomingBookings = activeBookings
    .filter(booking => booking.statusKey !== 'returned')
    .sort((a, b) => a.startDate - b.startDate)
    .slice(0, 8)

  const stats = {
    today: todayBookings.length,
    active: activeBookings.filter(booking => booking.statusKey === 'active').length,
    pending: pendingBookings.length,
    waitingReturn: returnsNeedingAttention.length,
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleApprove = (orderId) => {
    approveOrder(orderId)
    showToast('Đã duyệt đơn và đưa vào lịch thuê.')
  }

  const handleReject = (orderId) => {
    rejectOrder(orderId)
    showToast('Đã từ chối đơn thuê.')
  }

  const handleConfirmReturn = ({ refundAmount }) => {
    completeOrderReturn(activeModal.id)
    setActiveModal(null)
    showToast(`Đã xác nhận trả đồ · Hoàn ${refundAmount.toLocaleString('vi-VN')}đ`)
  }

  return (
    <div className="schedule-page">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

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
            {WEEK_DAYS.map(day => <span key={day}>{day}</span>)}
          </div>

          <div className="calendar-grid">
            {calendarDays.map(day => (
              <CalendarDay key={day.key} item={day} onDayClick={setSelectedDay} />
            ))}
          </div>

          <RentalTimeline bookings={activeBookings} monthDate={focusMonth} />
        </div>

        <aside className="schedule-sidebar">
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

              {pendingBookings.map(booking => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onOpenReturn={setActiveModal}
                />
              ))}

              {returnsNeedingAttention.map(booking => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onOpenReturn={setActiveModal}
                />
              ))}
            </div>
          </div>

          <div className="schedule-card compact-card">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Lịch sắp tới</h2>
                <p className="card-desc">Những đơn đã vào guồng trong thời gian gần nhất</p>
              </div>
            </div>

            <div className="booking-list">
              {upcomingBookings.length === 0 && (
                <div className="empty-mini-state">Chưa có đơn nào trong lịch thuê.</div>
              )}

              {upcomingBookings.map(booking => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onOpenReturn={setActiveModal}
                />
              ))}
            </div>
          </div>

          <div className="schedule-card compact-card highlight-card">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Nhắc trả đồ</h2>
                <p className="card-desc">Danh sách khách cần theo dõi sát ngày trả</p>
              </div>
            </div>

            <div className="return-list">
              {returnsNeedingAttention.slice(0, 4).map(booking => {
                const daysUntilReturn = diffCalendarDays(today, booking.endDate)

                return (
                  <div className="return-item" key={`return-${booking.id}`}>
                    <div>
                      <h3>{booking.costume}</h3>
                      <p>{booking.customer} · {booking.phone}</p>
                    </div>
                    <div className="return-meta">
                      <span>{formatDateVN(booking.endDate)}</span>
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
    </div>
  )
}

export default Schedule
