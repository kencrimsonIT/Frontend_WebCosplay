import { Link } from 'react-router-dom'
import { useDemoStore } from '../context/DemoStore'
import '../styles/Cart.css'

const WARRANTY_LABEL = { none: 'Không BH', basic: 'Cơ bản', standard: 'Tiêu chuẩn', premium: 'Cao cấp' }

function Cart() {
  const { cart, removeFromCart, updateCartQty } = useDemoStore()

  const rentalTotal   = cart.reduce((s, i) => s + (i.rentalPrice  ?? 0) * (i.quantity ?? 1), 0)
  const warrantyTotal = cart.reduce((s, i) => s + (i.warrantyFee  ?? 0) * (i.quantity ?? 1), 0)
  const depositTotal  = cart.reduce((s, i) => s + (i.deposit      ?? 0) * (i.quantity ?? 1), 0)
  const total = rentalTotal + warrantyTotal + depositTotal

  return (
    <div className="cart-page">
      <header className="cart-header">
        <span className="cart-label">✦ Giỏ Hàng Của Bạn</span>
        <h1 className="cart-title">Chi Tiết Đơn Hàng</h1>
      </header>

      <div className="cart-container">
        {cart.length > 0 ? (
          <>
            <div className="cart-items">
              {cart.map(item => {
                const qty = item.quantity ?? 1
                const itemTotal = ((item.rentalPrice ?? 0) + (item.warrantyFee ?? 0)) * qty
                return (
                  <div key={item.cartKey} className="cart-item-card">
                    <div className="item-image">
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={e => { e.target.src = `https://picsum.photos/seed/${item.productId}/200/200` }}
                      />
                    </div>

                    <div className="item-info">
                      <span className="item-category">{item.category}</span>
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-price">
                        {(item.pricePerDay ?? 0).toLocaleString('vi-VN')}đ/ngày · Size {item.size} · {item.days} ngày
                      </p>
                      <p className="item-price">
                        {item.startDate} → {item.endDate} · BH: {WARRANTY_LABEL[item.warranty]}
                      </p>
                    </div>

                    <div className="item-controls">
                      <div className="quantity-selector">
                        <button className="qty-btn" onClick={() => updateCartQty(item.cartKey, qty - 1)}>−</button>
                        <span className="qty-value">{qty}</span>
                        <button className="qty-btn" onClick={() => updateCartQty(item.cartKey, qty + 1)}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.cartKey)} className="btn-remove" title="Xóa">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>

                    <div className="item-total">
                      {itemTotal.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                )
              })}
            </div>

            <aside className="cart-summary">
              <div className="summary-card">
                <h3 className="summary-title">Tóm Tắt Thanh Toán</h3>

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

                <div className="summary-divider" />

                <div className="summary-row total">
                  <span>Tổng cộng</span>
                  <span>{total.toLocaleString('vi-VN')}đ</span>
                </div>

                <Link to="/checkout" className="btn-checkout">
                  Tiến Hành Thanh Toán
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/products" className="btn-continue">← Tiếp tục chọn đồ</Link>
              </div>
            </aside>
          </>
        ) : (
          <div className="cart-empty">
            <div className="empty-icon">🛒</div>
            <h2>Giỏ hàng còn trống</h2>
            <p>Hãy chọn cho mình những bộ trang phục thật ấn tượng nhé!</p>
            <Link to="/products" className="btn-hero-primary">Khám Phá Sản Phẩm</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
