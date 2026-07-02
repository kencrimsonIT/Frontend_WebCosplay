import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

import AuthModal from './components/AuthModal'
import { DemoProvider } from './context/DemoStore'

import UserLayout from './layout/UserLayout'
import AdminLayout from './layout/AdminLayout'
import SellerLayout from './layout/SellerLayout'
import SellerOrders from './pages/SellerOrders'

import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Profile from './pages/Profile'
import Favorites from './pages/Favorites'
import MyOrders from './pages/MyOrders'
import Schedule from './pages/Schedule'
import Revenue from './pages/Revenue'
import Contact from './pages/Contact'
import Reviews from './pages/Reviews'
import Promotions from './pages/Promotions'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import CheckoutSuccess from './pages/CheckoutSuccess'
import { PaymentVNPay, PaymentMoMo } from './pages/PaymentGateway'
import AddProduct from './pages/AddProduct'
import ManageInventory from './pages/ManageInventory'
import AdminDashboard from './pages/AdminDashboard'

// 1. ĐÃ THÊM 2 IMPORT MỚI
import AdminContentModeration from './pages/AdminContentModeration'
import AdminInsurance from './pages/AdminInsurance'

import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import SellerDashboard from './pages/SellerDashboard'

function App() {
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' })

  const openLogin = () => setAuthModal({ open: true, tab: 'login' })
  const openRegister = () => setAuthModal({ open: true, tab: 'register' })
  const closeAuth = () => setAuthModal((prev) => ({ ...prev, open: false }))

  return (
      <DemoProvider>
        <Router>
          <Routes>
            {/* WEB USER */}
            <Route
                element={
                  <UserLayout
                      onLoginClick={openLogin}
                      onRegisterClick={openRegister}
                  />
                }
            >
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/revenue" element={<Revenue />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/oauth2/callback" element={<OAuth2RedirectHandler />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/payment/vnpay" element={<PaymentVNPay />} />
              <Route path="/payment/momo" element={<PaymentMoMo />} />
            </Route>

            {/* WEB SELLER RIÊNG */}
            <Route path="/seller" element={<SellerLayout />}>
              <Route index element={<SellerDashboard />} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="manage-inventory" element={<ManageInventory />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="revenue" element={<Revenue />} />
              <Route path="reviews" element={<Reviews />} />
            </Route>

            {/* WEB ADMIN RIÊNG */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminDashboard />} />
              <Route path="categories" element={<AdminDashboard />} />

              {/* 2. ĐÃ CẬP NHẬT 2 ROUTE NÀY */}
              <Route path="content" element={<AdminContentModeration />} />
              <Route path="insurance" element={<AdminInsurance />} />

              <Route path="orders" element={<AdminDashboard />} />
              <Route path="revenue" element={<AdminDashboard />} />
              <Route path="complaints" element={<AdminDashboard />} />
            </Route>
          </Routes>

          <AuthModal
              isOpen={authModal.open}
              onClose={closeAuth}
              defaultTab={authModal.tab}
          />
        </Router>
      </DemoProvider>
  )
}

export default App