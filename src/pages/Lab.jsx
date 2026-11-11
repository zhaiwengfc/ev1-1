import { Link } from 'react-router-dom'
import Stars from '../components/Stars.jsx'
import { intros, labArticles, labReviews } from '../data/content.js'

export default function Lab() {
  return (
    <div className="lab-page">
      <header className="page-hero">
        <p className="hero-kicker">技术研究与产品评测</p>
        <h1 className="graffiti-title">研究室</h1>
        <p className="page-lead">{intros.lab}</p>
      </header>

      <section className="section-block" id="research">
        <div className="section-head">
          <h2 className="graffiti-title sm">技术研究</h2>
        </div>
        <p className="section-intro">{intros.research}</p>
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
        </div>
        <p className="section-intro">{intros.review}</p>
        <div className="review-grid">
          {labReviews.map((item) => (
            <Link key={item.id} to={`/lab/${item.id}`} className="review-card">
              <div className="card-meta">
                <span className="tag-sticker">产品评测</span>
                {item.unverifiedNote ? <span className="pending-badge">待核实</span> : null}
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
