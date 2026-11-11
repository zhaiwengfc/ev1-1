import { NavLink } from 'react-router-dom'
import Wordmark from './Wordmark.jsx'
import { useCart } from '../context/CartContext.jsx'

const links = [
  { to: '/', label: '首页', end: true },
  { to: '/news', label: '行业资讯' },
  { to: '/shop', label: '无人机商城' },
  { to: '/lab', label: '研究室' },
]

export default function Header() {
  const { count, setOpen } = useCart()

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
        <button
          type="button"
          className="cart-btn"
          onClick={() => setOpen(true)}
          aria-label={`打开购物车，当前 ${count} 件示例商品`}
        >
          购物车
          <span className="cart-count">{count}</span>
        </button>
      </div>
    </header>
  )
}
