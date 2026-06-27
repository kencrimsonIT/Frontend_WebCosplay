import '../styles/Reviews.css'

const reviewSummary = [
  { label: 'Đánh giá mới hôm nay', value: '26', note: '+8 phản hồi cần duyệt' },
  { label: 'Điểm trung bình', value: '4.8/5', note: 'Tăng 0.2 so với tuần trước' },
  { label: 'Đã phản hồi', value: '91%', note: 'Tỷ lệ phản hồi trong 24 giờ' },
  { label: 'Khách cần liên hệ', value: '7', note: 'Có 3 đánh giá 2 sao trở xuống' },
]

const reviewFilters = [
  { label: 'Tất cả', count: 128, active: true },
  { label: 'Chưa phản hồi', count: 18 },
  { label: '1-2 sao', count: 7 },
  { label: 'Có ảnh đính kèm', count: 23 },
]

const reviews = [
  {
    id: 'RV-2406-01',
    customer: 'Lê Thảo Vy',
    costume: 'Nezuko Kamado Premium',
    rating: 5,
    date: '06/04/2026',
    channel: 'Website',
    status: 'Đã phản hồi',
    sentiment: 'positive',
    comment: 'Đồ rất sạch, lên form đẹp và nhân viên hỗ trợ chỉnh phụ kiện cực nhanh. Mình sẽ thuê lại cho sự kiện tuần sau.',
    response: 'Cảm ơn Vy, shop đã ghi chú size và phụ kiện để hỗ trợ bạn nhanh hơn ở lần thuê tiếp theo.',
  },
  {
    id: 'RV-2406-02',
    customer: 'Trần Minh Khang',
    costume: 'Spider-Man Movie Suit',
    rating: 3,
    date: '06/04/2026',
    channel: 'Facebook',
    status: 'Chờ phản hồi',
    sentiment: 'neutral',
    comment: 'Trang phục ổn nhưng giao hàng sát giờ hơn dự kiến nên mình hơi cập rập. Mong shop cải thiện khâu xác nhận ship.',
    response: '',
  },
  {
    id: 'RV-2406-03',
    customer: 'Nguyễn Hà My',
    costume: 'Sailor Moon Deluxe',
    rating: 2,
    date: '05/04/2026',
    channel: 'Website',
    status: 'Ưu tiên xử lý',
    sentiment: 'negative',
    comment: 'Váy đẹp nhưng nơ áo bị lệch nhẹ và mình phải tự chỉnh lại trước giờ chụp. Cần kiểm tra kỹ hơn trước khi giao.',
    response: '',
  },
  {
    id: 'RV-2406-04',
    customer: 'Phạm Hoàng Long',
    costume: 'Raiden Shogun',
    rating: 4,
    date: '05/04/2026',
    channel: 'Zalo',
    status: 'Đã phản hồi',
    sentiment: 'positive',
    comment: 'Chất liệu đẹp, chụp ảnh lên ổn. Nếu thêm hướng dẫn mặc nhanh cho người mới thì sẽ tiện hơn nhiều.',
    response: 'Shop đã bổ sung thẻ hướng dẫn mặc nhanh vào đơn Raiden từ hôm nay, cảm ơn bạn đã góp ý rất hữu ích.',
  },
]

const responseQueue = [
  {
    customer: 'Nguyễn Hà My',
    priority: 'Cao',
    issue: 'Phản hồi 2 sao về lỗi phụ kiện',
    action: 'Liên hệ xin lỗi và tặng voucher 15%',
  },
  {
    customer: 'Trần Minh Khang',
    priority: 'Trung bình',
    issue: 'Phàn nàn giao hàng sát giờ',
    action: 'Xác nhận lại quy trình giao nhận',
  },
  {
    customer: 'Khánh Linh Studio',
    priority: 'Thấp',
    issue: 'Xin ảnh hậu trường để đăng lại',
    action: 'Gửi tin nhắn cảm ơn và xin phép sử dụng ảnh',
  },
]

const feedbackTopics = [
  { label: 'Chất lượng trang phục', value: 88 },
  { label: 'Tốc độ hỗ trợ', value: 76 },
  { label: 'Giao nhận đúng giờ', value: 61 },
  { label: 'Phụ kiện đi kèm', value: 69 },
]

