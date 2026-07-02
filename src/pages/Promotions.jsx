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
  return `${Number(value || 0).toLocaleString('vi-VN')}d`
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
  return 'Free ship'
}

function statusLabel(status) {
  return {
    ACTIVE: 'Dang chay',
    PAUSED: 'Tam dung',
    DRAFT: 'Luu nhap',
    EXPIRED: 'Het han',
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
      setMessage(err?.message || 'Khong tai duoc voucher.')
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
        setMessage('Da cap nhat voucher.')
      } else {
        await createSellerVoucher(payload())
        setMessage('Da tao voucher.')
      }
      resetForm()
      await loadVouchers()
    } catch (err) {
      setMessage(err?.message || 'Khong luu duoc voucher.')
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
      setMessage(err?.message || 'Thao tac voucher that bai.')
    }
  }

  const removeVoucher = async (item) => {
    if (!confirm(`Xoa voucher "${item.code}"? Lich su don hang da dung ma nay van duoc giu.`)) return
    await action(() => deleteSellerVoucher(item.id), 'Da xoa voucher.')
    if (editingId === item.id) resetForm()
  }

  return (
    <div className="promotions-page">
      <section className="promotions-hero">
        <div>
          <span className="page-kicker">Quan ly khuyen mai</span>
          <h1 className="page-title">Voucher</h1>
          <p className="page-subtitle">Quan ly ma giam gia, dieu kien ap dung, luot dung va trang thai trong mot luong duy nhat.</p>
        </div>

        <div className="promotions-hero-stats">
          <div className="hero-stat-card">
            <span className="hero-stat-value">{summary.active}</span>
            <span className="hero-stat-label">Ma dang chay</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{summary.used}</span>
            <span className="hero-stat-label">Luot su dung</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{summary.expiring}</span>
            <span className="hero-stat-label">Sap het han</span>
          </div>
        </div>
      </section>

      <section className="promotions-grid">
        <div className="promotions-main">
          <article className="promotions-panel promo-form-panel">
            <div className="card-head">
              <div>
                <h2 className="card-title">{editingId ? 'Sua voucher' : 'Tao voucher'}</h2>
                <p className="card-desc">Mot ma giam gia duy nhat dung cho ca trang khuyen mai va checkout.</p>
              </div>
            </div>

            <form className="promotion-form" onSubmit={submit}>
              <div className="form-grid">
                <label className="field">
                  <span>Ten chuong trinh</span>
                  <input value={form.title} onChange={event => updateField('title', event.target.value)} required />
                </label>
                <label className="field">
                  <span>Ma voucher</span>
                  <input value={form.code} onChange={event => updateField('code', event.target.value.toUpperCase())} required />
                </label>
                <label className="field">
                  <span>Loai giam</span>
                  <select value={form.discountType} onChange={event => updateField('discountType', event.target.value)}>
                    <option value="PERCENTAGE">Giam theo phan tram</option>
                    <option value="FIXED_AMOUNT">Giam theo so tien</option>
                    <option value="FREE_SHIPPING">Mien phi giao hang</option>
                  </select>
                </label>
                <label className="field">
                  <span>Gia tri giam</span>
                  <input type="number" min="0" value={form.discountValue} onChange={event => updateField('discountValue', event.target.value)} />
                </label>
                <label className="field">
                  <span>Giam toi da</span>
                  <input type="number" min="0" value={form.maxDiscountAmount || ''} onChange={event => updateField('maxDiscountAmount', event.target.value)} />
                </label>
                <label className="field">
                  <span>Don toi thieu</span>
                  <input type="number" min="0" value={form.minimumOrderAmount} onChange={event => updateField('minimumOrderAmount', event.target.value)} />
                </label>
                <label className="field">
                  <span>Ngay bat dau</span>
                  <input type="date" value={form.startsAt} onChange={event => updateField('startsAt', event.target.value)} required />
                </label>
                <label className="field">
                  <span>Ngay ket thuc</span>
                  <input type="date" value={form.endsAt} onChange={event => updateField('endsAt', event.target.value)} required />
                </label>
                <label className="field">
                  <span>Gioi han tong</span>
                  <input type="number" min="1" value={form.usageLimit || ''} onChange={event => updateField('usageLimit', event.target.value)} />
                </label>
                <label className="field">
                  <span>Moi khach duoc dung</span>
                  <input type="number" min="1" value={form.perUserLimit} onChange={event => updateField('perUserLimit', event.target.value)} />
                </label>
              </div>

              <div className="condition-grid">
                <label className="field field-wide">
                  <span>Trang thai</span>
                  <select value={form.status} onChange={event => updateField('status', event.target.value)}>
                    <option value="ACTIVE">Dang chay</option>
                    <option value="PAUSED">Tam dung</option>
                    <option value="DRAFT">Luu nhap</option>
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Doi tuong</span>
                  <select value={form.audience} onChange={event => updateField('audience', event.target.value)}>
                    <option value="ALL">Tat ca khach hang</option>
                    <option value="NEW_CUSTOMER">Khach moi</option>
                    <option value="VIP">Khach VIP</option>
                  </select>
                </label>
                <div className="field field-wide">
                  <span>Pham vi san pham</span>
                  <strong>Chi san pham cua shop</strong>
                </div>
                <label className="field field-wide">
                  <span>Ap chung voi ma khac</span>
                  <select value={form.stackable ? 'yes' : 'no'} onChange={event => updateField('stackable', event.target.value === 'yes')}>
                    <option value="no">Khong cho ap chung</option>
                    <option value="yes">Cho phep ap chung</option>
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Dieu kien ghi chu</span>
                  <textarea rows="4" value={form.description} onChange={event => updateField('description', event.target.value)} />
                </label>
              </div>

              {message && <p className="card-desc">{message}</p>}
              <div className="promotion-actions-row">
                <button type="submit" className="promotion-btn primary" disabled={saving}>
                  {saving ? 'Dang luu...' : editingId ? 'Luu thay doi' : 'Tao voucher'}
                </button>
                {editingId && (
                  <button type="button" className="promotion-btn secondary" onClick={resetForm} disabled={saving}>
                    Huy sua
                  </button>
                )}
              </div>
            </form>
          </article>

          <div className="promotion-list">
            {loading ? (
              <article className="promotions-panel"><p className="card-desc">Dang tai voucher...</p></article>
            ) : vouchers.length === 0 ? (
              <article className="promotions-panel"><p className="card-desc">Chua co voucher nao.</p></article>
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
                    <span className="meta-label">Loai</span>
                    <strong>{item.discountType}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Gia tri</span>
                    <strong>{discountText(item)}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Hieu luc</span>
                    <strong>{dateInput(item.startsAt) || '-'} - {dateInput(item.endsAt) || '-'}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Da dung</span>
                    <strong>{item.usedCount || 0} / {item.usageLimit || 'khong gioi han'}</strong>
                  </div>
                </div>

                <div className="promotion-condition-box">
                  <span className="meta-label">Dieu kien</span>
                  <p>
                    Don tu {money(item.minimumOrderAmount)}
                    {item.maxDiscountAmount ? ` - giam toi da ${money(item.maxDiscountAmount)}` : ''}
                    {item.perUserLimit ? ` - moi khach ${item.perUserLimit} luot` : ''}
                    {' - san pham cua shop'}
                    {item.stackable ? ' - cho phep ap chung' : ' - khong ap chung'}
                  </p>
                </div>

                <div className="promotion-actions">
                  <button className="promotion-btn secondary" type="button" onClick={() => editVoucher(item)}>
                    Sua
                  </button>
                  <button className="promotion-btn subtle" type="button" onClick={() => action(() => toggleSellerVoucher(item.id), 'Da doi trang thai voucher.')}>
                    {item.status === 'PAUSED' ? 'Kich hoat' : 'Tam dung'}
                  </button>
                  <button className="promotion-btn subtle" type="button" onClick={() => action(() => duplicateSellerVoucher(item.id), 'Da copy voucher.')}>
                    Copy
                  </button>
                  <button className="promotion-btn danger-outline" type="button" onClick={() => removeVoucher(item)}>
                    Xoa
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
                <h2 className="card-title">Da gop chuc nang</h2>
                <p className="card-desc">Promotion va voucher hien dung chung bang voucher, co tao, sua, xoa, copy, bat/tat, gioi han luot va dieu kien don hang.</p>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}

export default Promotions
