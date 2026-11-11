import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_FILE = path.join(ROOT, 'public', 'data', 'shop-live.json')
const DEPLOYED_URL = 'https://zhaiwengfc.github.io/ev1-1/data/shop-live.json'
const UA = 'EV1Shop/1.0 (+https://github.com/zhaiwengfc/ev1-1)'
const CN_COOKIE = 'region=CN; lang=zh-CN'
const SPEC_LABELS = ['起飞重量', '最长飞行时间', '影像传感器', '镜头', '图传方案']

const CATALOG = [
  {
    id: 'dji-mini-5-pro',
    brand: 'DJI',
    expect: 'Mini 5 Pro',
    storeUrl: 'https://store.dji.com/cn/product/dji-mini-5-pro',
    specsUrl: 'https://www.dji.com/cn/mini-5-pro/specs',
    kind: 'dji',
  },
  {
    id: 'dji-air-3s',
    brand: 'DJI',
    expect: 'Air 3S',
    storeUrl: 'https://store.dji.com/cn/product/dji-air-3s',
    specsUrl: 'https://www.dji.com/cn/air-3s/specs',
    kind: 'dji',
  },
  {
    id: 'dji-neo-2',
    brand: 'DJI',
    expect: 'Neo 2',
    storeUrl: 'https://store.dji.com/cn/product/dji-neo-2',
    specsUrl: 'https://www.dji.com/cn/neo-2/specs',
    kind: 'dji',
  },
  {
    id: 'antigravity-a1',
    brand: '影翎（Antigravity）',
    expect: 'A1',
    storeUrl: 'https://www.antigravity.tech/cn/drone/antigravity-a1/buy',
    specsUrl: 'https://www.antigravity.tech/cn/drone/antigravity-a1/specs',
    kind: 'antigravity',
    primaryName: '标准套装',
  },
]

const ACCESSORY =
  /care|propeller|battery|filter|charger|hub|bag|case|microsd|nd-|charging|goggles|intelligent-flight|transmission-module|accessory|combo-battery/i

export function isCnUrl(value) {
  try {
    const url = new URL(value)
    return url.pathname === '/cn' || url.pathname.startsWith('/cn/')
  } catch {
    return false
  }
}

export function assertPublicPage(value) {
  const url = new URL(value)
  if (url.pathname === '/api' || url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) {
    throw new Error(`robots.txt disallows ${url.pathname}`)
  }
}

