import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDemoStore } from '../context/DemoStore'
import { useAuth } from '../context/AuthContext'
import '../styles/Checkout.css'
import { createOrder, checkPromotion } from '../api/order_api'
import { createOnlinePayment } from '../api/payment_api'
import { applyVoucher } from '../api/voucher_api'

const WARRANTY_LABEL = { none: 'Không BH', basic: 'Cơ bản', standard: 'Tiêu chuẩn', premium: 'Cao cấp' }

const FLOW_STEPS = [
  { label: 'Đặt hàng',     key: 'placed' },
  { label: 'Seller duyệt', key: 'confirmed' },
  { label: 'Nhận đồ',      key: 'received' },
  { label: 'Đang thuê',    key: 'renting' },
  { label: 'Trả đồ',       key: 'returned' },
]

function OrderSuccess({ orderId, items, total }) {
  return (
      <div className="checkout-success">
        <div className="success-icon-wrap">
          <div className="success-icon">✓</div>
        </div>
        <h1 className="success-title">Đặt hàng thành công!</h1>
        <p className="success-order-id">Mã đơn: <strong>{orderId}</strong></p>

        <div className="success-timeline">
          {FLOW_STEPS.map((step, i) => (
              <div key={step.key} className="timeline-step">
                <div className={`timeline-dot ${i === 0 ? 'dot-done' : i === 1 ? 'dot-pending' : 'dot-waiting'}`}>
                  {i === 0 ? '✓' : i + 1}
                </div>
                <span className={`timeline-label ${i === 0 ? 'label-done' : i === 1 ? 'label-pending' : ''}`}>
              {step.label}
            </span>
                {i < FLOW_STEPS.length - 1 && <div className={`timeline-line ${i === 0 ? 'line-done' : ''}`} />}
              </div>
          ))}
        </div>

        <p className="success-note">
          Seller đang xem xét đơn hàng. Bạn sẽ nhận thông báo khi đơn được xác nhận.
        </p>

        <div className="success-order-summary">
          <h3 className="success-summary-title">Chi tiết đơn hàng</h3>
          {items.map(item => (
              <div key={item.cartKey} className="success-item-row">
                <div className="success-item-main">
                  <span className="success-item-name">{item.name}</span>
                  <div className="success-item-meta">
                    <span>Size: {item.size}</span>
                    <span>·</span>
                    <span>{item.days} ngày</span>
                    <span>·</span>
                    <span>BH: {WARRANTY_LABEL[item.warranty]}</span>
                  </div>
                  {item.accessories?.length > 0 && (
                      <div className="success-accessories">
                        Phụ kiện: {item.accessories.join(', ')}
                      </div>
                  )}
                </div>
                <span className="success-item-price">
              {((item.rentalPrice ?? 0) + (item.warrantyFee ?? 0)).toLocaleString('vi-VN')}đ
            </span>
              </div>
          ))}
          <div className="success-total-row">
            <span>Tổng thanh toán</span>
            <strong>{total.toLocaleString('vi-VN')}đ</strong>
          </div>
        </div>

        <div className="success-actions">
          <Link to="/orders" className="btn-view-orders">Xem đơn của tôi</Link>
          <Link to="/products" className="btn-continue-shopping">Tiếp tục mua sắm</Link>
        </div>
      </div>
  )
}

