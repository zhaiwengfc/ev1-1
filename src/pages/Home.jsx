import { Link } from 'react-router-dom'
import SampleBadge from '../components/SampleBadge.jsx'
import NewsCard from '../components/NewsCard.jsx'
import Wordmark from '../components/Wordmark.jsx'
import DroneArt from '../components/DroneArt.jsx'
import Stars from '../components/Stars.jsx'
import {
  SITE,
  highlights,
  getProduct,
  getLabItem,
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
        <p className="hero-kicker">低空经济信息与消费级无人机</p>
        <div className="hero-mark-wrap">
          <Wordmark size="hero" />
        </div>
        <p className="hero-tag">{SITE.tagline}</p>
        <p className="hero-lead">
          这里汇集低空行业资讯，以及面向消费级无人机的线上商城与研究室。资讯会自动更新公开报道，站长也可以自己发布。商城商品、价格与研究室评测仍是示例内容。
        </p>
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
          <p>
            政府政策、科技创新与供应链、比赛信息、无人机新品发布。支持分类浏览与详情阅读。
          </p>
          <span className="module-go">打开资讯墙 →</span>
        </Link>
        <Link to="/shop" className="module-card tilt-right">
          <span className="module-no">02</span>
          <h2>无人机商城 + 研究室</h2>
          <p>
            消费级示例商品可筛选、加购；研究室提供技术文章与带评分、优缺点的示意评测。
          </p>
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
          <SampleBadge>示例内容精选</SampleBadge>
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
          <SampleBadge>示例商品</SampleBadge>
        </div>
        <DroneArt variant={product.variant} accent={product.accent} />
        <h3>{product.name}</h3>
        <p className="sample-price">
          {formatSamplePrice(product.price)}
          <span> 示例价格</span>
        </p>
      </Link>
    )
  }
  const review = getLabItem(item.id)
  return (
    <Link to={`/lab/${review.id}`} className="sticker-card">
      <div className="card-meta">
        <span className="tag-sticker">产品评测</span>
        <SampleBadge>示例评测</SampleBadge>
      </div>
      <h3>{review.title}</h3>
      <Stars value={review.rating} />
      <p>{review.summary}</p>
    </Link>
  )
}
