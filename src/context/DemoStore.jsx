import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  addCartItem,
  clearRemoteCart,
  fetchCart,
  removeCartItem,
  updateCartItemQuantity,
} from '../api/cart_api'
import { useAuth } from './AuthContext'

const DemoCtx = createContext(null)

const SEED_ORDERS = [
  {
    id: 'ORD-2026-001',
    items: [{ name: 'Nezuko Kamado', price: 120000 }],
    costume: 'Nezuko Kamado',
    category: 'Anime',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=400&fit=crop',
    rentFrom: '2026-05-17',
    rentTo: '2026-05-20',
    price: 120000,
    days: 4,
    deposit: 200000,
    warranty: 'standard',
    size: 'M',
    customer: 'Trần Hà My',
    phone: '0912 345 678',
    address: '123 Nguyễn Huệ, Q.1, TP.HCM',
    status: 'Đang thuê',
    statusKey: 'active',
  },
  {
    id: 'ORD-2026-002',
    items: [{ name: 'Sailor Moon', price: 150000 }],
    costume: 'Sailor Moon',
    category: 'Anime',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=400&fit=crop',
    rentFrom: '2026-05-14',
    rentTo: '2026-05-18',
    price: 150000,
    days: 5,
    deposit: 250000,
    warranty: 'none',
    size: 'S',
    customer: 'Nguyễn Thảo Vy',
    phone: '0987 654 321',
    address: '88 Lê Lợi, Q.3, TP.HCM',
    status: 'Chờ trả đồ',
    statusKey: 'waiting_return',
  },
]

const SEED_PRODUCTS = []
const CART_STORAGE_KEY = 'coser_cart_v1'

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function cartIdentity(item) {
  return [
    item.productId,
    item.size || '',
    item.startDate || '',
    item.endDate || '',
    item.warranty || 'none',
  ].join('|')
}

function normalizeCartItem(item) {
  const maxQuantity = Math.max(0, toNumber(item.maxQuantity, 99))
  const quantity = maxQuantity === 0 ? 0 : Math.min(Math.max(1, toNumber(item.quantity, 1)), maxQuantity)
  return {
    ...item,
    cartKey: item.cartKey || `${item.productId}-${Date.now()}`,
    cartIdentity: item.cartIdentity || cartIdentity(item),
    quantity,
    maxQuantity,
    rentalPrice: toNumber(item.rentalPrice),
    warrantyFee: toNumber(item.warrantyFee),
    deposit: toNumber(item.deposit),
    days: Math.max(1, toNumber(item.days, 1)),
  }
}

function readStoredCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalizeCartItem) : []
  } catch {
    return []
  }
}

function hasAuthToken() {
  return Boolean(localStorage.getItem('accessToken'))
}

function remoteCartItems(response) {
  return Array.isArray(response?.items) ? response.items.map(normalizeCartItem) : []
}

function cartRequest(item) {
  return {
    productId: item.productId,
    size: item.size || null,
    startDate: item.startDate,
    endDate: item.endDate,
    days: item.days,
    quantity: item.quantity || 1,
    warranty: item.warranty || 'none',
    warrantyFee: item.warrantyFee || 0,
  }
}

function remoteId(cartKey) {
  const id = Number(cartKey)
  return Number.isInteger(id) && id > 0 ? id : null
}

function cartMergeSignature(items) {
  return items
    .map(item => `${cartIdentity(item)}:${item.quantity || 1}`)
    .sort()
    .join(',')
}

