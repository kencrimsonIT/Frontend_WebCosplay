import { useEffect, useState } from 'react'
import './css/ProductCard.css'
import { Link } from 'react-router-dom'

const FAVORITES_KEY = 'favoriteProductIds'

function readFavoriteIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []
    return saved.map(Number)
  } catch {
    return []
  }
}

function saveFavoriteIds(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
  window.dispatchEvent(new Event('favorites-changed'))
}

function ProductCard({ product,isLessor=false }) {
  const [isHovering, setIsHovering] = useState(false)
  const [isFavorite, setIsFavorite] = useState(() =>
    readFavoriteIds().includes(Number(product.id))
  )

  useEffect(() => {
    const syncFavorite = () => {
      setIsFavorite(readFavoriteIds().includes(Number(product.id)))
    }

    window.addEventListener('storage', syncFavorite)
    window.addEventListener('favorites-changed', syncFavorite)

    return () => {
      window.removeEventListener('storage', syncFavorite)
      window.removeEventListener('favorites-changed', syncFavorite)
    }
  }, [product.id])

  const formatPrice = (price) => price.toLocaleString('vi-VN')

  const getCategoryColor = (category) => {
    const colors = {
      'Anime': '#c084fc',
      'Game': '#a855f7',
      'Fantasy': '#ec4899',
      'Siêu Anh Hùng': '#f0abfc',
      'Nhật Bản': '#a78bfa'
    }
    return colors[category] || '#c084fc'
  }

  const handleToggleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const currentIds = readFavoriteIds()
    const productId = Number(product.id)
    const existed = currentIds.includes(productId)

    const nextIds = existed
      ? currentIds.filter(id => id !== productId)
      : [...currentIds, productId]

    saveFavoriteIds(nextIds)
    setIsFavorite(!existed)
  }

  const handleShare = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const productUrl = `${window.location.origin}/products/${product.id}`

    try {
      await navigator.clipboard.writeText(productUrl)
      alert('Đã copy link sản phẩm!')
    } catch {
      alert(productUrl)
    }
  }

  return (
    <article
      className="product-card"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="product-image-wrap">
        <img
          src={product.image}
          alt={product.name}
          className="product-img"
          loading="lazy"
          onError={(e) => {
            e.target.src = `https://picsum.photos/seed/${product.id}/600/750`
          }}
        />

        <div className="product-image-overlay" />

        <span
          className="product-category-tag"
          style={{ backgroundColor: getCategoryColor(product.category) }}
        >
          {product.category}
        </span>

        <div className={`product-quick-actions ${isHovering ? 'active' : ''}`}>
          <button
            type="button"
            className={`action-btn action-heart ${isFavorite ? 'active' : ''}`}
            title={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            onClick={handleToggleFavorite}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          <button
            type="button"
            className="action-btn action-share"
            title="Chia sẻ"
            onClick={handleShare}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
      </div>

      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>

        <div className="product-rating">
          <div className="stars">
            {'★★★★★'.split('').map((star, i) => (
              <span key={i} className="star">{star}</span>
            ))}
          </div>
          <span className="review-count">({product.reviewCount || 128})</span>
        </div>

        <Link to={`/products/${product.id}`} className="card-link">
          Xem chi tiết →
        </Link>

        <div className="product-footer">
          <div className="product-price-block">
            <span className="product-price-label">Giá thuê/ngày</span>
            <span className="product-price">
              {formatPrice(product.price)}
              <span className="product-price-unit">đ</span>
            </span>
          </div>

          <Link to={`/products/${product.id}`} className="btn-rent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
            </svg>
              {!isLessor ? (
                <span>Thuê Ngay</span>

              ) : null}
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ProductCard