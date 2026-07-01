import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import '../styles/AdminLayout.css'

function AdminLayout() {
  const navigate = useNavigate()

  return (
    <div className="admin-layout-page">
      <aside className="admin-sidebar-main">
        <div className="admin-logo-box">
          <div className="admin-logo-icon">A</div>
          <div>
            <h2>Cosplay Admin</h2>
            <p>Control Panel</p>
          </div>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <span>📊</span>
            Tổng quan
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <span>👥</span>
            Quản lý user
          </NavLink>

          <NavLink to="/admin/categories" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <span>📁</span>
            Quản lý danh mục
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <span>📦</span>
            Quản lý đơn hàng
          </NavLink>

          <NavLink to="/admin/revenue" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <span>📈</span>
            Doanh thu
          </NavLink>

          <NavLink to="/admin/content" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <span>🛡️</span>
            Kiểm duyệt nội dung
          </NavLink>

          <NavLink to="/admin/complaints" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <span>⚠️</span>
            Khiếu nại
          </NavLink>

          <NavLink to="/admin/insurance" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <span>💼</span>
            Bảo hiểm
          </NavLink>
        </nav>

        <button className="admin-back-user" onClick={() => navigate('/')}>
          ← Về trang người dùng
        </button>
      </aside>

      <div className="admin-main-area">
        <header className="admin-topbar">
          <div>
            <h1>Trang Quản Trị</h1>
            <p>Quản lý hệ thống thuê đồ cosplay</p>
          </div>

          <div className="admin-account-box">
            <div className="admin-avatar-small">AD</div>
            <div>
              <strong>Admin</strong>
              <span>Quản trị viên</span>
            </div>
          </div>
        </header>

        <main className="admin-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
