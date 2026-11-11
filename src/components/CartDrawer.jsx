import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { formatSamplePrice } from '../data/content.js'
import SampleBadge from './SampleBadge.jsx'
import DroneArt from './DroneArt.jsx'

export default function CartDrawer() {
  const { open, setOpen, items, total, setQuantity, removeItem, clear } = useCart()

  return (
    <>
      <div
        className={`cart-backdrop${open ? ' is-open' : ''}`}
        onClick={() => setOpen(false)}
        hidden={!open}
      />
      <aside className={`cart-drawer${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <h2>购物车</h2>
          <SampleBadge>示例结算</SampleBadge>
          <button type="button" className="icon-close" onClick={() => setOpen(false)}>
            关闭
          </button>
        </div>
        {items.length === 0 ? (
          <p className="cart-empty">购物车还是空的。去商城看看示例商品吧。</p>
        ) : (
          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.productId} className="cart-item">
                <div className="cart-thumb">
                  <DroneArt variant={item.product.variant} accent={item.product.accent} />
                </div>
                <div className="cart-info">
                  <Link to={`/shop/${item.product.id}`} onClick={() => setOpen(false)}>
                    {item.product.name}
                  </Link>
                  <p className="sample-price">
                    {formatSamplePrice(item.product.price)}
                    <span> 示例价格</span>
                  </p>
                  <div className="qty-row">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => removeItem(item.productId)}
                    >
                      移除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="cart-foot">
          <p className="cart-total">
            示例合计 <strong>{formatSamplePrice(total)}</strong>
          </p>
          <p className="tiny-note">此为示例购物车，不支持真实下单或支付。</p>
          <div className="cart-actions">
            <button type="button" className="btn-ghost" onClick={clear} disabled={!items.length}>
              清空
            </button>
            <button type="button" className="btn-primary" disabled={!items.length}>
              去结算（示例）
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
