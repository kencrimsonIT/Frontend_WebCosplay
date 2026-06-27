import '../styles/InsuranceAdmin.css'

const insuranceStats = [
  { label: 'Doanh thu bảo hiểm tháng này', value: '28.4M', note: '+14.2% so với tháng trước' },
  { label: 'Đơn có mua bảo hiểm', value: '312', note: 'Chiếm 61% tổng đơn xác nhận' },
  { label: 'Tỷ lệ claim', value: '8.7%', note: '27 yêu cầu đã phát sinh trong tháng' },
  { label: 'Tiền bồi hoàn đã xử lý', value: '9.6M', note: 'Đã duyệt cho 19 đơn hoàn tất' },
]

const packages = [
  {
    key: 'basic',
    name: 'Cơ bản',
    fee: '30.000đ',
    adoption: '29%',
    revenue: '8.1M',
    lossCover: 'Tối đa 80% cọc',
    desc: 'Phù hợp khách thuê ngắn ngày, bảo vệ cho các lỗi nhẹ và thiếu phụ kiện nhỏ.',
  },
  {
    key: 'standard',
    name: 'Tiêu chuẩn',
    fee: '60.000đ',
    adoption: '24%',
    revenue: '11.4M',
    lossCover: 'Tối đa 90% cọc',
    desc: 'Gói bán tốt nhất, cân bằng giữa khả năng bảo vệ và biên lợi nhuận cho nền tảng.',
  },
  {
    key: 'premium',
    name: 'Cao cấp',
    fee: '100.000đ',
    adoption: '8%',
    revenue: '8.9M',
    lossCover: 'Hỗ trợ 100% cọc',
    desc: 'Dành cho đơn giá trị cao, khách cần an tâm tối đa khi thuê trang phục hiếm.',
  },
]

const claims = [
  {
    id: 'CLM-2051',
    customer: 'Trần Hà My',
    costume: 'Nezuko Kamado',
    plan: 'Tiêu chuẩn',
    seller: 'Sakura Cosplay',
    refund: '180.000đ',
    status: 'Đang xử lý',
    reason: 'Thiếu 1 phụ kiện tóc, váy có vết bẩn nhẹ',
  },
  {
    id: 'CLM-2052',
    customer: 'Nguyễn Thảo Vy',
    costume: 'Sailor Moon',
    plan: 'Cơ bản',
    seller: 'Akiba Costume',
    refund: '120.000đ',
    status: 'Đã duyệt',
    reason: 'Mất găng tay phụ kiện',
  },
  {
    id: 'CLM-2053',
    customer: 'Lê Minh Khang',
    costume: 'Raiden Shogun',
    plan: 'Cao cấp',
    seller: 'Moonlight Rent',
    refund: '350.000đ',
    status: 'Chờ xác minh',
    reason: 'Trang phục có vết rách nhỏ ở tay áo',
  },
]

const insuranceTransactions = [
  { id: 'INS-8841', type: 'Phí bảo hiểm', plan: 'Tiêu chuẩn', amount: '+60.000đ', owner: 'ORD-2026-112' },
  { id: 'INS-8842', type: 'Phí bảo hiểm', plan: 'Cơ bản', amount: '+30.000đ', owner: 'ORD-2026-113' },
  { id: 'INS-8843', type: 'Bồi hoàn claim', plan: 'Tiêu chuẩn', amount: '-180.000đ', owner: 'CLM-2051' },
  { id: 'INS-8844', type: 'Phí bảo hiểm', plan: 'Cao cấp', amount: '+100.000đ', owner: 'ORD-2026-114' },
]

