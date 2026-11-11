import { NavLink } from 'react-router-dom'
import Wordmark from './Wordmark.jsx'

const links = [
  { to: '/', label: '首页', end: true },
  { to: '/news', label: '行业资讯' },
  { to: '/shop', label: '无人机商城' },
]

export default function Header() {
  return (
    <header className="site-header">
      <div className="caution-tape header-tape" aria-hidden="true" />
      <div className="header-inner">
        <Wordmark />
        <nav className="site-nav" aria-label="主导航">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `nav-sticker${isActive ? ' is-active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
