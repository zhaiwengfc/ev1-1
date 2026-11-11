import { Link } from 'react-router-dom'
import Wordmark from './Wordmark.jsx'
import { SITE } from '../data/content.js'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="caution-tape" aria-hidden="true" />
      <div className="footer-inner">
        <div className="footer-brand">
          <Wordmark />
          <p className="footer-tag">{SITE.tagline}</p>
        </div>
        <div className="footer-links">
          <Link to="/news">行业资讯</Link>
          <Link to="/shop">无人机商城</Link>
          <Link to="/shop#reading">科普阅读</Link>
        </div>
        <p className="footer-disclaimer">{SITE.disclaimer}</p>
      </div>
    </footer>
  )
}
