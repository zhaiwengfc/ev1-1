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
    return { ...product, storeUrl, pricePending: true, priceStale: false, listPrice: null, bundles: [] }
  }
  if (!live || live.officialPrice == null) {
    const checkedAt = catalogCheckedAt(product)
    return {
      ...product,
      storeUrl,
      checkedAt,
      priceStale: isPriceStale(checkedAt, now),
      pricePending: false,
      listPrice: null,
      bundles: [],
      stockLabel: '',
    }
  }
  const checkedAt = live.checkedAt || catalogCheckedAt(product)
  const specs = Array.isArray(live.specs) && live.specs.length >= 3 ? live.specs : product.specs
  return {
    ...product,
    price: live.officialPrice,
    listPrice: live.listPrice > live.officialPrice ? live.listPrice : null,
    priceLabel: live.priceLabel || product.priceLabel,
    bundles: Array.isArray(live.bundles) ? live.bundles : [],
    stockLabel: stockLabel(live.availability),
    storeUrl,
    checkedAt,
    priceStale: isPriceStale(checkedAt, now),
    pricePending: false,
    specs,
    specSource: specs !== product.specs ? live.specSource || '官网规格页' : '',
  }
}

export function launchProduct(item, now = Date.now()) {
  const checkedAt = item.checkedAt || item.firstSeenAt || ''
  const price = item.officialPrice ?? null
  return {
    id: item.id,
    name: item.name,
    brand: item.brand || '',
    brandTag: item.brand || '',
    category: 'aerial',
    categoryLabel: '航拍',
    tag: '新品',
    pendingCopy: true,
    price,
    listPrice: item.listPrice > price ? item.listPrice : null,
    priceLabel: item.priceLabel || '',
    currency: 'CNY',
    bundles: Array.isArray(item.bundles) ? item.bundles : [],
    stockLabel: stockLabel(item.availability),
    storeUrl: item.sourceUrl || '',
    checkedAt,
    priceStale: price == null || isPriceStale(checkedAt, now),
    pricePending: false,
    image: item.image || '',
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
