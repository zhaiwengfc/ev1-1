import { useState } from 'react'
import DroneArt from './DroneArt.jsx'
import { formatSamplePrice } from '../data/content.js'
import { formatBeijing } from '../data/shopLive.js'

function localSrc(image) {
  if (!image || /^https?:/i.test(image)) return ''
  return `${import.meta.env.BASE_URL}${image.replace(/^\//, '')}`
}

export function ProductVisual({ product, stage = false, children }) {
  const [failed, setFailed] = useState(false)
  const src = localSrc(product.image)
  const showPhoto = Boolean(src) && !failed
  return (
    <div className={`${stage ? 'product-stage' : 'product-art'}${showPhoto ? ' has-photo' : ''}`}>
      {showPhoto ? (
        <img className="product-photo" src={src} alt="" onError={() => setFailed(true)} />
      ) : (
        <DroneArt variant={product.variant} accent={product.accent} />
      )}
      {children}
      {showPhoto ? <p className="image-credit">图片来源：品牌官网</p> : null}
    </div>
  )
}

export default function OfficialPrice({ product, size = '' }) {
  if (product.pricePending) {
    return (
      <div className="official-price">
        <p className="price-check">正在核对官方价格</p>
      </div>
    )
  }

  if (product.priceUncertain) {
    return (
      <div className="official-price">
        {product.storeUrl ? (
          <a className="btn-primary store-cta" href={product.storeUrl} target="_blank" rel="noreferrer">
            以官网为准，去官网查看 →
          </a>
        ) : (
          <p className="price-check">以官网为准</p>
        )}
      </div>
    )
  }

  const hasPrice = product.price != null && product.price !== ''
  const checked = product.checkedAt ? formatBeijing(product.checkedAt) : ''
  return (
    <div className="official-price">
      {hasPrice ? (
        <p className={`sample-price${size ? ` ${size}` : ''}`}>
          {formatSamplePrice(product.price)}
          {product.listPrice ? <s className="list-price">{formatSamplePrice(product.listPrice)}</s> : null}
          {product.priceLabel ? <span> {product.priceLabel}</span> : null}
        </p>
      ) : null}
      <p className="price-check">{`官方价格${checked ? ` · 最后核对 ${checked}` : ''}`}</p>
      {product.stockLabel ? <p className="price-check">{product.stockLabel}</p> : null}
      {product.storeUrl ? (
        <a className="store-link" href={product.storeUrl} target="_blank" rel="noreferrer">
          官方商城
        </a>
      ) : null}
    </div>
  )
}

export function BundlePrices({ product }) {
  if (!product || product.priceUncertain || !product.bundles || product.bundles.length < 2) return null
  return (
    <ul className="bundle-list">
      {product.bundles.map((bundle) => (
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
