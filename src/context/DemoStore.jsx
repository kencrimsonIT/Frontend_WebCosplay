import { createContext, useContext, useState } from 'react'

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

export function DemoProvider({ children }) {
  const [orders, setOrders] = useState(SEED_ORDERS)
  const [sellerProducts, setSellerProducts] = useState(SEED_PRODUCTS)
  const [cart, setCart] = useState([])

  const addToCart = (item) => {
    setCart(prev => [...prev, { ...item, cartKey: `${item.productId}-${Date.now()}`, quantity: 1 }])
  }

  const removeFromCart = (cartKey) => {
    setCart(prev => prev.filter(i => i.cartKey !== cartKey))
  }

  const updateCartQty = (cartKey, qty) => {
    setCart(prev => prev.map(i => i.cartKey === cartKey ? { ...i, quantity: Math.max(1, qty) } : i))
  }

  const clearCart = () => setCart([])

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
