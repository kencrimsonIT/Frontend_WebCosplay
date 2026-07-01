import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getSellerPromotions,
  getSellerPromotionSummary,
  createSellerPromotion,
  updateSellerPromotion,
  toggleSellerPromotion,
  duplicateSellerPromotion,
  deleteSellerPromotion,
} from '../api/seller_api'
import '../styles/Promotions.css'

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'PERCENT', label: 'Giảm theo %' },
  { value: 'AMOUNT', label: 'Giảm tiền trực tiếp' },
  { value: 'FREESHIP', label: 'Miễn phí giao hàng' },
]

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Tất cả khách hàng' },
  { value: 'new-customer', label: 'Khách hàng mới' },
  { value: 'vip', label: 'Khách VIP' },
]

const APPLY_OPTIONS = [
  { value: 'all-costumes', label: 'Toàn bộ trang phục' },
  { value: 'new-arrivals', label: 'Bộ sưu tập mới' },
  { value: 'event-costumes', label: 'Trang phục sự kiện' },
]

const DEMO_PROMOTIONS = [
  {
    id: 'demo-1',
    code: 'COSPLAY10',
    title: 'Giảm 10% cho khách mới',
    type: 'PERCENT',
    value: 10,
    minOrderAmount: 500000,
    maxUses: 300,
    usedCount: 126,
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    targetAudience: 'new-customer',
    applyTo: 'all-costumes',
    extraCondition: '',
    status: 'ACTIVE',
  },
  {
    id: 'demo-2',
    code: 'GROUP20',
    title: 'Ưu đãi thuê nhóm sự kiện',
    type: 'PERCENT',
    value: 20,
    minOrderAmount: 1500000,
    maxUses: 80,
    usedCount: 42,
    startDate: '2026-04-05',
    endDate: '2026-04-20',
    targetAudience: 'all',
    applyTo: 'event-costumes',
    extraCondition: 'Từ 2 sản phẩm',
    status: 'ACTIVE',
  },
  {
    id: 'demo-3',
    code: 'NIGHT80K',
    title: 'Giảm trực tiếp cho đơn tối',
    type: 'AMOUNT',
    value: 80000,
    minOrderAmount: null,
    maxUses: 60,
    usedCount: 19,
    startDate: '2026-04-06',
    endDate: '2026-04-15',
    targetAudience: 'all',
    applyTo: 'all-costumes',
    extraCondition: 'Đặt sau 18:00 · Nhận tại cửa hàng',
    status: 'PAUSED',
  },
]

