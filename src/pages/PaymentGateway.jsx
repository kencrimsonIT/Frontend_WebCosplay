import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPayment } from '../api/payment_api'
import '../styles/PaymentGateway.css'

function PaymentGateway({ provider }) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const txnRef = searchParams.get('txnRef') || ''
    const orderCode = searchParams.get('orderCode') || ''
    const amount = Number(searchParams.get('amount') || 0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const providerLabel = provider === 'momo' ? 'MoMo' : 'VNPay'
    const providerColor = provider === 'momo' ? '#a50064' : '#0066b3'

    const handlePay = async (success) => {
        if (!txnRef) {
            setError('Thiếu mã giao dịch')
            return
        }
        setLoading(true)
        setError('')
        try {
            // 3. Gọi trực tiếp hàm confirmPayment
            await confirmPayment(txnRef, success)
            navigate(`/checkout/success?orderCode=${encodeURIComponent(orderCode)}`, { replace: true })
        } catch (err) {
            // 4. Cách lấy tin nhắn lỗi chuẩn của Axios (lấy từ Backend trả về)
            const errorMessage = err.response?.data?.message || err.message || 'Thanh toán thất bại'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="payment-gateway-page">
            <div className="payment-gateway-card" style={{ borderTopColor: providerColor }}>
                <div className="payment-provider-logo" style={{ background: providerColor }}>
                    {providerLabel}
                </div>
                <h1>Cổng thanh toán {providerLabel}</h1>
                <p className="payment-gateway-sub">Mô phỏng thanh toán trực tuyến (demo)</p>

                <div className="payment-info-box">
                    <div><span>Mã đơn</span><strong>{orderCode || '—'}</strong></div>
                    <div><span>Mã GD</span><strong>{txnRef || '—'}</strong></div>
                    <div><span>Số tiền</span><strong>{amount.toLocaleString('vi-VN')}đ</strong></div>
                </div>

                {error && <p className="payment-error">{error}</p>}

                <button
                    type="button"
                    className="btn-pay-success"
                    style={{ background: providerColor }}
                    disabled={loading}
                    onClick={() => handlePay(true)}
                >
                    {loading ? 'Đang xử lý...' : `Thanh toán ${amount.toLocaleString('vi-VN')}đ`}
                </button>

                <button
                    type="button"
                    className="btn-pay-cancel"
                    disabled={loading}
                    onClick={() => handlePay(false)}
                >
                    Hủy giao dịch
                </button>

                <Link to="/cart" className="payment-back-link">← Quay lại giỏ hàng</Link>
            </div>
        </div>
    )
}

export function PaymentVNPay() {
    return <PaymentGateway provider="vnpay" />
}

export function PaymentMoMo() {
    return <PaymentGateway provider="momo" />
}

export default PaymentGateway