export function officialImageUrl(html, primary = '') {
  const candidates = [primary]
  const tags = String(html || '').match(/<meta\b[^>]*>/gi) || []
  for (const tag of tags) {
    if (!/property=["']og:image["']/i.test(tag)) continue
    const content = tag.match(/content=["']([^"']+)["']/i)
    if (content) candidates.push(content[1])
  }
  for (const candidate of candidates) {
    const text = String(candidate || '').trim()
    if (text.startsWith('//')) return `https:${text}`
    if (/^https?:\/\//i.test(text)) return text
  }
  return ''
}

function decodeBasic(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

export function shanghaiNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type) => parts.find((part) => part.type === type)?.value || '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}+08:00`
}

function money(value) {
  const number = Number(String(value ?? '').replace(/,/g, ''))
  if (!Number.isFinite(number) || number < 100 || number >= 99999) return null
  return Math.round(number)
}

export function offerUnavailable(price, status) {
  const number = Number(price)
  if (Number.isFinite(number) && number >= 99999) return true
  if (status == null) return false
  const text = String(status).trim()
  if (!text || text === 'out_of_stock') return true
  return /not_sale|unavailable|sold_out|out_of_stock|缺货|不支持销往/i.test(text)
}

function currencyOk(value) {
  const text = String(value || '').toUpperCase()
  return text === 'CNY' || text === 'RMB' || text === '¥' || text === '￥'
}

export function parseJsonLdProducts(html) {
  const products = []
  const pattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let match = pattern.exec(html)
  while (match) {
    try {
      const data = JSON.parse(match[1])
      const nodes = Array.isArray(data) ? data : data['@graph'] || [data]
      for (const node of nodes) {
        const type = node?.['@type']
        const types = Array.isArray(type) ? type : [type]
        if (types.includes('Product')) products.push(node)
      }
    } catch {
      // A broken block does not hide the other blocks.
    }
    match = pattern.exec(html)
  }
  return products
}

function offerOf(product) {
  const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers
  return offer || null
}

function extractNextData(html) {
  const idAt = html.indexOf('id="__NEXT_DATA__"')
  if (idAt < 0) return null
  const start = html.indexOf('>', idAt)
  const end = html.indexOf('</script>', start)
  if (start < 0 || end < 0) return null
  try {
    return JSON.parse(html.slice(start + 1, end))
  } catch {
    return null
  }
}

function nameMatches(html, name, expect) {
  const needle = String(expect || '').toLowerCase().trim()
  if (!needle) return true
  const hay = `${name || ''} ${String(html).slice(0, 8000)}`.toLowerCase()
  return hay.includes(needle) || hay.includes(needle.replace(/\s+/g, ''))
}

function availabilityOf(value) {
  const text = String(value || '')
  if (/OutOfStock|SoldOut|not_sale|unavailable|缺货|不支持销往/i.test(text)) return 'out_of_stock'
  if (/PreOrder|预售/i.test(text)) return 'preorder'
  if (/InStock|on_sale|有货|立即购买|normal/i.test(text)) return 'in_stock'
  return ''
}

function extractJsonAssignment(html, marker) {
  const start = html.indexOf(marker)
  if (start < 0) return null
  let index = start + marker.length
  while (html[index] === ' ') index += 1
  const opener = html[index]
  if (opener !== '{' && opener !== '[') return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let cursor = index; cursor < html.length; cursor += 1) {
    const char = html[cursor]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{' || char === '[') depth += 1
    if (char === '}' || char === ']') {
      depth -= 1
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(index, cursor + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

function bundleFromVariant(variant) {
  const status = availabilityOf(variant?.status?.code || variant?.status?.text || '')
  const raw = Number(String(variant?.price ?? '').replace(/,/g, ''))
  const unavailable = offerUnavailable(raw, status)
  if (!unavailable && !currencyOk(variant?.currencyName || variant?.currencySymbol || 'CNY')) return null
  const price = unavailable ? null : money(raw)
  if (!unavailable && !price) return null
  const original = unavailable ? null : money(variant?.originalPrice)
  return {
    id: String(variant.slug || variant.id || ''),
    name: String(variant.title || variant.variantTitle || variant.slug || '').trim(),
    price,
    listPrice: original && price && original > price ? original : null,
    status: unavailable ? 'out_of_stock' : status,
  }
}

export function djiBundles(variants, slug) {
  const list = []
  const seen = new Set()
  const seenNames = new Set()
  for (const variant of variants || []) {
    const id = String(variant?.slug || '')
    if (!id || seen.has(id)) continue
    if (id !== slug && !id.startsWith(`${slug}-`)) continue
    if (ACCESSORY.test(id)) continue
    if (id !== slug && !/combo|fly-more|套装/i.test(`${id} ${variant.title || ''}`)) continue
    const bundle = bundleFromVariant(variant)
    if (!bundle?.name || seenNames.has(bundle.name)) continue
    seen.add(id)
    seenNames.add(bundle.name)
    list.push(bundle)
  }
  return list.filter((bundle, _index, all) => {
    if (/[\u4e00-\u9fff]/.test(bundle.name)) return true
    return !all.some((other) => other !== bundle && other.price === bundle.price && /[\u4e00-\u9fff]/.test(other.name))
  })
}

export function parseDjiProduct(html, { slug, expect }) {
  const ld = parseJsonLdProducts(html).find((item) =>
    String(item.name || '').toLowerCase().includes(String(expect).toLowerCase()),
  )
  const state = extractJsonAssignment(html, 'window.__PRELOADED_STATE__ =')
  const variants = state?.products?.variants || []
  const bundles = djiBundles(variants, slug)
  const available = bundles.filter((item) => item.price != null && item.status === 'in_stock')
  const base = available.find((item) => item.id === slug) || available.slice().sort((a, b) => a.price - b.price)[0] || null
  const offer = offerOf(ld)
  const ldStatus = availabilityOf(offer?.availability)
  const ldPrice = offerUnavailable(offer?.price, ldStatus) ? null : money(offer?.price)
  const ldCurrency = offer?.priceCurrency
  if (ld && ldCurrency && !currencyOk(ldCurrency)) {
    throw new Error(`currency ${ldCurrency}`)
  }
  const officialPrice = base?.price ?? (bundles.length ? null : ldPrice)
  if (officialPrice == null && bundles.length === 0) throw new Error('no CNY price')
  if (!nameMatches(html, ld?.name || base?.name, expect)) throw new Error('product name did not match')
  const rawImage = typeof ld?.image === 'string' ? ld.image : Array.isArray(ld?.image) ? ld.image[0] : ''
  return {
    name: String(ld?.name || base?.name || '').trim(),
    officialPrice,
    listPrice: base?.listPrice || null,
    currency: 'CNY',
    priceLabel: base?.name || String(ld?.name || '').trim(),
    availability: base ? 'in_stock' : 'out_of_stock',
    bundles,
    officialBlurb: String(ld?.description || '').trim(),
    image: officialImageUrl(html, rawImage),
  }
}

export function parseAntigravityBuy(html, { primaryName = '标准套装', expect = 'A1' } = {}) {
  const next = extractNextData(html)
  let commodities = next?.props?.pageProps?.productInfo?.commodities
  if (!Array.isArray(commodities)) {
    const ld = parseJsonLdProducts(html)
    commodities = ld.map((item) => ({
      id: item.sku || item.name,
      name: item.name,
      price: { currency: offerOf(item)?.priceCurrency, amount: offerOf(item)?.price },
      originPrice: null,
      saleState: offerOf(item)?.availability,
    }))
  }
  const bundles = []
  for (const item of commodities || []) {
    const currency = item?.price?.currency || item?.price?.signal
    if (currency && !currencyOk(currency)) continue
    const raw = Number(item?.price?.amount ?? item?.price)
    const status = availabilityOf(item.saleState || item.availability || '')
    const unavailable = offerUnavailable(raw, status || (item.saleState ? '' : 'in_stock'))
    const price = unavailable ? null : money(raw)
    if (!unavailable && !price) continue
    const name = String(item.name || '').trim()
    if (!name || !/套装/.test(name)) continue
    const list = unavailable ? null : money(item?.originPrice?.amount ?? item?.originPrice)
    bundles.push({
      id: String(item.id || name),
      name,
      price,
      listPrice: list && price && list > price ? list : null,
      status: unavailable ? 'out_of_stock' : status || 'in_stock',
    })
  }
  const available = bundles.filter((item) => item.price != null && item.status === 'in_stock')
  if (!bundles.length) throw new Error('no CNY bundles')
  const primary = available.find((item) => item.name.includes(primaryName)) || available[0] || null
  if (!nameMatches(html, `${primary?.name || ''} ${bundles.map((item) => item.name).join(' ')}`, expect)) {
    throw new Error('product name did not match')
  }
  const image = String(
    commodities?.find((item) => String(item.name || '').includes(primaryName))?.mainPictureUrlM
      || commodities?.[0]?.mainPictureUrlM
      || '',
  )
  return {
    name: primary?.name || bundles[0]?.name || '',
    officialPrice: primary?.price ?? null,
    listPrice: primary?.listPrice || null,
    currency: 'CNY',
    priceLabel: primary?.name || '',
    availability: primary ? 'in_stock' : 'out_of_stock',
    bundles,
    officialBlurb: '',
    image: officialImageUrl(html, image),
  }
}

export function parseSpecList(html) {
  const specs = []
  const pattern = /<h4>([^<]+)<\/h4>[\s\S]*?<div class="detailed-parameter-value">([\s\S]*?)<\/div>/g
  let match = pattern.exec(html)
  while (match) {
    const label = decodeBasic(match[1]).trim()
    if (SPEC_LABELS.includes(label) && !specs.some((row) => row[0] === label)) {
      const first = decodeBasic(match[2])
        .split('\n')
        .map((line) => line.trim())
        .find(Boolean)
      if (first && first.length <= 80) specs.push([label, first])
    }
    match = pattern.exec(html)
  }
  return specs.length >= 3 ? specs : []
}

export function cameraDroneSlugs(html) {
  const slugs = new Set()
  const pattern = /store\.dji\.com\/(?:cn\/)?product\/([a-z0-9-]+)/g
  let match = pattern.exec(html)
  while (match) {
    slugs.add(match[1])
    match = pattern.exec(html)
  }
  return [...slugs]
}

export function sitemapProductSlugs(xml) {
  const slugs = new Set()
  const pattern = /\/cn\/product\/([a-z0-9-]+)/g
  let match = pattern.exec(xml)
  while (match) {
    slugs.add(match[1])
    match = pattern.exec(xml)
  }
  return slugs
}

export function isConsumerDroneSlug(slug) {
  if (!/^dji-(mini|air|neo|avata|flip|mavic|lito)(?:-[a-z0-9]+)*$/.test(slug)) return false
  if (ACCESSORY.test(slug) || /combo|fly-more|inspire|matrice|agras|dock|om-|osmo|mic/.test(slug)) return false
  return true
}

export function selectLaunchIds({ pageSlugs, sitemapSlugs, catalogIds, antiSlugs = [] }) {
  const known = catalogIds instanceof Set ? catalogIds : new Set(catalogIds)
  const dji = pageSlugs.filter((slug) => isConsumerDroneSlug(slug) && sitemapSlugs.has(slug) && !known.has(slug))
  const anti = antiSlugs.filter((slug) => !known.has(slug) && slug !== 'antigravity-a1')
  return { dji, anti }
}

export function antigravityDroneSlugs(xml) {
  const slugs = new Set()
  const pattern = /\/cn\/drone\/([a-z0-9-]+)/g
  let match = pattern.exec(xml)
  while (match) {
    const slug = match[1]
    if (!/follow-me|-global$|buy|specs|news|hub/.test(slug) && slug.startsWith('antigravity-')) slugs.add(slug)
    match = pattern.exec(xml)
  }
  return [...slugs]
}

export function keepPrevious(previous, error, attemptedAt) {
  if (previous && previous.officialPrice) {
    return { ...previous, ok: false, error: String(error || 'fetch failed'), attemptedAt }
  }
  return null
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchText(url, { requireCn = false } = {}) {
  assertPublicPage(url)
  let current = url
  for (let hop = 0; hop < 4; hop += 1) {
    const response = await fetch(current, {
      redirect: 'manual',
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xml,text/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        Cookie: CN_COOKIE,
      },
      signal: AbortSignal.timeout(20000),
    })
    if (response.status >= 300 && response.status < 400) {
      const next = new URL(response.headers.get('location') || '', current).toString()
      if (requireCn && !isCnUrl(next)) throw new Error(`left /cn/ for ${next}`)
      current = next
      continue
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (requireCn && !isCnUrl(response.url || current)) throw new Error(`left /cn/ for ${response.url || current}`)
    return response.text()
  }
  throw new Error('too many redirects')
}

async function fetchOptional(url, options) {
  try {
    return await fetchText(url, options)
  } catch (error) {
    console.warn(`[shop] ${url} failed: ${error.message}`)
    return ''
  }
}

function recordFailure(failures, source, error) {
  failures.push({ source, error: String(error?.message || error) })
  console.warn(`[shop] fail ${source}: ${error?.message || error}`)
}

async function loadPrevious() {
  const local = readJson(OUT_FILE) || { products: {}, newLaunches: [] }
  try {
    const response = await fetch(DEPLOYED_URL, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) return local
    const deployed = await response.json()
    const localTime = Date.parse(local.checkedAt || 0)
    const deployedTime = Date.parse(deployed?.checkedAt || 0)
    if (deployedTime > localTime) return deployed
  } catch {
    // The committed file is enough when the live site has no copy yet.
  }
  return local
}

const IMAGE_DIR = path.join(ROOT, 'public', 'images', 'products')
const imageStats = {}

function imageBrand(brand) {
  if (/影翎|antigravity/i.test(brand || '')) return '影翎'
  if (/dji|大疆/i.test(brand || '')) return 'DJI'
  return brand || '其他'
}

async function saveOfficialImage(id, remoteUrl, brand) {
  const key = imageBrand(brand)
  if (!imageStats[key]) imageStats[key] = { found: 0, missing: 0 }
  if (!remoteUrl) {
    imageStats[key].missing += 1
    return ''
  }
  try {
    assertPublicPage(remoteUrl)
    const response = await fetch(remoteUrl, {
      headers: { 'User-Agent': UA, Accept: 'image/*,*/*', Cookie: CN_COOKIE },
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    const sharp = (await import('sharp')).default
    fs.mkdirSync(IMAGE_DIR, { recursive: true })
    const file = path.join(IMAGE_DIR, `${id}.webp`)
    await sharp(bytes).rotate().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 72 }).toFile(file)
    imageStats[key].found += 1
    console.log(`[shop] image ${key} ${id} ${fs.statSync(file).size} bytes`)
    return `images/products/${id}.webp`
  } catch (error) {
    imageStats[key].missing += 1
    console.warn(`[shop] image ${id} failed: ${error.message}`)
    return ''
  }
}

function withMeta(parsed, source, checkedAt, specs) {
  return {
    ...parsed,
    currency: 'CNY',
    sourceUrl: source.storeUrl,
    specsUrl: source.specsUrl,
    specSource: specs.length ? source.specSource : '',
    specs,
    checkedAt,
    ok: true,
    error: '',
  }
}

export async function main() {
  const checkedAt = shanghaiNow()
  const previous = await loadPrevious()
  const products = { ...(previous.products || {}) }
  const failures = []
  const notes = []

  for (const source of CATALOG) {
    await sleep(1000)
    try {
      const html = await fetchText(source.storeUrl, { requireCn: true })
      const parsed =
        source.kind === 'dji'
          ? parseDjiProduct(html, { slug: source.id, expect: source.expect })
          : parseAntigravityBuy(html, { primaryName: source.primaryName, expect: source.expect })
      await sleep(1000)
      const specsHtml = await fetchOptional(source.specsUrl, { requireCn: true })
      const specs =
        specsHtml && specsHtml.toLowerCase().includes(source.expect.toLowerCase())
          ? parseSpecList(specsHtml)
          : []
      parsed.image = await saveOfficialImage(source.id, parsed.image, source.brand)
      products[source.id] = withMeta(
        parsed,
        { ...source, specSource: source.kind === 'dji' ? '大疆官网规格页' : '影翎官网参数页' },
        checkedAt,
        specs,
      )
      notes.push(`${source.id} ¥${parsed.officialPrice}${parsed.listPrice ? ` (划线 ¥${parsed.listPrice})` : ''} bundles ${parsed.bundles.length}`)
      console.log(`[shop] ok ${source.id} ¥${parsed.officialPrice}`)
    } catch (error) {
      recordFailure(failures, source.id, error)
      const kept = keepPrevious(previous.products?.[source.id], error, checkedAt)
      if (kept) products[source.id] = kept
    }
  }

  const known = new Set(CATALOG.map((item) => item.id))
  let newLaunches = Array.isArray(previous.newLaunches) ? previous.newLaunches : []
  try {
    await sleep(1000)
    const [cameraHtml, sitemapXml, antiXml] = await Promise.all([
      fetchText('https://www.dji.com/cn/camera-drones', { requireCn: true }),
      fetchText('https://assets.djicdn.com/sitemap/store/store-cn.xml'),
      fetchText('https://www.antigravity.tech/sitemap-cn.xml'),
    ])
    const onPage = cameraDroneSlugs(cameraHtml)
    const inSitemap = sitemapProductSlugs(sitemapXml)
    const { dji: djiIds, anti: antiIds } = selectLaunchIds({
      pageSlugs: onPage,
      sitemapSlugs: inSitemap,
      catalogIds: known,
      antiSlugs: antigravityDroneSlugs(antiXml),
    })
    const previousById = new Map(newLaunches.map((item) => [item.id, item]))
    const fresh = []
    for (const slug of djiIds) {
      await sleep(1000)
      const storeUrl = `https://store.dji.com/cn/product/${slug}`
      const specsUrl = `https://www.dji.com/cn/${slug.replace(/^dji-/, '')}/specs`
      try {
        const html = await fetchText(storeUrl, { requireCn: true })
        const parsed = parseDjiProduct(html, { slug, expect: slug.replace(/^dji-/, '').replace(/-/g, ' ') })
        parsed.image = await saveOfficialImage(slug, parsed.image, 'DJI')
        if (!parsed.name) throw new Error('missing official name')
        fresh.push({
          id: slug,
          name: parsed.name,
          brand: 'DJI',
          officialPrice: parsed.officialPrice,
          listPrice: parsed.listPrice,
          currency: 'CNY',
          priceLabel: parsed.priceLabel,
          availability: parsed.availability,
          bundles: parsed.bundles,
          officialBlurb: parsed.officialBlurb,
          image: parsed.image,
          sourceUrl: storeUrl,
          specsUrl,
          status: 'pending_copy',
          firstSeenAt: previousById.get(slug)?.firstSeenAt || checkedAt,
          checkedAt,
          ok: true,
        })
        console.log(`[shop] new ${slug} ${parsed.name} ¥${parsed.officialPrice}`)
      } catch (error) {
        recordFailure(failures, slug, error)
        if (previousById.get(slug)) fresh.push({ ...previousById.get(slug), ok: false, error: error.message, attemptedAt: checkedAt })
      }
    }
    for (const slug of antiIds) {
      await sleep(1000)
      const storeUrl = `https://www.antigravity.tech/cn/drone/${slug}/buy`
      try {
        const html = await fetchText(storeUrl, { requireCn: true })
        const parsed = parseAntigravityBuy(html, { expect: slug })
        parsed.image = await saveOfficialImage(slug, parsed.image, '影翎')
        fresh.push({
          id: slug,
          name: parsed.name,
          brand: '影翎（Antigravity）',
          officialPrice: parsed.officialPrice,
          listPrice: parsed.listPrice,
          currency: 'CNY',
          priceLabel: parsed.priceLabel,
          availability: parsed.availability,
          bundles: parsed.bundles,
          officialBlurb: parsed.officialBlurb,
          image: parsed.image,
          sourceUrl: storeUrl,
          specsUrl: `https://www.antigravity.tech/cn/drone/${slug}/specs`,
          status: 'pending_copy',
          firstSeenAt: previousById.get(slug)?.firstSeenAt || checkedAt,
          checkedAt,
          ok: true,
        })
      } catch (error) {
        recordFailure(failures, slug, error)
        if (previousById.get(slug)) fresh.push({ ...previousById.get(slug), ok: false, attemptedAt: checkedAt })
      }
    }
    newLaunches = fresh
    notes.push(`new ${fresh.map((item) => item.id).join(', ') || 'none'}`)
  } catch (error) {
    recordFailure(failures, 'new-launches', error)
  }

  const payload = { checkedAt, products, newLaunches, failures }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`)
  console.log(`[shop] wrote ${Object.keys(products).length} products, ${newLaunches.length} new, ${failures.length} failures`)
  console.log(notes.join('\n'))
  for (const [brand, stat] of Object.entries(imageStats)) {
    console.log(`[shop] images ${brand} found ${stat.found}, missing ${stat.missing}`)
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectRun) {
  main()
    .catch((error) => {
      console.error('[shop] fatal', error)
    })
    .finally(() => {
      process.exitCode = 0
    })
}
