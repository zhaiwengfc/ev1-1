import { Link, useParams } from 'react-router-dom'
import Stars from '../components/Stars.jsx'
import Sources from '../components/Sources.jsx'
import DroneArt from '../components/DroneArt.jsx'
import {
  getProduct,
  getLabItem,
  formatSamplePrice,
  productCategoryLabel,
  labArticles,
} from '../data/content.js'

export default function ProductDetail() {
  const { id } = useParams()
  const product = getProduct(id)

  if (!product) {
    return (
      <div className="detail-page">
        <p>没有找到这款机型。</p>
        <Link to="/shop" className="btn-ghost">
          返回商城
        </Link>
      </div>
    )
  }

  const review = product.reviewId ? getLabItem(product.reviewId) : null
  const reading = (product.scienceIds || [])
    .map((scienceId) => labArticles.find((item) => item.id === scienceId))
    .filter(Boolean)
  const intro = Array.isArray(product.intro) ? product.intro : product.intro ? [product.intro] : []
  const highlights = product.highlights || []

  return (
    <article className="product-detail">
      <Link to="/shop" className="back-link">
        ← 返回无人机商城
      </Link>
      <div className="product-detail-grid">
        <div className="product-stage">
          <DroneArt variant={product.variant} accent={product.accent} />
        </div>
        <div>
          <div className="card-meta">
            <span className="tag-sticker">{productCategoryLabel(product.category)}</span>
            <span className="tag-sticker">{product.categoryLabel || product.tag}</span>
          </div>
          <h1 className="detail-title">{product.name}</h1>
          <p className="sample-price xl">
            {formatSamplePrice(product.price)}
            <span> {product.priceLabel}</span>
          </p>
          {product.priceNote ? <p className="detail-summary">{product.priceNote}</p> : null}
          <p className="tiny-note">本站只做资料整理，没有购买或比价下单。</p>
        </div>
      </div>

      <section className="spec-board">
        <h2>产品介绍</h2>
        {intro.map((para) => (
          <p key={para.slice(0, 24)}>{para}</p>
        ))}
      </section>

      <section className="spec-board">
        <h2>技术亮点与解读</h2>
        <ul className="highlight-list">
          {highlights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {(product.techBody || []).map((para) => (
          <p key={para.slice(0, 24)}>{para}</p>
        ))}
        <dl>
          {product.specs.map(([label, value]) => (
            <div key={label} className="spec-row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <Sources sources={product.sources} />
      </section>

      {review ? (
        <section className="spec-board" id="review">
          <h2>资料评测</h2>
          <div className="card-meta">
            {review.unverifiedNote ? <span className="pending-badge">待核实</span> : null}
            <span className="card-date">{review.date}</span>
          </div>
          <h3 className="detail-title">{review.title}</h3>
          <Stars value={review.rating} />
          {review.unverifiedNote ? <p className="pending-note">{review.unverifiedNote}</p> : null}
          <p className="detail-summary">{review.summary}</p>
          <div className="pros-cons">
            <div className="pros">
              <h3>优点</h3>
              <ul>
                {review.pros.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="cons">
              <h3>不足</h3>
              <ul>
                {review.cons.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="detail-body">
            {review.body.map((para, index) => (
              <p key={`${index}-${para.slice(0, 24)}`}>{para}</p>
            ))}
          </div>
          <Sources sources={review.sources} />
        </section>
      ) : null}

      {reading.length > 0 ? (
        <section className="related">
          <h2>相关科普</h2>
          <ul>
            {reading.map((item) => (
              <li key={item.id}>
                <Link to={`/shop/read/${item.id}`}>{item.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
