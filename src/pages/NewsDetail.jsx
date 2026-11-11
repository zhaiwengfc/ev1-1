import { Link, useParams } from 'react-router-dom'
import SampleBadge from '../components/SampleBadge.jsx'
import { getNews, categoryLabel, news } from '../data/content.js'

export default function NewsDetail() {
  const { id } = useParams()
  const item = getNews(id)

  if (!item) {
    return (
      <div className="detail-page">
        <p>未找到该示例资讯。</p>
        <Link to="/news" className="btn-ghost">
          返回资讯列表
        </Link>
      </div>
    )
  }

  const related = news.filter((n) => n.category === item.category && n.id !== item.id).slice(0, 3)

  return (
    <article className="detail-page">
      <Link to="/news" className="back-link">
        ← 返回行业资讯
      </Link>
      <div className="card-meta">
        <span className="tag-sticker">{categoryLabel(item.category)}</span>
        <SampleBadge />
        <span className="card-date">{item.date}</span>
      </div>
      <h1 className="detail-title">{item.title}</h1>
      <p className="detail-summary">{item.summary}</p>
      <div className="detail-body">
        {item.body.map((para) => (
          <p key={para}>{para}</p>
        ))}
      </div>
      {related.length > 0 && (
        <section className="related">
          <h2>同栏目其他示例</h2>
          <ul>
            {related.map((n) => (
              <li key={n.id}>
                <Link to={`/news/${n.id}`}>{n.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
