import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SampleBadge from '../components/SampleBadge.jsx'
import DroneArt from '../components/DroneArt.jsx'
import {
  products,
  productCategories,
  priceFilters,
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
        <p className="hero-kicker">
          <SampleBadge>示例商品</SampleBadge> 消费级无人机线上售卖演示
        </p>
        <h1 className="graffiti-title">无人机商城</h1>
        <p className="page-lead">
          以下机型、规格与售价全部为示例内容，仅用于展示筛选、商品卡片、详情与购物车。不代表任何真实品牌或可购买商品。研究室评测入口在页面底部。
        </p>
        <Link to="/lab" className="btn-ghost">
          前往研究室 / 评测 →
        </Link>
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
          <p className="filter-label">价位（示例价格）</p>
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

      <p className="result-count">共 {list.length} 件示例商品</p>
      {list.length === 0 ? (
        <p className="empty-hint">这个筛选条件下没有示例商品，试试其他类型或价位。</p>
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
                  <SampleBadge>示例价格</SampleBadge>
                </div>
                <h2>{product.name}</h2>
                <p>{product.blurb}</p>
                <p className="sample-price lg">
                  {formatSamplePrice(product.price)}
                  <span> 示例价格</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
