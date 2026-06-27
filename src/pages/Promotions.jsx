import '../styles/Promotions.css'

const promotionSummary = [
  { label: 'Mã đang hoạt động', value: '12', note: '4 mã áp dụng toàn bộ sản phẩm' },
  { label: 'Voucher đã dùng', value: '328', note: 'Tăng 14% so với tuần trước' },
  { label: 'Doanh thu giảm giá', value: '86.4M', note: 'Đến từ chiến dịch tháng 4' },
  { label: 'Sắp hết hạn', value: '3', note: 'Cần gia hạn trong 72 giờ tới' },
]

const voucherTemplates = [
  { label: 'Giảm 10%', desc: 'Dùng cho khách mới, đơn tối thiểu 499K', code: 'NEW10' },
  { label: 'Freeship', desc: 'Áp dụng đơn nội thành từ 799K', code: 'SHIP0' },
  { label: 'Combo sự kiện', desc: 'Giảm cho đơn thuê từ 2 trang phục', code: 'EVENT15' },
]

const activePromotions = [
  {
    code: 'COSPLAY10',
    title: 'Giảm 10% cho khách mới',
    type: 'Phần trăm',
    value: '10%',
    validity: '01/04/2026 - 30/04/2026',
    usage: '126 / 300 lượt',
    condition: 'Đơn từ 500.000đ · Khách hàng mới',
    status: 'Đang chạy',
  },
  {
    code: 'GROUP20',
    title: 'Ưu đãi thuê nhóm sự kiện',
    type: 'Phần trăm',
    value: '20%',
    validity: '05/04/2026 - 20/04/2026',
    usage: '42 / 80 lượt',
    condition: 'Từ 2 sản phẩm · Đơn từ 1.500.000đ',
    status: 'Hiệu quả cao',
  },
  {
    code: 'NIGHT80K',
    title: 'Giảm trực tiếp cho đơn tối',
    type: 'Số tiền',
    value: '80.000đ',
    validity: '06/04/2026 - 15/04/2026',
    usage: '19 / 60 lượt',
    condition: 'Đặt sau 18:00 · Nhận tại cửa hàng',
    status: 'Sắp hết hạn',
  },
]

const applicationRules = [
  { label: 'Đơn tối thiểu', value: '500.000đ', hint: 'Ngăn áp dụng cho đơn nhỏ' },
  { label: 'Giới hạn lượt dùng', value: '300', hint: 'Có thể đặt theo mỗi khách hoặc toàn hệ thống' },
  { label: 'Nhóm khách hàng', value: 'Khách mới / Khách VIP', hint: 'Chọn đúng phân khúc nhận ưu đãi' },
  { label: 'Khung giờ áp dụng', value: '09:00 - 22:00', hint: 'Dùng cho flash sale hoặc giờ thấp điểm' },
]

function PromotionCard({ item }) {
  const statusClass =
    item.status === 'Đang chạy'
      ? 'running'
      : item.status === 'Hiệu quả cao'
        ? 'strong'
        : 'expiring'

  return (
    <article className="promotion-card">
      <div className="promotion-card-head">
        <div>
          <div className="promotion-code">{item.code}</div>
          <h3>{item.title}</h3>
        </div>
        <span className={`promotion-status ${statusClass}`}>{item.status}</span>
      </div>

      <div className="promotion-meta-grid">
        <div>
          <span className="meta-label">Loại ưu đãi</span>
          <strong>{item.type}</strong>
        </div>
        <div>
          <span className="meta-label">Giá trị</span>
          <strong>{item.value}</strong>
        </div>
        <div>
          <span className="meta-label">Hiệu lực</span>
          <strong>{item.validity}</strong>
        </div>
        <div>
          <span className="meta-label">Đã sử dụng</span>
          <strong>{item.usage}</strong>
        </div>
      </div>

      <div className="promotion-condition-box">
        <span className="meta-label">Điều kiện áp dụng</span>
        <p>{item.condition}</p>
      </div>

      <div className="promotion-actions">
        <button className="promotion-btn subtle">Tạm dừng</button>
        <button className="promotion-btn secondary">Nhân bản</button>
        <button className="promotion-btn primary">Chỉnh sửa</button>
      </div>
    </article>
  )
}

