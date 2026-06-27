import '../styles/Revenue.css'

const revenueSummary = [
  { label: 'Doanh thu tháng', value: '248.6M', trend: '+18.4%' },
  { label: 'Tiền cọc đang giữ', value: '62.1M', trend: '+6.2%' },
  { label: 'Giao dịch hoàn tất', value: '1,284', trend: '+11.7%' },
  { label: 'Tỷ lệ đúng hạn', value: '96.3%', trend: '+1.1%' },
]

const weeklyRevenue = [
  { day: 'T2', value: 32 },
  { day: 'T3', value: 41 },
  { day: 'T4', value: 28 },
  { day: 'T5', value: 56 },
  { day: 'T6', value: 46 },
  { day: 'T7', value: 64 },
  { day: 'CN', value: 51 },
]

const transactions = [
  { id: 'TRX-8841', customer: 'Lê Thảo Vy', type: 'Thanh toán cọc', amount: '+3.200.000đ', time: '09:14', note: 'Đơn Nezuko Kamado' },
  { id: 'TRX-8842', customer: 'Trần Minh Khang', type: 'Thanh toán thuê', amount: '+1.850.000đ', time: '10:32', note: 'Đơn Spider-Man' },
  { id: 'TRX-8843', customer: 'Nguyễn Hà My', type: 'Hoàn cọc', amount: '-1.200.000đ', time: '12:05', note: 'Trả đơn Sailor Moon' },
  { id: 'TRX-8844', customer: 'Phạm Hoàng Long', type: 'Gia hạn', amount: '+680.000đ', time: '15:40', note: 'Đơn Genshin Raiden' },
]

const revenueChannels = [
  { label: 'Online booking', value: 48 },
  { label: 'Tại cửa hàng', value: 32 },
  { label: 'Đặt qua đối tác', value: 20 },
]

function RevenueBar({ item }) {
  return (
    <div className="bar-item">
      <span className="bar-label">{item.day}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ height: `${Math.max(item.value, 10)}%` }} />
      </div>
      <span className="bar-value">{item.value}M</span>
    </div>
  )
}

function Revenue() {
  return (
    <div className="revenue-page">
      <section className="revenue-hero">
        <div>
          <span className="page-kicker">Quản lý doanh thu</span>
          <h1 className="page-title">Finance / Revenue</h1>
          <p className="page-subtitle">Theo dõi doanh thu, tiền cọc và lịch sử giao dịch theo thời gian thực.</p>
        </div>

        <div className="revenue-actions">
          <button className="revenue-btn secondary">Xuất báo cáo</button>
          <button className="revenue-btn primary">Xem chi tiết dòng tiền</button>
        </div>
      </section>

      <section className="revenue-summary-grid">
        {revenueSummary.map(item => (
          <article className="summary-card" key={item.label}>
            <span className="summary-label">{item.label}</span>
            <span className="summary-value">{item.value}</span>
            <span className="summary-trend">{item.trend} so với tháng trước</span>
          </article>
        ))}
      </section>

      <section className="revenue-grid">
        <article className="revenue-card chart-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Biểu đồ dòng tiền tuần này</h2>
              <p className="card-desc">Các cột thể hiện tổng doanh thu theo ngày</p>
            </div>
          </div>

          <div className="chart-area">
            {weeklyRevenue.map(item => <RevenueBar key={item.day} item={item} />)}
          </div>

          <div className="channel-list">
            {revenueChannels.map(channel => (
              <div className="channel-row" key={channel.label}>
                <div>
                  <span className="channel-label">{channel.label}</span>
                  <span className="channel-percent">{channel.value}%</span>
                </div>
                <div className="channel-track">
                  <div className="channel-fill" style={{ width: `${channel.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="revenue-sidebar">
          <article className="revenue-card transaction-card">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Lịch sử giao dịch</h2>
                <p className="card-desc">Các giao dịch gần nhất cần theo dõi</p>
              </div>
            </div>

            <div className="transaction-list">
              {transactions.map(tx => (
                <div className="transaction-item" key={tx.id}>
                  <div className="transaction-left">
                    <h3>{tx.customer}</h3>
                    <p>{tx.type} · {tx.note}</p>
                  </div>
                  <div className="transaction-right">
                    <strong className={tx.amount.startsWith('-') ? 'loss' : 'gain'}>{tx.amount}</strong>
                    <span>{tx.time} · {tx.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="revenue-card deposit-card">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Tiền cọc đang giữ</h2>
                <p className="card-desc">Phần tiền sẽ hoàn lại khi khách trả đồ</p>
              </div>
            </div>

            <div className="deposit-figure">62.1M</div>
            <div className="deposit-note">42 đơn còn giữ cọc · 11 đơn sắp hoàn trả</div>
          </article>
        </aside>
      </section>
    </div>
  )
}

export default Revenue