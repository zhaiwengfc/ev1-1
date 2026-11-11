import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DroneArt from '../components/DroneArt.jsx'
import {
  intros,
  products,
  productCategories,
  priceFilters,
  labArticles,
  formatSamplePrice,
  productCategoryLabel,
} from '../data/content.js'

export default function Shop() {
  const [cat, setCat] = useState('all')
  const [price, setPrice] = useState('all')

  const list = useMemo(() => {
    const range = priceFilters.find((item) => item.id === price)
    return products.filter((item) => {
      const okCat = cat === 'all' || item.category === cat
      const okPrice =
        !range || range.id === 'all' || (item.price >= range.min && item.price < range.max)
      return okCat && okPrice
    })
  }, [cat, price])

  return (
    <div className="shop-page">
      <header className="page-hero">
        <p className="hero-kicker">看参数，再读评测</p>
        <h1 className="graffiti-title">无人机商城</h1>
        <p className="page-lead">{intros.shop}</p>
        <p className="page-lead">
          现在上架的是四款已经写了资料评测的机型。标价来自评测里的首发价或活动价，带「待核实」的以官方页面为准。这里不能下单。
        </p>
      </header>

      <div className="filter-board">
        <div>
          <p className="filter-label">类型</p>
          <div className="tab-row compact">
            {productCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`tab-sticker${cat === item.id ? ' is-active' : ''}`}
                onClick={() => setCat(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="filter-label">价位</p>
          <div className="tab-row compact">
            {priceFilters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`tab-sticker${price === item.id ? ' is-active' : ''}`}
                onClick={() => setPrice(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="result-count">共 {list.length} 款</p>
      {list.length === 0 ? (
        <p className="empty-hint">这个筛选条件下没有机型，试试其他类型或价位。</p>
      ) : (
        <div className="product-grid">
          {list.map((product) => (
            <Link key={product.id} to={`/shop/${product.id}`} className="product-card">
              <div className="product-art">
                <DroneArt variant={product.variant} accent={product.accent} />
                <span className="tag-sticker on-art">{product.tag}</span>
              </div>
              <div className="product-body">
                <div className="card-meta">
                  <span className="muted">{productCategoryLabel(product.category)}</span>
                  {product.priceNote ? <span className="pending-badge">待核实</span> : null}
                </div>
                <h2>{product.name}</h2>
                <p>{product.blurb}</p>
                <p className="sample-price lg">
                  {formatSamplePrice(product.price)}
                  <span> {product.priceLabel}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="section-block" id="reading">
        <div className="section-head">
          <h2 className="graffiti-title sm">科普阅读</h2>
        </div>
        <p className="section-intro">{intros.research}</p>
        <div className="news-grid">
          {labArticles.map((item) => (
            <Link key={item.id} to={`/shop/read/${item.id}`} className="sticker-card">
              <div className="card-meta">
                <span className="tag-sticker">技术研究</span>
                <span className="card-date">{item.date}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
