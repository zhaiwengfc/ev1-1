import { Link } from 'react-router-dom'
import SampleBadge from '../components/SampleBadge.jsx'
import Stars from '../components/Stars.jsx'
import { labArticles, labReviews } from '../data/content.js'

export default function Lab() {
  return (
    <div className="lab-page">
      <header className="page-hero">
        <p className="hero-kicker">
          <SampleBadge /> 技术研究与产品评测
        </p>
        <h1 className="graffiti-title">研究室</h1>
        <p className="page-lead">
          研究室承担技术研究笔记与消费级无人机产品评测。以下文章、评分和优缺点全部为示例内容，不代表真实测试结论。也可回到
          <Link to="/shop"> 无人机商城 </Link>
          对照示例商品。
        </p>
      </header>

      <section className="section-block" id="research">
        <div className="section-head">
          <h2 className="graffiti-title sm">技术研究</h2>
          <SampleBadge>示例文稿</SampleBadge>
        </div>
        <div className="news-grid">
          {labArticles.map((item) => (
            <Link key={item.id} to={`/lab/${item.id}`} className="sticker-card">
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

      <section className="section-block" id="reviews">
        <div className="section-head">
          <h2 className="graffiti-title sm">产品评测</h2>
          <SampleBadge>示例评测</SampleBadge>
        </div>
        <div className="review-grid">
          {labReviews.map((item) => (
            <Link key={item.id} to={`/lab/${item.id}`} className="review-card">
              <div className="card-meta">
                <span className="tag-sticker">产品评测</span>
                <span className="card-date">{item.date}</span>
              </div>
              <h3>{item.title}</h3>
              <Stars value={item.rating} />
              <p>{item.summary}</p>
              <div className="pros-cons compact">
                <div className="pros">
                  <h4>优点</h4>
                  <ul>
                    {item.pros.slice(0, 2).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div className="cons">
                  <h4>不足</h4>
                  <ul>
                    {item.cons.slice(0, 2).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
