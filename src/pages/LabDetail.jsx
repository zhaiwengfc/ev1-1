import { Link, useParams } from 'react-router-dom'
import SampleBadge from '../components/SampleBadge.jsx'
import Stars from '../components/Stars.jsx'
import { getLabItem, getProduct } from '../data/content.js'

export default function LabDetail() {
  const { id } = useParams()
  const item = getLabItem(id)

  if (!item) {
    return (
      <div className="detail-page">
        <p>未找到该示例文章。</p>
        <Link to="/lab" className="btn-ghost">
          返回研究室
        </Link>
      </div>
    )
  }

  const product = item.productId ? getProduct(item.productId) : null
  const isReview = item.type === 'review'

  return (
    <article className="detail-page">
      <Link to="/lab" className="back-link">
        ← 返回研究室
      </Link>
      <div className="card-meta">
        <span className="tag-sticker">{isReview ? '产品评测' : '技术研究'}</span>
        <SampleBadge>{isReview ? '示例评测' : '示例文稿'}</SampleBadge>
        <span className="card-date">{item.date}</span>
      </div>
      <h1 className="detail-title">{item.title}</h1>
      {isReview && <Stars value={item.rating} />}
      <p className="detail-summary">{item.summary}</p>
      {isReview && (
        <div className="pros-cons">
          <div className="pros">
            <h2>优点</h2>
            <ul>
              {item.pros.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="cons">
            <h2>不足</h2>
            <ul>
              {item.cons.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className="detail-body">
        {item.body.map((para) => (
          <p key={para}>{para}</p>
        ))}
      </div>
      {product && (
        <p className="related-inline">
          对照商城示例商品：
          <Link to={`/shop/${product.id}`}>{product.name}</Link>
        </p>
      )}
    </article>
  )
}
