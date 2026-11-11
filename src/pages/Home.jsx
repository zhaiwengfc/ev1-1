import { Link } from 'react-router-dom'
import NewsCard from '../components/NewsCard.jsx'
import Wordmark from '../components/Wordmark.jsx'
import DroneArt from '../components/DroneArt.jsx'
import {
  SITE,
  intros,
  highlights,
  getProduct,
  formatSamplePrice,
  productCategoryLabel,
} from '../data/content.js'
import { PUBLISH_URL, formatUpdated, useNewsFeed } from '../data/newsFeed.js'

export default function Home() {
  const feed = useNewsFeed()
  const preview = feed.items.slice(0, 4)
  const samples = highlights.filter((item) => item.kind !== 'news')

  return (
    <div className="home-page">
      <section className="hero">
        <p className="hero-kicker">{SITE.heroKicker}</p>
        <div className="hero-mark-wrap">
          <Wordmark size="hero" />
        </div>
        <p className="hero-tag">{SITE.tagline}</p>
        <p className="hero-lead">{SITE.heroLead}</p>
        <div className="hero-actions">
          <Link to="/news" className="btn-primary">
            进入行业资讯
          </Link>
          <Link to="/shop" className="btn-ghost">
            逛无人机商城
          </Link>
        </div>
      </section>

      <section className="module-grid">
        <Link to="/news" className="module-card tilt-left">
          <span className="module-no">01</span>
          <h2>低空行业资讯</h2>
          <p>{intros.news}</p>
          <span className="module-go">打开资讯墙 →</span>
        </Link>
        <Link to="/shop" className="module-card tilt-right">
          <span className="module-no">02</span>
          <h2>无人机商城 + 研究室</h2>
          <p>{intros.shopLab}</p>
          <span className="module-go">进入商城 / 研究室 →</span>
        </Link>
      </section>

      <section className="section-block">
        <div className="section-head spread">
          <h2 className="graffiti-title">最新资讯</h2>
          <a className="btn-primary publish-btn" href={PUBLISH_URL} target="_blank" rel="noreferrer">
            发布资讯
          </a>
        </div>
        <p className="news-updated">
          {feed.status !== 'ready'
            ? '正在读取资讯…'
            : feed.sample
              ? '当前显示的是示例资讯。'
              : formatUpdated(feed.updatedAt)}
        </p>
        {feed.status === 'ready' && preview.length > 0 ? (
          <div className="highlight-grid">
            {preview.map((item) => (
              <NewsCard key={item.id} item={item} titleAs="h3" />
            ))}
          </div>
        ) : null}
      </section>

      <section className="section-block">
        <div className="section-head">
          <h2 className="graffiti-title sm">商城与研究室</h2>
        </div>
        <div className="highlight-grid">
          {samples.map((item) => (
            <HighlightCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}

function HighlightCard({ item }) {
  if (item.kind === 'product') {
    const product = getProduct(item.id)
    return (
      <Link to={`/shop/${product.id}`} className="sticker-card product-mini">
        <div className="card-meta">
          <span className="tag-sticker">{productCategoryLabel(product.category)}</span>
          {product.priceNote ? <span className="pending-badge">待核实</span> : null}
        </div>
        <DroneArt variant={product.variant} accent={product.accent} />
        <h3>{product.name}</h3>
        <p className="sample-price">
          {formatSamplePrice(product.price)}
          <span> {product.priceLabel}</span>
        </p>
      </Link>
    )
  }
  return null
}
