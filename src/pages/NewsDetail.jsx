import { Link, useParams } from 'react-router-dom'
import SampleBadge from '../components/SampleBadge.jsx'
import Sources from '../components/Sources.jsx'
import { categoryLabel } from '../data/content.js'
import { formatItemDate, officialStatus, safeHttpUrl, showOfficialBadge, useNewsFeed } from '../data/newsFeed.js'

export default function NewsDetail() {
  const { id } = useParams()
  const feed = useNewsFeed()
  const item = feed.items.find((entry) => entry.id === id)

  if (feed.status === 'loading') {
    return (
      <div className="detail-page">
        <p>正在读取资讯…</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="detail-page">
        <p>未找到这条资讯。</p>
        <Link to="/news" className="btn-ghost">
          返回资讯列表
        </Link>
      </div>
    )
  }

  const related = feed.items
    .filter((entry) => entry.category === item.category && entry.id !== item.id)
    .slice(0, 3)
  const link = safeHttpUrl(item.link)
  const image = safeHttpUrl(item.image)
  const showSummary = item.sample || !item.body?.length

  return (
    <article className="detail-page">
      <Link to="/news" className="back-link">
        ← 返回行业资讯
      </Link>
      <div className="card-meta">
        <span className="tag-sticker">{categoryLabel(item.category)}</span>
        {showOfficialBadge(item) ? <span className="official-badge">官方发布</span> : null}
        {item.sample ? <SampleBadge /> : null}
        {item.unverifiedNote ? <span className="pending-badge">待核实</span> : null}
        {officialStatus(item) ? <span className="status-badge">{officialStatus(item)}</span> : null}
        <span className="card-date">{formatItemDate(item)}</span>
      </div>
      <h1 className="detail-title">{item.title}</h1>
      {item.unverifiedNote ? <p className="pending-note">{item.unverifiedNote}</p> : null}
      {officialStatus(item) ? <p className="status-note">{officialStatus(item)}</p> : null}
      {!item.sample && item.source && item.source !== 'EV1平台' ? (
        <p className="detail-source">来源：{item.source}</p>
      ) : null}
      {image ? (
        <img
          className="detail-cover"
          src={image}
          alt=""
          referrerPolicy="no-referrer"
          onError={(event) => event.currentTarget.remove()}
        />
      ) : null}
      {showSummary && item.summary ? <p className="detail-summary">{item.summary}</p> : null}
      {item.body?.length > 0 ? (
        <div className="detail-body">
          {item.body.map((para, index) => (
            <p key={`${index}-${para.slice(0, 24)}`}>{para}</p>
          ))}
        </div>
      ) : null}
      <Sources sources={item.sources} />
      {link ? (
        <p className="detail-actions">
          <a className="btn-primary" href={link} target="_blank" rel="noreferrer">
            阅读原文
          </a>
        </p>
      ) : null}
      {related.length > 0 ? (
        <section className="related">
          <h2>{item.sample ? '同栏目其他示例' : '同栏目其他资讯'}</h2>
          <ul>
            {related.map((entry) => (
              <li key={entry.id}>
                <Link to={`/news/${entry.id}`}>{entry.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
