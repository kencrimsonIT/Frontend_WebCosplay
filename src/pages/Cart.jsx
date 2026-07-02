import { Link } from 'react-router-dom'
import { useDemoStore } from '../context/DemoStore'
import '../styles/Cart.css'

const WARRANTY_LABEL = { none: 'Khong BH', basic: 'Co ban', standard: 'Tieu chuan', premium: 'Cao cap' }

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}d`
}

function Cart() {
  const { cart, cartMeta, clearCart, removeFromCart, updateCartQty } = useDemoStore()

  const rentalTotal = cartMeta.rentalTotal
  const warrantyTotal = cartMeta.warrantyTotal
  const depositTotal = cartMeta.depositTotal
  const total = cartMeta.total
  const canCheckout = !cartMeta.hasMixedRentalDates && !cartMeta.hasStockIssue

  return (
    <div className="cart-page">
      <header className="cart-header">
        <span className="cart-label">Gio Hang Cua Ban</span>
        <h1 className="cart-title">Chi Tiet Don Hang</h1>
      </header>

      <div className="cart-container">
        {cart.length > 0 ? (
          <>
            <div className="cart-items">
              {cartMeta.hasMixedRentalDates && (
                <div className="cart-alert">
                  Mot don hang chi ho tro mot khoang ngay thue. Hay tach cac san pham khac ngay nhan/tra thanh don rieng.
                </div>
              )}

              {cart.map(item => {
                const qty = item.quantity ?? 1
                const maxQuantity = item.maxQuantity ?? 99
                const itemTotal = ((item.rentalPrice ?? 0) + (item.warrantyFee ?? 0)) * qty
                const canDecrease = qty > 1
                const canIncrease = qty < maxQuantity

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
                        {money(item.pricePerDay)}/ngay - Size {item.size} - {item.days} ngay
                      </p>
                      <p className="item-price">
                        {item.startDate} to {item.endDate} - BH: {WARRANTY_LABEL[item.warranty] || item.warranty}
                      </p>
                      <p className="stock-note">Ton kho kha dung: {maxQuantity}</p>
                    </div>

                    <div className="item-controls">
                      <div className="quantity-selector">
                        <button
                          className="qty-btn"
                          onClick={() => updateCartQty(item.cartKey, qty - 1)}
                          disabled={!canDecrease}
                        >
                          -
                        </button>
                        <span className="qty-value">{qty}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateCartQty(item.cartKey, qty + 1)}
                          disabled={!canIncrease}
                        >
                          +
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.cartKey)} className="btn-remove" title="Xoa">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>

                    <div className="item-total">
                      {money(itemTotal)}
                    </div>
                  </div>
                )
              })}
            </div>

            <aside className="cart-summary">
              <div className="summary-card">
                <h3 className="summary-title">Tom Tat Thanh Toan</h3>

                <div className="summary-row">
                  <span>So luong san pham</span>
                  <span>{cartMeta.itemCount}</span>
                </div>
                <div className="summary-row">
                  <span>Tien thue</span>
                  <span>{money(rentalTotal)}</span>
                </div>
                {warrantyTotal > 0 && (
                  <div className="summary-row">
                    <span>Phi bao hanh</span>
                    <span>{money(warrantyTotal)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Tien coc hoan khi tra</span>
                  <span>{money(depositTotal)}</span>
                </div>

                <div className="summary-divider" />

                <div className="summary-row total">
                  <span>Tong cong</span>
                  <span>{money(total)}</span>
                </div>

                {canCheckout ? (
                  <Link to="/checkout" className="btn-checkout">
                    Tien Hanh Thanh Toan
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <button type="button" className="btn-checkout disabled" disabled>
                    Kiem tra lai gio hang
                  </button>
                )}
                <Link to="/products" className="btn-continue">Tiep tuc chon do</Link>
                <button type="button" className="btn-clear-cart" onClick={clearCart}>Xoa toan bo gio hang</button>
              </div>
            </aside>
          </>
        ) : (
          <div className="cart-empty">
            <div className="empty-icon">Cart</div>
            <h2>Gio hang con trong</h2>
            <p>Hay chon cho minh nhung bo trang phuc that an tuong nhe.</p>
            <Link to="/products" className="btn-hero-primary">Kham Pha San Pham</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
