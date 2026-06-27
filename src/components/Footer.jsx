import { Link } from 'react-router-dom'
import '../components/css/Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-glow" />
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-icon">⛩</span>
            <span className="footer-logo-name">COSPLAY</span>
          </div>
          <p className="footer-tagline">Biến ước mơ thành hiện thực — một bộ trang phục tại một thời điểm.</p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4 className="footer-heading">Điều Hướng</h4>
            <Link to="/" className="footer-link">Trang Chủ</Link>
            <Link to="/products" className="footer-link">Sản Phẩm</Link>
            <Link to="/contact" className="footer-link">Liên Hệ</Link>
          </div>
          <div className="footer-col">
            <h4 className="footer-heading">Liên Hệ</h4>
            <span className="footer-contact-item">📧 info@cosplay.vn</span>
            <span className="footer-contact-item">📞 0123 456 789</span>
            <span className="footer-contact-item">📍 TP. Hồ Chí Minh</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2024 Cho Thuê Đồ Cosplay. Tất cả quyền được bảo vệ.</span>
        <div className="footer-divider" />
        <span>Thiết kế với ♥ tại Việt Nam</span>
      </div>
    </footer>
  )
}

export default Footer