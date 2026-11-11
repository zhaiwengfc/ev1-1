import { Link, useParams } from 'react-router-dom'
import SampleBadge from '../components/SampleBadge.jsx'
import DroneArt from '../components/DroneArt.jsx'
import { useCart } from '../context/CartContext.jsx'
import {
  getProduct,
  formatSamplePrice,
  productCategoryLabel,
  labReviews,
} from '../data/content.js'

export default function ProductDetail() {
  const { id } = useParams()
  const product = getProduct(id)
  const { addItem } = useCart()

  if (!product) {
    return (
      <div className="detail-page">
        <p>未找到该示例商品。</p>
        <Link to="/shop" className="btn-ghost">
          返回商城
        </Link>
      </div>
    )
  }

  const relatedReview = labReviews.find((item) => item.productId === product.id)

  return (
    <article className="product-detail">
      <Link to="/shop" className="back-link">
        ← 返回无人机商城
      </Link>
      <div className="product-detail-grid">
        <div className="product-stage">
          <DroneArt variant={product.variant} accent={product.accent} />
          <SampleBadge className="stage-badge">示例商品 · 非真实品牌</SampleBadge>
        </div>
        <div>
          <div className="card-meta">
            <span className="tag-sticker">{productCategoryLabel(product.category)}</span>
            <span className="tag-sticker">{product.tag}</span>
          </div>
          <h1 className="detail-title">{product.name}</h1>
          <p className="sample-price xl">
            {formatSamplePrice(product.price)}
            <span> 示例价格，非真实报价</span>
          </p>
          <p className="detail-summary">{product.desc}</p>
          <button type="button" className="btn-primary" onClick={() => addItem(product.id)}>
            加入购物车
          </button>
          <p className="tiny-note">加入后可在右侧抽屉调整数量。结算按钮为示意，不会产生真实订单。</p>
        </div>
      </div>
      <section className="spec-board">
        <h2>示例规格</h2>
        <dl>
          {product.specs.map(([k, v]) => (
            <div key={k} className="spec-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      {relatedReview && (
        <p className="related-inline">
          研究室有对应的
          <Link to={`/lab/${relatedReview.id}`}>示例评测：{relatedReview.title}</Link>
        </p>
      )}
    </article>
  )
}
