import { useEffect, useMemo, useState } from 'react'
import { products as catalogProducts } from './catalog.js'

export const PRICE_STALE_MS = 48 * 60 * 60 * 1000

export function formatBeijing(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type) => parts.find((part) => part.type === type)?.value || ''
  if (!get('year')) return ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
}

export function isPriceStale(checkedAt, now = Date.now()) {
  const time = Date.parse(checkedAt || '')
  if (!Number.isFinite(time)) return true
  return now - time > PRICE_STALE_MS
}

export function stockLabel(availability) {
  if (availability === 'in_stock') return '有货'
  if (availability === 'out_of_stock') return '缺货'
  if (availability === 'preorder') return '预售'
  return ''
}

function localProductImage(value) {
  const text = String(value || '').trim()
  if (!text || /^https?:/i.test(text)) return ''
  return text.replace(/^\//, '')
}

export function offerUnavailable(price, status) {
  const number = Number(price)
  if (Number.isFinite(number) && number >= 99999) return true
  if (status == null) return false
  const text = String(status).trim()
  if (!text || text === 'out_of_stock') return true
  return /not_sale|unavailable|sold_out|out_of_stock|缺货|不支持销往/i.test(text)
}

export function sanitizeBundles(bundles) {
  return (bundles || []).map((bundle) => {
    if (offerUnavailable(bundle?.price, bundle?.status)) {
      return { ...bundle, price: null, listPrice: null, status: 'out_of_stock' }
    }
    return bundle
  })
}

export function chooseMainBundle(bundles, slug) {
  const available = sanitizeBundles(bundles).filter((bundle) => bundle.price != null && bundle.status === 'in_stock')
  return available.find((bundle) => bundle.id === slug) || available.slice().sort((a, b) => a.price - b.price)[0] || null
}

export function hasFilterPrice(product) {
  return (
    product?.price != null &&
    product.price < 99999 &&
    product.availability !== 'out_of_stock' &&
    !product.priceUnavailable
  )
}
export function isPriceUncertain(product) {
  if (product.pricePending) return false
  if (product.pendingCopy || product.sample || product.unverifiedNote) return true
  if (!product.officialFetched) return true
  if (product.currency && product.currency !== 'CNY') return true
  if (product.price == null || product.price === '') return true
  if (product.priceStale) return true
  return false
}
function catalogCheckedAt(product) {
  const match = String(product?.priceNote || '').match(/(\d{4}-\d{2}-\d{2})/)
  return match ? `${match[1]}T12:00:00+08:00` : ''
}

export function applyLiveProduct(product, live, now = Date.now(), { pending = false } = {}) {
  const storeUrl =
    live?.sourceUrl ||
    [...(product.sources || [])].reverse().find((item) => item.url)?.url ||
    ''
  if (pending) {
    return {
      ...product,
      storeUrl,
      pricePending: true,
      priceStale: false,
      priceUncertain: false,
      officialFetched: false,
      listPrice: null,
      bundles: [],
    }
  }
  const image = localProductImage(live?.image)
  const bundles = sanitizeBundles(live?.bundles)
  let main = chooseMainBundle(bundles, product.id)
  if (!main && live && !offerUnavailable(live.officialPrice, live.availability == null ? 'in_stock' : live.availability)) {
    main = {
      id: product.id,
      name: live.priceLabel || product.priceLabel,
      price: Number(live.officialPrice),
      listPrice: live.listPrice,
      status: 'in_stock',
    }
  }
  if (!live || !main) {
    const checkedAt = live?.checkedAt || catalogCheckedAt(product)
    const next = {
      ...product,
      image,
      imageCredit: image ? '品牌官网' : '',
      storeUrl,
      checkedAt,
      price: null,
      priceLabel: product.priceLabel,
      availability: 'out_of_stock',
      priceUnavailable: true,
      priceStale: !live || isPriceStale(checkedAt, now),
      officialFetched: Boolean(live),
      pricePending: false,
      listPrice: null,
      bundles,
      stockLabel: '缺货/暂无报价',
    }
    return { ...next, priceUncertain: isPriceUncertain(next) }
  }
  const checkedAt = live.checkedAt || catalogCheckedAt(product)
  const specs = Array.isArray(live.specs) && live.specs.length >= 3 ? live.specs : product.specs
  const next = {
    ...product,
    price: main.price,
    listPrice: main.listPrice > main.price ? main.listPrice : null,
    priceLabel: main.name || live.priceLabel || product.priceLabel,
    bundles,
    stockLabel: stockLabel('in_stock'),
    availability: 'in_stock',
    priceUnavailable: false,
    storeUrl,
    checkedAt,
    currency: live.currency || product.currency || 'CNY',
    officialFetched: true,
    priceStale: isPriceStale(checkedAt, now),
    pricePending: false,
    image,
    imageCredit: image ? '品牌官网' : '',
    specs,
    specSource: specs !== product.specs ? live.specSource || '官网规格页' : '',
  }
  return { ...next, priceUncertain: isPriceUncertain(next) }
}

export function launchProduct(item, now = Date.now()) {
  const checkedAt = item.checkedAt || item.firstSeenAt || ''
  const bundles = sanitizeBundles(item.bundles)
  const main = chooseMainBundle(bundles, item.id)
  const price = main?.price ?? null
  const image = localProductImage(item.image)
  const next = {
    id: item.id,
    name: item.name,
    brand: item.brand || '',
    brandTag: item.brand || '',
    category: 'aerial',
    categoryLabel: '航拍',
    tag: '新品',
    pendingCopy: true,
    price,
    listPrice: main?.listPrice > price ? main.listPrice : null,
    priceLabel: main?.name || item.priceLabel || '',
    currency: item.currency || 'CNY',
    bundles,
    availability: price == null ? 'out_of_stock' : 'in_stock',
    priceUnavailable: price == null,
    stockLabel: price == null ? '缺货/暂无报价' : stockLabel('in_stock'),
    storeUrl: item.sourceUrl || '',
    checkedAt,
    officialFetched: Boolean(item.ok !== false && (item.officialPrice != null || bundles.length)),
    priceStale: isPriceStale(checkedAt, now),
    pricePending: false,
    image,
    imageCredit: image ? '品牌官网' : '',
    officialBlurb: item.officialBlurb || '',
    specs: Array.isArray(item.specs) ? item.specs : [],
    specSource: item.specSource || '',
    intro: [],
    highlights: [],
    techBody: [],
    sources: item.sourceUrl ? [{ label: '官方商城', url: item.sourceUrl }] : [],
    accent: '#FFE500',
    variant: 'quad',
  }
  return { ...next, priceUncertain: isPriceUncertain(next) }
}

export function mergeShop(catalog, live, now = Date.now(), { pending = false } = {}) {
  const liveProducts = live?.products || {}
  const known = new Set(catalog.map((item) => item.id))
  const merged = catalog.map((product) => applyLiveProduct(product, pending ? undefined : liveProducts[product.id], now, { pending }))
  if (!pending) {
    for (const item of live?.newLaunches || []) {
      if (!item?.id || !item?.name || known.has(item.id)) continue
      merged.push(launchProduct(item, now))
      known.add(item.id)
    }
  }
  return merged
}

let pendingLoad = null

export function loadShopLive() {
  if (!pendingLoad) {
    pendingLoad = fetch(`${import.meta.env.BASE_URL}data/shop-live.json`, { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`status ${response.status}`)
        return response.json()
      })
      .catch(() => ({ products: {}, newLaunches: [] }))
  }
  return pendingLoad
}

export function useShopCatalog() {
  const [live, setLive] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let alive = true
    loadShopLive().then((data) => {
      if (!alive) return
      setLive(data)
      setStatus('ready')
    })
    return () => {
      alive = false
    }
  }, [])

  const products = useMemo(
    () => mergeShop(catalogProducts, live, Date.now(), { pending: status !== 'ready' }),
    [live, status],
  )

  const getProduct = (id) => products.find((item) => item.id === id)

  return { status, products, getProduct }
}
