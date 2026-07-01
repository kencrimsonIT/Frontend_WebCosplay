import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getNewestProducts, getBestSellerProducts } from '../api/product_api'
import ProductCard from '../components/ProductCard'
import '../styles/Home.css'

// Giữ lại các icon và text trau chuốt từ code cũ của bạn
const features = [
  {
    icon: '💎',
    title: 'Chất Lượng Cao',
    desc: 'Mỗi bộ trang phục được kiểm tra kỹ lưỡng, bảo quản hoàn hảo để bạn luôn tỏa sáng.',
  },
  {
    icon: '💰',
    title: 'Giá Hợp Lý',
    desc: 'Mức giá cạnh tranh nhất thị trường, phù hợp với mọi ngân sách từ sinh viên đến chuyên nghiệp.',
  },
  {
    icon: '🚚',
    title: 'Giao Hàng Nhanh',
    desc: 'Hỗ trợ giao hàng trong ngày tại TP.HCM, ship toàn quốc an toàn và đúng hẹn.',
  },
  {
    icon: '👥',
    title: 'Tư Vấn Miễn Phí',
    desc: 'Đội ngũ stylist am hiểu cosplay sẵn sàng giúp bạn chọn bộ outfit hoàn hảo nhất.',
  },
]

// Component hiển thị danh sách sản phẩm từ code mới
function ProductSection({ title, badge, products, loading }) {
  return (
      <section className="product-section">
        <div className="section-header">
          <span className="section-label">{badge}</span>
          <h2 className="section-title">{title}</h2>
        </div>
        {loading ? (
            <div className="section-loading">
              {[...Array(4)].map((_, i) => (
                  <div key={i} className="product-skeleton" />
              ))}
            </div>
        ) : (
            <div className="products-grid">
              {products.map(p => (
                  <ProductCard key={p.id} product={p} />
              ))}
            </div>
        )}
        <div className="section-footer">
          <Link to="/products" className="btn-see-all">
            Xem Tất Cả
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </section>
  )
}

function Home() {
  // Logic gọi API từ code mới
  const [newest, setNewest]         = useState([])
  const [bestSeller, setBestSeller] = useState([])
  const [loadingNew, setLoadingNew] = useState(true)
  const [loadingBest, setLoadingBest] = useState(true)

  useEffect(() => {
    getNewestProducts(8)
        .then(res => setNewest(res.data ?? []))
        .catch(() => setNewest([]))
        .finally(() => setLoadingNew(false))

    getBestSellerProducts(8)
        .then(res => setBestSeller(res.data ?? []))
        .catch(() => setBestSeller([]))
        .finally(() => setLoadingBest(false))
  }, [])

  return (
      <div className="home">
        {/* ═════ HERO SECTION (Giữ nguyên văn bản đầy đủ của code cũ) ═════ */}
        <section className="hero">
          <div className="hero-bg-orbs">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
          </div>

          <div className="hero-content">
          <span className="hero-badge">
            <span className="badge-icon">✦</span>
            Cho Thuê Trang Phục Cosplay Cao Cấp
          </span>

            <h1 className="hero-title">
              Hóa Thân Thành<br/>
              <span className="hero-title-accent"> Nhân Vật Yêu Thích</span>
            </h1>

            <p className="hero-subtitle">
              Hàng trăm bộ trang phục cosplay chất lượng cao từ anime, game, fantasy và siêu anh hùng — sẵn sàng để bạn tỏa sáng tại mọi sự kiện.
            </p>

            <div className="hero-actions">
              <Link to="/products" className="btn-hero-primary">
                <span>Khám Phá Ngay</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link to="/contact" className="btn-hero-outline">
                Tư Vấn Miễn Phí
              </Link>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-num">200+</span>
                <span className="hero-stat-label">Trang Phục</span>
              </div>
              <div className="hero-stat-sep" />
              <div className="hero-stat">
                <span className="hero-stat-num">1.5K+</span>
                <span className="hero-stat-label">Khách Hàng</span>
              </div>
              <div className="hero-stat-sep" />
              <div className="hero-stat">
                <span className="hero-stat-num">4.9★</span>
                <span className="hero-stat-label">Đánh Giá</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═════ SẢN PHẨM MỚI NHẤT & BÁN CHẠY NHẤT (Chèn code mới vào đây) ═════ */}
        <div className="home-products-container">
          <ProductSection
              title="Sản Phẩm Mới Nhất"
              badge="✦ Vừa Cập Nhật"
              products={newest}
              loading={loadingNew}
          />

          <ProductSection
              title="Bán Chạy Nhất"
              badge="🔥 Được Yêu Thích"
              products={bestSeller}
              loading={loadingBest}
          />
        </div>

        {/* ═════ FEATURES SECTION ═════ */}
        <section className="features">
          <div className="features-container">
            <div className="section-header">
              <span className="section-label">✦ Tại Sao Chọn Chúng Tôi</span>
              <h2 className="section-title">Trải Nghiệm Đỉnh Cao</h2>
            </div>

            <div className="features-grid">
              {features.map((f, i) => (
                  <article className="feature-card" key={i}>
                    <div className="feature-icon">{f.icon}</div>
                    <h3 className="feature-title">{f.title}</h3>
                    <p className="feature-desc">{f.desc}</p>
                  </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═════ CTA SECTION ═════ */}
        <section className="cta-banner">
          <div className="cta-glow" />
          <div className="cta-container">
            <div className="cta-content">
              <h2 className="cta-title">Sẵn Sàng Biến Ước Mơ Thành Hiện Thực?</h2>
              <p className="cta-sub">Duyệt qua bộ sưu tập của chúng tôi và tìm bộ trang phục hoàn hảo ngay hôm nay</p>
              <Link to="/products" className="btn-hero-primary">
                Xem Tất Cả Sản Phẩm
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </div>
  )
}

export default Home