function StarRating({ value }) {
  return (
    <div className="review-stars" aria-label={`${value} sao`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < value ? 'filled' : ''}>★</span>
      ))}
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <article className={`review-card review-${review.sentiment}`}>
      <div className="review-card-head">
        <div>
          <div className="review-card-topline">
            <h3>{review.customer}</h3>
            <span className="review-id">{review.id}</span>
          </div>
          <p className="review-product">{review.costume}</p>
        </div>

        <div className="review-card-side">
          <StarRating value={review.rating} />
          <span className={`review-status ${review.sentiment}`}>{review.status}</span>
        </div>
      </div>

      <div className="review-meta">
        <span>{review.date}</span>
        <span>{review.channel}</span>
      </div>

      <p className="review-comment">{review.comment}</p>

      <div className="review-response-box">
        <span className="response-label">Phản hồi từ shop</span>
        <p>{review.response || 'Chưa có phản hồi. Nên xử lý trong 24 giờ để giữ trải nghiệm khách hàng.'}</p>
      </div>

      <div className="review-actions">
        <button className="review-btn subtle">Ẩn đánh giá</button>
        <button className="review-btn secondary">Soạn phản hồi</button>
        <button className="review-btn primary">Xem chi tiết</button>
      </div>
    </article>
  )
}

function Reviews() {
  return (
    <div className="reviews-page">
      <section className="reviews-hero">
        <div>
          <span className="page-kicker">Quản lý đánh giá</span>
          <h1 className="page-title">Reviews / Feedback</h1>
          <p className="page-subtitle">Theo dõi đánh giá, ý kiến phản hồi và xử lý các trường hợp cần chăm sóc khách hàng ngay.</p>
        </div>

        <div className="reviews-hero-stats">
          <div className="hero-stat-card">
            <span className="hero-stat-value">4.8</span>
            <span className="hero-stat-label">Điểm trung bình</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">18</span>
            <span className="hero-stat-label">Chờ phản hồi</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">7</span>
            <span className="hero-stat-label">Cần ưu tiên</span>
          </div>
        </div>
      </section>

      <section className="reviews-summary-grid">
        {reviewSummary.map((item) => (
          <article className="summary-card" key={item.label}>
            <span className="summary-label">{item.label}</span>
            <span className="summary-value">{item.value}</span>
            <span className="summary-trend">{item.note}</span>
          </article>
        ))}
      </section>

      <section className="reviews-grid">
        <div className="reviews-main">
          <article className="reviews-panel filter-panel">
            <div className="card-head">
              <div>
                <h2 className="card-title">Bộ lọc đánh giá</h2>
                <p className="card-desc">Ưu tiên xử lý các đánh giá chưa phản hồi và nhóm có điểm thấp</p>
              </div>
            </div>

            <div className="filter-chip-list">
              {reviewFilters.map((filter) => (
                <button key={filter.label} className={`filter-chip ${filter.active ? 'active' : ''}`}>
                  <span>{filter.label}</span>
                  <strong>{filter.count}</strong>
                </button>
              ))}
            </div>
          </article>

          <div className="review-list">
            {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
          </div>
        </div>

        <aside className="reviews-sidebar">
          <article className="reviews-panel compact-panel">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Hàng chờ phản hồi</h2>
                <p className="card-desc">Các khách hàng nên được liên hệ sớm</p>
              </div>
            </div>

            <div className="queue-list">
              {responseQueue.map((item) => (
                <div className="queue-item" key={`${item.customer}-${item.issue}`}>
                  <div>
                    <h3>{item.customer}</h3>
                    <p>{item.issue}</p>
                  </div>
                  <div className="queue-meta">
                    <span>{item.priority}</span>
                    <strong>{item.action}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="reviews-panel compact-panel highlight-panel">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Chủ đề phản hồi</h2>
                <p className="card-desc">Những nhóm nội dung khách nhắc đến nhiều nhất</p>
              </div>
            </div>

            <div className="topic-list">
              {feedbackTopics.map((topic) => (
                <div className="topic-row" key={topic.label}>
                  <div className="topic-head">
                    <span>{topic.label}</span>
                    <strong>{topic.value}%</strong>
                  </div>
                  <div className="topic-track">
                    <div className="topic-fill" style={{ width: `${topic.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}

export default Reviews
