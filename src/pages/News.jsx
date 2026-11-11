import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SampleBadge from '../components/SampleBadge.jsx'
import { news, newsCategories, categoryLabel } from '../data/content.js'

export default function News() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('cat') || 'all'
  const [category, setCategory] = useState(
    newsCategories.some((item) => item.id === initial) ? initial : 'all',
  )

  const list = useMemo(
    () =>
      category === 'all' ? news : news.filter((item) => item.category === category),
    [category],
  )

  const select = (id) => {
    setCategory(id)
    if (id === 'all') setParams({})
    else setParams({ cat: id })
  }

  return (
    <div className="news-page">
      <header className="page-hero">
        <p className="hero-kicker">
          <SampleBadge /> 低空行业信息交流
        </p>
        <h1 className="graffiti-title">行业资讯</h1>
        <p className="page-lead">
          按四个栏目浏览示例资讯：政府政策、科技创新与供应链、比赛信息、无人机新品发布。点击卡片可进入详情。所有稿件均为占位文本，不含真实文号或新闻事实。
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

      <p className="result-count">共 {list.length} 条示例资讯</p>
      <div className="news-grid">
        {list.map((item) => (
          <Link key={item.id} to={`/news/${item.id}`} className="sticker-card">
            <div className="card-meta">
              <span className="tag-sticker">{categoryLabel(item.category)}</span>
              <SampleBadge />
            </div>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <span className="card-date">{item.date}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
