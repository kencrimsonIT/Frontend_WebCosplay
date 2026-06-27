import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';
import { login, register, getGoogleLoginUrl, getFacebookLoginUrl } from '../api/auth_api';
import { useAuth } from '../context/AuthContext';

/**
 * AuthModal
 * Props:
 *   isOpen  {boolean}  – controls visibility
 *   onClose {function} – called when user dismisses the modal
 *   defaultTab {'login' | 'register'} – which form to show first
 */
function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
    const navigate = useNavigate()
    const [tab, setTab] = useState(defaultTab)
    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', confirmPassword: '',
    })
    const [errors, setErrors] = useState({})
    const [showPw, setShowPw] = useState(false)
    const [showPw2, setShowPw2] = useState(false)
    const [pwStrength, setPwStrength] = useState(0)
    const [submitted, setSubmitted] = useState(false)
    const [apiError, setApiError] = useState('')
    const [loading, setLoading] = useState(false)
    
    const { loginUser } = useAuth()

    /* Reset state when tab switches */
    const switchTab = (next) => {
        setTab(next)
        setErrors({})
        setSubmitted(false)
        setFormData({ fullName: '', email: '', password: '', confirmPassword: '' })
        setPwStrength(0)
        setApiError('')
    }

    /* Close on ESC */
    const handleKey = useCallback((e) => {
        if (e.key === 'Escape') onClose()
    }, [onClose])

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKey)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleKey)
            document.body.style.overflow = ''
        }
    }, [isOpen, handleKey])

    /* Sync defaultTab when parent changes it */
    useEffect(() => { setTab(defaultTab) }, [defaultTab])

    if (!isOpen) return null

    /* ── Field change ── */
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        setErrors((prev) => ({ ...prev, [name]: '' }))
        setApiError('')
        if (name === 'password') setPwStrength(calcStrength(value))
    }

    /* ── Password strength ── */
    const calcStrength = (pw) => {
        let s = 0
        if (pw.length >= 8) s++
        if (/[A-Z]/.test(pw)) s++
        if (/[0-9]/.test(pw)) s++
        if (/[^A-Za-z0-9]/.test(pw)) s++
        return s
    }

    const strengthLabel = ['', 'Yếu', 'Trung bình', 'Khá mạnh', 'Rất mạnh']
    const strengthClass = ['', 'weak', 'fair', 'good', 'strong']

    /* ── Validation ── */
    const validateLogin = () => {
        const e = {}
        if (!formData.email) e.email = 'Vui lòng nhập email.'
        else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email không hợp lệ.'
        if (!formData.password) e.password = 'Vui lòng nhập mật khẩu.'
        return e
    }

    const validateRegister = () => {
        const e = {}
        if (!formData.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên.'
        if (!formData.email) e.email = 'Vui lòng nhập email.'
        else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email không hợp lệ.'
        if (!formData.password) e.password = 'Vui lòng nhập mật khẩu.'
        else if (formData.password.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự.'
        if (!formData.confirmPassword) e.confirmPassword = 'Vui lòng xác nhận mật khẩu.'
        else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Mật khẩu không khớp.'
        return e
    }

    /* ── Submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = tab === 'login' ? validateLogin() : validateRegister()
        if (Object.keys(errs).length) { setErrors(errs); return }
        
        setErrors({})
        setApiError('')
        setLoading(true)
        
        try {
            if (tab === 'login') {
                const data = await login({
                    email: formData.email,
                    password: formData.password
                });
                loginUser(data.user, data.accessToken);
                setSubmitted(true);
                setTimeout(() => { 
                    setSubmitted(false); 
                    onClose();
                    if (data.user.role === 'ADMIN') {
                        navigate('/admin');
                    } else if (data.user.role === 'SELLER') {
                        navigate('/seller');
                    }
                }, 1500);
            } else {
                await register({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                });
                setSubmitted(true);
                setTimeout(() => { 
                    setSubmitted(false); 
                    switchTab('login');
                }, 2000);
            }
        } catch (error) {
            setApiError(error.error || error.message || 'Đã có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {/* ── OVERLAY ── */}
            <div className="auth-overlay" onClick={onClose} aria-hidden="true" />

            {/* ── MODAL ── */}
            <div
                className="auth-modal"
                role="dialog"
                aria-modal="true"
                aria-label={tab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            >
                {/* Close button */}
                <button className="auth-close-btn" onClick={onClose} aria-label="Đóng">✕</button>

                {/* Header */}
                <div className="auth-header">
                    <div className="auth-logo">
                        <span className="auth-logo-icon">⛩</span>
                        <span className="auth-logo-text">COSPLAY</span>
                    </div>

                    {/* Tab switcher */}
                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                            onClick={() => switchTab('login')}
                        >
                            Đăng nhập
                        </button>
                        <button
                            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                            onClick={() => switchTab('register')}
                        >
                            Đăng ký
                        </button>
                        <div className={`auth-tab-slider ${tab === 'register' ? 'right' : 'left'}`} />
                    </div>
                </div>

                {/* Body */}
                <div className="auth-body">
                    {/* API Error message */}
                    {apiError && <p className="auth-error" style={{ textAlign: 'center', marginBottom: '16px' }}>{apiError}</p>}

                    {/* Success state */}
                    {submitted ? (
                        <div className="auth-success">
                            <div className="auth-success-icon">✓</div>
                            <p>{tab === 'login' ? 'Đăng nhập thành công! Đang chuyển hướng…' : 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.'}</p>
                        </div>
                    ) : (
                        <form className="auth-form" onSubmit={handleSubmit} noValidate>
                            {/* ... (rest of the form fields) ... */}
                            {/* ── REGISTER ONLY: Full Name ── */}
                            {tab === 'register' && (
                                <div className="auth-field">
                                    <label className="auth-label" htmlFor="fullName">Họ và tên</label>
                                    <div className="auth-input-wrap">
                                        <span className="auth-icon">👤</span>
                                        <input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            className={`auth-input ${errors.fullName ? 'auth-input-error' : ''}`}
                                            placeholder="Nguyễn Văn An"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            autoComplete="name"
                                            disabled={loading}
                                        />
                                    </div>
                                    {errors.fullName && <p className="auth-error">{errors.fullName}</p>}
                                </div>
                            )}

                            {/* ── EMAIL ── */}
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="email">Email</label>
                                <div className="auth-input-wrap">
                                    <span className="auth-icon">✉</span>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                        disabled={loading}
                                    />
                                </div>
                                {errors.email && <p className="auth-error">{errors.email}</p>}
                            </div>

                            {/* ── PASSWORD ── */}
                            <div className="auth-field">
                                <div className="auth-label-row">
                                    <label className="auth-label" htmlFor="password">Mật khẩu</label>
                                    {tab === 'login' && (
                                        <button 
                                            type="button" 
                                            className="auth-forgot" 
                                            disabled={loading}
                                            onClick={() => {
                                                navigate('/forgot-password');
                                                onClose();
                                            }}
                                        >
                                            Quên mật khẩu?
                                        </button>
                                    )}
                                </div>
                                <div className="auth-input-wrap">
                                    <span className="auth-icon">🔒</span>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPw ? 'text' : 'password'}
                                        className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
                                        placeholder={tab === 'register' ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="auth-pw-toggle"
                                        onClick={() => setShowPw((v) => !v)}
                                        aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        disabled={loading}
                                    >
                                        {showPw ? '🙈' : '👁'}
                                    </button>
                                </div>
                                {errors.password && <p className="auth-error">{errors.password}</p>}

                                {/* Strength bar — register only */}
                                {tab === 'register' && formData.password && (
                                    <div className="auth-strength">
                                        <div className="auth-strength-bar">
                                            <div
                                                className={`auth-strength-fill ${strengthClass[pwStrength]}`}
                                                style={{ width: `${(pwStrength / 4) * 100}%` }}
                                            />
                                        </div>
                                        <span className={`auth-strength-label ${strengthClass[pwStrength]}`}>
                      {strengthLabel[pwStrength]}
                    </span>
                                    </div>
                                )}
                            </div>

                            {/* ── REGISTER ONLY: Confirm Password ── */}
                            {tab === 'register' && (
                                <div className="auth-field">
                                    <label className="auth-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                                    <div className="auth-input-wrap">
                                        <span className="auth-icon">🔐</span>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showPw2 ? 'text' : 'password'}
                                            className={`auth-input ${errors.confirmPassword ? 'auth-input-error' : ''}`}
                                            placeholder="Nhập lại mật khẩu"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="auth-pw-toggle"
                                            onClick={() => setShowPw2((v) => !v)}
                                            aria-label={showPw2 ? 'Ẩn' : 'Hiện'}
                                            disabled={loading}
                                        >
                                            {showPw2 ? '🙈' : '👁'}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword}</p>}
                                </div>
                            )}

                            {/* ── SUBMIT ── */}
                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? 'Đang xử lý...' : (tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
                            </button>

                            {/* ── DIVIDER ── */}
                            <div className="auth-divider">
                                <span>hoặc tiếp tục với</span>
                            </div>

                            {/* ── SOCIAL ── */}
                            <div className="auth-social-row">
                                <button 
                                    type="button" 
                                    className="auth-social-btn" 
                                    disabled={loading}
                                    onClick={() => window.location.href = getGoogleLoginUrl()}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Google
                                </button>
                                <button 
                                    type="button" 
                                    className="auth-social-btn" 
                                    disabled={loading}
                                    onClick={() => window.location.href = getFacebookLoginUrl()}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    Facebook
                                </button>
                            </div>

                            {/* ── SWITCH ── */}
                            <p className="auth-switch">
                                {tab === 'login'
                                    ? 'Chưa có tài khoản? '
                                    : 'Đã có tài khoản? '}
                                <button type="button" className="auth-switch-btn" onClick={() => switchTab(tab === 'login' ? 'register' : 'login')} disabled={loading}>
                                    {tab === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                                </button>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </>
    )
}

export default AuthModal