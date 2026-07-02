import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useDemoStore } from '../context/DemoStore'
import { applyVoucher } from '../api/voucher_api'
import '../styles/Cart.css'

export const CHECKOUT_DRAFT_KEY = 'coser_checkout_draft_v1'

const WARRANTY_LABEL = { none: 'Không BH', basic: 'Cơ bản', standard: 'Tiêu chuẩn', premium: 'Cao cấp' }

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function groupKey(item) {
  return [
    item.sellerId || item.shopId || item.lessorId || 'default-shop',
    item.startDate || '',
    item.endDate || '',
  ].join('|')
}

function groupLabel(item) {
  const seller = item.sellerName || item.shopName || item.lessorName || 'Shop cho thuê'
  const dateRange = item.startDate && item.endDate ? `${item.startDate} đến ${item.endDate}` : 'Chưa chọn ngày thuê'
  return { seller, dateRange }
}

function toOrderItem(item) {
  const quantity = item.quantity || 1
  return {
    productId: item.productId,
    productName: item.name,
    categoryName: item.category,
    size: item.size,
    days: item.days,
    quantity,
    lineTotal: (item.rentalPrice ?? 0) * quantity,
  }
}

function summarizeItems(items) {
  return items.reduce((summary, item) => {
    const quantity = item.quantity || 1
    summary.itemCount += quantity
    summary.rentalTotal += (item.rentalPrice ?? 0) * quantity
    summary.warrantyTotal += (item.warrantyFee ?? 0) * quantity
    summary.depositTotal += (item.deposit ?? 0) * quantity
    return summary
  }, { itemCount: 0, rentalTotal: 0, warrantyTotal: 0, depositTotal: 0 })
}

function buildOrderGroups(items) {
  const map = new Map()

  items.forEach(item => {
    const key = groupKey(item)
    const current = map.get(key) || {
      key,
      ...groupLabel(item),
      startDate: item.startDate,
      endDate: item.endDate,
      items: [],
    }

    current.items.push(item)
    map.set(key, current)
  })

  return Array.from(map.values()).map(group => {
    const totals = summarizeItems(group.items)
    const subTotal = totals.rentalTotal + totals.warrantyTotal + totals.depositTotal
    const stockIssues = group.items.filter(item => (item.quantity || 1) > (item.maxQuantity || 99))
    return {
      ...group,
      ...totals,
      subTotal,
      stockIssues,
      orderItems: group.items.map(toOrderItem),
    }
  })
}

function validateVoucherPlan(groups, voucherStates) {
  const usage = new Map()

  groups.forEach(group => {
    const voucher = voucherStates[group.key]?.voucher
    if (!voucher?.code) return

    const key = voucher.voucherId || voucher.code
    const current = usage.get(key) || {
      code: voucher.code,
      title: voucher.title,
      planned: 0,
      usageLimit: voucher.usageLimit,
      perUserLimit: voucher.perUserLimit,
      usedCount: Number(voucher.usedCount || 0),
      userUsedCount: Number(voucher.userUsedCount || 0),
    }

    current.planned += 1
    usage.set(key, current)
  })

  for (const item of usage.values()) {
    if (item.usageLimit && item.planned > item.usageLimit - item.usedCount) {
      return `Voucher ${item.code} không còn đủ lượt cho ${item.planned} đơn đã chọn.`
    }
    if (item.perUserLimit && item.planned > item.perUserLimit - item.userUsedCount) {
      return `Voucher ${item.code} chỉ còn ${Math.max(0, item.perUserLimit - item.userUsedCount)} lượt dùng cho tài khoản này. Hãy bỏ mã ở bớt đơn.`
    }
  }

  return ''
}

