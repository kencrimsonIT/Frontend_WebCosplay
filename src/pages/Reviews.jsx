import { useEffect, useMemo, useState } from 'react'
import {
  getSellerReviews,
  respondSellerReview,
  updateSellerReviewVisibility,
} from '../api/review_api'
import '../styles/Reviews.css'

const FILTERS = [
  { key: '', label: 'Tat ca' },
  { key: 'VISIBLE', label: 'Dang hien' },
  { key: 'HIDDEN', label: 'Da an' },
]

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN')
}

function StarRating({ value }) {
  return (
    <div className="review-stars" aria-label={`${value} sao`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < value ? 'filled' : ''}>*</span>
      ))}
    </div>
  )
}

function ReviewCard({ review, onRespond, onVisibility }) {
  const [responseText, setResponseText] = useState(review.sellerResponse || '')
  const [busy, setBusy] = useState(false)
  const sentiment = review.rating <= 2 ? 'negative' : review.rating === 3 ? 'neutral' : 'positive'

  const submitResponse = async () => {
    if (!responseText.trim()) return
    setBusy(true)
    try {
      await onRespond(review.id, responseText)
    } finally {
      setBusy(false)
    }
  }

  const toggleVisibility = async () => {
    setBusy(true)
    try {
      await onVisibility(review.id, review.status === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`review-card review-${sentiment}`}>
      <div className="review-card-head">
        <div>
          <div className="review-card-topline">
            <h3>{review.buyerName}</h3>
            <span className="review-id">#{review.id}</span>
          </div>
          <p className="review-product">{review.productName} - {review.orderCode}</p>
        </div>

        <div className="review-card-side">
          <StarRating value={review.rating} />
          <span className={`review-status ${sentiment}`}>
            {review.status === 'VISIBLE' ? 'Dang hien' : 'Da an'}
          </span>
        </div>
      </div>

      <div className="review-meta">
        <span>{formatDate(review.createdAt)}</span>
        <span>{review.sellerResponse ? 'Da phan hoi' : 'Chua phan hoi'}</span>
        <span>{review.likeCount ?? 0} luot thich</span>
      </div>

      <p className="review-comment">{review.content}</p>

      {review.imageUrls?.length > 0 && (
        <div className="review-image-list">
          {review.imageUrls.map(url => <img key={url} src={url} alt="Review" />)}
        </div>
      )}

      <div className="review-response-box">
        <span className="response-label">Phan hoi tu shop</span>
        <textarea
          value={responseText}
          onChange={event => setResponseText(event.target.value)}
          placeholder="Nhap phan hoi lich su, ro cach shop xu ly neu co van de..."
        />
        {review.sellerRespondedAt && <p>Cap nhat: {formatDate(review.sellerRespondedAt)}</p>}
      </div>

      <div className="review-actions">
        <button className="review-btn subtle" type="button" onClick={toggleVisibility} disabled={busy}>
          {review.status === 'VISIBLE' ? 'An danh gia' : 'Hien lai'}
        </button>
        <button className="review-btn secondary" type="button" onClick={submitResponse} disabled={busy || !responseText.trim()}>
          Luu phan hoi
        </button>
      </div>
    </article>
  )
}

function Reviews() {
  const [filter, setFilter] = useState('')
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReviews = async (status = filter) => {
    setLoading(true)
    setError('')
    try {
      const data = await getSellerReviews(status ? { status } : {})
      setReviews(data.reviews || [])
      setSummary(data.summary || null)
    } catch (err) {
      setError(err?.message || 'Khong tai duoc danh sach danh gia.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews(filter)
  }, [filter])

  const lowRating = useMemo(() => reviews.filter(item => item.rating <= 2), [reviews])
  const pendingResponse = useMemo(() => reviews.filter(item => !item.sellerResponse), [reviews])

  const respond = async (id, responseText) => {
    await respondSellerReview(id, responseText)
    await loadReviews()
  }

  const updateVisibility = async (id, status) => {
    await updateSellerReviewVisibility(id, status)
    await loadReviews()
  }

  return (
    <div className="reviews-page">
      <section className="reviews-hero">
        <div>
          <span className="page-kicker">Quan ly danh gia</span>
          <h1 className="page-title">Reviews / Feedback</h1>
          <p className="page-subtitle">Theo doi danh gia that tu don hang da hoan thanh va phan hoi khach hang.</p>
        </div>

        <div className="reviews-hero-stats">
          <div className="hero-stat-card">
            <span className="hero-stat-value">{summary?.averageRating ?? 0}</span>
            <span className="hero-stat-label">Diem TB</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{summary?.pendingResponse ?? 0}</span>
            <span className="hero-stat-label">Cho phan hoi</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{summary?.lowRatingReviews ?? 0}</span>
            <span className="hero-stat-label">1-2 sao</span>
          </div>
        </div>
      </section>

      <section className="reviews-summary-grid">
        <article className="summary-card">
          <span className="summary-label">Tong danh gia</span>
          <span className="summary-value">{summary?.totalReviews ?? 0}</span>
          <span className="summary-trend">Tat ca review cua san pham shop</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Dang hien</span>
          <span className="summary-value">{summary?.visibleReviews ?? 0}</span>
          <span className="summary-trend">Khach co the xem</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Da an</span>
          <span className="summary-value">{summary?.hiddenReviews ?? 0}</span>
          <span className="summary-trend">Chi seller quan ly</span>
        </article>
        <article className="summary-card">
          <span className="summary-label">Can uu tien</span>
          <span className="summary-value">{lowRating.length}</span>
          <span className="summary-trend">Review diem thap trong bo loc hien tai</span>
        </article>
      </section>

      <section className="reviews-grid">
        <div className="reviews-main">
          <article className="reviews-panel filter-panel">
            <div className="card-head">
              <div>
                <h2 className="card-title">Bo loc danh gia</h2>
                <p className="card-desc">Loc theo trang thai hien thi de seller xu ly nhanh.</p>
              </div>
            </div>

            <div className="filter-chip-list">
              {FILTERS.map(item => (
                <button
                  key={item.key}
                  type="button"
                  className={`filter-chip ${filter === item.key ? 'active' : ''}`}
                  onClick={() => setFilter(item.key)}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </article>

          {loading && <article className="reviews-panel"><p className="card-desc">Dang tai danh gia...</p></article>}
          {error && !loading && <article className="reviews-panel"><p className="card-desc">{error}</p></article>}
          {!loading && !error && (
            <div className="review-list">
              {reviews.length === 0 ? (
                <article className="reviews-panel"><p className="card-desc">Chua co danh gia nao.</p></article>
              ) : reviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onRespond={respond}
                  onVisibility={updateVisibility}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="reviews-sidebar">
          <article className="reviews-panel compact-panel">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Hang cho phan hoi</h2>
                <p className="card-desc">Nen tra loi cac review nay som.</p>
              </div>
            </div>

            <div className="queue-list">
              {pendingResponse.length === 0 ? (
                <p className="card-desc">Khong co review dang cho.</p>
              ) : pendingResponse.slice(0, 5).map(item => (
                <div className="queue-item" key={item.id}>
                  <div>
                    <h3>{item.buyerName}</h3>
                    <p>{item.productName}</p>
                  </div>
                  <div className="queue-meta">
                    <span>{item.rating} sao</span>
                    <strong>{item.content}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="reviews-panel compact-panel highlight-panel">
            <div className="card-head compact-head">
              <div>
                <h2 className="card-title">Can uu tien</h2>
                <p className="card-desc">Review 1-2 sao de shop xu ly chat luong.</p>
              </div>
            </div>

            <div className="queue-list">
              {lowRating.length === 0 ? (
                <p className="card-desc">Chua co review diem thap.</p>
              ) : lowRating.slice(0, 5).map(item => (
                <div className="queue-item" key={item.id}>
                  <div>
                    <h3>{item.productName}</h3>
                    <p>{item.content}</p>
                  </div>
                  <div className="queue-meta">
                    <span>{item.rating} sao</span>
                    <strong>{formatDate(item.createdAt)}</strong>
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
