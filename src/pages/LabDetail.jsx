import { Link, useParams } from 'react-router-dom'
import Stars from '../components/Stars.jsx'
import Sources from '../components/Sources.jsx'
import { getLabItem, getProduct } from '../data/content.js'

export default function LabDetail() {
  const { id } = useParams()
  const item = getLabItem(id)

  if (!item) {
    return (
      <div className="detail-page">
        <p>未找到这篇文章。</p>
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
        {item.unverifiedNote ? <span className="pending-badge">待核实</span> : null}
        <span className="card-date">{item.date}</span>
      </div>
      <h1 className="detail-title">{item.title}</h1>
      {isReview && <Stars value={item.rating} />}
      {item.unverifiedNote ? <p className="pending-note">{item.unverifiedNote}</p> : null}
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
        {item.body.map((para, index) => (
          <p key={`${index}-${para.slice(0, 24)}`}>{para}</p>
        ))}
      </div>
      <Sources sources={item.sources} />
      {product && (
        <p className="related-inline">
          对照商城示例商品：
          <Link to={`/shop/${product.id}`}>{product.name}</Link>
        </p>
      )}
    </article>
  )
}
