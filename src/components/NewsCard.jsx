import { Link } from 'react-router-dom'
import SampleBadge from './SampleBadge.jsx'
import { categoryLabel } from '../data/content.js'
import { formatItemDate, safeHttpUrl } from '../data/newsFeed.js'

export default function NewsCard({ item, titleAs = 'h2' }) {
  const Title = titleAs
  const image = safeHttpUrl(item.image)

  return (
    <Link to={`/news/${item.id}`} className="sticker-card">
      {image ? (
        <img
          className="news-thumb"
          src={image}
          alt=""
          referrerPolicy="no-referrer"
          onError={(event) => event.currentTarget.remove()}
        />
      ) : null}
      <div className="card-meta">
        <span className="tag-sticker">{categoryLabel(item.category)}</span>
        {item.official ? <span className="official-badge">官方发布</span> : null}
        {item.sample ? <SampleBadge /> : null}
        {item.unverifiedNote ? <span className="pending-badge">待核实</span> : null}
        {!item.sample && !item.official && item.source ? (
          <span className="news-source">{item.source}</span>
        ) : null}
      </div>
      <Title>{item.title}</Title>
      {item.summary ? <p>{item.summary}</p> : null}
      <span className="card-date">{formatItemDate(item)}</span>
    </Link>
  )
}