function Promotions() {
  return (
    <div className="promotions-page">
      <section className="promotions-hero">
        <div>
          <span className="page-kicker">Quản lý khuyến mãi</span>
          <h1 className="page-title">Promotions / Voucher</h1>
          <p className="page-subtitle">Tạo mã voucher, đặt điều kiện áp dụng và theo dõi hiệu quả các chương trình khuyến mãi theo thời gian thực.</p>
        </div>

        <div className="promotions-hero-stats">
          <div className="hero-stat-card">
            <span className="hero-stat-value">12</span>
            <span className="hero-stat-label">Mã đang chạy</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">328</span>
            <span className="hero-stat-label">Lượt sử dụng</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">3</span>
            <span className="hero-stat-label">Sắp hết hạn</span>
          </div>
        </div>
      </section>

      <section className="promotions-summary-grid">
        {promotionSummary.map((item) => (
          <article className="summary-card" key={item.label}>
            <span className="summary-label">{item.label}</span>
            <span className="summary-value">{item.value}</span>
            <span className="summary-trend">{item.note}</span>
          </article>
        ))}
      </section>

      <section className="promotions-grid">
        <div className="promotions-main">
          <article className="promotions-panel promo-form-panel">
            <div className="card-head">
              <div>
                <h2 className="card-title">Tạo mã khuyến mãi</h2>
                <p className="card-desc">Thiết lập voucher mới với mức giảm và điều kiện áp dụng cụ thể</p>
              </div>
            </div>

            <form className="promotion-form">
              <div className="form-grid">
                <label className="field">
                  <span>Tên chương trình</span>
                  <input type="text" placeholder="Ví dụ: Giảm 10% khách mới" />
                </label>
                <label className="field">
                  <span>Mã voucher</span>
                  <input type="text" placeholder="COSPLAY10" />
                </label>
                <label className="field">
                  <span>Loại khuyến mãi</span>
                  <select defaultValue="percent">
                    <option value="percent">Giảm theo phần trăm</option>
                    <option value="amount">Giảm theo số tiền</option>
                    <option value="shipping">Miễn phí giao hàng</option>
                  </select>
                </label>
                <label className="field">
                  <span>Giá trị giảm</span>
                  <input type="text" placeholder="10% hoặc 100000" />
                </label>
                <label className="field">
                  <span>Ngày bắt đầu</span>
                  <input type="date" />
                </label>
                <label className="field">
                  <span>Ngày kết thúc</span>
                  <input type="date" />
                </label>
                <label className="field">
                  <span>Đơn tối thiểu</span>
                  <input type="text" placeholder="500000" />
                </label>
                <label className="field">
                  <span>Giới hạn lượt dùng</span>
                  <input type="number" placeholder="300" />
                </label>
              </div>

              <div className="condition-grid">
                <label className="field field-wide">
                  <span>Đối tượng áp dụng</span>
                  <select defaultValue="new-customer">
                    <option value="new-customer">Khách hàng mới</option>
                    <option value="vip">Khách VIP</option>
                    <option value="all">Tất cả khách hàng</option>
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Sản phẩm áp dụng</span>
                  <select defaultValue="all-costumes">
                    <option value="all-costumes">Toàn bộ trang phục</option>
                    <option value="new-arrivals">Bộ sưu tập mới</option>
                    <option value="event-costumes">Trang phục sự kiện</option>
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Điều kiện bổ sung</span>
                  <textarea rows="4" placeholder="Ví dụ: Mỗi khách chỉ dùng 1 lần, không áp dụng cùng ưu đãi khác." />
                </label>
              </div>

              <div className="promo-template-row">
                {voucherTemplates.map((template) => (
                  <button type="button" className="template-chip" key={template.code}>
                    <strong>{template.code}</strong>
                    <span>{template.label}</span>
                    <small>{template.desc}</small>
                  </button>
                ))}
              </div>

              <div className="promotion-actions-row">
                <button type="button" className="promotion-btn subtle">Lưu nháp</button>
                <button type="button" className="promotion-btn secondary">Xem trước</button>
                <button type="submit" className="promotion-btn primary">Tạo voucher</button>
              </div>
            </form>
          </article>

          <div className="promotion-list">
            {activePromotions.map((item) => (
              <PromotionCard key={item.code} item={item} />
            ))}
          </div>
        </div>

        <aside className="promotions-sidebar">
          <article className="promotions-panel compact-panel">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Điều kiện áp dụng</h2>
                <p className="card-desc">Các cấu hình quan trọng cần theo dõi trước khi phát hành</p>
              </div>
            </div>

            <div className="rules-list">
              {applicationRules.map((rule) => (
                <div className="rule-item" key={rule.label}>
                  <div>
                    <h3>{rule.label}</h3>
                    <p>{rule.hint}</p>
                  </div>
                  <strong>{rule.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="promotions-panel compact-panel highlight-panel">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Mẹo triển khai</h2>
                <p className="card-desc">Gợi ý để chương trình khuyến mãi dễ dùng và ít lỗi</p>
              </div>
            </div>

            <div className="tips-list">
              <div className="tip-item">
                <span>01</span>
                <p>Đặt mã ngắn, dễ nhớ và phản ánh đúng chiến dịch để khách dễ nhập.</p>
              </div>
              <div className="tip-item">
                <span>02</span>
                <p>Luôn đặt đơn tối thiểu để giữ biên lợi nhuận khi chạy khuyến mãi phần trăm.</p>
              </div>
              <div className="tip-item">
                <span>03</span>
                <p>Giới hạn số lượt dùng theo từng khách để tránh lạm dụng voucher.</p>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}

export default Promotions