function InsuranceAdmin() {
  return (
    <div className="insurance-admin-page">
      <section className="insurance-hero">
        <div>
          <span className="insurance-kicker">Insurance Console</span>
          <h1 className="insurance-title">Quản lý bảo hiểm đơn thuê</h1>
          <p className="insurance-subtitle">
            Theo dõi doanh thu từ bảo hiểm, mức sử dụng từng gói và các yêu cầu bồi hoàn giữa khách, seller và nền tảng.
          </p>
        </div>

        <div className="insurance-hero-actions">
          <button className="insurance-btn secondary">Xuất báo cáo claim</button>
          <button className="insurance-btn primary">Cập nhật chính sách gói</button>
        </div>
      </section>

      <section className="insurance-stats-grid">
        {insuranceStats.map(item => (
          <article className="insurance-stat-card" key={item.label}>
            <span className="insurance-stat-label">{item.label}</span>
            <strong className="insurance-stat-value">{item.value}</strong>
            <span className="insurance-stat-note">{item.note}</span>
          </article>
        ))}
      </section>

      <section className="insurance-layout">
        <div className="insurance-main">
          <article className="insurance-panel">
            <div className="panel-head">
              <div>
                <h2>Hiệu quả từng gói bảo hiểm</h2>
                <p>Admin có thể theo dõi mức bán, doanh thu và phạm vi bồi hoàn của từng gói.</p>
              </div>
            </div>

            <div className="package-grid">
              {packages.map(pkg => (
                <article className={`package-card package-${pkg.key}`} key={pkg.key}>
                  <div className="package-top">
                    <div>
                      <span className="package-name">{pkg.name}</span>
                      <p className="package-desc">{pkg.desc}</p>
                    </div>
                    <span className="package-fee">{pkg.fee}</span>
                  </div>

                  <div className="package-metrics">
                    <div>
                      <span>Tỷ lệ chọn</span>
                      <strong>{pkg.adoption}</strong>
                    </div>
                    <div>
                      <span>Doanh thu</span>
                      <strong>{pkg.revenue}</strong>
                    </div>
                    <div>
                      <span>Bảo vệ cọc</span>
                      <strong>{pkg.lossCover}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="insurance-panel">
            <div className="panel-head">
              <div>
                <h2>Danh sách claim gần đây</h2>
                <p>Các ca cần đối soát giữa seller, khách thuê và quỹ bảo hiểm của nền tảng.</p>
              </div>
            </div>

            <div className="claim-list">
              {claims.map(claim => (
                <article className="claim-card" key={claim.id}>
                  <div className="claim-header">
                    <div>
                      <h3>{claim.costume}</h3>
                      <p>{claim.customer} · {claim.id}</p>
                    </div>
                    <span className={`claim-status status-${claim.status.replace(/\s+/g, '-').toLowerCase()}`}>{claim.status}</span>
                  </div>

                  <div className="claim-meta">
                    <span>Gói: {claim.plan}</span>
                    <span>Seller: {claim.seller}</span>
                    <span>Bồi hoàn đề xuất: {claim.refund}</span>
                  </div>

                  <p className="claim-reason">{claim.reason}</p>

                  <div className="claim-actions">
                    <button className="insurance-btn secondary small">Xem hồ sơ</button>
                    <button className="insurance-btn primary small">Duyệt xử lý</button>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>

        <aside className="insurance-side">
          <article className="insurance-panel">
            <div className="panel-head compact">
              <div>
                <h2>Dòng tiền bảo hiểm</h2>
                <p>Phân biệt rõ phí thu vào và khoản chi bồi hoàn.</p>
              </div>
            </div>

            <div className="insurance-transaction-list">
              {insuranceTransactions.map(item => (
                <div className="insurance-transaction-item" key={item.id}>
                  <div>
                    <strong>{item.type}</strong>
                    <p>{item.plan} · {item.owner}</p>
                  </div>
                  <span className={item.amount.startsWith('-') ? 'money-out' : 'money-in'}>{item.amount}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="insurance-panel reserve-panel">
            <div className="panel-head compact">
              <div>
                <h2>Quỹ dự phòng bảo hiểm</h2>
                <p>Tỷ lệ nên giữ lại để xử lý các claim bất thường.</p>
              </div>
            </div>

            <div className="reserve-amount">14.8M</div>
            <div className="reserve-note">Đang giữ 52% doanh thu bảo hiểm tháng này làm quỹ dự phòng.</div>

            <div className="reserve-breakdown">
              <div>
                <span>Thu bảo hiểm</span>
                <strong>28.4M</strong>
              </div>
              <div>
                <span>Đã chi claim</span>
                <strong>9.6M</strong>
              </div>
              <div>
                <span>Còn khả dụng</span>
                <strong>18.8M</strong>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}

export default InsuranceAdmin