export function DemoProvider({ children }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState(SEED_ORDERS)
  const [sellerProducts, setSellerProducts] = useState(SEED_PRODUCTS)
  const [cart, setCart] = useState(readStoredCart)

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (!user || !hasAuthToken()) return

    let active = true
    const localCart = cart

    const loadRemoteCart = async () => {
      try {
        const remote = await fetchCart()
        if (!active) return
        const localOnlyItems = localCart.filter(item => !remoteId(item.cartKey))
        if (localOnlyItems.length === 0) {
          setCart(remoteCartItems(remote))
          return
        }

        const mergeKey = `coser_cart_merge_${user.email}_${cartMergeSignature(localOnlyItems)}`
        if (sessionStorage.getItem(mergeKey)) {
          setCart(remoteCartItems(remote))
          return
        }
        sessionStorage.setItem(mergeKey, '1')

        let latest = remote
        for (const item of localOnlyItems) {
          try {
            latest = await addCartItem(cartRequest(item))
          } catch {
            // Skip unavailable local items; the server remains the source of truth.
          }
        }
        if (active) {
          const refreshed = await fetchCart()
          setCart(remoteCartItems(refreshed || latest))
        }
      } catch {
        // Keep local cart when backend is unavailable.
      }
    }

    loadRemoteCart()
    return () => {
      active = false
    }
    // Per-action methods keep the server in sync after login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const applyRemoteCart = async (request) => {
    if (!hasAuthToken()) return
    try {
      const remote = await request
      setCart(remoteCartItems(remote))
    } catch {
      // Local cart remains usable if the sync request fails.
    }
  }

  const addToCart = (item) => {
    const nextItem = normalizeCartItem({ ...item, cartIdentity: cartIdentity(item) })
    if (nextItem.maxQuantity <= 0) return
    setCart(prev => {
      const existingIndex = prev.findIndex(current => current.cartIdentity === nextItem.cartIdentity)
      if (existingIndex === -1) {
        return [...prev, nextItem]
      }

      return prev.map((current, index) => {
        if (index !== existingIndex) return current
        const maxQuantity = Math.max(current.maxQuantity || 1, nextItem.maxQuantity || 1)
        return {
          ...current,
          maxQuantity,
          quantity: Math.min((current.quantity || 1) + (nextItem.quantity || 1), maxQuantity),
        }
      })
    })
    applyRemoteCart(addCartItem(cartRequest(nextItem)))
  }

  const removeFromCart = (cartKey) => {
    setCart(prev => prev.filter(i => i.cartKey !== cartKey))
    const id = remoteId(cartKey)
    if (id) applyRemoteCart(removeCartItem(id))
  }

  const updateCartQty = (cartKey, qty) => {
    const nextQuantity = Math.max(1, toNumber(qty, 1))
    setCart(prev => prev.map(i => {
      if (i.cartKey !== cartKey) return i
      const maxQuantity = Math.max(1, toNumber(i.maxQuantity, 99))
      return { ...i, quantity: Math.min(nextQuantity, maxQuantity) }
    }))
    const id = remoteId(cartKey)
    if (id) applyRemoteCart(updateCartItemQuantity(id, nextQuantity))
  }

  const clearCart = () => {
    setCart([])
    applyRemoteCart(clearRemoteCart())
  }

  const cartMeta = useMemo(() => {
    const rentalKeys = new Set(cart.map(item => `${item.startDate || ''}|${item.endDate || ''}`))
    const stockIssues = cart.filter(item => (item.quantity || 1) > (item.maxQuantity || 99))
    const rentalTotal = cart.reduce((s, i) => s + (i.rentalPrice ?? 0) * (i.quantity ?? 1), 0)
    const warrantyTotal = cart.reduce((s, i) => s + (i.warrantyFee ?? 0) * (i.quantity ?? 1), 0)
    const depositTotal = cart.reduce((s, i) => s + (i.deposit ?? 0) * (i.quantity ?? 1), 0)
    return {
      itemCount: cart.reduce((s, i) => s + (i.quantity ?? 1), 0),
      rentalTotal,
      warrantyTotal,
      depositTotal,
      total: rentalTotal + warrantyTotal + depositTotal,
      hasMixedRentalDates: rentalKeys.size > 1,
      hasStockIssue: stockIssues.length > 0,
      stockIssues,
    }
  }, [cart])

  const placeOrder = (data) => {
    const idx = orders.length + 1
    const id = `ORD-2026-${String(idx + 2).padStart(3, '0')}`
    const today = new Date().toISOString().split('T')[0]
    const rentFrom = data.rentFrom ?? today
    const rentTo = data.rentTo ?? rentFrom

    const newOrder = {
      id,
      ...data,
      rentFrom,
      rentTo,
      status: 'Chờ xác nhận',
      statusKey: 'pending_confirm',
      createdAt: new Date().toISOString(),
    }

    setOrders(prev => [newOrder, ...prev])
    return id
  }

  const approveOrder = (orderId) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'Đã xác nhận', statusKey: 'confirmed' }
        : o
    ))
  }

  const rejectOrder = (orderId) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'Đã từ chối', statusKey: 'rejected' }
        : o
    ))
  }

  const completeOrderReturn = (orderId) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'Đã trả đồ', statusKey: 'returned', returnedAt: new Date().toISOString() }
        : o
    ))
  }

  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: `SP-${Date.now()}`,
      addedAt: new Date().toISOString(),
      quantity: 1,
      status: 'available',
    }

    setSellerProducts(prev => [newProduct, ...prev])
    return newProduct.id
  }

  return (
    <DemoCtx.Provider
      value={{
        orders,
        placeOrder,
        approveOrder,
        rejectOrder,
        completeOrderReturn,
        sellerProducts,
        addProduct,
        cart,
        cartMeta,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
      }}
    >
      {children}
    </DemoCtx.Provider>
  )
}

export const useDemoStore = () => useContext(DemoCtx)