const TIPS = [
  'Đặt mã ngắn, dễ nhớ và phản ánh đúng chiến dịch để khách dễ nhập.',
  'Luôn đặt đơn tối thiểu để giữ biên lợi nhuận khi chạy khuyến mãi phần trăm.',
  'Giới hạn số lượt dùng theo từng khách để tránh lạm dụng voucher.',
  'Kết hợp thời gian hiệu lực ngắn (flash sale) để tạo hiệu ứng khẩn cấp.',
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtMoney(v) {
  return Number(v || 0).toLocaleString('vi-VN')
}

function fmtValue(p) {
  if (p.type === 'PERCENT') return `${p.value}%`
  if (p.type === 'FREESHIP') return 'Miễn ship'
  return `${fmtMoney(p.value)}đ`
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function deriveStatusLabel(p) {
  const today = new Date().toISOString().slice(0, 10)
  if (p.status === 'PAUSED' || p.status === 'DRAFT') return p.status
  if (p.endDate && p.endDate < today) return 'EXPIRED'
  if (p.endDate) {
    const diff = Math.ceil((new Date(p.endDate) - new Date(today)) / 86400000)
    if (diff <= 3) return 'EXPIRING'
  }
  if (p.usedCount >= (p.maxUses || Infinity)) return 'FULL'
  return 'ACTIVE'
}

function getStatusMeta(key) {
  return {
    ACTIVE: { label: 'Đang chạy', cls: 'running' },
    PAUSED: { label: 'Tạm dừng', cls: 'paused' },
    DRAFT: { label: 'Nháp', cls: 'draft' },
    EXPIRING: { label: 'Sắp hết hạn', cls: 'expiring' },
    EXPIRED: { label: 'Hết hạn', cls: 'expired' },
    FULL: { label: 'Đã hết lượt', cls: 'full' },
  }[key] ?? { label: key, cls: 'running' }
}

function usagePct(p) {
  if (!p.maxUses) return 0
  return Math.min(100, Math.round((p.usedCount / p.maxUses) * 100))
}

const EMPTY_FORM = {
  title: '',
  code: '',
  type: 'PERCENT',
  value: '',
  minOrderAmount: '',
  maxUses: '',
  startDate: '',
  endDate: '',
  targetAudience: 'all',
  applyTo: 'all-costumes',
  extraCondition: '',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toast({ message, kind = 'info', onDone }) {
  return (
      <div className={`promo-toast promo-toast-${kind}`} onAnimationEnd={onDone}>
        {message}
      </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
      <div className="modal-overlay" onClick={onCancel}>
        <div className="confirm-modal-box" onClick={e => e.stopPropagation()}>
          <p>{message}</p>
          <div className="confirm-modal-actions">
            <button className="promotion-btn subtle" onClick={onCancel}>Hủy</button>
            <button className="promotion-btn danger" onClick={onConfirm}>Xác nhận</button>
          </div>
        </div>
      </div>
  )
}

function PromotionCard({ item, onToggle, onDuplicate, onEdit, onDelete }) {
  const statusKey = deriveStatusLabel(item)
  const { label, cls } = getStatusMeta(statusKey)
  const pct = usagePct(item)

  return (
      <article className="promotion-card">
        <div className="promotion-card-head">
          <div>
            <div className="promotion-code">{item.code}</div>
            <h3>{item.title}</h3>
          </div>
          <span className={`promotion-status ${cls}`}>{label}</span>
        </div>

        <div className="promotion-meta-grid">
          <div>
            <span className="meta-label">Loại ưu đãi</span>
            <strong>{TYPE_OPTIONS.find(t => t.value === item.type)?.label ?? item.type}</strong>
          </div>
          <div>
            <span className="meta-label">Giá trị</span>
            <strong className="promo-value-highlight">{fmtValue(item)}</strong>
          </div>
          <div>
            <span className="meta-label">Hiệu lực</span>
            <strong>{fmtDate(item.startDate)} – {fmtDate(item.endDate)}</strong>
          </div>
          <div>
            <span className="meta-label">Đã dùng / Giới hạn</span>
            <strong>{item.usedCount}{item.maxUses ? ` / ${item.maxUses}` : ''}</strong>
          </div>
        </div>

        {item.maxUses > 0 && (
            <div className="usage-bar-wrap">
              <div className="usage-bar">
                <div
                    className={`usage-bar-fill ${pct >= 80 ? 'fill-danger' : pct >= 50 ? 'fill-warn' : ''}`}
                    style={{ width: `${pct}%` }}
                />
              </div>
              <span className="usage-pct">{pct}%</span>
            </div>
        )}

        {(item.minOrderAmount || item.extraCondition) && (
            <div className="promotion-condition-box">
              <span className="meta-label">Điều kiện áp dụng</span>
              <p>
                {item.minOrderAmount ? `Đơn từ ${fmtMoney(item.minOrderAmount)}đ` : ''}
                {item.minOrderAmount && item.extraCondition ? ' · ' : ''}
                {item.extraCondition || ''}
              </p>
            </div>
        )}

        <div className="promotion-actions">
          <button
              className={`promotion-btn subtle`}
              onClick={() => onToggle(item)}
              title={item.status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt'}
          >
            {item.status === 'ACTIVE' ? '⏸ Tạm dừng' : '▶ Kích hoạt'}
          </button>
          <button className="promotion-btn secondary" onClick={() => onDuplicate(item)}>
            📋 Nhân bản
          </button>
          <button className="promotion-btn primary" onClick={() => onEdit(item)}>
            ✏️ Chỉnh sửa
          </button>
          <button className="promotion-btn danger-outline" onClick={() => onDelete(item)}>
            🗑
          </button>
        </div>
      </article>
  )
}

function PromoForm({ initial, onSave, onCancel, saving, error: externalError }) {
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY_FORM;
    return {
      ...initial,
      extraCondition: initial.extraCondition || '',
      minOrderAmount: initial.minOrderAmount || '',
      maxUses: initial.maxUses || '',
      startDate: initial.startDate || '',
      endDate: initial.endDate || ''
    };
  })
  const [localError, setLocalError] = useState('')

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setLocalError('')

    if (!form.title.trim()) return setLocalError('Vui lòng nhập tên chương trình')
    if (!form.code.trim()) return setLocalError('Vui lòng nhập mã voucher')
    if (!/^[A-Z0-9_]{2,50}$/.test(form.code.toUpperCase()))
      return setLocalError('Mã chỉ dùng CHỮ HOA, số và dấu _')
    if (!form.value || Number(form.value) <= 0) return setLocalError('Giá trị giảm phải > 0')
    if (form.type === 'PERCENT' && Number(form.value) > 100)
      return setLocalError('Phần trăm không được vượt quá 100')

    const payload = {
      title: form.title ? form.title.trim() : '',
      code: form.code ? form.code.toUpperCase().trim() : '',
      type: form.type,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      targetAudience: form.targetAudience,
      applyTo: form.applyTo,
      extraCondition: form.extraCondition ? form.extraCondition.trim() : null,
    }
    onSave(payload)
  }

  const displayError = externalError || localError

  return (
      <form className="promotion-form" onSubmit={handleSubmit} noValidate>
        {displayError && <p className="promo-form-error">{displayError}</p>}

        <div className="form-grid">
          <label className="field">
            <span>Tên chương trình *</span>
            <input
                type="text"
                placeholder="VD: Giảm 10% khách mới"
                value={form.title}
                onChange={e => set('title', e.target.value)}
            />
          </label>

          <label className="field">
            <span>Mã voucher *</span>
            <input
                type="text"
                placeholder="COSPLAY10"
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
            />
          </label>

          <label className="field">
            <span>Loại khuyến mãi</span>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label className="field">
            <span>Giá trị giảm * {form.type === 'PERCENT' ? '(%)' : form.type === 'AMOUNT' ? '(đ)' : ''}</span>
            <input
                type="number"
                min="0"
                placeholder={form.type === 'PERCENT' ? '10' : '80000'}
                value={form.value}
                onChange={e => set('value', e.target.value)}
                disabled={form.type === 'FREESHIP'}
            />
          </label>

          <label className="field">
            <span>Ngày bắt đầu</span>
            <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </label>

          <label className="field">
            <span>Ngày kết thúc</span>
            <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
          </label>

          <label className="field">
            <span>Đơn tối thiểu (đ)</span>
            <input
                type="number"
                min="0"
                placeholder="500000"
                value={form.minOrderAmount}
                onChange={e => set('minOrderAmount', e.target.value)}
            />
          </label>

          <label className="field">
            <span>Giới hạn lượt dùng</span>
            <input
                type="number"
                min="1"
                placeholder="300"
                value={form.maxUses}
                onChange={e => set('maxUses', e.target.value)}
            />
          </label>
        </div>

        <div className="condition-grid">
          <label className="field field-wide">
            <span>Đối tượng áp dụng</span>
            <select value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)}>
              {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label className="field field-wide">
            <span>Sản phẩm áp dụng</span>
            <select value={form.applyTo} onChange={e => set('applyTo', e.target.value)}>
              {APPLY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label className="field field-wide">
            <span>Điều kiện bổ sung</span>
            <textarea
                rows="3"
                placeholder="VD: Mỗi khách chỉ dùng 1 lần, không áp dụng cùng ưu đãi khác."
                value={form.extraCondition}
                onChange={e => set('extraCondition', e.target.value)}
            />
          </label>
        </div>

        <div className="promotion-actions-row">
          {onCancel && (
              <button type="button" className="promotion-btn subtle" onClick={onCancel} disabled={saving}>
                Hủy
              </button>
          )}
          <button type="submit" className="promotion-btn primary" disabled={saving}>
            {saving ? 'Đang lưu…' : initial ? 'Cập nhật voucher' : 'Tạo voucher'}
          </button>
        </div>
      </form>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

function Promotions() {
  const location = useLocation()
  const sellerMode = location.pathname.startsWith('/seller')

  const [promotions, setPromotions] = useState([])
  const [summary, setSummary] = useState({ activeCount: 0, totalUsed: 0, expiringSoon: 0 })
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const [editTarget, setEditTarget] = useState(null)      // null = create, else item
  const [showForm, setShowForm] = useState(false)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [filterStatus, setFilterStatus] = useState('ALL')

  const [toast, setToast] = useState(null)  // { message, kind }
  const [confirm, setConfirm] = useState(null)  // { message, onConfirm }

  const showToast = (message, kind = 'success') => {
    setToast({ message, kind })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!sellerMode) {
      setPromotions(DEMO_PROMOTIONS)
      setSummary({ activeCount: 12, totalUsed: 328, expiringSoon: 3 })
      return
    }
    setLoading(true)
    setApiError('')
    try {
      const [list, sum] = await Promise.all([getSellerPromotions(), getSellerPromotionSummary()])
      setPromotions(Array.isArray(list) ? list : [])
      setSummary(sum ?? { activeCount: 0, totalUsed: 0, expiringSoon: 0 })
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Không tải được dữ liệu'
      setApiError(msg)
      // Fall back to demo data so UI still renders
      setPromotions(DEMO_PROMOTIONS)
    } finally {
      setLoading(false)
    }
  }, [sellerMode])

  useEffect(() => { loadData() }, [loadData])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditTarget(item)
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditTarget(null)
    setFormError('')
  }

  const handleSave = async (payload) => {
    setFormSaving(true)
    setFormError('')
    try {
      if (!sellerMode) {
        // Demo mode: mutate local state
        if (editTarget) {
          setPromotions(prev => prev.map(p => p.id === editTarget.id ? { ...p, ...payload } : p))
          showToast('Đã cập nhật khuyến mãi')
        } else {
          const newItem = { id: `demo-${Date.now()}`, usedCount: 0, status: 'ACTIVE', ...payload }
          setPromotions(prev => [newItem, ...prev])
          showToast('Đã tạo mã khuyến mãi mới')
        }
        closeForm()
        return
      }

      let saved
      if (editTarget) {
        saved = await updateSellerPromotion(editTarget.id, payload)
        setPromotions(prev => prev.map(p => p.id === saved.id ? saved : p))
        showToast('Đã cập nhật khuyến mãi')
      } else {
        saved = await createSellerPromotion(payload)
        setPromotions(prev => [saved, ...prev])
        setSummary(prev => ({ ...prev, activeCount: prev.activeCount + 1 }))
        showToast('Đã tạo mã khuyến mãi mới')
      }
      closeForm()
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Lưu thất bại'
      setFormError(msg)
    } finally {
      setFormSaving(false)
    }
  }

  const handleToggle = async (item) => {
    try {
      if (!sellerMode) {
        setPromotions(prev => prev.map(p =>
            p.id === item.id ? { ...p, status: p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : p
        ))
        showToast(item.status === 'ACTIVE' ? 'Đã tạm dừng khuyến mãi' : 'Đã kích hoạt khuyến mãi')
        return
      }
      const updated = await toggleSellerPromotion(item.id)
      setPromotions(prev => prev.map(p => p.id === updated.id ? updated : p))
      showToast(updated.status === 'ACTIVE' ? 'Đã kích hoạt' : 'Đã tạm dừng')
    } catch (err) {
      showToast(err?.message || 'Thao tác thất bại', 'error')
    }
  }

  const handleDuplicate = async (item) => {
    try {
      if (!sellerMode) {
        const copy = { ...item, id: `demo-${Date.now()}`, code: item.code + '_COPY', title: item.title + ' (bản sao)', usedCount: 0, status: 'DRAFT' }
        setPromotions(prev => [copy, ...prev])
        showToast('Đã nhân bản khuyến mãi')
        return
      }
      const copy = await duplicateSellerPromotion(item.id)
      setPromotions(prev => [copy, ...prev])
      showToast('Đã nhân bản khuyến mãi')
    } catch (err) {
      showToast(err?.message || 'Nhân bản thất bại', 'error')
    }
  }

  const handleDelete = (item) => {
    setConfirm({
      message: `Bạn có chắc muốn xóa mã "${item.code}"? Thao tác không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirm(null)
        try {
          if (!sellerMode) {
            setPromotions(prev => prev.filter(p => p.id !== item.id))
            showToast('Đã xóa khuyến mãi')
            return
          }
          await deleteSellerPromotion(item.id)
          setPromotions(prev => prev.filter(p => p.id !== item.id))
          setSummary(prev => ({ ...prev, activeCount: Math.max(0, prev.activeCount - 1) }))
          showToast('Đã xóa khuyến mãi')
        } catch (err) {
          showToast(err?.message || 'Xóa thất bại', 'error')
        }
      },
    })
  }

  // ── Filter ────────────────────────────────────────────────────────────────

  const filteredPromotions = filterStatus === 'ALL'
      ? promotions
      : promotions.filter(p => deriveStatusLabel(p) === filterStatus)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
      <div className="promotions-page">
        {toast && <Toast message={toast.message} kind={toast.kind} onDone={() => setToast(null)} />}
        {confirm && (
            <ConfirmModal
                message={confirm.message}
                onConfirm={confirm.onConfirm}
                onCancel={() => setConfirm(null)}
            />
        )}

        {/* ── Hero ── */}
        <section className="promotions-hero">
          <div>
            <span className="page-kicker">Quản lý khuyến mãi</span>
            <h1 className="page-title">Promotions &amp; Voucher</h1>
            <p className="page-subtitle">
              Tạo mã voucher, đặt điều kiện áp dụng và theo dõi hiệu quả các chương trình khuyến mãi theo thời gian thực.
            </p>
          </div>

          <div className="promotions-hero-stats">
            <div className="hero-stat-card">
              <span className="hero-stat-value">{summary.activeCount}</span>
              <span className="hero-stat-label">Mã đang chạy</span>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-value">{summary.totalUsed}</span>
              <span className="hero-stat-label">Lượt sử dụng</span>
            </div>
            <div className={`hero-stat-card ${summary.expiringSoon > 0 ? 'warning' : ''}`}>
              <span className="hero-stat-value">{summary.expiringSoon}</span>
              <span className="hero-stat-label">Sắp hết hạn</span>
            </div>
          </div>
        </section>

        {/* ── Error banner ── */}
        {apiError && (
            <div className="promo-api-error">
              ⚠ {apiError} — Đang hiển thị dữ liệu mẫu.
            </div>
        )}

        {/* ── Main grid ── */}
        <section className="promotions-grid">
          <div className="promotions-main">

            {/* Form panel */}
            <article className="promotions-panel promo-form-panel">
              <div className="card-head">
                <div>
                  <h2 className="card-title">
                    {showForm ? (editTarget ? 'Chỉnh sửa khuyến mãi' : 'Tạo mã khuyến mãi mới') : 'Tạo mã khuyến mãi'}
                  </h2>
                  <p className="card-desc">
                    {showForm
                        ? 'Điền thông tin bên dưới rồi nhấn lưu'
                        : 'Thiết lập voucher mới với mức giảm và điều kiện áp dụng cụ thể'}
                  </p>
                </div>
                {!showForm && (
                    <button className="promotion-btn primary" onClick={openCreate}>
                      + Tạo voucher mới
                    </button>
                )}
              </div>

              {showForm ? (
                  <PromoForm
                      initial={editTarget}
                      onSave={handleSave}
                      onCancel={closeForm}
                      saving={formSaving}
                      error={formError}
                  />
              ) : (
                  <div className="promo-empty-form-hint">
                    <span>🎟️</span>
                    <p>Nhấn <strong>Tạo voucher mới</strong> để bắt đầu tạo chương trình khuyến mãi.</p>
                  </div>
              )}
            </article>

            {/* Filter bar */}
            <div className="promo-filter-bar">
              <span className="promo-filter-label">Lọc theo trạng thái:</span>
              {['ALL', 'ACTIVE', 'PAUSED', 'EXPIRING', 'EXPIRED', 'DRAFT'].map(key => (
                  <button
                      key={key}
                      className={`promo-filter-btn ${filterStatus === key ? 'active' : ''}`}
                      onClick={() => setFilterStatus(key)}
                  >
                    {key === 'ALL' ? 'Tất cả' : getStatusMeta(key).label}
                  </button>
              ))}
            </div>

            {/* Promotion list */}
            {loading ? (
                <div className="promo-loading">Đang tải khuyến mãi…</div>
            ) : (
                <div className="promotion-list">
                  {filteredPromotions.length === 0 ? (
                      <div className="promo-empty-state">
                        <span>🎟️</span>
                        <p>Chưa có mã khuyến mãi nào{filterStatus !== 'ALL' ? ' trong bộ lọc này' : ''}.</p>
                        {filterStatus === 'ALL' && (
                            <button className="promotion-btn primary" onClick={openCreate}>
                              + Tạo voucher đầu tiên
                            </button>
                        )}
                      </div>
                  ) : (
                      filteredPromotions.map(item => (
                          <PromotionCard
                              key={item.id}
                              item={item}
                              onToggle={handleToggle}
                              onDuplicate={handleDuplicate}
                              onEdit={openEdit}
                              onDelete={handleDelete}
                          />
                      ))
                  )}
                </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="promotions-sidebar">
            <article className="promotions-panel compact-panel">
              <div className="card-head compact-head">
                <div>
                  <h2 className="card-title">Thống kê nhanh</h2>
                  <p className="card-desc">Tổng quan hiệu quả chiến dịch hiện tại</p>
                </div>
              </div>

              <div className="rules-list">
                {[
                  { label: 'Mã đang hoạt động', value: summary.activeCount, icon: '✅' },
                  { label: 'Tổng lượt dùng', value: summary.totalUsed, icon: '📊' },
                  { label: 'Tổng số mã', value: promotions.length, icon: '🎟️' },
                  { label: 'Sắp hết hạn (≤3 ngày)', value: summary.expiringSoon, icon: '⏰', warn: summary.expiringSoon > 0 },
                ].map(s => (
                    <div className={`rule-item ${s.warn ? 'rule-warn' : ''}`} key={s.label}>
                      <div>
                        <h3>{s.icon} {s.label}</h3>
                      </div>
                      <strong className={s.warn ? 'warn-value' : ''}>{s.value}</strong>
                    </div>
                ))}
              </div>
            </article>

            <article className="promotions-panel compact-panel highlight-panel">
              <div className="card-head compact-head">
                <div>
                  <h2 className="card-title">Mẹo triển khai</h2>
                  <p className="card-desc">Gợi ý để chương trình khuyến mãi hiệu quả hơn</p>
                </div>
              </div>

              <div className="tips-list">
                {TIPS.map((tip, i) => (
                    <div className="tip-item" key={i}>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      <p>{tip}</p>
                    </div>
                ))}
              </div>
            </article>

            {/* Quick templates */}
            <article className="promotions-panel compact-panel">
              <div className="card-head compact-head">
                <div>
                  <h2 className="card-title">Mẫu nhanh</h2>
                  <p className="card-desc">Click để tạo từ template</p>
                </div>
              </div>
              <div className="promo-template-row">
                {[
                  { code: 'NEW10', label: 'Giảm 10%', desc: 'Khách mới, đơn ≥499K' },
                  { code: 'GROUP20', label: 'Thuê nhóm', desc: 'Giảm 20%, 2 SP+' },
                  { code: 'FLASH50K', label: 'Flash sale', desc: 'Giảm 50K, 24 giờ' },
                ].map(t => (
                    <button
                        key={t.code}
                        type="button"
                        className="template-chip"
                        onClick={() => {
                          setEditTarget(null)
                          setShowForm(true)
                        }}
                    >
                      <strong>{t.code}</strong>
                      <span>{t.label}</span>
                      <small>{t.desc}</small>
                    </button>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </div>
  )
}

export default Promotions
