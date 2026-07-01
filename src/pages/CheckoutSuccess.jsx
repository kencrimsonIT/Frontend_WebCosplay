import { Link, useSearchParams } from 'react-router-dom'
import '../styles/Checkout.css'

function CheckoutSuccess() {
    const [searchParams] = useSearchParams()
    const orderCode = searchParams.get('orderCode') || '—'

    return (
        <div className="checkout-page">
            <div className="checkout-success">
                <div className="success-icon-wrap">
                    <div className="success-icon">✓</div>
                </div>
                <h1 className="success-title">Thanh toán thành công!</h1>
                <p className="success-order-id">Mã đơn: <strong>{orderCode}</strong></p>
                <p className="success-note">
                    Đơn hàng đã được ghi nhận. Seller sẽ xem xét và xác nhận trong thời gian sớm nhất.
                </p>
                <div className="success-actions">
                    <Link to="/orders" className="btn-view-orders">Xem đơn của tôi</Link>
                    <Link to="/products" className="btn-continue-shopping">Tiếp tục mua sắm</Link>
                </div>
            </div>
        </div>
    )
}

export default CheckoutSuccess
