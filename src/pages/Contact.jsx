import { useState } from 'react'
import '../styles/Contact.css'

const CONTACT_INFO = [
    {
        icon: '📍',
        label: 'Địa chỉ',
        value: '123 Nguyễn Huệ, Quận 1',
        sub: 'TP. Hồ Chí Minh',
    },
    {
        icon: '📞',
        label: 'Điện thoại',
        value: '0123 456 789',
        sub: 'Thứ 2 – CN, 8:00 – 21:00',
    },
    {
        icon: '📧',
        label: 'Email',
        value: 'info@cosplay.vn',
        sub: 'Phản hồi trong 2 giờ',
    },
    {
        icon: '💬',
        label: 'Zalo / Facebook',
        value: 'Cosplay.vn',
        sub: 'Nhắn tin để được hỗ trợ nhanh nhất',
    },
]

const FAQ = [
    {
        q: 'Tôi cần đặt cọc bao nhiêu khi thuê?',
        a: 'Tiền cọc thường bằng 150% giá thuê một ngày của trang phục. Toàn bộ số tiền cọc sẽ được hoàn trả ngay khi bạn trả đồ nguyên vẹn.',
    },
    {
        q: 'Có giao hàng tận nơi không?',
        a: 'Có! Chúng tôi hỗ trợ giao và nhận tận nơi trong khu vực TP.HCM với phí 30.000đ. Ship toàn quốc qua đơn vị vận chuyển đối tác.',
    },
    {
        q: 'Tôi có thể hủy đơn không? Có mất phí không?',
        a: 'Bạn có thể hủy miễn phí nếu thông báo trước 48 giờ. Hủy trong vòng 48 giờ sẽ bị giữ lại 30% tổng giá trị đơn thuê.',
    },
    {
        q: 'Nếu trang phục bị hư hỏng thì sao?',
        a: 'Hư hỏng nhỏ (sứt chỉ, bong nút) sẽ được miễn phí sửa chữa. Hư hỏng nặng hoặc mất mát sẽ bồi thường theo giá trị thực tế của trang phục.',
    },
    {
        q: 'Có tư vấn chọn trang phục không?',
        a: 'Có! Đội ngũ stylist của chúng tôi sẵn sàng tư vấn miễn phí. Bạn có thể đến trực tiếp cửa hàng hoặc nhắn tin qua Zalo/Facebook.',
    },
]

function FaqItem({ item, index }) {
    const [open, setOpen] = useState(false)
    return (
        <div className={`faq-item ${open ? 'open' : ''}`} style={{ animationDelay: `${index * 0.07}s` }}>
            <button className="faq-question" onClick={() => setOpen(v => !v)}>
                <span>{item.q}</span>
                <span className="faq-chevron">{open ? '−' : '+'}</span>
            </button>
            {open && <p className="faq-answer">{item.a}</p>}
        </div>
    )
}

