import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { adminListUsers, adminToggleUser, adminDeleteUser, adminListProducts, adminToggleProduct, adminDeleteProduct, adminListOrders, adminUpdateOrderStatus } from '../api/admin_api'
import { getAllCategories, createCategory, updateCategory, deleteCategory as deleteCategoryApi } from '../api/category_api'
import { getRevenueByCategory } from '../api/statistics_api'
import '../styles/AdminDashboard.css'

const COLORS = ["#7c3aed","#ec4899","#06b6d4","#f59e0b","#10b981","#6366f1","#ef4444","#f97316","#14b8a6"];
const fmt = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
const fmtShort = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + " tr" : n >= 1e3 ? (n / 1e3).toFixed(0) + "k" : n;
const MONTHS = ["","T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];

function PieChart({ slices, size = 220 }) {
    const [hovered, setHovered] = useState(null);
    const cx = size / 2, cy = size / 2, r = size * 0.38, innerR = size * 0.22;

    let cumAngle = -Math.PI / 2;
    const segments = slices.map((s, i) => {
        const angle = (s.percentage / 100) * 2 * Math.PI;
        const startAngle = cumAngle;
        cumAngle += angle;
        const endAngle = cumAngle;
        const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + innerR * Math.cos(startAngle), iy1 = cy + innerR * Math.sin(startAngle);
        const ix2 = cx + innerR * Math.cos(endAngle),   iy2 = cy + innerR * Math.sin(endAngle);
        const largeArc = angle > Math.PI ? 1 : 0;
        const midAngle = startAngle + angle / 2;
        const path = `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
        return { ...s, path, midAngle, i };
    });

    const hov = hovered !== null ? slices[hovered] : null;

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <svg width={size} height={size} style={{ overflow: "visible" }}>
                {segments.map((seg, i) => (
                    <path
                        key={i}
                        d={seg.path}
                        fill={seg.color}
                        opacity={hovered === null || hovered === i ? 1 : 0.35}
                        style={{
                            cursor: "pointer",
                            transform: hovered === i ? `translate(${Math.cos(seg.midAngle)*6}px,${Math.sin(seg.midAngle)*6}px)` : "none",
                            transition: "all 0.2s ease",
                            filter: hovered === i ? `drop-shadow(0 0 8px ${seg.color}88)` : "none",
                        }}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                    />
                ))}
                <text x={cx} y={cy - 10} textAnchor="middle" fill={hov ? hov.color : "#e2e8f0"} fontSize={hov ? 13 : 11} fontWeight="700" fontFamily="monospace">
                    {hov ? hov.percentage.toFixed(1) + "%" : "DOANH"}
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="monospace">
                    {hov ? fmtShort(hov.revenue) : "THU"}
                </text>
                <text x={cx} y={cy + 26} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                    {hov ? (hov.categoryName?.split(" ")[0] || "") : ""}
                </text>
            </svg>
        </div>
    );
}

function StatCard({ label, value, sub, accent, icon }) {
    return (
        <div style={{
            background: "#0f172a", border: `1px solid ${accent}33`, borderRadius: 12,
            padding: "18px 20px", position: "relative", overflow: "hidden",
        }}>
            <div style={{
                position: "absolute", top: 0, right: 0, width: 80, height: 80,
                background: `radial-gradient(circle at top right, ${accent}22, transparent 70%)`,
            }} />
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: accent, fontFamily: "monospace", letterSpacing: -1 }}>{value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, fontFamily: "monospace" }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{sub}</div>}
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────────

function AdminDashboard() {
    const location = useLocation()

    const activeTab = (() => {
        if (location.pathname === '/admin') return 'overview'
        if (location.pathname === '/admin/users') return 'users'
        if (location.pathname === '/admin/categories') return 'categories'
        if (location.pathname === '/admin/content') return 'content'
        if (location.pathname === '/admin/complaints') return 'complaints'
        if (location.pathname === '/admin/revenue') return 'revenue'
        return 'overview'
    })()

    const [users, setUsers] = useState([])
    const [categories, setCategories] = useState([])
    const [products, setProducts] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [reviews, setReviews] = useState([])
    const [complaints, setComplaints] = useState([])
    const [categoryName, setCategoryName] = useState('')
    const [editingCategoryId, setEditingCategoryId] = useState(null)

    // ─── 2. THÊM STATE CHO TAB DOANH THU ────────────────────────────────────────
    const [revenueData, setRevenueData] = useState(null)
    const [chartYear, setChartYear] = useState(new Date().getFullYear())
    const [chartMonth, setChartMonth] = useState(new Date().getMonth() + 1)
    const [revenueLoading, setRevenueLoading] = useState(false)

    // ─── 3. TÁCH HÀM LOAD DATA ──────────────────────────────────────────────────
    const loadAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, productsRes, categoriesRes, ordersRes] = await Promise.all([
                adminListUsers(),
                adminListProducts(),
                getAllCategories(),
                adminListOrders()
            ]);

            const normalizedUsers = usersRes.data.map(u => ({
                ...u,
                name: u.fullName,
                status: u.enabled ? 'Hoạt động' : 'Bị khóa',
                createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'N/A'
            }));
            setUsers(normalizedUsers);

            const normalizedProducts = productsRes.data.map(p => ({
                ...p,
                image: p.imageUrl,
                price: p.pricePerDay,
                category: p.categoryName,
                status: p.visible ? 'Hiển thị' : 'Đã ẩn'
            }));
            setProducts(normalizedProducts);

            const normalizedCategories = categoriesRes.data.map(c => ({
                ...c,
                status: c.active ? 'Hoạt động' : 'Đã ẩn'
            }));
            setCategories(normalizedCategories);

            setOrders(ordersRes.data);
        } catch (err) {
            console.error("Failed to fetch admin data:", err);
        } finally {
            setLoading(false);
        }
    };

    // Hàm gọi riêng API doanh thu khi đổi tháng/năm
    const loadRevenueChart = async () => {
        setRevenueLoading(true);
        try {
            const res = await getRevenueByCategory(chartYear, chartMonth);
            setRevenueData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setRevenueLoading(false);
        }
    };

    // Load dữ liệu chung lần đầu
    useEffect(() => {
        loadAllData();
    }, [])

    // Load lại biểu đồ khi đổi tháng/năm hoặc khi vào tab Revenue
    useEffect(() => {
        if (activeTab === 'revenue') {
            loadRevenueChart();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, chartYear, chartMonth]);

    const stats = useMemo(() => {
        const totalUsers = users.length
        const totalCustomers = users.filter(user => user.role === 'CLIENT').length
        const totalSellers = users.filter(user => user.role === 'SELLER').length
        const totalProducts = products.length
        const hiddenProducts = products.filter(product => product.status === 'Đã ẩn').length
        const pendingComplaints = complaints.filter(item => item.status !== 'Đã giải quyết').length

        const totalRevenue = orders.reduce((acc, curr) => acc + (curr.paidAt ? Number(curr.rentalTotal) : 0), 0);

        return {
            totalUsers,
            totalCustomers,
            totalSellers,
            totalProducts,
            hiddenProducts,
            pendingComplaints,
            totalOrders: orders.length,
            totalRevenue: totalRevenue,
            monthlyRevenue: revenueData?.totalRevenue ? Number(revenueData.totalRevenue) : 0,
            successfulOrders: orders.filter(o => o.status === 'COMPLETED').length,
            cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length
        }
    }, [users, products, complaints, orders, revenueData])

    const formatPrice = (price) => {
        return (price || 0).toLocaleString('vi-VN') + 'đ'
    }

    const handleToggleUserStatus = async (id) => {
        try {
            await adminToggleUser(id);
            loadAllData();
        } catch (err) {
            alert(err.message || 'Thao tác thất bại');
        }
    }

    const handleDeleteUser = async (id) => {
        const confirmed = window.confirm('Bạn có chắc muốn xóa user này không?')
        if (!confirmed) return

        try {
            await adminDeleteUser(id);
            loadAllData();
        } catch (err) {
            alert(err.message || 'Xóa thất bại');
        }
    }

    const handleSubmitCategory = async (e) => {
        e.preventDefault()

        const name = categoryName.trim()
        if (!name) {
            alert('Vui lòng nhập tên danh mục')
            return
        }

        try {
            if (editingCategoryId) {
                await updateCategory(editingCategoryId, { name, active: true });
            } else {
                await createCategory({ name, active: true });
            }
            loadAllData();
            setEditingCategoryId(null)
            setCategoryName('')
        } catch (err) {
            alert(err.message || 'Thao tác thất bại');
        }
    }

    const handleEditCategory = (category) => {
        setCategoryName(category.name)
        setEditingCategoryId(category.id)
    }

    const handleDeleteCategory = async (id) => {
        const confirmed = window.confirm('Bạn có chắc muốn xóa danh mục này không?')
        if (!confirmed) return

        try {
            await deleteCategoryApi(id);
            loadAllData();
        } catch (err) {
            alert(err.message || 'Xóa danh mục thất bại. Có thể danh mục đang chứa sản phẩm.');
        }
    }

    const handleToggleProductStatus = async (id) => {
        try {
            await adminToggleProduct(id);
            loadAllData();
        } catch (err) {
            alert(err.message || 'Thao tác thất bại');
        }
    }

    const handleDeleteProduct = async (id) => {
        const confirmed = window.confirm('Bạn có chắc muốn xóa trang phục này không?')
        if (!confirmed) return

        try {
            await adminDeleteProduct(id);
            loadAllData();
        } catch (err) {
            alert(err.message || 'Xóa thất bại');
        }
    }

    const handleDeleteReview = (id) => {
        const confirmed = window.confirm('Bạn có chắc muốn xóa đánh giá này không?')
        if (!confirmed) return

        setReviews(prev => prev.filter(review => review.id !== id))
    }

    const handleApproveReview = (id) => {
        setReviews(prev =>
            prev.map(review =>
                review.id === id
                    ? { ...review, status: 'Hiển thị' }
                    : review
            )
        )
    }

    const handleResolveComplaint = (id) => {
        setComplaints(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, status: 'Đã giải quyết' }
                    : item
            )
        )
    }

    if (loading) {
        return <div className="admin-dashboard-page"><p style={{ textAlign: 'center', color: 'var(--text-primary)', marginTop: '100px' }}>Đang tải dữ liệu hệ thống...</p></div>
    }

    return (
        <div className="admin-dashboard-page">
            <div className="admin-hero">
                <div>
                    <span className="admin-label">ADMIN CONTROL PANEL</span>
                    <h1>Trang Quản Trị Hệ Thống</h1>
                    <p>
                        Quản lý người dùng, danh mục, sản phẩm, đánh giá, thống kê và khiếu nại trong hệ thống thuê đồ cosplay.
                    </p>
                </div>

                <div className="admin-badge">
                    <span>ADMIN</span>
                    <strong>Đang hoạt động</strong>
                </div>
            </div>

            {activeTab === 'overview' && (
                <section className="admin-section">
                    <div className="section-heading">
                        <div>
                            <h2>Thống kê hệ thống</h2>
                            <p>Tổng quan hoạt động của website cho thuê đồ cosplay</p>
                        </div>
                    </div>

                    <div className="admin-stats-grid">
                        <div className="admin-stat-card">
                            <span className="stat-icon">👥</span>
                            <p>Tổng user</p>
                            <h3>{stats.totalUsers}</h3>
                        </div>

                        <div className="admin-stat-card">
                            <span className="stat-icon">🛍️</span>
                            <p>Customer</p>
                            <h3>{stats.totalCustomers}</h3>
                        </div>

                        <div className="admin-stat-card">
                            <span className="stat-icon">🏪</span>
                            <p>Người bán</p>
                            <h3>{stats.totalSellers}</h3>
                        </div>

                        <div className="admin-stat-card">
                            <span className="stat-icon">👘</span>
                            <p>Trang phục</p>
                            <h3>{stats.totalProducts}</h3>
                        </div>

                        <div className="admin-stat-card">
                            <span className="stat-icon">📦</span>
                            <p>Số lượng đơn hàng</p>
                            <h3>{stats.totalOrders}</h3>
                        </div>

                        <div className="admin-stat-card">
                            <span className="stat-icon">💰</span>
                            <p>Doanh thu</p>
                            <h3>{formatPrice(stats.totalRevenue)}</h3>
                        </div>

                        <div className="admin-stat-card warning">
                            <span className="stat-icon">🙈</span>
                            <p>Trang phục đã ẩn</p>
                            <h3>{stats.hiddenProducts}</h3>
                        </div>

                        <div className="admin-stat-card danger">
                            <span className="stat-icon">⚠️</span>
                            <p>Khiếu nại chưa xong</p>
                            <h3>{stats.pendingComplaints}</h3>
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'users' && (
                <section className="admin-section">
                    <div className="section-heading">
                        <div>
                            <h2>Quản lý user</h2>
                            <p>Bao gồm quản lý người bán và quản lý customer</p>
                        </div>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>Người dùng</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                            </thead>

                            <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <strong>{user.name}</strong>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{user.phone}</td>
                                    <td>
                                            <span className={`role-pill ${user.role === 'SELLER' ? 'seller' : user.role === 'ADMIN' ? 'admin' : 'customer'}`}>
                                                {user.role === 'SELLER' ? 'Người bán' : user.role === 'ADMIN' ? 'Quản trị' : 'Khách hàng'}
                                            </span>
                                    </td>
                                    <td>
                                            <span className={`status-pill ${user.status === 'Hoạt động' ? 'active' : 'locked'}`}>
                                                {user.status}
                                            </span>
                                    </td>
                                    <td>{user.createdAt}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="btn-admin small"
                                                onClick={() => handleToggleUserStatus(user.id)}
                                            >
                                                {user.status === 'Hoạt động' ? 'Khóa' : 'Mở khóa'}
                                            </button>

                                            <button
                                                className="btn-admin small danger"
                                                onClick={() => handleDeleteUser(user.id)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {activeTab === 'categories' && (
                <section className="admin-section">
                    <div className="section-heading">
                        <div>
                            <h2>Quản lý danh mục</h2>
                            <p>Thêm, sửa và xóa danh mục trang phục</p>
                        </div>
                    </div>

                    <form className="category-form" onSubmit={handleSubmitCategory}>
                        <input
                            type="text"
                            placeholder="Nhập tên danh mục..."
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                        />

                        <button className="btn-admin primary" type="submit">
                            {editingCategoryId ? 'Cập nhật danh mục' : '+ Thêm danh mục'}
                        </button>

                        {editingCategoryId && (
                            <button
                                type="button"
                                className="btn-admin"
                                onClick={() => {
                                    setEditingCategoryId(null)
                                    setCategoryName('')
                                }}
                            >
                                Hủy
                            </button>
                        )}
                    </form>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên danh mục</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                            </thead>

                            <tbody>
                            {categories.map(category => (
                                <tr key={category.id}>
                                    <td>#{category.id}</td>
                                    <td>
                                        <strong>{category.name}</strong>
                                    </td>
                                    <td>
                                            <span className="status-pill active">
                                                {category.status}
                                            </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="btn-admin small"
                                                onClick={() => handleEditCategory(category)}
                                            >
                                                Sửa
                                            </button>

                                            <button
                                                className="btn-admin small danger"
                                                onClick={() => handleDeleteCategory(category.id)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {activeTab === 'content' && (
                <section className="admin-section">
                    <div className="section-heading">
                        <div>
                            <h2>Kiểm duyệt nội dung</h2>
                            <p>Ẩn/xóa trang phục và xóa đánh giá chứa từ ngữ phản cảm</p>
                        </div>
                    </div>

                    <h3 className="sub-title">Danh sách trang phục</h3>

                    <div className="admin-product-grid">
                        {products.map(product => (
                            <div className="admin-product-card" key={product.id}>
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    onError={(e) => {
                                        e.currentTarget.src = `https://picsum.photos/seed/admin-${product.id}/500/650`
                                    }}
                                />

                                <div className="admin-product-body">
                                    <h4>{product.name}</h4>
                                    <p>{product.category}</p>

                                    <span className={`status-pill ${product.status === 'Hiển thị' ? 'active' : 'hidden'}`}>
                                        {product.status}
                                    </span>

                                    <div className="table-actions">
                                        <button
                                            className="btn-admin small"
                                            onClick={() => handleToggleProductStatus(product.id)}
                                        >
                                            {product.status === 'Hiển thị' ? 'Ẩn' : 'Hiện'}
                                        </button>

                                        <button
                                            className="btn-admin small danger"
                                            onClick={() => handleDeleteProduct(product.id)}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <h3 className="sub-title">Danh sách đánh giá</h3>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Người đánh giá</th>
                                <th>Số sao</th>
                                <th>Nội dung</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                            </thead>

                            <tbody>
                            {reviews.map(review => (
                                <tr key={review.id}>
                                    <td>{review.productName}</td>
                                    <td>{review.user}</td>
                                    <td>⭐ {review.rating}</td>
                                    <td>{review.content}</td>
                                    <td>
                                            <span className={`status-pill ${review.status === 'Hiển thị' ? 'active' : 'pending'}`}>
                                                {review.status}
                                            </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            {review.status !== 'Hiển thị' && (
                                                <button
                                                    className="btn-admin small"
                                                    onClick={() => handleApproveReview(review.id)}
                                                >
                                                    Duyệt
                                                </button>
                                            )}

                                            <button
                                                className="btn-admin small danger"
                                                onClick={() => handleDeleteReview(review.id)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {activeTab === 'complaints' && (
                <section className="admin-section">
                    <div className="section-heading">
                        <div>
                            <h2>Giải quyết khiếu nại</h2>
                            <p>Theo dõi và cập nhật trạng thái xử lý khiếu nại của khách hàng</p>
                        </div>
                    </div>

                    <div className="complaint-list">
                        {complaints.map(item => (
                            <div className="complaint-card" key={item.id}>
                                <div className="complaint-top">
                                    <div>
                                        <h3>{item.title}</h3>
                                        <p>Khách hàng: {item.customer}</p>
                                    </div>

                                    <span className={`status-pill ${
                                        item.status === 'Đã giải quyết'
                                            ? 'active'
                                            : item.status === 'Đang xử lý'
                                                ? 'pending'
                                                : 'locked'
                                    }`}>
                                        {item.status}
                                    </span>
                                </div>

                                <p className="complaint-content">{item.content}</p>

                                <div className="complaint-bottom">
                                    <span>Ngày gửi: {item.date}</span>

                                    {item.status !== 'Đã giải quyết' && (
                                        <button
                                            className="btn-admin primary"
                                            onClick={() => handleResolveComplaint(item.id)}
                                        >
                                            Đánh dấu đã giải quyết
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ─── 4. GIAO DIỆN TAB DOANH THU ĐƯỢC CẬP NHẬT ──────────────────────── */}
            {activeTab === 'revenue' && (
                <section className="admin-section" style={{ background: "#020617", color: "#e2e8f0", padding: "28px 24px", borderRadius: 16 }}>

                    {/* Header Mới */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                        <div>
                            <div style={{ fontSize: 11, color: "#475569", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
                                ◈ COSPLAY STAR ADMIN
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>
                                Thống kê doanh thu
                            </div>
                        </div>

                        {/* Month/Year picker */}
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <select
                                value={chartMonth}
                                onChange={(e) => setChartMonth(Number(e.target.value))}
                                style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
                                disabled={revenueLoading}
                            >
                                {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                            </select>
                            <select
                                value={chartYear}
                                onChange={(e) => setChartYear(Number(e.target.value))}
                                style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
                                disabled={revenueLoading}
                            >
                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    {revenueLoading && <div style={{ marginBottom: 20, color: '#06b6d4' }}>Đang tải dữ liệu biểu đồ...</div>}

                    {/* Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
                        <StatCard icon="💰" label="Doanh thu tháng" value={fmtShort(stats.monthlyRevenue)} sub={fmt(stats.monthlyRevenue)} accent="#7c3aed" />
                        <StatCard icon="📦" label="Tổng đơn hàng"  value={orders.length}  accent="#06b6d4" />
                        <StatCard icon="⏳" label="Chờ xác nhận"   value={orders.filter(o => o.status === 'PENDING_CONFIRM').length}  accent="#f59e0b" />
                        <StatCard icon="✅" label="Đang thuê"      value={orders.filter(o => o.status === 'RENTING').length} accent="#10b981" />
                        <StatCard icon="🏆" label="Hoàn thành"     value={stats.successfulOrders} accent="#6366f1" />
                        <StatCard icon="❌" label="Đã huỷ"         value={stats.cancelledOrders} accent="#ef4444" />
                    </div>

                    {/* Main 2-col layout */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                        {/* Pie Chart */}
                        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 24 }}>
                            <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>
                                ◈ Doanh thu theo danh mục — {MONTHS[chartMonth]} {chartYear}
                            </div>

                            {!revenueData?.slices || revenueData.slices.length === 0 ? (
                                <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
                                    Không có dữ liệu tháng này
                                </div>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                                    <PieChart slices={revenueData.slices} size={200} />

                                    <div style={{ flex: 1, minWidth: 140 }}>
                                        {revenueData.slices.map((s, i) => (
                                            <div key={i} style={{ marginBottom: 12 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                                    <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color || COLORS[i % COLORS.length], flexShrink: 0 }} />
                                                    <span style={{ fontSize: 12, color: "#cbd5e1", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {s.categoryName}
                                                    </span>
                                                    <span style={{ fontSize: 12, color: s.color || COLORS[i % COLORS.length], fontWeight: 700, marginLeft: 4 }}>
                                                        {s.percentage?.toFixed(1) || 0}%
                                                    </span>
                                                </div>
                                                <div style={{ height: 3, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
                                                    <div style={{ height: "100%", width: (s.percentage || 0) + "%", background: s.color || COLORS[i % COLORS.length], borderRadius: 2, transition: "width 0.6s ease" }} />
                                                </div>
                                                <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                                                    {fmt(s.revenue)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Top Products */}
                        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 24 }}>
                            <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>
                                ◈ Top sản phẩm doanh thu cao nhất
                            </div>

                            {!revenueData?.topProducts || revenueData.topProducts.length === 0 ? (
                                <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
                                    Chưa có dữ liệu sản phẩm
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    {revenueData.topProducts.map((p, i) => {
                                        const maxTopRevenue = revenueData.topProducts[0]?.totalRevenue || 1;
                                        const barPct = (p.totalRevenue / maxTopRevenue) * 100;
                                        const col = COLORS[i % COLORS.length];
                                        return (
                                            <div key={i}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                    <div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <span style={{ fontSize: 11, fontWeight: 800, color: col, background: col + "22", borderRadius: 4, padding: "1px 6px" }}>#{i + 1}</span>
                                                            <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{p.productName}</span>
                                                        </div>
                                                        <div style={{ fontSize: 11, color: "#475569", marginTop: 2, paddingLeft: 28 }}>
                                                            {p.categoryName} · {p.totalQuantity} lượt thuê
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: col }}>{fmtShort(p.totalRevenue)}</div>
                                                        <div style={{ fontSize: 10, color: "#475569" }}>{fmt(p.totalRevenue)}</div>
                                                    </div>
                                                </div>
                                                <div style={{ height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
                                                    <div style={{ height: "100%", width: barPct + "%", background: `linear-gradient(90deg, ${col}, ${col}88)`, borderRadius: 2, transition: "width 0.8s ease" }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}

export default AdminDashboard