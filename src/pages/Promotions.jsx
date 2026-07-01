import { useEffect, useMemo, useState } from 'react'
import {
  createSellerVoucher,
  getSellerVouchers,
  toggleSellerVoucher,
} from '../api/voucher_api'
import '../styles/Promotions.css'

const initialForm = {
  title: '',
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  maxDiscountAmount: 100000,
  minimumOrderAmount: 300000,
  usageLimit: 100,
  perUserLimit: 1,
  startsAt: '',
  endsAt: '',
  audience: 'ALL',
  productScope: 'SELLER_PRODUCTS',
  stackable: false,
  description: '',
}

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}d`
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('vi-VN')
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

function PromotionCard({ item, onToggle }) {
  const statusClass = item.status === 'ACTIVE' ? 'running' : item.status === 'PAUSED' ? 'expiring' : 'strong'

  return (
    <article className="promotion-card">
      <div className="promotion-card-head">
        <div>
          <div className="promotion-code">{item.code}</div>
          <h3>{item.title}</h3>
        </div>
        <span className={`promotion-status ${statusClass}`}>{statusLabel(item.status)}</span>
      </div>

      <div className="promotion-meta-grid">
        <div>
          <span className="meta-label">Loai uu dai</span>
          <strong>{item.discountType}</strong>
        </div>
        <div>
          <span className="meta-label">Gia tri</span>
          <strong>{discountText(item)}</strong>
        </div>
        <div>
          <span className="meta-label">Hieu luc</span>
          <strong>{formatDate(item.startsAt)} - {formatDate(item.endsAt)}</strong>
        </div>
        <div>
          <span className="meta-label">Da su dung</span>
          <strong>{item.usedCount || 0} / {item.usageLimit || 'khong gioi han'}</strong>
        </div>
      </div>

      <div className="promotion-condition-box">
        <span className="meta-label">Dieu kien ap dung</span>
        <p>
          Don tu {money(item.minimumOrderAmount)}
          {item.maxDiscountAmount ? ` - giam toi da ${money(item.maxDiscountAmount)}` : ''}
          {item.stackable ? ' - cho phep ap chung' : ' - khong ap chung'}
        </p>
      </div>

      <div className="promotion-actions">
        <button className="promotion-btn subtle" type="button" onClick={() => onToggle(item.id)}>
          {item.status === 'PAUSED' ? 'Kich hoat' : 'Tam dung'}
        </button>
      </div>
    </article>
  )
}

function Promotions() {
  const [form, setForm] = useState(initialForm)
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await createSellerVoucher({
        ...form,
        code: form.code.toUpperCase(),
        discountValue: Number(form.discountValue || 0),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        minimumOrderAmount: Number(form.minimumOrderAmount || 0),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: Number(form.perUserLimit || 1),
        startsAt: toDateTime(form.startsAt),
        endsAt: toDateTime(form.endsAt, true),
      })
      setForm(initialForm)
      setMessage('Da tao voucher.')
      await loadVouchers()
    } catch (err) {
      setMessage(err?.message || 'Khong tao duoc voucher.')
    } finally {
      setSaving(false)
    }
  }

  const toggleVoucher = async (id) => {
    setMessage('')
    try {
      await toggleSellerVoucher(id)
      await loadVouchers()
    } catch (err) {
      setMessage(err?.message || 'Khong doi duoc trang thai voucher.')
    }
  }

  return (
    <div className="promotions-page">
      <section className="promotions-hero">
        <div>
          <span className="page-kicker">Quan ly khuyen mai</span>
          <h1 className="page-title">Promotions / Voucher</h1>
          <p className="page-subtitle">Tao ma voucher, dat dieu kien ap dung va theo doi hieu qua theo du lieu backend.</p>
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
                <h2 className="card-title">Tao ma khuyen mai</h2>
                <p className="card-desc">Seller tao voucher cho san pham cua shop.</p>
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
                  <span>Loai khuyen mai</span>
                  <select value={form.discountType} onChange={event => updateField('discountType', event.target.value)}>
                    <option value="PERCENTAGE">Giam theo phan tram</option>
                    <option value="FIXED_AMOUNT">Giam theo so tien</option>
                    <option value="FREE_SHIPPING">Mien phi giao hang</option>
                  </select>
                </label>
                <label className="field">
                  <span>Gia tri giam</span>
                  <input type="number" value={form.discountValue} onChange={event => updateField('discountValue', event.target.value)} />
                </label>
                <label className="field">
                  <span>Giam toi da</span>
                  <input type="number" value={form.maxDiscountAmount || ''} onChange={event => updateField('maxDiscountAmount', event.target.value)} />
                </label>
                <label className="field">
                  <span>Don toi thieu</span>
                  <input type="number" value={form.minimumOrderAmount} onChange={event => updateField('minimumOrderAmount', event.target.value)} />
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
                  <input type="number" value={form.usageLimit || ''} onChange={event => updateField('usageLimit', event.target.value)} />
                </label>
                <label className="field">
                  <span>Moi khach duoc dung</span>
                  <input type="number" value={form.perUserLimit} onChange={event => updateField('perUserLimit', event.target.value)} />
                </label>
              </div>

              <div className="condition-grid">
                <label className="field field-wide">
                  <span>Doi tuong ap dung</span>
                  <select value={form.audience} onChange={event => updateField('audience', event.target.value)}>
                    <option value="ALL">Tat ca khach hang</option>
                    <option value="NEW_CUSTOMER">Khach moi</option>
                    <option value="VIP">Khach VIP</option>
                  </select>
                </label>
                <label className="field field-wide">
                  <span>San pham ap dung</span>
                  <select value={form.productScope} onChange={event => updateField('productScope', event.target.value)}>
                    <option value="SELLER_PRODUCTS">San pham cua shop</option>
                    <option value="ALL_PRODUCTS">Toan bo san pham</option>
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Cho phep ap chung</span>
                  <select value={form.stackable ? 'yes' : 'no'} onChange={event => updateField('stackable', event.target.value === 'yes')}>
                    <option value="no">Khong ap chung</option>
                    <option value="yes">Cho phep ap chung</option>
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Dieu kien bo sung</span>
                  <textarea rows="4" value={form.description} onChange={event => updateField('description', event.target.value)} />
                </label>
              </div>

              {message && <p className="card-desc">{message}</p>}
              <div className="promotion-actions-row">
                <button type="submit" className="promotion-btn primary" disabled={saving}>
                  {saving ? 'Dang tao...' : 'Tao voucher'}
                </button>
              </div>
            </form>
          </article>

          <div className="promotion-list">
            {loading ? (
              <article className="promotions-panel"><p className="card-desc">Dang tai voucher...</p></article>
            ) : vouchers.length === 0 ? (
              <article className="promotions-panel"><p className="card-desc">Chua co voucher nao.</p></article>
            ) : vouchers.map(item => (
              <PromotionCard key={item.id} item={item} onToggle={toggleVoucher} />
            ))}
          </div>
        </div>

        <aside className="promotions-sidebar">
          <article className="promotions-panel compact-panel">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Dieu kien da co</h2>
                <p className="card-desc">Voucher hien co ngay het han, don toi thieu, gioi han luot, gioi han moi user, max discount va co ap chung hay khong.</p>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}

export default Promotions
