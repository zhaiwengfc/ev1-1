import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DroneArt from '../components/DroneArt.jsx'
import OfficialPrice from '../components/OfficialPrice.jsx'
import { productCategories, priceFilters, labArticles } from '../data/content.js'
import { useShopCatalog } from '../data/shopLive.js'

function ProductTags({ product }) {
  const tags = [product.brandTag || product.brand, product.formTag, product.useTag].filter(Boolean)
  return tags.map((tag) => (
    <span key={tag} className="tag-sticker">
      {tag}
    </span>
  ))
}

export default function Shop() {
  const [cat, setCat] = useState('all')
  const [price, setPrice] = useState('all')
  const shop = useShopCatalog()

  const list = useMemo(() => {
    const range = priceFilters.find((item) => item.id === price)
    return shop.products.filter((item) => {
      const okCat = cat === 'all' || item.category === cat
      const okPrice =
        !range ||
        range.id === 'all' ||
        (item.price != null && item.price >= range.min && item.price < range.max)
      return okCat && okPrice
    })
  }, [cat, price, shop.products])

  const known = list.filter((item) => !item.pendingCopy)
  const fresh = list.filter((item) => item.pendingCopy)

  return (
    <div className="shop-page">
      <header className="page-hero">
        <h1 className="graffiti-title">无人机商城</h1>
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
        <>
          {known.length > 0 ? (
            <div className="product-grid">
              {known.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}
          {fresh.length > 0 ? (
            <section className="section-block">
              <div className="section-head">
                <h2 className="graffiti-title sm">新品</h2>
              </div>
              <div className="product-grid">
                {fresh.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <section className="section-block" id="reading">
        <div className="section-head">
          <h2 className="graffiti-title sm">科普阅读</h2>
        </div>
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

function ProductCard({ product }) {
  return (
    <Link to={`/shop/${product.id}`} className="product-card">
      <div className={`product-art${product.image ? ' has-photo' : ''}`}>
        {product.image ? (
          <img className="product-photo" src={product.image} alt="" />
        ) : (
          <DroneArt variant={product.variant} accent={product.accent} />
        )}
        <span className="tag-sticker on-art">{product.tag}</span>
      </div>
      <div className="product-body">
        <div className="card-meta">
          <ProductTags product={product} />
          {product.pendingCopy ? <span className="copy-badge">待补充介绍</span> : null}
        </div>
        <h2>{product.name}</h2>
        <OfficialPrice product={product} size="lg" />
      </div>
    </Link>
  )
}
