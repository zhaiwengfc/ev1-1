import { formatSamplePrice } from '../data/content.js'
import { formatBeijing } from '../data/shopLive.js'

export default function OfficialPrice({ product, size = '' }) {
  const hasPrice = product.price != null && product.price !== ''
  const checked = product.checkedAt ? formatBeijing(product.checkedAt) : ''
  const status = product.pricePending
    ? '正在核对官方价格'
    : `${product.priceStale || !hasPrice ? '价格待更新' : '官方价格'}${checked ? ` · 最后核对 ${checked}` : ''}`

  return (
    <div className="official-price">
      {hasPrice ? (
        <p className={`sample-price${size ? ` ${size}` : ''}`}>
          {formatSamplePrice(product.price)}
          {product.listPrice ? <s className="list-price">{formatSamplePrice(product.listPrice)}</s> : null}
          {product.priceLabel ? <span> {product.priceLabel}</span> : null}
        </p>
      ) : (
        <p className={`sample-price${size ? ` ${size}` : ''}`}>价格待更新</p>
      )}
      <p className="price-check">{status}</p>
      {product.stockLabel ? <p className="price-check">{product.stockLabel}</p> : null}
      {product.storeUrl ? (
        <a className="store-link" href={product.storeUrl} target="_blank" rel="noreferrer">
          官方商城
        </a>
      ) : null}
    </div>
  )
}

export function BundlePrices({ bundles }) {
  if (!bundles || bundles.length < 2) return null
  return (
    <ul className="bundle-list">
      {bundles.map((bundle) => (
        <li key={bundle.id || bundle.name}>
          <span>{bundle.name}</span>
          <span>
            {formatSamplePrice(bundle.price)}
            {bundle.listPrice ? <s className="list-price">{formatSamplePrice(bundle.listPrice)}</s> : null}
          </span>
        </li>
      ))}
    </ul>
  )
}
