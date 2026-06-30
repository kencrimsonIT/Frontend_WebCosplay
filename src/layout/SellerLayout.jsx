import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import '../styles/SellerLayout.css'

function SellerLayout() {
  const navigate = useNavigate()

  return (
    <div className="seller-layout-page">
      <aside className="seller-sidebar-main">
        <div className="seller-logo-box">
          <div className="seller-logo-icon">S</div>
          <div>
            <h2>Cosplay Lessor</h2>
            <p>Kênh người cho thuê</p>
          </div>
        </div>

        <nav className="seller-nav">
          <NavLink
            to="/seller"
            end
            className={({ isActive }) =>
              isActive ? 'seller-nav-link active' : 'seller-nav-link'
            }
          >
            <span>□</span>
            Tổng quan
          </NavLink>

          <NavLink
            to="/seller/add-product"
            className={({ isActive }) =>
              isActive ? 'seller-nav-link active' : 'seller-nav-link'
            }
          >
            <span>➕</span>
            Đăng sản phẩm
          </NavLink>

          <NavLink
            to="/seller/manage-inventory"
            className={({ isActive }) =>
              isActive ? 'seller-nav-link active' : 'seller-nav-link'
            }
          >
            <span>📦</span>
            Quản lý kho
          </NavLink>

          <NavLink
            to="/seller/promotions"
            className={({ isActive }) =>
              isActive ? 'seller-nav-link active' : 'seller-nav-link'
            }
          >
            <span>🎟️</span>
            Quản lý khuyến mãi
          </NavLink>

          <NavLink
            to="/seller/schedule"
            className={({ isActive }) =>
              isActive ? 'seller-nav-link active' : 'seller-nav-link'
            }
          >
            <span>📅</span>
            Lịch cho thuê
          </NavLink>

          <NavLink
            to="/seller/revenue"
            className={({ isActive }) =>
              isActive ? 'seller-nav-link active' : 'seller-nav-link'
            }
          >
            <span>💰</span>
            Doanh thu
          </NavLink>

          <NavLink
            to="/seller/reviews"
            className={({ isActive }) =>
              isActive ? 'seller-nav-link active' : 'seller-nav-link'
            }
          >
            <span>⭐</span>
            Đánh giá
          </NavLink>
        </nav>

        <button className="seller-back-user" onClick={() => navigate('/')}>
          ← Về trang khách hàng
        </button>
      </aside>

      <div className="seller-main-area">
        <header className="seller-topbar">
          <div>
            <h1>Kênh Người Cho Thuê</h1>
            <p>Quản lý gian hàng thuê đồ cosplay của bạn</p>
          </div>

          <div className="seller-account-box">
            <div className="seller-avatar-small">LS</div>
            <div>
              <strong>Lessor</strong>
              <span>Người cho thuê</span>
            </div>
          </div>
        </header>

        <main className="seller-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SellerLayout
