import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../styles/ResetPassword.css';
import { resetPassword } from '../api/auth_api';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmNewPassword: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.newPassword) {
            setError('Vui lòng nhập mật khẩu mới.');
            return;
        }
        if (formData.newPassword.length < 8) {
            setError('Mật khẩu phải có ít nhất 8 ký tự.');
            return;
        }
        if (formData.newPassword !== formData.confirmNewPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await resetPassword({
                token,
                newPassword: formData.newPassword,
                confirmNewPassword: formData.confirmNewPassword
            });
            setSubmitted(true);
        } catch (err) {
            setError(err.error || err.message || 'Đã có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="reset-password-body" style={{ textAlign: 'center' }}>
                        <p className="reset-password-error-main">Liên kết không hợp lệ hoặc đã hết hạn.</p>
                        <Link to="/" className="reset-password-back-btn" style={{ marginTop: '20px' }}>
                            Quay lại trang chủ
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <div className="reset-password-header">
                    <div className="reset-password-logo">
                        <span className="reset-password-logo-icon">⛩</span>
                        <span className="reset-password-logo-text">COSPLAY</span>
                    </div>
                    <h2>Đặt lại mật khẩu</h2>
                    <p className="reset-password-subtitle">
                        Tạo mật khẩu mới cho tài khoản của bạn.
                    </p>
                </div>

                <div className="reset-password-body">
                    {submitted ? (
                        <div className="reset-password-success">
                            <div className="reset-password-success-icon">✓</div>
                            <h3>Thành công!</h3>
                            <p>Mật khẩu của bạn đã được thay đổi thành công.</p>
                            <Link to="/" className="reset-password-back-btn">
                                Đăng nhập ngay
                            </Link>
                        </div>
                    ) : (
                        <form className="reset-password-form" onSubmit={handleSubmit} noValidate>
                            {error && <p className="reset-password-error-main">{error}</p>}
                            
                            <div className="reset-password-field">
                                <label className="reset-password-label" htmlFor="newPassword">Mật khẩu mới</label>
                                <div className="reset-password-input-wrap">
                                    <span className="reset-password-icon">🔒</span>
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type={showPw ? 'text' : 'password'}
                                        className={`reset-password-input ${error && !formData.newPassword ? 'reset-password-input-error' : ''}`}
                                        placeholder="Ít nhất 8 ký tự"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="reset-password-pw-toggle"
                                        onClick={() => setShowPw((v) => !v)}
                                    >
                                        {showPw ? '🙈' : '👁'}
                                    </button>
                                </div>
                            </div>

                            <div className="reset-password-field">
                                <label className="reset-password-label" htmlFor="confirmNewPassword">Xác nhận mật khẩu</label>
                                <div className="reset-password-input-wrap">
                                    <span className="reset-password-icon">🔐</span>
                                    <input
                                        id="confirmNewPassword"
                                        name="confirmNewPassword"
                                        type={showPw2 ? 'text' : 'password'}
                                        className={`reset-password-input ${error && formData.newPassword !== formData.confirmNewPassword ? 'reset-password-input-error' : ''}`}
                                        placeholder="Nhập lại mật khẩu"
                                        value={formData.confirmNewPassword}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="reset-password-pw-toggle"
                                        onClick={() => setShowPw2((v) => !v)}
                                    >
                                        {showPw2 ? '🙈' : '👁'}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="reset-password-submit-btn" disabled={loading}>
                                {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
