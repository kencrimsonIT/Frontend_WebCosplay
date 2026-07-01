import { useState, useEffect, useCallback } from 'react'
import {
    adminGetPlans, adminGetClaims, adminGetInsuranceStats,
    adminTogglePlan, adminVerifyClaim, adminResolveClaim, adminCreatePlan
} from '../api/insurance_api'
import '../styles/InsuranceAdmin.css' // Dùng CSS cũ của bạn

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => Number(n ?? 0).toLocaleString('vi-VN') + 'đ'
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

const CLAIM_STATUS = {
    PENDING:   { label: 'Chờ xử lý',    cls: 'status-đang-xử-lý'   },
    VERIFYING: { label: 'Đang xác minh', cls: 'status-chờ-xác-minh' },
    APPROVED:  { label: 'Đã duyệt',      cls: 'status-đã-duyệt'  },
    REJECTED:  { label: 'Từ chối',       cls: 'status-từ-chối'  },
}

// ─── Mock Data cho Cột Side (Giữ lại giao diện bạn thích) ─────────────────────
const insuranceTransactions = [
    { id: 'INS-8841', type: 'Phí bảo hiểm', plan: 'Tiêu chuẩn', amount: '+60.000đ', owner: 'ORD-2026-112' },
    { id: 'INS-8842', type: 'Phí bảo hiểm', plan: 'Cơ bản', amount: '+30.000đ', owner: 'ORD-2026-113' },
    { id: 'INS-8843', type: 'Bồi hoàn claim', plan: 'Tiêu chuẩn', amount: '-180.000đ', owner: 'CLM-2051' },
    { id: 'INS-8844', type: 'Phí bảo hiểm', plan: 'Cao cấp', amount: '+100.000đ', owner: 'ORD-2026-114' },
]