function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cart, placeOrder, clearCart } = useDemoStore()
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.addresses?.find(a => a.isDefault)?.fullAddress || '',
    city: '',
    note: '',
    paymentMethod: 'COD',
  })
  const [placedOrderId, setPlacedOrderId] = useState(null)
  const [snapshotCart, setSnapshotCart] = useState([])
  const [snapshotTotal, setSnapshotTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState('')
  const [checkingPromo, setCheckingPromo] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucher, setVoucher] = useState(null)
  const [voucherMessage, setVoucherMessage] = useState('')
  const [voucherLoading, setVoucherLoading] = useState(false)

  const rentalTotal   = cart.reduce((s, i) => s + (i.rentalPrice  ?? 0) * (i.quantity ?? 1), 0)
  const warrantyTotal = cart.reduce((s, i) => s + (i.warrantyFee  ?? 0) * (i.quantity ?? 1), 0)
  const depositTotal  = cart.reduce((s, i) => s + (i.deposit      ?? 0) * (i.quantity ?? 1), 0)
  const subTotal = rentalTotal + warrantyTotal + depositTotal
  const orderItems = cart.map(item => ({
    productId: item.productId,
    productName: item.name,
    categoryName: item.category,
    size: item.size,
    days: item.days,
    quantity: item.quantity || 1,
    lineTotal: (item.rentalPrice ?? 0) * (item.quantity || 1),
  }))

  let promoDiscount = 0
  if (appliedPromo) {
    if (appliedPromo.type === 'PERCENT') {
      promoDiscount = (rentalTotal * appliedPromo.value) / 100
    } else if (appliedPromo.type === 'AMOUNT') {
      promoDiscount = appliedPromo.value
    }
  }
  const voucherDiscount = voucher?.discountAmount ?? 0
  const discountTotal = voucher ? voucherDiscount : promoDiscount
  const total = Math.max(0, subTotal - discountTotal)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setCheckingPromo(true)
    setPromoError('')
    try {
      const res = await checkPromotion(promoCode, subTotal)
      setAppliedPromo(res)
      setVoucher(null)
      setVoucherCode('')
      setVoucherMessage('')
    } catch (err) {
      setPromoError(err?.message || 'Không thể áp dụng mã khuyến mãi')
      setAppliedPromo(null)
    } finally {
      setCheckingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoCode('')
    setPromoError('')
  }

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return
    setVoucherLoading(true)
    setVoucherMessage('')
    setVoucher(null)
    try {
      const result = await applyVoucher({
        code: voucherCode,
        rentalTotal,
        warrantyTotal,
        depositTotal,
        items: orderItems,
      })
      setVoucher(result)
      setVoucherCode(result.code)
      setAppliedPromo(null)
      setPromoCode('')
      setPromoError('')
      setVoucherMessage(`${result.title}: giam ${(result.discountAmount ?? 0).toLocaleString('vi-VN')}d`)
    } catch (err) {
      setVoucherMessage(err?.message || 'Voucher khong hop le.')
    } finally {
      setVoucherLoading(false)
    }
  }

  const handleRemoveVoucher = () => {
    setVoucher(null)
    setVoucherCode('')
    setVoucherMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (cart.length === 0) return

    setLoading(true)
    setError('')

    try {
      const orderRequest = {
        customerName: formData.fullName,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        shippingAddress: `${formData.address}, ${formData.city}`,
        paymentMethod: formData.paymentMethod,
        rentalTotal: rentalTotal,
        warrantyTotal: warrantyTotal,
        depositTotal: depositTotal,
        discountTotal: discountTotal,
        grandTotal: total,
        voucherCode: voucher?.code || null,
        promotionCode: voucher ? null : appliedPromo?.code || null,
        rentFrom: cart[0]?.startDate,
        rentTo: cart[0]?.endDate,
        items: orderItems
      }

      const response = await createOrder(orderRequest)
      const order = response.data

      if (formData.paymentMethod === 'VNPAY' || formData.paymentMethod === 'MOMO') {
        const paymentResponse = await createOnlinePayment({
          orderId: order.id,
          method: formData.paymentMethod
        })

        if (paymentResponse.success && paymentResponse.data.paymentUrl) {
          window.location.href = paymentResponse.data.paymentUrl
          return
        } else {
          throw new Error('Không thể tạo liên kết thanh toán')
        }
      }

      // COD path
      setSnapshotCart([...cart])
      setSnapshotTotal(total)
      setPlacedOrderId(order.orderCode)
      clearCart()
      window.scrollTo({ top: 0, behavior: 'smooth' })

    } catch (err) {
      console.error("Checkout error:", err)
      setError(err.message || 'Đã có lỗi xảy ra trong quá trình thanh toán')
    } finally {
      setLoading(false)
    }
  }

  /* Giỏ trống, chưa order */
  if (!placedOrderId && cart.length === 0) {
    return (
        <div className="checkout-page">
          <div className="checkout-empty">
            <div className="empty-icon">🛒</div>
            <h2>Giỏ hàng trống</h2>
            <p>Vui lòng thêm trang phục vào giỏ trước khi thanh toán.</p>
            <Link to="/products" className="btn-view-orders">← Xem sản phẩm</Link>
          </div>
        </div>
    )
  }

  if (placedOrderId) {
    return (
        <div className="checkout-page">
          <OrderSuccess orderId={placedOrderId} items={snapshotCart} total={snapshotTotal} />
        </div>
    )
  }

  return (
      <div className="checkout-page">
        <header className="checkout-header">
          <span className="checkout-label">✦ Thanh Toán</span>
          <h1 className="checkout-title">Hoàn Tất Đơn Hàng</h1>
        </header>

        <form onSubmit={handleSubmit} className="checkout-container">
          {/* Thông tin liên hệ */}
          <div className="checkout-form-section">
            <div className="section-card">
              <h3 className="section-title">
                <span className="step-num">1</span>
                Thông Tin Liên Hệ
              </h3>
              {error && <p className="pd-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</p>}
              <div className="form-grid">
                <div className="form-group">
                  <label>Họ và Tên</label>
                  <input type="text" name="fullName" required placeholder="Nguyễn Văn A"
                         value={formData.fullName} onChange={handleInputChange} disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Số Điện Thoại</label>
                  <input type="tel" name="phone" required placeholder="0901234567"
                         value={formData.phone} onChange={handleInputChange} disabled={loading} />
                </div>
                <div className="form-group full">
                  <label>Email</label>
                  <input type="email" name="email" required placeholder="example@gmail.com"
                         value={formData.email} onChange={handleInputChange} disabled={loading} />
                </div>
                <div className="form-group full">
                  <label>Địa Chỉ Nhận Đồ</label>
                  <input type="text" name="address" required placeholder="Số nhà, tên đường, phường/xã..."
                         value={formData.address} onChange={handleInputChange} disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Tỉnh / Thành Phố</label>
                  <select name="city" value={formData.city} onChange={handleInputChange} required disabled={loading}>
                    <option value="">Chọn tỉnh thành</option>
                    <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label>Ghi Chú (Tùy chọn)</label>
                  <textarea name="note" rows="3" placeholder="Yêu cầu đặc biệt..."
                            value={formData.note} onChange={handleInputChange} disabled={loading} />
                </div>
              </div>
            </div>

            <div className="section-card mt-2">
              <h3 className="section-title">
                <span className="step-num">2</span>
                Phương Thức Thanh Toán
              </h3>
              <div className="payment-options">
                <label className={`payment-option ${formData.paymentMethod === 'COD' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMethod" value="COD"
                         checked={formData.paymentMethod === 'COD'} onChange={handleInputChange} disabled={loading} />
                  <div className="payment-info">
                    <span className="payment-name">Thanh toán khi nhận đồ (COD)</span>
                    <span className="payment-desc">Bạn sẽ thanh toán tiền thuê và tiền cọc khi nhận trang phục.</span>
                  </div>
                </label>
                <label className={`payment-option ${formData.paymentMethod === 'VNPAY' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMethod" value="VNPAY"
                         checked={formData.paymentMethod === 'VNPAY'} onChange={handleInputChange} disabled={loading} />
                  <div className="payment-info">
                    <span className="payment-name">Thanh toán qua VNPay</span>
                    <span className="payment-desc">Thanh toán an toàn qua cổng VNPay (ATM/Visa/MasterCard/QR).</span>
                  </div>
                </label>
                <label className={`payment-option ${formData.paymentMethod === 'MOMO' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMethod" value="MOMO"
                         checked={formData.paymentMethod === 'MOMO'} onChange={handleInputChange} disabled={loading} />
                  <div className="payment-info">
                    <span className="payment-name">Thanh toán qua MoMo</span>
                    <span className="payment-desc">Thanh toán nhanh chóng bằng ví điện tử MoMo.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Tóm tắt đơn hàng */}
          <aside className="checkout-summary">
            <div className="summary-card">
              <h3 className="summary-title">Đơn Hàng Của Bạn</h3>
              <div className="order-items-mini">
                {cart.map(item => (
                    <div key={item.cartKey} className="mini-item">
                      <div>
                        <p className="mini-item-name">{item.name}</p>
                        <p className="mini-item-sub">
                          Size {item.size} · {item.days} ngày · BH {WARRANTY_LABEL[item.warranty]}
                        </p>
                        {item.accessories?.length > 0 && (
                            <p className="mini-item-acc">
                              Phụ kiện: {item.accessories.slice(0, 2).join(', ')}{item.accessories.length > 2 ? '...' : ''}
                            </p>
                        )}
                      </div>
                      <span className="mini-item-price">{(item.rentalPrice ?? 0).toLocaleString('vi-VN')}đ</span>
                    </div>
                ))}
              </div>

              <div className="summary-divider" />
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Tiền thuê</span>
                  <span>{rentalTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                {warrantyTotal > 0 && (
                    <div className="summary-row">
                      <span>Phí bảo hành</span>
                      <span>{warrantyTotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                )}
                <div className="summary-row">
                  <span>Tiền cọc (hoàn khi trả)</span>
                  <span>{depositTotal.toLocaleString('vi-VN')}đ</span>
                </div>

                <div className="checkout-voucher-box">
                  {!voucher ? (
                      <>
                        <label className="checkout-voucher-label">Ma voucher</label>
                        <div className="checkout-voucher-row">
                          <input
                              type="text"
                              value={voucherCode}
                              onChange={event => {
                                setVoucherCode(event.target.value.toUpperCase())
                                setVoucherMessage('')
                              }}
                              placeholder="COSPLAY10"
                              disabled={voucherLoading || loading}
                          />
                          <button type="button" onClick={handleApplyVoucher} disabled={voucherLoading || loading || !voucherCode.trim()}>
                            {voucherLoading ? 'Dang ap dung...' : 'Ap dung'}
                          </button>
                        </div>
                      </>
                  ) : (
                      <div className="applied-promo">
                        <div>
                          <span className="promo-badge">Voucher {voucher.code}</span>
                          <span className="promo-desc">{voucher.title}</span>
                        </div>
                        <button type="button" onClick={handleRemoveVoucher} disabled={loading}>x</button>
                      </div>
                  )}
                  {voucherMessage && <p className="checkout-voucher-message">{voucherMessage}</p>}
                </div>

                <div className="checkout-promo-section">
                  {!appliedPromo ? (
                      <div className="promo-input-group">
                        <input
                            type="text"
                            placeholder="Mã giảm giá"
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value.toUpperCase())}
                            disabled={checkingPromo || loading || !!voucher}
                        />
                        <button type="button" onClick={handleApplyPromo} disabled={!promoCode.trim() || checkingPromo || loading || !!voucher}>
                          {checkingPromo ? 'Đang ktra...' : 'Áp dụng'}
                        </button>
                      </div>
                  ) : (
                      <div className="applied-promo">
                        <div>
                          <span className="promo-badge">🎟️ {appliedPromo.code}</span>
                          <span className="promo-desc">{appliedPromo.title}</span>
                        </div>
                        <button type="button" onClick={handleRemovePromo} disabled={loading}>✕</button>
                      </div>
                  )}
                  {promoError && <p className="promo-error">{promoError}</p>}
                </div>

                {discountTotal > 0 && (
                    <div className="summary-row discount-row">
                      <span>Giảm giá</span>
                      <span>- {discountTotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                )}

                <div className="summary-divider" />
                <div className="summary-row total">
                  <span>Tổng Thanh Toán</span>
                  <span>{total.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <button type="submit" className="btn-place-order" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Xác Nhận Đặt Hàng'}
                {!loading && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                )}
              </button>
              <p className="security-note">🔒 Thông tin thanh toán được bảo mật tuyệt đối.</p>
            </div>
          </aside>
        </form>
      </div>
  )
}

export default Checkout

