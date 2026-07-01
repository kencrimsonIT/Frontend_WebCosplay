import { useState, useEffect, useMemo } from 'react'
import ProductCard from '../components/ProductCard'
import { getProducts as fetchProductsApi } from '../api/product_api'
import { getActiveCategories } from '../api/category_api'
import '../styles/Products.css'

const SORT_OPTIONS = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'popular', label: 'Phổ biến nhất' },
    { value: 'price-low', label: 'Giá: Từ thấp đến cao' },
    { value: 'price-high', label: 'Giá: Từ cao đến thấp' },
]

function Products() {
    const [products, setProducts] = useState([])
    const [apiCategories, setApiCategories] = useState([])
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [sortBy, setSortBy] = useState('newest')
    const [loading, setLoading] = useState(true)

    const [visibleCount, setVisibleCount] = useState(12)

    // Load products and categories
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    // Thêm tham số size to để lấy hết về cho Frontend tự filter
                    fetchProductsApi({ size: 1000 }),
                    getActiveCategories()
                ]);

                // Xử lý linh hoạt: Nếu API trả về PagedResponse thì mảng nằm trong .content
                const rawProducts = productsRes.content || productsRes.data?.content || productsRes.data || productsRes || [];

                const normalizedProducts = rawProducts.map(p => ({
                    ...p,
                    image: p.imageUrl,
                    price: p.pricePerDay,
                    category: p.categoryName,
                    description: p.description || 'Trang phục cosplay cao cấp, chất lượng tốt.'
                }));

                setProducts(normalizedProducts);
                setApiCategories(categoriesRes.data || categoriesRes);
            } catch (err) {
                console.error("Failed to fetch products or categories:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [])

    const categoriesList = useMemo(() => {
        return [{ id: 'all', name: 'Tất Cả' }, ...apiCategories];
    }, [apiCategories]);

    // Filter & Sort
    const filtered = useMemo(() => {
        let result = [...products]

        // Category filter
        if (activeCategory !== 'all') {
            result = result.filter(p => p.categoryId === Number(activeCategory))
        }

        // Search filter
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q)
            )
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price
                case 'price-high':
                    return b.price - a.price
                case 'popular':
                    return b.id - a.id
                default:
                    return 0
            }
        })

        return result
    }, [products, search, activeCategory, sortBy])

    useEffect(() => {
        setVisibleCount(12)
    }, [search, activeCategory, sortBy])

    const handleReset = () => {
        setSearch('')
        setActiveCategory('all')
        setSortBy('newest')
        setVisibleCount(12)
    }

    return (
        <div className="products-page">
            {/* ═════ HEADER ═════ */}
            <header className="products-header">
                <span className="products-label">✦ Bộ Sưu Tập</span>
                <h1 className="products-title">Trang Phục Cosplay</h1>
                <p className="products-subtitle">
                    Khám phá hàng trăm bộ trang phục từ anime, game và fantasy — chất lượng cao, giá cả hợp lý
                </p>
            </header>

            {/* ═════ FILTERS & CONTROLS ═════ */}
            <div className="products-controls">
                {/* Search */}
                <div className="search-wrap">
                    <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Tìm kiếm trang phục, nhân vật..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                {/* Sort Dropdown */}
                <div className="sort-wrap">
                    <label htmlFor="sort">Sắp xếp:</label>
                    <select
                        id="sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ═════ CATEGORIES ═════ */}
            <div className="products-filters">
                <div className="category-pills">
                    {categoriesList.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-pill ${activeCategory === String(cat.id) ? 'active' : ''}`}
                            onClick={() => setActiveCategory(String(cat.id))}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
                {(search || activeCategory !== 'all') && (
                    <button onClick={handleReset} className="btn-clear-filters">
                        ✕ Xóa bộ lọc
                    </button>
                )}
            </div>

            {/* ═════ RESULTS ═════ */}
            <div className="products-results">
                <p className="results-count">
                    Tìm thấy <span>{filtered.length}</span> sản phẩm
                </p>

                {filtered.length > 0 ? (
                    <>
                        <div className="products-grid">
                            {/* CHỈ RENDER NHỮNG SẢN PHẨM TRONG GIỚI HẠN VISIBLE_COUNT */}
                            {filtered.slice(0, visibleCount).map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* THÊM NÚT "XEM THÊM" */}
                        {visibleCount < filtered.length && (
                            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 12)}
                                    className="insurance-btn secondary"
                                    style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    Xem thêm sản phẩm ↓
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="products-empty">
                        <div className="empty-icon">🔍</div>
                        <h3>Không tìm thấy sản phẩm</h3>
                        <p>Hãy thử thay đổi các bộ lọc hoặc từ khóa tìm kiếm</p>
                        <button onClick={handleReset} className="btn-reset">
                            Xem Tất Cả Sản Phẩm
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Products