// ─── Modals (Giữ nguyên logic của file mới) ───────────────────────────────────
function ResolveModal({ claim, onClose, onDone }) {
    const [action, setAction]     = useState('APPROVED')
    const [amount, setAmount]     = useState(claim?.requestedAmount ?? 0)
    const [note, setNote]         = useState('')
    const [loading, setLoading]   = useState(false)
    const [error, setError]       = useState('')

    const handleSubmit = async () => {
        if (action === 'APPROVED' && (!amount || Number(amount) <= 0)) {
            setError('Nhập số tiền bồi hoàn'); return
        }
        if (action === 'REJECTED' && !note.trim()) {
            setError('Nhập lý do từ chối'); return
        }
        setLoading(true); setError('')
        try {
            await adminResolveClaim(claim.id, {
                status: action,
                approvedAmount: action === 'APPROVED' ? Number(amount) : undefined,
                resolutionNote: note,
            })
            onDone(); onClose()
        } catch (e) {
            setError(e?.response?.data?.message || 'Xử lý thất bại')
        } finally { setLoading(false) }
    }

    return (
        <div className="ins-modal-overlay" onClick={onClose} style={modalOverlayStyle}>
            <div className="ins-modal" onClick={e => e.stopPropagation()} style={modalStyle}>
                <h3 style={{marginTop: 0}}>Xử lý claim {claim.claimCode}</h3>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <p><strong>Đơn hàng:</strong> {claim.orderCode}</p>
                    <p><strong>Khách hàng:</strong> {claim.customerName}</p>
                    <p><strong>Gói BH:</strong> {claim.planName}</p>
                    <p><strong>Đề nghị bồi hoàn:</strong> {fmt(claim.requestedAmount)}</p>
                    <p><strong>Sự cố:</strong> {claim.description}</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <button onClick={() => setAction('APPROVED')} className={`insurance-btn ${action === 'APPROVED' ? 'primary' : 'secondary'}`}>Duyệt bồi hoàn</button>
                    <button onClick={() => setAction('REJECTED')} className={`insurance-btn ${action === 'REJECTED' ? 'primary' : 'secondary'}`} style={action === 'REJECTED' ? {background: '#ef4444', borderColor: '#ef4444'} : {}}>Từ chối</button>
                </div>

                {action === 'APPROVED' && (
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Số tiền bồi hoàn (VND)</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={0} max={claim.requestedAmount} style={inputStyle} />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Tối đa: {fmt(claim.requestedAmount)}</span>
                    </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>{action === 'REJECTED' ? 'Lý do từ chối (bắt buộc)' : 'Ghi chú (tuỳ chọn)'}</label>
                    <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập ghi chú..." style={inputStyle} />
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="insurance-btn secondary" onClick={onClose} disabled={loading}>Đóng</button>
                    <button className="insurance-btn primary" onClick={handleSubmit} disabled={loading} style={action === 'REJECTED' ? {background: '#ef4444', borderColor: '#ef4444'} : {}}>
                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function CreatePlanModal({ onClose, onDone }) {
    const [form, setForm]     = useState({ name: '', description: '', feeAmount: '', coverPercent: 80, maxPayout: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError]   = useState('')

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async () => {
        if (!form.name || !form.feeAmount || !form.coverPercent) {
            setError('Tên, phí và % bảo vệ là bắt buộc'); return
        }
        setLoading(true); setError('')
        try {
            await adminCreatePlan({
                name: form.name,
                description: form.description,
                feeAmount: Number(form.feeAmount),
                coverPercent: Number(form.coverPercent),
                maxPayout: form.maxPayout ? Number(form.maxPayout) : null,
            })
            onDone(); onClose()
        } catch (e) {
            setError(e?.response?.data?.message || 'Tạo gói thất bại')
        } finally { setLoading(false) }
    }

    return (
        <div className="ins-modal-overlay" onClick={onClose} style={modalOverlayStyle}>
            <div className="ins-modal" onClick={e => e.stopPropagation()} style={modalStyle}>
                <h3 style={{marginTop: 0, marginBottom: '20px', color: '#334155'}}>Tạo gói bảo hiểm mới</h3>

                {[
                    { label: 'Tên gói *', key: 'name', type: 'text', placeholder: 'VD: Cơ bản / Siêu cấp' },
                    { label: 'Mô tả', key: 'description', type: 'text', placeholder: 'Mô tả ngắn...' },
                    { label: 'Phí bảo hiểm (VND) *', key: 'feeAmount', type: 'number', placeholder: '60000' },
                    { label: '% Bảo vệ số tiền cọc *', key: 'coverPercent', type: 'number', placeholder: '80' },
                    { label: 'Bồi hoàn tối đa (VND)', key: 'maxPayout', type: 'number', placeholder: '1000000' },
                ].map(f => (
                    <div style={{ marginBottom: '12px' }} key={f.key}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => set(f.key, e.target.value)} style={inputStyle} />
                    </div>
                ))}

                {error && <p style={{ color: '#ef4444', fontSize: '14px', margin: '10px 0' }}>{error}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button className="insurance-btn secondary" onClick={onClose} disabled={loading}>Đóng</button>
                    <button className="insurance-btn primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Đang tạo...' : 'Tạo gói'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Component Chính ──────────────────────────────────────────────────────────
function InsuranceAdmin() {
    const [plans, setPlans]           = useState([])
    const [claims, setClaims]         = useState([])
    const [stats, setStats]           = useState(null)
    const [loading, setLoading]       = useState(true)
    const [resolveModal, setResolveModal] = useState(null)
    const [createPlanModal, setCreatePlanModal] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            // Lấy dữ liệu thật từ API
            const [statsRes, plansRes, claimsRes] = await Promise.all([
                adminGetInsuranceStats(),
                adminGetPlans(),
                adminGetClaims(null, 0, 50), // Tạm lấy max 50 claims mới nhất cho UI này
            ])
            setStats(statsRes.data)
            setPlans(plansRes.data ?? [])
            setClaims(claimsRes.data?.content ?? [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // Cấu trúc lại Stats thật vào giao diện cũ
    const mappedStats = [
        { label: 'Chờ xử lý', value: stats?.pendingClaims ?? 0, note: 'Yêu cầu bồi hoàn mới' },
        { label: 'Đang xác minh', value: stats?.verifyingClaims ?? 0, note: 'Đang kiểm tra bằng chứng' },
        { label: 'Đã duyệt bồi hoàn', value: stats?.approvedClaims ?? 0, note: 'Đơn đã xử lý xong' },
        { label: 'Tiền bồi hoàn đã xuất', value: fmt(stats?.totalPaidOut ?? 0), note: 'Tổng chi tháng này' },
    ]

    return (
        <div className="insurance-admin-page">
            {/* --- HERO --- */}
            <section className="insurance-hero">
                <div>
                    <span className="insurance-kicker">Insurance Console</span>
                    <h1 className="insurance-title">Quản lý bảo hiểm đơn thuê</h1>
                    <p className="insurance-subtitle">
                        Theo dõi doanh thu từ bảo hiểm, mức sử dụng từng gói và các yêu cầu bồi hoàn giữa khách, seller và nền tảng.
                    </p>
                </div>

                <div className="insurance-hero-actions">
                    <button className="insurance-btn secondary" onClick={fetchData}>Làm mới dữ liệu</button>
                    <button className="insurance-btn primary" onClick={() => setCreatePlanModal(true)}>+ Tạo gói mới</button>
                </div>
            </section>

            {/* --- STATS GRID --- */}
            <section className="insurance-stats-grid">
                {mappedStats.map(item => (
                    <article className="insurance-stat-card" key={item.label}>
                        <span className="insurance-stat-label">{item.label}</span>
                        <strong className="insurance-stat-value">{item.value}</strong>
                        <span className="insurance-stat-note">{item.note}</span>
                    </article>
                ))}
            </section>

            {/* --- MAIN LAYOUT --- */}
            <section className="insurance-layout">
                <div className="insurance-main">

                    {/* PANEL GÓI BẢO HIỂM */}
                    <article className="insurance-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Hiệu quả từng gói bảo hiểm</h2>
                                <p>Admin có thể theo dõi và bật/tắt các gói đang được cung cấp.</p>
                            </div>
                        </div>

                        <div className="package-grid">
                            {plans.map((pkg, index) => {
                                // Lấy class màu sắc ngẫu nhiên từ UI cũ (basic, standard, premium)
                                const colorClass = ['basic', 'standard', 'premium'][index % 3]
                                return (
                                    <article className={`package-card package-${colorClass}`} key={pkg.id} style={{ opacity: pkg.isActive ? 1 : 0.6 }}>
                                        <div className="package-top">
                                            <div>
                                                <span className="package-name">{pkg.name} {pkg.isActive ? '' : '(Tạm dừng)'}</span>
                                                <p className="package-desc">{pkg.description}</p>
                                            </div>
                                            <span className="package-fee">{fmt(pkg.feeAmount)}</span>
                                        </div>

                                        <div className="package-metrics">
                                            <div>
                                                <span>Bồi hoàn tối đa</span>
                                                <strong>{pkg.maxPayout ? fmt(pkg.maxPayout) : 'Không giới hạn'}</strong>
                                            </div>
                                            <div>
                                                <span>Bảo vệ cọc</span>
                                                <strong>{pkg.coverPercent}%</strong>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '16px' }}>
                                            <button
                                                className="insurance-btn secondary small"
                                                style={{ width: '100%', borderColor: pkg.isActive ? '#ef4444' : '#22c55e', color: pkg.isActive ? '#ef4444' : '#22c55e' }}
                                                onClick={async () => { await adminTogglePlan(pkg.id); fetchData() }}
                                            >
                                                {pkg.isActive ? 'Tạm dừng gói này' : 'Kích hoạt lại'}
                                            </button>
                                        </div>
                                    </article>
                                )})}
                        </div>
                    </article>

                    {/* PANEL CLAIMS */}
                    <article className="insurance-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Danh sách claim gần đây</h2>
                                <p>Các ca cần đối soát giữa seller, khách thuê và quỹ bảo hiểm của nền tảng.</p>
                            </div>
                        </div>

                        {loading ? (
                            <p style={{ padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu...</p>
                        ) : claims.length === 0 ? (
                            <p style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Không có yêu cầu bồi hoàn nào.</p>
                        ) : (
                            <div className="claim-list">
                                {claims.map(claim => {
                                    const cs = CLAIM_STATUS[claim.status] ?? { label: claim.status, cls: '' }
                                    return (
                                        <article className="claim-card" key={claim.id}>
                                            <div className="claim-header">
                                                <div>
                                                    <h3>Đơn hàng #{claim.orderCode}</h3>
                                                    <p>{claim.customerName} · Mã Claim: {claim.claimCode}</p>
                                                </div>
                                                <span className={`claim-status ${cs.cls}`}>{cs.label}</span>
                                            </div>

                                            <div className="claim-meta">
                                                <span>Gói: {claim.planName}</span>
                                                <span>Ngày tạo: {fmtDate(claim.createdAt)}</span>
                                                <span>Bồi hoàn đề xuất: {fmt(claim.requestedAmount)}</span>
                                            </div>

                                            <p className="claim-reason"><strong>Lý do:</strong> {claim.description}</p>

                                            {claim.resolutionNote && (
                                                <p className="claim-reason" style={{ color: '#0ea5e9', background: '#f0f9ff', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                                                    <strong>Ghi chú:</strong> {claim.resolutionNote}
                                                </p>
                                            )}

                                            <div className="claim-actions">
                                                {claim.status === 'PENDING' && (
                                                    <button className="insurance-btn secondary small" onClick={async () => { await adminVerifyClaim(claim.id); fetchData() }}>
                                                        Bắt đầu xác minh
                                                    </button>
                                                )}
                                                {(claim.status === 'PENDING' || claim.status === 'VERIFYING') && (
                                                    <button className="insurance-btn primary small" onClick={() => setResolveModal(claim)}>
                                                        Duyệt xử lý
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    )})}
                            </div>
                        )}
                    </article>
                </div>

                {/* SIDE PANEL (Giữ nguyên cấu trúc giao diện yêu thích của bạn) */}
                <aside className="insurance-side">
                    <article className="insurance-panel">
                        <div className="panel-head compact">
                            <div>
                                <h2>Dòng tiền bảo hiểm</h2>
                                <p>Mô phỏng dữ liệu dòng tiền thu vào/chi ra.</p>
                            </div>
                        </div>

                        <div className="insurance-transaction-list">
                            {insuranceTransactions.map(item => (
                                <div className="insurance-transaction-item" key={item.id}>
                                    <div>
                                        <strong>{item.type}</strong>
                                        <p>{item.plan} · {item.owner}</p>
                                    </div>
                                    <span className={item.amount.startsWith('-') ? 'money-out' : 'money-in'}>{item.amount}</span>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="insurance-panel reserve-panel">
                        <div className="panel-head compact">
                            <div>
                                <h2>Quỹ dự phòng bảo hiểm</h2>
                                <p>Tỷ lệ nên giữ lại để xử lý claim bất thường.</p>
                            </div>
                        </div>

                        <div className="reserve-amount">14.8M</div>
                        <div className="reserve-note">Đang giữ 52% doanh thu làm quỹ dự phòng.</div>

                        <div className="reserve-breakdown">
                            <div><span>Thu bảo hiểm</span><strong>28.4M</strong></div>
                            <div><span>Đã chi claim</span><strong>9.6M</strong></div>
                            <div><span>Còn khả dụng</span><strong>18.8M</strong></div>
                        </div>
                    </article>
                </aside>
            </section>

            {/* Render Modals */}
            {resolveModal && <ResolveModal claim={resolveModal} onClose={() => setResolveModal(null)} onDone={fetchData} />}
            {createPlanModal && <CreatePlanModal onClose={() => setCreatePlanModal(false)} onDone={fetchData} />}
        </div>
    )
}

export default InsuranceAdmin

// ─── Inline Styles cho Modals (Để không bị phụ thuộc vào file CSS cũ) ────────
const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
}
const modalStyle = {
    backgroundColor: '#fff', padding: '24px', borderRadius: '16px',
    width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
}
const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
}