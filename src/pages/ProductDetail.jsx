import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Stars from '../components/Stars.jsx'
import Sources from '../components/Sources.jsx'
import OfficialPrice, { BundlePrices, ProductVisual } from '../components/OfficialPrice.jsx'
import { getLabItem, labArticles } from '../data/content.js'
import { useShopCatalog } from '../data/shopLive.js'

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
  const shop = useShopCatalog()
  const product = shop.getProduct(id)

  if (!product) {
    return (
      <div className="detail-page">
        <p>{shop.status === 'loading' ? '正在读取机型…' : '没有找到这款机型。'}</p>
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
        <ProductVisual product={product} stage />
        <div className="product-intro-card">
          <div className="card-meta">
            {tags.map((tag) => (
              <span key={tag} className="tag-sticker">
                {tag}
              </span>
            ))}
            {product.pendingCopy ? <span className="copy-badge">待补充介绍</span> : null}
            {product.tag === '新品' ? <span className="tag-sticker">新品</span> : null}
          </div>
          <h1 className="detail-title">{product.name}</h1>
          <OfficialPrice product={product} size="xl" />
          <BundlePrices product={product} />
          {!product.priceUncertain && product.priceNote ? <p className="detail-summary">{product.priceNote}</p> : null}
          <p className="tiny-note">本站只做资料整理，没有购买或比价下单。下单请以官方商城结算页为准。</p>
          <Sources sources={product.sources} />
        </div>
      </div>

      {intro.length > 0 ? (
        <Fold title="产品介绍" tease={intro[0] || ''}>
          {intro.map((para, index) => (
            <p key={`${index}-${para.slice(0, 16)}`}>{para}</p>
          ))}
        </Fold>
      ) : null}

      {product.pendingCopy && product.officialBlurb ? (
        <section className="fold-card">
          <h2>官方简介</h2>
          <p>{product.officialBlurb}</p>
          <p className="price-check">来自官方商城，不是本站撰写的介绍。</p>
        </section>
      ) : null}

      {highlights.length > 0 || (product.specs || []).length > 0 ? (
        <Fold title="技术亮点与解读" tease={highlights.slice(0, 2).join('；') || '官方规格'}>
          {highlights.length > 0 ? (
            <ul className="highlight-list">
              {highlights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {(product.techBody || []).map((para, index) => (
            <p key={`${index}-${para.slice(0, 16)}`}>{para}</p>
          ))}
          {(product.specs || []).length > 0 ? (
            <>
              {product.specSource ? <p className="price-check">规格来自{product.specSource}</p> : null}
              <dl>
                {product.specs.map(([label, value]) => (
                  <div key={label} className="spec-row">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
        </Fold>
      ) : null}

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
