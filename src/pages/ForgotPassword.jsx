import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ForgotPassword.css';
import { forgotPassword } from '../api/auth_api';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Vui lòng nhập email.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Email không hợp lệ.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await forgotPassword(email);
            setSubmitted(true);
        } catch (err) {
            setError(err.error || err.message || 'Đã có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="forgot-password-header">
                    <div className="forgot-password-logo">
                        <span className="forgot-password-logo-icon">⛩</span>
                        <span className="forgot-password-logo-text">COSPLAY</span>
                    </div>
                    <h2>Quên mật khẩu?</h2>
                    <p className="forgot-password-subtitle">
                        Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn để đặt lại mật khẩu.
                    </p>
                </div>

                <div className="forgot-password-body">
                    {submitted ? (
                        <div className="forgot-password-success">
                            <div className="forgot-password-success-icon">✓</div>
                            <h3>Đã gửi email!</h3>
                            <p>
                                Vui lòng kiểm tra hộp thư đến <strong>{email}</strong> và làm theo hướng dẫn để đặt lại mật khẩu.
                            </p>
                            <Link to="/" className="forgot-password-back-btn">
                                Quay lại trang chủ
                            </Link>
                        </div>
                    ) : (
                        <form className="forgot-password-form" onSubmit={handleSubmit} noValidate>
                            {error && <p className="forgot-password-error-main">{error}</p>}
                            
                            <div className="forgot-password-field">
                                <label className="forgot-password-label" htmlFor="email">Email</label>
                                <div className="forgot-password-input-wrap">
                                    <span className="forgot-password-icon">✉</span>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        className={`forgot-password-input ${error ? 'forgot-password-input-error' : ''}`}
                                        placeholder="email@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="forgot-password-submit-btn" disabled={loading}>
                                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </button>

                            <div className="forgot-password-footer">
                                <Link to="/" className="forgot-password-back-link">
                                    ← Quay lại trang chủ
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
