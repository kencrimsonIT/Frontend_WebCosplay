import '../styles/SellerDashboard.css'

const stats = [
  { label: 'Đơn hàng mới', value: '5', icon: '📦' },
  { label: 'Doanh thu tháng', value: '15.2M', icon: '💰' },
  { label: 'Sản phẩm đang thuê', value: '12', icon: '👘' },
  { label: 'Đánh giá mới', value: '4.8★', icon: '⭐' },
  { label: 'Khuyến mãi đang chạy', value: '3', icon: '🎟️' },
]

function SellerDashboard() {
  return (
    <div className="seller-dashboard">
      <header className="dashboard-header">
        <h1>Tổng quan gian hàng</h1>
        <p>Thống kê hoạt động kinh doanh của bạn</p>
      </header>
      
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
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
          <h2>Cần xử lý gấp</h2>
          <div className="section-content">
            <p>Không có yêu cầu khẩn cấp hiện tại.</p>
          </div>
        </section>
        
        <section className="dashboard-section">
          <h2>Đánh giá chưa phản hồi</h2>
          <div className="section-content">
            <p>Bạn có 3 đánh giá mới cần phản hồi.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
export default SellerDashboard
