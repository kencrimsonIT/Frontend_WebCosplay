import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSellerDashboard } from '../api/seller_api'
import '../styles/SellerDashboard.css'

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}d`
}

function SellerDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    getSellerDashboard()
      .then(data => {
        if (!ignore) setDashboard(data)
      })
      .catch(err => {
        if (!ignore) setError(err?.message || 'Khong tai duoc dashboard nguoi ban')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => { ignore = true }
  }, [])

  const stats = [
    { label: 'Tong san pham', value: dashboard?.productCount ?? 0, icon: '□' },
    { label: 'Dang hien thi', value: dashboard?.visibleProductCount ?? 0, icon: '✓' },
    { label: 'Don cho xu ly', value: dashboard?.pendingOrderCount ?? 0, icon: '!' },
    { label: 'Dang cho thue', value: dashboard?.rentingOrderCount ?? 0, icon: '↔' },
    { label: 'Doanh thu thue', value: money(dashboard?.rentalRevenue), icon: '$' },
    { label: 'Tien coc dang giu', value: money(dashboard?.depositHeld), icon: 'D' },
  ]

  if (loading) {
    return <div className="seller-dashboard"><h1>Dang tai dashboard...</h1></div>
  }

  if (error) {
    return (
      <div className="seller-dashboard">
        <header className="dashboard-header">
          <h1>Khong tai duoc dashboard</h1>
          <p>{error}</p>
        </header>
      </div>
    )
  }

  return (
    <div className="seller-dashboard">
      <header className="dashboard-header">
        <h1>Tong quan gian hang</h1>
        <p>{dashboard?.sellerName} · {dashboard?.sellerEmail}</p>
      </header>

      <div className="stats-grid">
        {stats.map(stat => (
          <div key={stat.label} className="stat-card">
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-info">
              <h3>{stat.label}</h3>
              <p>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        <section className="dashboard-section">
          <h2>Don gan day</h2>
          <div className="section-content">
            {(dashboard?.recentOrders || []).length === 0 ? (
              <p>Chua co don hang nao.</p>
            ) : dashboard.recentOrders.map(order => (
              <p key={order.id}>
                <strong>{order.orderCode}</strong> · {order.customerName} · {order.status} · {money(order.sellerEstimatedReceivable)}
              </p>
            ))}
            <Link to="/seller/schedule" className="btn-browse">Xem lich don</Link>
          </div>
        </section>

        <section className="dashboard-section">
          <h2>San pham sap het / can theo doi</h2>
          <div className="section-content">
            {(dashboard?.lowStockProducts || []).length === 0 ? (
              <p>Kho dang on dinh.</p>
            ) : dashboard.lowStockProducts.map(product => (
              <p key={product.id}>
                <strong>{product.name}</strong> · SL {product.quantity} · {product.inventoryStatus}
              </p>
            ))}
            <Link to="/seller/manage-inventory" className="btn-browse">Quan ly kho</Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default SellerDashboard
