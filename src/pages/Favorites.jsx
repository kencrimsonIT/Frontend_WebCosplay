import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { getProducts as fetchProductsApi } from '../api/product_api'
import '../styles/Favorites.css'

const FAVORITES_KEY = 'favoriteProductIds'

function readFavoriteIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []
    return saved.map(Number)
  } catch {
    return []
  }
}

function Favorites() {
  const [favoriteIds, setFavoriteIds] = useState(readFavoriteIds)
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProductsApi()
      .then(response => {
        const normalized = response.data.map(p => ({
          ...p,
          image: p.imageUrl,
          price: p.pricePerDay,
          category: p.categoryName,
          description: p.description || 'Trang phục cosplay cao cấp.'
        }))
        setAllProducts(normalized)
      })
      .catch(err => console.error("Failed to fetch products for favorites:", err))
      .finally(() => setLoading(false))

    const syncFavorites = () => {
      setFavoriteIds(readFavoriteIds())
    }

    window.addEventListener('storage', syncFavorites)
    window.addEventListener('favorites-changed', syncFavorites)

    return () => {
      window.removeEventListener('storage', syncFavorites)
      window.removeEventListener('favorites-changed', syncFavorites)
    }
  }, [])

  const favoriteProducts = useMemo(() => {
    return allProducts.filter(product => favoriteIds.includes(Number(product.id)))
  }, [favoriteIds, allProducts])

  const handleClearFavorites = () => {
    localStorage.removeItem(FAVORITES_KEY)
    setFavoriteIds([])
    window.dispatchEvent(new Event('favorites-changed'))
  }

  if (loading) {
    return <div className="favorites-page"><p style={{ textAlign: 'center', color: 'var(--text-primary)', marginTop: '40px' }}>Đang tải danh sách yêu thích...</p></div>
  }

  return (
    <div className="favorites-page">
      <header className="favorites-header">
        <div className="favorites-title-row">
          <div className="favorites-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
              2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 
              4.5 2.09C13.09 3.81 14.76 3 16.5 
              3 19.58 3 22 5.42 22 8.5c0 
              3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          <div>
            <span className="favorites-label">Bộ sưu tập cá nhân</span>
            <h1 className="favorites-title">Sản Phẩm Yêu Thích</h1>
            <p className="favorites-subtitle">
              Những trang phục bạn đã lưu lại để xem và thuê sau.
            </p>
          </div>
        </div>

        {favoriteProducts.length > 0 && (
          <button className="btn-clear-favorites" onClick={handleClearFavorites}>
            Xóa tất cả
          </button>
        )}
      </header>

      <div className="favorites-results">
        <p className="favorites-count">
          Bạn đang có <span>{favoriteProducts.length}</span> sản phẩm yêu thích
        </p>

        {favoriteProducts.length > 0 ? (
          <div className="favorites-grid">
            {favoriteProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="favorites-empty">
            <div className="favorites-empty-icon">♡</div>
            <h2>Chưa có sản phẩm yêu thích</h2>
            <p>
              Bạn hãy bấm vào biểu tượng trái tim trên sản phẩm để lưu vào danh sách yêu thích.
            </p>
            <Link to="/products" className="btn-go-products">
              Xem sản phẩm
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Favorites