function Cart() {
  const navigate = useNavigate()
  const { cart, clearCart, removeFromCart, updateCartQty } = useDemoStore()
  const [selectedKeys, setSelectedKeys] = useState(() => cart.map(item => item.cartKey))
  const [groupVouchers, setGroupVouchers] = useState({})
  const [checkoutError, setCheckoutError] = useState('')
  const [focusedGroupKey, setFocusedGroupKey] = useState(() => cart[0] ? groupKey(cart[0]) : '')

  useEffect(() => {
    setSelectedKeys(current => {
      const existingKeys = new Set(cart.map(item => item.cartKey))
      const kept = current.filter(key => existingKeys.has(key))
      const added = cart.map(item => item.cartKey).filter(key => !current.includes(key))
      return [...kept, ...added]
    })
  }, [cart])

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys])
  const selectedItems = useMemo(
    () => cart.filter(item => selectedKeySet.has(item.cartKey)),
    [cart, selectedKeySet],
  )
  const groups = useMemo(() => buildOrderGroups(selectedItems), [selectedItems])

  const selectedSummary = useMemo(() => summarizeItems(selectedItems), [selectedItems])
  const voucherDiscountTotal = groups.reduce((sum, group) => {
    const voucher = groupVouchers[group.key]?.voucher
    return sum + (voucher?.discountAmount || 0)
  }, 0)
  const selectedSubTotal = selectedSummary.rentalTotal + selectedSummary.warrantyTotal + selectedSummary.depositTotal
  const finalTotal = Math.max(0, selectedSubTotal - voucherDiscountTotal)
  const hasSelectedStockIssue = groups.some(group => group.stockIssues.length > 0)
  const allSelected = cart.length > 0 && selectedKeys.length === cart.length
  const canCheckout = selectedItems.length > 0 && !hasSelectedStockIssue
  const focusedGroup = groups.find(group => group.key === focusedGroupKey) || groups[0] || null

  const updateVoucherState = (key, patch) => {
    setGroupVouchers(prev => ({
      ...prev,
      [key]: {
        code: '',
        voucher: null,
        message: '',
        loading: false,
        ...(prev[key] || {}),
        ...patch,
      },
    }))
  }

  const toggleItem = (cartKey) => {
    setCheckoutError('')
    const item = cart.find(current => current.cartKey === cartKey)
    if (item) setFocusedGroupKey(groupKey(item))
    setSelectedKeys(current => (
      current.includes(cartKey)
        ? current.filter(key => key !== cartKey)
        : [...current, cartKey]
    ))
  }

  const focusItem = (item) => {
    setFocusedGroupKey(groupKey(item))
  }

  const toggleAll = () => {
    setCheckoutError('')
    setSelectedKeys(allSelected ? [] : cart.map(item => item.cartKey))
  }

  const handleApplyVoucher = async (group) => {
    const state = groupVouchers[group.key] || {}
    const code = (state.code || '').trim()
    if (!code) return

    updateVoucherState(group.key, { loading: true, message: '', voucher: null })
    try {
      const result = await applyVoucher({
        code,
        rentalTotal: group.rentalTotal,
        warrantyTotal: group.warrantyTotal,
        depositTotal: group.depositTotal,
        items: group.orderItems,
      })
      updateVoucherState(group.key, {
        code: result.code || code.toUpperCase(),
        voucher: result,
        message: `${result.title || 'Voucher'} giảm ${money(result.discountAmount || 0)}`,
        loading: false,
      })
    } catch (err) {
      updateVoucherState(group.key, {
        voucher: null,
        message: err?.message || 'Voucher không hợp lệ cho đơn này.',
        loading: false,
      })
    }
  }

  const handleRemoveVoucher = (key) => {
    updateVoucherState(key, { code: '', voucher: null, message: '' })
  }

  const handleContinueCheckout = () => {
    if (!canCheckout) return
    const voucherError = validateVoucherPlan(groups, groupVouchers)
    if (voucherError) {
      setCheckoutError(voucherError)
      return
    }

    const checkoutGroups = groups.map((group, index) => {
      const voucher = groupVouchers[group.key]?.voucher
      const discountAmount = voucher?.discountAmount || 0
      return {
        key: group.key,
        index: index + 1,
        seller: group.seller,
        dateRange: group.dateRange,
        startDate: group.startDate,
        endDate: group.endDate,
        items: group.items,
        orderItems: group.orderItems,
        rentalTotal: group.rentalTotal,
        warrantyTotal: group.warrantyTotal,
        depositTotal: group.depositTotal,
        subTotal: group.subTotal,
        discountTotal: discountAmount,
        grandTotal: Math.max(0, group.subTotal - discountAmount),
        voucherCode: voucher?.code || null,
        voucherTitle: voucher?.title || null,
        voucherId: voucher?.voucherId || null,
        voucherUsageLimit: voucher?.usageLimit ?? null,
        voucherPerUserLimit: voucher?.perUserLimit ?? null,
        voucherUsedCount: voucher?.usedCount ?? 0,
        voucherUserUsedCount: voucher?.userUsedCount ?? 0,
      }
    })

    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({
      createdAt: new Date().toISOString(),
      selectedKeys,
      groups: checkoutGroups,
    }))
    navigate('/checkout')
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <span className="cart-label">Giỏ hàng của bạn</span>
        <h1 className="cart-title">Chi tiết đơn hàng</h1>
      </header>

      <div className="cart-container">
        {cart.length > 0 ? (
          <>
            <div className="cart-items">
              <div className="cart-selection-bar">
                <label className="cart-check-row">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  <span>Chọn tất cả sản phẩm</span>
                </label>
                <span>{selectedSummary.itemCount} sản phẩm đang chọn</span>
              </div>

              {cart.map(item => {
                const qty = item.quantity ?? 1
                const maxQuantity = item.maxQuantity ?? 99
                const itemTotal = ((item.rentalPrice ?? 0) + (item.warrantyFee ?? 0)) * qty
                const canDecrease = qty > 1
                const canIncrease = qty < maxQuantity
                const isSelected = selectedKeySet.has(item.cartKey)

                return (
                  <div
                    key={item.cartKey}
                    className={`cart-item-card ${isSelected ? 'selected' : ''} ${groupKey(item) === focusedGroupKey ? 'focused' : ''}`}
                    onClick={() => focusItem(item)}
                  >
                    <label className="item-check" title="Chọn sản phẩm này">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={event => event.stopPropagation()}
                        onChange={() => toggleItem(item.cartKey)}
                      />
                    </label>

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
                        {money(item.pricePerDay)}/ngày - Size {item.size} - {item.days} ngày
                      </p>
                      <p className="item-price">
                        {item.startDate} đến {item.endDate} - BH: {WARRANTY_LABEL[item.warranty] || item.warranty}
                      </p>
                      <p className="stock-note">Tồn kho khả dụng: {maxQuantity}</p>
                    </div>

                    <div className="item-controls">
                      <div className="quantity-selector">
                        <button
                          className="qty-btn"
                          onClick={event => {
                            event.stopPropagation()
                            updateCartQty(item.cartKey, qty - 1)
                          }}
                          disabled={!canDecrease}
                        >
                          -
                        </button>
                        <span className="qty-value">{qty}</span>
                        <button
                          className="qty-btn"
                          onClick={event => {
                            event.stopPropagation()
                            updateCartQty(item.cartKey, qty + 1)
                          }}
                          disabled={!canIncrease}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={event => {
                          event.stopPropagation()
                          removeFromCart(item.cartKey)
                        }}
                        className="btn-remove"
                        title="Xóa"
                      >
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

            <section className="cart-focus-panel">
              {focusedGroup ? (() => {
                const voucherState = groupVouchers[focusedGroup.key] || {}
                const discount = voucherState.voucher?.discountAmount || 0
                const groupTotal = Math.max(0, focusedGroup.subTotal - discount)
                const mainItem = focusedGroup.items[0]

                return (
                  <article className="cart-order-box active">
                    <div className="order-box-head">
                      <div>
                        <span className="order-box-label">Khung đang chọn</span>
                        <h3 className="order-focus-title">{mainItem?.name || 'Đơn đang chọn'}</h3>
                        <p>{focusedGroup.dateRange}</p>
                        {mainItem && (
                          <div className="order-focus-meta">
                            <span>{mainItem.category}</span>
                            <span>Size {mainItem.size}</span>
                            <span>{mainItem.days} ngày</span>
                            <span>BH: {WARRANTY_LABEL[mainItem.warranty] || mainItem.warranty}</span>
                          </div>
                        )}
                      </div>
                      <strong>{money(groupTotal)}</strong>
                    </div>

                    <div className="order-box-items">
                      {focusedGroup.items.map(item => (
                        <div key={item.cartKey} className="order-box-item">
                          <span>{item.name}</span>
                          <span>x{item.quantity || 1}</span>
                          <span>{money(((item.rentalPrice ?? 0) + (item.warrantyFee ?? 0) + (item.deposit ?? 0)) * (item.quantity || 1))}</span>
                        </div>
                      ))}
                    </div>

                    {focusedGroup.stockIssues.length > 0 && (
                      <p className="order-warning">Có sản phẩm vượt tồn kho, hãy giảm số lượng trước khi thanh toán.</p>
                    )}

                    <div className="order-voucher">
                      {!voucherState.voucher ? (
                        <>
                          <input
                            type="text"
                            value={voucherState.code || ''}
                            onChange={event => updateVoucherState(focusedGroup.key, {
                              code: event.target.value.toUpperCase(),
                              message: '',
                            })}
                            placeholder="Mã giảm giá"
                            disabled={voucherState.loading}
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyVoucher(focusedGroup)}
                            disabled={voucherState.loading || !voucherState.code?.trim()}
                          >
                            {voucherState.loading ? 'Đang áp dụng...' : 'Áp mã'}
                          </button>
                        </>
                      ) : (
                        <div className="applied-voucher">
                          <div>
                            <span>Voucher {voucherState.voucher.code}</span>
                            <p>{voucherState.voucher.title}</p>
                          </div>
                          <button type="button" onClick={() => handleRemoveVoucher(focusedGroup.key)}>Bỏ</button>
                        </div>
                      )}
                    </div>

                    {voucherState.message && <p className="voucher-message">{voucherState.message}</p>}

                    <div className="order-box-totals">
                      <span>Tiền thuê: {money(focusedGroup.rentalTotal)}</span>
                      {focusedGroup.warrantyTotal > 0 && <span>Bảo hành: {money(focusedGroup.warrantyTotal)}</span>}
                      <span>Cọc: {money(focusedGroup.depositTotal)}</span>
                      {discount > 0 && <span className="discount-text">Giảm: -{money(discount)}</span>}
                    </div>
                  </article>
                )
              })() : (
                <div className="cart-order-box empty-focus">
                  <span className="order-box-label">Khung đang chọn</span>
                  <h3>Chưa có sản phẩm</h3>
                  <p>Tick sản phẩm trong giỏ để xem chi tiết đơn và áp mã giảm giá.</p>
                </div>
              )}
            </section>

            <aside className="cart-summary">
              <div className="summary-card">
                <h3 className="summary-title">Tóm tắt thanh toán</h3>

                <div className="summary-row">
                  <span>Số lượng sản phẩm</span>
                  <span>{selectedSummary.itemCount}</span>
                </div>
                <div className="summary-row">
                  <span>Số đơn sẽ tạo</span>
                  <span>{groups.length}</span>
                </div>
                <div className="summary-row">
                  <span>Tiền thuê</span>
                  <span>{money(selectedSummary.rentalTotal)}</span>
                </div>
                {selectedSummary.warrantyTotal > 0 && (
                  <div className="summary-row">
                    <span>Phí bảo hành</span>
                    <span>{money(selectedSummary.warrantyTotal)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Tiền cọc hoàn khi trả</span>
                  <span>{money(selectedSummary.depositTotal)}</span>
                </div>
                {voucherDiscountTotal > 0 && (
                  <div className="summary-row discount-row">
                    <span>Giảm giá</span>
                    <span>- {money(voucherDiscountTotal)}</span>
                  </div>
                )}

                <div className="summary-divider" />

                <div className="summary-row total">
                  <span>Tổng cộng</span>
                  <span>{money(finalTotal)}</span>
                </div>

                <button
                  type="button"
                  className="btn-checkout"
                  disabled={!canCheckout}
                  onClick={handleContinueCheckout}
                >
                  Tiến hành thanh toán
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                {checkoutError && <p className="summary-error">{checkoutError}</p>}
                {!canCheckout && (
                  <p className="summary-hint">
                    {selectedItems.length === 0 ? 'Hãy chọn ít nhất một sản phẩm.' : 'Hãy kiểm tra lại tồn kho trong các đơn đã chọn.'}
                  </p>
                )}
                <Link to="/products" className="btn-continue">Tiếp tục chọn đồ</Link>
                <button type="button" className="btn-clear-cart" onClick={clearCart}>Xóa toàn bộ giỏ hàng</button>
              </div>
            </aside>
          </>
        ) : (
          <div className="cart-empty">
            <div className="empty-icon">Cart</div>
            <h2>Giỏ hàng còn trống</h2>
            <p>Hãy chọn cho mình những bộ trang phục thật ấn tượng nhé.</p>
            <Link to="/products" className="btn-hero-primary">Khám phá sản phẩm</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
