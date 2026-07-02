import { useEffect, useMemo, useState } from 'react'
import {
  createSellerVoucher,
  deleteSellerVoucher,
  duplicateSellerVoucher,
  getSellerVouchers,
  toggleSellerVoucher,
  updateSellerVoucher,
} from '../api/voucher_api'
import '../styles/Promotions.css'

function todayInput(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

const blankForm = {
  title: '',
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  maxDiscountAmount: 100000,
  minimumOrderAmount: 0,
  usageLimit: 100,
  perUserLimit: 1,
  startsAt: todayInput(),
  endsAt: todayInput(30),
  status: 'ACTIVE',
  audience: 'ALL',
  productScope: 'SELLER_PRODUCTS',
  stackable: false,
  description: '',
}

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function dateInput(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function toDateTime(value, endOfDay = false) {
  if (!value) return null
  return `${value}T${endOfDay ? '23:59:00' : '00:00:00'}`
}

function discountText(voucher) {
  if (voucher.discountType === 'PERCENTAGE') return `${voucher.discountValue}%`
  if (voucher.discountType === 'FIXED_AMOUNT') return money(voucher.discountValue)
  return 'Miễn phí giao hàng'
}

function statusLabel(status) {
  return {
    ACTIVE: 'Đang chạy',
    PAUSED: 'Tạm dừng',
    DRAFT: 'Lưu nháp',
    EXPIRED: 'Hết hạn',
  }[status] || status
}

function statusClass(status) {
  if (status === 'ACTIVE') return 'running'
  if (status === 'PAUSED') return 'paused'
  if (status === 'DRAFT') return 'draft'
  if (status === 'EXPIRED') return 'expired'
  return 'paused'
}

function Promotions() {
  const [form, setForm] = useState(blankForm)
  const [editingId, setEditingId] = useState(null)
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const summary = useMemo(() => {
    const active = vouchers.filter(item => item.status === 'ACTIVE').length
    const used = vouchers.reduce((sum, item) => sum + Number(item.usedCount || 0), 0)
    const expiring = vouchers.filter(item => {
      if (!item.endsAt) return false
      const diff = new Date(item.endsAt).getTime() - Date.now()
      return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000
    }).length
    return { active, used, expiring }
  }, [vouchers])

  const loadVouchers = async () => {
    setLoading(true)
    try {
      setVouchers(await getSellerVouchers())
    } catch (err) {
      setMessage(err?.message || 'Không tải được voucher.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVouchers()
  }, [])

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(blankForm)
    setEditingId(null)
  }

  const payload = () => ({
    ...form,
    code: form.code.trim().toUpperCase(),
    discountValue: Number(form.discountValue || 0),
    maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
    minimumOrderAmount: Number(form.minimumOrderAmount || 0),
    usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    perUserLimit: Number(form.perUserLimit || 1),
    startsAt: toDateTime(form.startsAt),
    endsAt: toDateTime(form.endsAt, true),
  })

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      if (editingId) {
        await updateSellerVoucher(editingId, payload())
        setMessage('Đã cập nhật voucher.')
      } else {
        await createSellerVoucher(payload())
        setMessage('Đã tạo voucher.')
      }
      resetForm()
      await loadVouchers()
    } catch (err) {
      setMessage(err?.message || 'Không lưu được voucher.')
    } finally {
      setSaving(false)
    }
  }

  const editVoucher = (item) => {
    setEditingId(item.id)
    setForm({
      title: item.title || '',
      code: item.code || '',
      discountType: item.discountType || 'PERCENTAGE',
      discountValue: item.discountValue || 0,
      maxDiscountAmount: item.maxDiscountAmount || '',
      minimumOrderAmount: item.minimumOrderAmount || 0,
      usageLimit: item.usageLimit || '',
      perUserLimit: item.perUserLimit || 1,
      startsAt: dateInput(item.startsAt),
      endsAt: dateInput(item.endsAt),
      status: item.status || 'ACTIVE',
      audience: item.audience || 'ALL',
      productScope: 'SELLER_PRODUCTS',
      stackable: Boolean(item.stackable),
      description: item.description || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const action = async (work, successMessage) => {
    setMessage('')
    try {
      await work()
      setMessage(successMessage)
      await loadVouchers()
    } catch (err) {
      setMessage(err?.message || 'Thao tác voucher thất bại.')
    }
  }

  const removeVoucher = async (item) => {
    if (!confirm(`Xóa voucher "${item.code}"? Lịch sử đơn hàng đã dùng mã này vẫn được giữ.`)) return
    await action(() => deleteSellerVoucher(item.id), 'Đã xóa voucher.')
    if (editingId === item.id) resetForm()
  }

  return (
    <div className="promotions-page">
      <section className="promotions-hero">
        <div>
          <span className="page-kicker">Quản lý khuyến mãi</span>
          <h1 className="page-title">Voucher</h1>
          <p className="page-subtitle">Quản lý mã giảm giá, điều kiện áp dụng, lượt dùng và trạng thái trong một luồng duy nhất.</p>
        </div>

        <div className="promotions-hero-stats">
          <div className="hero-stat-card">
            <span className="hero-stat-value">{summary.active}</span>
            <span className="hero-stat-label">Mã đang chạy</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{summary.used}</span>
            <span className="hero-stat-label">Lượt sử dụng</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{summary.expiring}</span>
            <span className="hero-stat-label">Sắp hết hạn</span>
          </div>
        </div>
      </section>

      <section className="promotions-grid">
        <div className="promotions-main">
          <article className="promotions-panel promo-form-panel">
            <div className="card-head">
              <div>
                <h2 className="card-title">{editingId ? 'Sửa voucher' : 'Tạo voucher'}</h2>
                <p className="card-desc">Một mã giảm giá duy nhất dùng cho trang khuyến mãi và checkout.</p>
              </div>
            </div>

            <form className="promotion-form" onSubmit={submit}>
              <div className="form-grid">
                <label className="field">
                  <span>Tên chương trình</span>
                  <input value={form.title} onChange={event => updateField('title', event.target.value)} required />
                </label>
                <label className="field">
                  <span>Mã voucher</span>
                  <input value={form.code} onChange={event => updateField('code', event.target.value.toUpperCase())} required />
                </label>
                <label className="field">
                  <span>Loại giảm</span>
                  <select value={form.discountType} onChange={event => updateField('discountType', event.target.value)}>
                    <option value="PERCENTAGE">Giảm theo phần trăm</option>
                    <option value="FIXED_AMOUNT">Giảm theo số tiền</option>
                    <option value="FREE_SHIPPING">Miễn phí giao hàng</option>
                  </select>
                </label>
                <label className="field">
                  <span>Giá trị giảm</span>
                  <input type="number" min="0" value={form.discountValue} onChange={event => updateField('discountValue', event.target.value)} />
                </label>
                <label className="field">
                  <span>Giảm tối đa</span>
                  <input type="number" min="0" value={form.maxDiscountAmount || ''} onChange={event => updateField('maxDiscountAmount', event.target.value)} />
                </label>
                <label className="field">
                  <span>Đơn tối thiểu</span>
                  <input type="number" min="0" value={form.minimumOrderAmount} onChange={event => updateField('minimumOrderAmount', event.target.value)} />
                </label>
                <label className="field">
                  <span>Ngày bắt đầu</span>
                  <input type="date" value={form.startsAt} onChange={event => updateField('startsAt', event.target.value)} required />
                </label>
                <label className="field">
                  <span>Ngày kết thúc</span>
                  <input type="date" value={form.endsAt} onChange={event => updateField('endsAt', event.target.value)} required />
                </label>
                <label className="field">
                  <span>Giới hạn tổng</span>
                  <input type="number" min="1" value={form.usageLimit || ''} onChange={event => updateField('usageLimit', event.target.value)} />
                </label>
                <label className="field">
                  <span>Mỗi khách được dùng</span>
                  <input type="number" min="1" value={form.perUserLimit} onChange={event => updateField('perUserLimit', event.target.value)} />
                </label>
              </div>

              <div className="condition-grid">
                <label className="field field-wide">
                  <span>Trạng thái</span>
                  <select value={form.status} onChange={event => updateField('status', event.target.value)}>
                    <option value="ACTIVE">Đang chạy</option>
                    <option value="PAUSED">Tạm dừng</option>
                    <option value="DRAFT">Lưu nháp</option>
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Đối tượng</span>
                  <select value={form.audience} onChange={event => updateField('audience', event.target.value)}>
                    <option value="ALL">Tất cả khách hàng</option>
                    <option value="NEW_CUSTOMER">Khách mới</option>
                    <option value="VIP">Khách VIP</option>
                  </select>
                </label>
                <div className="field field-wide">
                  <span>Phạm vi sản phẩm</span>
                  <strong>Chỉ sản phẩm của shop</strong>
                </div>
                <label className="field field-wide">
                  <span>Áp chung với mã khác</span>
                  <select value={form.stackable ? 'yes' : 'no'} onChange={event => updateField('stackable', event.target.value === 'yes')}>
                    <option value="no">Không cho áp chung</option>
                    <option value="yes">Cho phép áp chung</option>
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Điều kiện ghi chú</span>
                  <textarea rows="4" value={form.description} onChange={event => updateField('description', event.target.value)} />
                </label>
              </div>

              {message && <p className="card-desc">{message}</p>}
              <div className="promotion-actions-row">
                <button type="submit" className="promotion-btn primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo voucher'}
                </button>
                {editingId && (
                  <button type="button" className="promotion-btn secondary" onClick={resetForm} disabled={saving}>
                    Hủy sửa
                  </button>
                )}
              </div>
            </form>
          </article>

          <div className="promotion-list">
            {loading ? (
              <article className="promotions-panel"><p className="card-desc">Đang tải voucher...</p></article>
            ) : vouchers.length === 0 ? (
              <article className="promotions-panel"><p className="card-desc">Chưa có voucher nào.</p></article>
            ) : vouchers.map(item => (
              <article key={item.id} className="promotion-card">
                <div className="promotion-card-head">
                  <div>
                    <div className="promotion-code">{item.code}</div>
                    <h3>{item.title}</h3>
                  </div>
                  <span className={`promotion-status ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                </div>

                <div className="promotion-meta-grid">
                  <div>
                    <span className="meta-label">Loại</span>
                    <strong>{item.discountType}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Giá trị</span>
                    <strong>{discountText(item)}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Hiệu lực</span>
                    <strong>{dateInput(item.startsAt) || '-'} - {dateInput(item.endsAt) || '-'}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Đã dùng</span>
                    <strong>{item.usedCount || 0} / {item.usageLimit || 'không giới hạn'}</strong>
                  </div>
                </div>

                <div className="promotion-condition-box">
                  <span className="meta-label">Điều kiện</span>
                  <p>
                    Đơn từ {money(item.minimumOrderAmount)}
                    {item.maxDiscountAmount ? ` - giảm tối đa ${money(item.maxDiscountAmount)}` : ''}
                    {item.perUserLimit ? ` - mỗi khách ${item.perUserLimit} lượt` : ''}
                    {' - sản phẩm của shop'}
                    {item.stackable ? ' - cho phép áp chung' : ' - không áp chung'}
                  </p>
                </div>

                <div className="promotion-actions">
                  <button className="promotion-btn secondary" type="button" onClick={() => editVoucher(item)}>
                    Sửa
                  </button>
                  <button className="promotion-btn subtle" type="button" onClick={() => action(() => toggleSellerVoucher(item.id), 'Đã đổi trạng thái voucher.')}>
                    {item.status === 'PAUSED' ? 'Kích hoạt' : 'Tạm dừng'}
                  </button>
                  <button className="promotion-btn subtle" type="button" onClick={() => action(() => duplicateSellerVoucher(item.id), 'Đã copy voucher.')}>
                    Copy
                  </button>
                  <button className="promotion-btn danger-outline" type="button" onClick={() => removeVoucher(item)}>
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="promotions-sidebar">
          <article className="promotions-panel compact-panel">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Đã gộp chức năng</h2>
                <p className="card-desc">Promotion và voucher hiện dùng chung bảng voucher, có tạo, sửa, xóa, copy, bật/tắt, giới hạn lượt và điều kiện đơn hàng.</p>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}

export default Promotions