function Contact() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', topic: '', message: '' })
    const [errors, setErrors] = useState({})
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)

    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = 'Vui lòng nhập họ tên.'
        if (!form.email.trim()) e.email = 'Vui lòng nhập email.'
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email không hợp lệ.'
        if (!form.message.trim()) e.message = 'Vui lòng nhập nội dung.'
        return e
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(p => ({ ...p, [name]: value }))
        setErrors(p => ({ ...p, [name]: '' }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            setSent(true)
        }, 1400)
    }

    return (
        <div className="contact-page">

            {/* ── HERO ── */}
            <section className="contact-hero">
                <div className="contact-hero-orb orb-a" />
                <div className="contact-hero-orb orb-b" />
                <div className="contact-hero-content">
                    <span className="contact-kicker">✦ Hỗ Trợ &amp; Liên Hệ</span>
                    <h1 className="contact-title">
                        Chúng Tôi Luôn<br />
                        <span className="contact-title-accent">Sẵn Sàng Giúp Bạn</span>
                    </h1>
                    <p className="contact-subtitle">
                        Có câu hỏi về trang phục, đặt thuê hay cần tư vấn?
                        Đội ngũ của chúng tôi phản hồi trong vòng 2 giờ.
                    </p>
                </div>
            </section>

            {/* ── MAIN GRID ── */}
            <section className="contact-main">

                {/* LEFT — Form */}
                <div className="contact-form-wrap">
                    <div className="contact-card">
                        <h2 className="contact-card-title">Gửi Tin Nhắn</h2>
                        <p className="contact-card-desc">Điền form bên dưới, chúng tôi sẽ liên hệ lại sớm nhất có thể.</p>

                        {sent ? (
                            <div className="contact-success">
                                <div className="success-icon">✓</div>
                                <h3>Đã gửi thành công!</h3>
                                <p>Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi qua email trong vòng 2 giờ.</p>
                                <button className="btn-send-again" onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', topic: '', message: '' }) }}>
                                    Gửi tin nhắn khác
                                </button>
                            </div>
                        ) : (
                            <form className="contact-form" onSubmit={handleSubmit} noValidate>
                                <div className="form-row">
                                    <div className="cform-group">
                                        <label className="cform-label" htmlFor="name">Họ và tên *</label>
                                        <div className="cform-input-wrap">
                                            <span className="cform-icon">👤</span>
                                            <input
                                                id="name" name="name" type="text"
                                                className={`cform-input ${errors.name ? 'error' : ''}`}
                                                placeholder="Nguyễn Văn An"
                                                value={form.name} onChange={handleChange}
                                            />
                                        </div>
                                        {errors.name && <p className="cform-error">{errors.name}</p>}
                                    </div>

                                    <div className="cform-group">
                                        <label className="cform-label" htmlFor="email">Email *</label>
                                        <div className="cform-input-wrap">
                                            <span className="cform-icon">✉</span>
                                            <input
                                                id="email" name="email" type="email"
                                                className={`cform-input ${errors.email ? 'error' : ''}`}
                                                placeholder="email@example.com"
                                                value={form.email} onChange={handleChange}
                                            />
                                        </div>
                                        {errors.email && <p className="cform-error">{errors.email}</p>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="cform-group">
                                        <label className="cform-label" htmlFor="phone">Số điện thoại</label>
                                        <div className="cform-input-wrap">
                                            <span className="cform-icon">📞</span>
                                            <input
                                                id="phone" name="phone" type="tel"
                                                className="cform-input"
                                                placeholder="0912 345 678"
                                                value={form.phone} onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="cform-group">
                                        <label className="cform-label" htmlFor="topic">Chủ đề</label>
                                        <div className="cform-input-wrap">
                                            <span className="cform-icon">🏷</span>
                                            <select
                                                id="topic" name="topic"
                                                className="cform-input cform-select"
                                                value={form.topic} onChange={handleChange}
                                            >
                                                <option value="">Chọn chủ đề...</option>
                                                <option value="rental">Đặt thuê trang phục</option>
                                                <option value="consult">Tư vấn trang phục</option>
                                                <option value="order">Vấn đề đơn hàng</option>
                                                <option value="return">Trả / Gia hạn đồ</option>
                                                <option value="other">Khác</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="cform-group">
                                    <label className="cform-label" htmlFor="message">Nội dung *</label>
                                    <textarea
                                        id="message" name="message"
                                        className={`cform-input cform-textarea ${errors.message ? 'error' : ''}`}
                                        placeholder="Mô tả chi tiết câu hỏi hoặc yêu cầu của bạn..."
                                        rows={5}
                                        value={form.message} onChange={handleChange}
                                    />
                                    {errors.message && <p className="cform-error">{errors.message}</p>}
                                </div>

                                <button type="submit" className={`btn-contact-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                                    {loading ? (
                                        <><span className="spinner" />Đang gửi...</>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                            </svg>
                                            Gửi tin nhắn
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* RIGHT — Info */}
                <div className="contact-info-col">

                    {/* Info cards */}
                    <div className="contact-info-grid">
                        {CONTACT_INFO.map((item, i) => (
                            <div className="contact-info-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                                <span className="cinfo-icon">{item.icon}</span>
                                <div>
                                    <p className="cinfo-label">{item.label}</p>
                                    <p className="cinfo-value">{item.value}</p>
                                    <p className="cinfo-sub">{item.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Map placeholder */}
                    <div className="contact-map-card">
                        <div className="map-placeholder">
                            <div className="map-pin">📍</div>
                            <p className="map-address">123 Nguyễn Huệ, Quận 1, TP.HCM</p>
                            <a
                                href="https://maps.google.com/?q=Nguyen+Hue+Ho+Chi+Minh"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-map-open"
                            >
                                Mở Google Maps →
                            </a>
                        </div>
                    </div>

                    {/* Hours */}
                    <div className="contact-hours-card">
                        <h3 className="hours-title">🕐 Giờ Hoạt Động</h3>
                        <div className="hours-list">
                            <div className="hours-row"><span>Thứ 2 – Thứ 6</span><span className="hours-time">8:00 – 21:00</span></div>
                            <div className="hours-row"><span>Thứ 7</span><span className="hours-time">8:00 – 22:00</span></div>
                            <div className="hours-row"><span>Chủ nhật</span><span className="hours-time">9:00 – 20:00</span></div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="contact-faq">
                <div className="faq-header">
                    <span className="contact-kicker">✦ Câu Hỏi Thường Gặp</span>
                    <h2 className="faq-title">Có Thể Bạn Đang Thắc Mắc</h2>
                </div>
                <div className="faq-list">
                    {FAQ.map((item, i) => (
                        <FaqItem key={i} item={item} index={i} />
                    ))}
                </div>
            </section>

        </div>
    )
}

export default Contact