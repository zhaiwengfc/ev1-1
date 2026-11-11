import { useMemo, useState } from 'react'
import NewsCard from '../components/NewsCard.jsx'
import { newsCategories } from '../data/content.js'
import { PUBLISH_URL, formatUpdated, useNewsFeed } from '../data/newsFeed.js'
import { useSearchParams } from 'react-router-dom'

export default function News() {
  const feed = useNewsFeed()
  const [params, setParams] = useSearchParams()
  const initial = params.get('cat') || 'all'
  const [category, setCategory] = useState(
    newsCategories.some((item) => item.id === initial) ? initial : 'all',
  )

  const list = useMemo(() => {
    if (category === 'all') return feed.items
    return feed.items.filter((item) => item.category === category)
  }, [category, feed.items])

  const select = (id) => {
    setCategory(id)
    if (id === 'all') setParams({})
    else setParams({ cat: id })
  }

  const ready = feed.status === 'ready'

  return (
    <div className="news-page">
      <header className="page-hero">
        <div className="news-toolbar">
          <div>
            <h1 className="graffiti-title">行业资讯</h1>
          </div>
          <a className="btn-primary publish-btn" href={PUBLISH_URL} target="_blank" rel="noreferrer">
            发布资讯
          </a>
        </div>
        <p className="news-updated">
          {!ready
            ? '正在读取资讯…'
            : feed.sample
              ? '当前显示的是示例资讯。自动更新完成后，这里会换成公开报道。'
              : formatUpdated(feed.updatedAt)}
        </p>
      </header>

      <div className="tab-row" role="tablist" aria-label="资讯分类">
        {newsCategories.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={category === item.id}
            className={`tab-sticker${category === item.id ? ' is-active' : ''}`}
            onClick={() => select(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>

      {!ready ? (
        <p className="result-count">正在读取资讯…</p>
      ) : list.length === 0 ? (
        <p className="empty-hint">这个分类暂时没有资讯。</p>
      ) : (
        <>
          <p className="result-count">
            {feed.sample ? `共 ${list.length} 条示例资讯` : `共 ${list.length} 条`}
          </p>
          <div className="news-grid">
            {list.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
