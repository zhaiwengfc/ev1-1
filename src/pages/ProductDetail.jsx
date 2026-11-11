import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Stars from '../components/Stars.jsx'
import Sources from '../components/Sources.jsx'
import DroneArt from '../components/DroneArt.jsx'
import { getProduct, getLabItem, formatSamplePrice, labArticles } from '../data/content.js'

function Fold({ title, tease, children }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="fold-card">
      <h2>{title}</h2>
      {open ? children : <p className="fold-tease">{tease}</p>}
      <button
        type="button"
        className="btn-ghost fold-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? '收起' : '展开查看'}
      </button>
    </section>
  )
}

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
  const tags = [product.brandTag || product.brand, product.formTag, product.useTag].filter(Boolean)

  return (
    <article className="product-detail">
      <Link to="/shop" className="back-link">
        ← 返回无人机商城
      </Link>
      <div className="product-detail-grid">
        <div className="product-stage">
          <DroneArt variant={product.variant} accent={product.accent} />
        </div>
        <div className="product-intro-card">
          <div className="card-meta">
            {tags.map((tag) => (
              <span key={tag} className="tag-sticker">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="detail-title">{product.name}</h1>
          <p className="sample-price xl">
            {formatSamplePrice(product.price)}
            <span> {product.priceLabel}</span>
          </p>
          {product.priceNote ? <p className="detail-summary">{product.priceNote}</p> : null}
          <p className="tiny-note">本站只做资料整理，没有购买或比价下单。</p>
          <Sources sources={product.sources} />
        </div>
      </div>

      <Fold title="产品介绍" tease={intro[0] || ''}>
        {intro.map((para, index) => (
          <p key={`${index}-${para.slice(0, 16)}`}>{para}</p>
        ))}
      </Fold>

      <Fold title="技术亮点与解读" tease={highlights.slice(0, 2).join('；')}>
        <ul className="highlight-list">
          {highlights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {(product.techBody || []).map((para, index) => (
          <p key={`${index}-${para.slice(0, 16)}`}>{para}</p>
        ))}
        <dl>
          {product.specs.map(([label, value]) => (
            <div key={label} className="spec-row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </Fold>

      {review ? (
        <Fold title="资料评测" tease={review.summary}>
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
              <p key={`${index}-${para.slice(0, 16)}`}>{para}</p>
            ))}
          </div>
          <Sources sources={review.sources} />
        </Fold>
      ) : null}

      {reading.length > 0 ? (
        <section className="fold-card">
          <h2>相关科普</h2>
          <ul className="reading-links">
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
