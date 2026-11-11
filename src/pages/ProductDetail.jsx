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
  const intro = product.intro?.trim() || review?.summary || ''
  const highlights = product.highlights?.length ? product.highlights : review?.pros || []

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
            <span className="tag-sticker">{product.tag}</span>
            {product.priceNote ? <span className="pending-badge">待核实</span> : null}
          </div>
          <h1 className="detail-title">{product.name}</h1>
          <p className="sample-price xl">
            {formatSamplePrice(product.price)}
            <span> {product.priceLabel}</span>
          </p>
          {product.priceNote ? <p className="pending-note">{product.priceNote}</p> : null}
          <p className="tiny-note">本站只做资料整理，没有购买或比价下单。</p>
        </div>
      </div>

      <section className="spec-board">
        <h2>产品介绍</h2>
        {!product.intro?.trim() ? (
          <p className="tiny-note">
            单独的产品介绍还没写好。下面先用研究室资料评测里的摘要，文案到了会换上。
          </p>
        ) : null}
        {intro ? <p className="detail-summary">{intro}</p> : null}
      </section>

      <section className="spec-board">
        <h2>技术看点</h2>
        {!product.highlights?.length ? (
          <p className="tiny-note">技术看点暂时来自资料评测的优点，独立说明写好后会替换。</p>
        ) : null}
        <ul className="highlight-list">
          {highlights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <dl>
          {product.specs.map(([label, value]) => (
            <div key={label} className="spec-row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
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
