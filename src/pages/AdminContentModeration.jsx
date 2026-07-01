import { useState, useEffect, useCallback } from 'react'
import { getModerationReviews, getModerationStats, moderateReview, getBannedKeywords, updateBannedKeywords } from '../api/moderation_api'
import '../styles/InsuranceAdmin.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'
const STARS = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

const STATUS_TABS = [
    { key: null,       label: 'Tất cả' },
    { key: 'FLAGGED',  label: 'Bị báo cáo' },
    { key: 'PENDING',  label: 'Chờ duyệt' },
    { key: 'APPROVED', label: 'Đã duyệt' },
    { key: 'HIDDEN',   label: 'Đã ẩn' },
]

// Tận dụng lại các class màu sắc từ file CSS của bạn
const STATUS_BADGE = {
    PENDING:  { label: 'Chờ duyệt',   cls: 'status-chờ-xác-minh'  },
    APPROVED: { label: 'Đã duyệt',    cls: 'status-đã-duyệt' },
    HIDDEN:   { label: 'Đã ẩn',       cls: 'status-từ-chối'   },
    FLAGGED:  { label: 'Bị báo cáo',  cls: 'status-đang-xử-lý'  },
}

// ─── Modal Hành Động (Giữ CSS Inline cho đồng bộ với file trước) ───────────────
function ActionModal({ review, onClose, onDone }) {
    const [action, setAction]   = useState('APPROVED')
    const [note, setNote]       = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')

    const handleSubmit = async () => {
        if (action === 'HIDDEN' && !note.trim()) {
            setError('Cần nhập lý do khi ẩn đánh giá'); return
        }
        setLoading(true); setError('')
        try {
            await moderateReview(review.id, action, note)
            onDone(); onClose()
        } catch (e) {
            setError(e?.response?.data?.message || 'Thao tác thất bại')
        } finally { setLoading(false) }
    }

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <h3 style={{marginTop: 0}}>Kiểm duyệt đánh giá</h3>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ color: '#fbbf24', fontSize: '18px', marginBottom: '4px' }}>{STARS(review.rating)}</div>
                    <p style={{ fontStyle: 'italic', marginBottom: '8px' }}>"{review.comment}"</p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                        Bởi: <strong>{review.userName}</strong> · SP: {review.productName}
                    </p>
                    {review.reportCount > 0 && (
                        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px', fontWeight: 'bold' }}>
                            ⚠️ Bị cộng đồng báo cáo {review.reportCount} lần
                        </p>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <button onClick={() => setAction('APPROVED')} className={`insurance-btn ${action === 'APPROVED' ? 'primary' : 'secondary'}`}>✅ Duyệt hiển thị</button>
                    <button onClick={() => setAction('HIDDEN')} className={`insurance-btn ${action === 'HIDDEN' ? 'primary' : 'secondary'}`} style={action === 'HIDDEN' ? {background: '#ef4444', borderColor: '#ef4444'} : {}}>🚫 Ẩn đánh giá</button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <textarea
                        rows={3}
                        style={inputStyle}
                        placeholder={action === 'HIDDEN' ? 'Lý do ẩn (bắt buộc)...' : 'Ghi chú nội bộ (tuỳ chọn)...'}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                    />
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="insurance-btn secondary" onClick={onClose} disabled={loading}>Đóng</button>
                    <button className="insurance-btn primary" onClick={handleSubmit} disabled={loading} style={action === 'HIDDEN' ? {background: '#ef4444', borderColor: '#ef4444'} : {}}>
                        {loading ? 'Đang xử lý...' : action === 'APPROVED' ? 'Xác nhận Duyệt' : 'Xác nhận Ẩn'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminContentModeration() {
    const [tab, setTab]           = useState(null)
    const [reviews, setReviews]   = useState([])
    const [stats, setStats]       = useState(null)
    const [loading, setLoading]   = useState(true)
    const [page, setPage]         = useState(0)
    const [total, setTotal]       = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [activeReview, setActiveReview] = useState(null)

    // State cho Modal Từ Khóa
    const [keywordModal, setKeywordModal] = useState(false)
    const [keywords, setKeywords] = useState('')
    const [savingKeywords, setSavingKeywords] = useState(false)

    const SIZE = 10

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [reviewRes, statsRes] = await Promise.all([
                getModerationReviews(tab, page, SIZE),
                getModerationStats(),
            ])
            setReviews(reviewRes.data?.content ?? [])
            setTotal(reviewRes.data?.totalElements ?? 0)
            setTotalPages(reviewRes.data?.totalPages ?? 0)
            setStats(statsRes.data)
        } catch (e) {
            console.error(e)
            setReviews([])
        } finally { setLoading(false) }
    }, [tab, page])

    useEffect(() => { fetchData() }, [fetchData])

    // ─── Hàm xử lý cho Modal Từ Khóa ───
    const handleOpenKeywordModal = async () => {
        setKeywordModal(true);
        try {
            const res = await getBannedKeywords();
            setKeywords(res.data || '');
        } catch (error) {
            console.error("Lỗi lấy từ khóa:", error);
        }
    };

    const handleSaveKeywords = async () => {
        setSavingKeywords(true);
        try {
            await updateBannedKeywords(keywords);
            alert('Cập nhật từ khóa cấm thành công!');
            setKeywordModal(false);
        } catch (error) {
            alert('Có lỗi xảy ra khi lưu từ khóa');
            console.error(error);
        } finally {
            setSavingKeywords(false);
        }
    };

    // Render Stats
    const mappedStats = [
        { label: 'Bị báo cáo (Cần ưu tiên)', value: stats?.flaggedCount ?? 0, note: 'Bị cộng đồng cắm cờ vi phạm' },
        { label: 'Chờ kiểm duyệt', value: stats?.pendingCount ?? 0, note: 'Đánh giá mới gửi lên' },
        { label: 'Đã ẩn', value: stats?.hiddenCount ?? 0, note: 'Vi phạm tiêu chuẩn cộng đồng' },
        { label: 'Đã duyệt', value: stats?.approvedCount ?? 0, note: 'Đang hiển thị công khai' },
    ]

    return (
        <div className="insurance-admin-page">
            {/* --- HERO --- */}
            <section className="insurance-hero">
                <div>
                    <span className="insurance-kicker">Moderation Console</span>
                    <h1 className="insurance-title">Kiểm duyệt nội dung</h1>
                    <p className="insurance-subtitle">
                        Theo dõi và xử lý các đánh giá vi phạm, ẩn/hiện nội dung phản cảm để giữ môi trường nền tảng trong sạch.
                    </p>
                </div>

                <div className="insurance-hero-actions">
                    <button className="insurance-btn secondary" onClick={fetchData}>Làm mới dữ liệu</button>
                    {/* Đã gắn sự kiện onClick vào đây */}
                    <button className="insurance-btn primary" onClick={handleOpenKeywordModal}>Cấu hình từ khóa cấm</button>
                </div>
            </section>

            {/* --- STATS GRID --- */}
            <section className="insurance-stats-grid">
                {mappedStats.map((item, idx) => (
                    <article className="insurance-stat-card" key={idx}>
                        <span className="insurance-stat-label">{item.label}</span>
                        <strong className="insurance-stat-value" style={idx === 0 && item.value > 0 ? {color: '#ef4444'} : {}}>{item.value}</strong>
                        <span className="insurance-stat-note">{item.note}</span>
                    </article>
                ))}
            </section>

            {/* --- MAIN LAYOUT --- */}
            <section className="insurance-layout">
                <div className="insurance-main">
                    <article className="insurance-panel">
                        <div className="panel-head" style={{flexDirection: 'column', gap: '20px'}}>
                            <div>
                                <h2>Danh sách đánh giá</h2>
                                <p>Phân loại theo trạng thái hiển thị và mức độ vi phạm.</p>
                            </div>

                            {/* Nút lọc Tab thiết kế dạng Pills */}
                            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                {STATUS_TABS.map(t => (
                                    <button
                                        key={String(t.key)}
                                        className={`insurance-btn ${tab === t.key ? 'primary' : 'secondary'} small`}
                                        onClick={() => { setTab(t.key); setPage(0); }}
                                    >
                                        {t.label} {t.key === 'FLAGGED' && stats?.flaggedCount > 0 && `(${stats.flaggedCount})`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <p style={{ padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu...</p>
                        ) : reviews.length === 0 ? (
                            <p style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Không có đánh giá nào trong mục này.</p>
                        ) : (
                            <div className="claim-list">
                                {reviews.map(review => {
                                    const badge = STATUS_BADGE[review.moderationStatus] ?? { label: review.moderationStatus, cls: '' }
                                    return (
                                        <article className="claim-card" key={review.id}>
                                            <div className="claim-header">
                                                <div>
                                                    <h3>Sản phẩm: {review.productName}</h3>
                                                    <p>Người dùng: <strong>{review.userName}</strong> · 📅 {fmtDate(review.createdAt)}</p>
                                                </div>
                                                <span className={`claim-status ${badge.cls}`}>{badge.label}</span>
                                            </div>

                                            <div className="claim-meta" style={{color: '#fbbf24', fontSize: '16px'}}>
                                                {STARS(review.rating)}
                                            </div>

                                            <p className="claim-reason" style={{fontSize: '14px', color: '#e2e8f0', marginTop: '10px'}}>
                                                "{review.comment}"
                                            </p>

                                            {review.reportCount > 0 && (
                                                <p className="claim-reason" style={{ color: '#ef4444', marginTop: '8px' }}>
                                                    🚩 Bị báo cáo {review.reportCount} lần
                                                </p>
                                            )}

                                            {review.moderationNote && (
                                                <p className="claim-reason" style={{ color: '#0ea5e9', background: '#f0f9ff', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                                                    📝 <strong>Ghi chú:</strong> {review.moderationNote}
                                                </p>
                                            )}

                                            <div className="claim-actions">
                                                <button className="insurance-btn secondary small" onClick={() => setActiveReview(review)}>
                                                    Xử lý đánh giá này
                                                </button>
                                            </div>
                                        </article>
                                    )})}
                            </div>
                        )}

                        {/* Phân trang */}
                        {totalPages > 1 && (
                            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px'}}>
                                <button className="insurance-btn secondary small" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Trước</button>
                                <span style={{color: '#94a3b8', fontSize: '13px'}}>Trang {page + 1} / {totalPages}</span>
                                <button className="insurance-btn secondary small" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Tiếp →</button>
                            </div>
                        )}

                    </article>
                </div>

                {/* --- SIDE PANEL --- */}
                <aside className="insurance-side">
                    <article className="insurance-panel">
                        <div className="panel-head compact">
                            <div>
                                <h2>Tiêu chuẩn cộng đồng</h2>
                                <p>Các quy tắc xử lý vi phạm</p>
                            </div>
                        </div>

                        <div className="insurance-transaction-list">
                            <div className="insurance-transaction-item">
                                <div>
                                    <strong>Nội dung phản cảm</strong>
                                    <p>Chứa từ ngữ tục tĩu, công kích cá nhân.</p>
                                </div>
                                <span className="money-out" style={{fontSize: '12px'}}>Ẩn ngay</span>
                            </div>
                            <div className="insurance-transaction-item">
                                <div>
                                    <strong>Spam / Quảng cáo</strong>
                                    <p>Chứa link rác, quảng cáo shop khác.</p>
                                </div>
                                <span className="money-out" style={{fontSize: '12px'}}>Ẩn ngay</span>
                            </div>
                            <div className="insurance-transaction-item">
                                <div>
                                    <strong>Đánh giá không liên quan</strong>
                                    <p>Nội dung không nói về sản phẩm.</p>
                                </div>
                                <span className="money-out" style={{fontSize: '12px'}}>Cảnh cáo</span>
                            </div>
                        </div>
                    </article>

                    <article className="insurance-panel reserve-panel">
                        <div className="panel-head compact">
                            <div>
                                <h2>Sức khỏe nền tảng</h2>
                                <p>Tỷ lệ nội dung bị gắn cờ vi phạm.</p>
                            </div>
                        </div>

                        {/* Tính toán tỷ lệ dựa trên stats */}
                        <div className="reserve-amount">
                            {stats && stats.flaggedCount + stats.approvedCount + stats.hiddenCount > 0
                                ? Math.round((stats.hiddenCount / (stats.flaggedCount + stats.approvedCount + stats.hiddenCount)) * 100)
                                : 0}%
                        </div>
                        <div className="reserve-note">Đánh giá bị ẩn trên tổng số đánh giá đã xử lý.</div>

                        <div className="reserve-breakdown">
                            <div><span>Tổng đánh giá</span><strong>{stats ? (stats.flaggedCount + stats.approvedCount + stats.hiddenCount + stats.pendingCount) : 0}</strong></div>
                            <div><span>Sạch</span><strong>{stats?.approvedCount ?? 0}</strong></div>
                            <div><span>Vi phạm</span><strong>{stats?.hiddenCount ?? 0}</strong></div>
                        </div>
                    </article>
                </aside>
            </section>

            {/* Render Modal Xử lý Review */}
            {activeReview && (
                <ActionModal
                    review={activeReview}
                    onClose={() => setActiveReview(null)}
                    onDone={fetchData}
                />
            )}

            {/* ĐÃ THÊM: Modal Cấu hình từ khóa cấm */}
            {keywordModal && (
                <div style={modalOverlayStyle} onClick={() => setKeywordModal(false)}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <h3 style={{marginTop: 0, marginBottom: '16px'}}>Cấu hình từ khóa cấm</h3>
                        <p style={{fontSize: '14px', color: '#64748b', marginBottom: '16px'}}>
                            Hệ thống sẽ tự động ẨN các đánh giá chứa những từ khóa này. Các từ cách nhau bởi dấu phẩy (,).
                        </p>

                        <textarea
                            style={{...inputStyle, height: '120px'}}
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="Ví dụ: lừa đảo, rách, thái độ tồi..."
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button
                                className="insurance-btn secondary"
                                onClick={() => setKeywordModal(false)}
                                disabled={savingKeywords}
                            >
                                Hủy
                            </button>
                            <button
                                className="insurance-btn primary"
                                onClick={handleSaveKeywords}
                                disabled={savingKeywords}
                            >
                                {savingKeywords ? 'Đang lưu...' : 'Lưu cấu hình'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
}

const modalStyle = {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    color: '#0f172a'
}

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc',
    color: '#0f172a'
}