import assert from 'node:assert/strict'
import test from 'node:test'
import {
  antigravityDroneSlugs,
  assertPublicPage,
  cameraDroneSlugs,
  isCnUrl,
  isConsumerDroneSlug,
  keepPrevious,
  officialImageUrl,
  parseAntigravityBuy,
  parseDjiProduct,
  parseSpecList,
  selectLaunchIds,
  sitemapProductSlugs,
} from './fetch-shop.mjs'

const djiHtml = `<!DOCTYPE html><html><head><title>购买 DJI Mini 5 Pro</title>
<script type="application/ld+json">{"@context":"https://schema.org/","@type":"Product","name":"DJI Mini 5 Pro","image":"https://example.com/mini.png","offers":{"@type":"Offer","price":"4788","priceCurrency":"CNY","availability":"https://schema.org/InStock"}}</script>
</head><body><script>window.__PRELOADED_STATE__ = {"products":{"variants":[
  {"slug":"dji-mini-5-pro","title":"DJI Mini 5 Pro","price":4788,"originalPrice":4788,"currencyName":"RMB","currencySymbol":"¥","status":{"code":"on_sale","text":"立即购买"}},
  {"slug":"dji-mini-5-pro-fly-more-combo-dji-rc-n3","title":"DJI Mini 5 Pro 畅飞套装（DJI RC-N3）","price":5988,"originalPrice":5988,"currencyName":"RMB","status":{"code":"on_sale"}},
  {"slug":"dji-mini-5-pro-propellers","title":"螺旋桨","price":49,"originalPrice":49,"currencyName":"RMB","status":{"code":"on_sale"}},
  {"slug":"dji-air-3s","title":"DJI Air 3S","price":6988,"originalPrice":6988,"currencyName":"RMB","status":{"code":"on_sale"}}
]}};</script></body></html>`

test('rejects a store URL that leaves the China site and any /api/ path', () => {
  assert.equal(isCnUrl('https://store.dji.com/cn/product/dji-mini-5-pro'), true)
  assert.equal(isCnUrl('https://store.dji.com/de/product/dji-mini-5-pro'), false)
  assert.throws(() => assertPublicPage('https://store.dji.com/api/product'), /robots/)
})

test('drops DJI placeholder prices and unsold bundles from the main price', () => {
  const html = `<!DOCTYPE html><html><head><title>DJI Mavic 4 Pro</title>
<script type="application/ld+json">{"@type":"Product","name":"DJI Mavic 4 Pro","offers":{"price":"13888","priceCurrency":"CNY","availability":"https://schema.org/InStock"}}</script>
</head><body><script>window.__PRELOADED_STATE__ = {"products":{"variants":[
  {"slug":"dji-mavic-4-pro","title":"DJI Mavic 4 Pro（DJI RC 2）","price":13888,"originalPrice":13888,"currencyName":"RMB","status":{"code":"on_sale","text":"立即购买"}},
  {"slug":"dji-mavic-4-pro-fly-more-combo-dji-rc-2","title":"DJI Mavic 4 Pro 畅飞套装（DJI RC 2）","price":99999,"originalPrice":99999,"currencyName":"RMB","status":{"code":"not_sale","text":"此商品暂时缺货或不支持销往中国大陆"}},
  {"slug":"dji-mavic-4-pro-512gb-creator-combo-dji-rc-pro-2","title":"DJI Mavic 4 Pro 512GB 创作者套装（DJI RC Pro 2）","price":99999,"originalPrice":99999,"currencyName":"RMB","status":{"code":"","text":""}}
]}};</script></body></html>`
  const parsed = parseDjiProduct(html, { slug: 'dji-mavic-4-pro', expect: 'Mavic 4 Pro' })
  assert.equal(parsed.officialPrice, 13888)
  assert.equal(parsed.availability, 'in_stock')
  const hidden = parsed.bundles.filter((item) => item.price == null)
  assert.equal(hidden.length, 2)
  assert.ok(hidden.every((item) => item.status === 'out_of_stock'))
})

test('reads the DJI China price, stock, and aircraft bundles', () => {
  const parsed = parseDjiProduct(djiHtml, { slug: 'dji-mini-5-pro', expect: 'Mini 5 Pro' })
  assert.equal(parsed.officialPrice, 4788)
  assert.equal(parsed.currency, 'CNY')
  assert.equal(parsed.availability, 'in_stock')
  assert.deepEqual(parsed.bundles.map((item) => item.price), [4788, 5988])
  assert.equal(parsed.image, 'https://example.com/mini.png')
})

test('prefers a JSON-LD image and falls back to og:image', () => {
  const html = `<meta property="og:image" content="https://example.com/og.png"><script type="application/ld+json">{"@type":"Product","name":"DJI Mini 5 Pro","image":"https://example.com/ld.png"}</script>`
  assert.equal(officialImageUrl(html, 'https://example.com/ld.png'), 'https://example.com/ld.png')
  assert.equal(officialImageUrl('<meta property="og:image" content="//cdn.example/a.png">', ''), 'https://cdn.example/a.png')
})

test('reads the Antigravity promo price and the struck list price', () => {
  const html = `<html><head><title>影翎 A1</title></head><body><script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"productInfo":{"commodities":[
    {"id":"std","name":"全景飞行标准套装","price":{"currency":"CNY","amount":5599},"originPrice":{"currency":"CNY","amount":6799},"saleState":"normal","mainPictureUrlM":"https://example.com/a1.png"},
    {"id":"explore","name":"全景飞行探索套装","price":{"currency":"CNY","amount":6799},"originPrice":{"currency":"CNY","amount":7999},"saleState":"normal"}
  ]}}}}</script></body></html>`
  const parsed = parseAntigravityBuy(html, { primaryName: '标准套装', expect: 'A1' })
  assert.equal(parsed.officialPrice, 5599)
  assert.equal(parsed.listPrice, 6799)
  assert.equal(parsed.bundles.length, 2)
})

test('keeps a short official spec list only when several fields parse', () => {
  const html = `
    <h4>起飞重量</h4><div class="detailed-parameter-value">249.9 克<br>备注</div>
    <h4>最长飞行时间</h4><div class="detailed-parameter-value">36 分钟</div>
    <h4>镜头</h4><div class="detailed-parameter-value">等效 24mm</div>
    <h4>尺寸</h4><div class="detailed-parameter-value">不收录</div>`
  assert.deepEqual(parseSpecList(html), [
    ['起飞重量', '249.9 克'],
    ['最长飞行时间', '36 分钟'],
    ['镜头', '等效 24mm'],
  ])
  assert.deepEqual(parseSpecList('<h4>起飞重量</h4><div class="detailed-parameter-value">249.9 克</div>'), [])
})

test('lists Avata 360, Flip, and Mavic 4 Pro, and skips accessories', () => {
  const html = `
    <a href="https://store.dji.com/cn/product/dji-avata-360">Avata</a>
    <a href="https://store.dji.com/product/dji-flip">Flip</a>
    <a href="https://store.dji.com/cn/product/dji-mavic-4-pro">Mavic</a>
    <a href="https://store.dji.com/cn/product/dji-mini-5-pro">Mini</a>
    <a href="https://store.dji.com/cn/product/dji-matrice-5t">Matrice</a>
    <a href="https://store.dji.com/cn/product/dji-om-5">OM</a>`
  const sitemap = new Set(['dji-avata-360', 'dji-flip', 'dji-mavic-4-pro', 'dji-mini-5-pro', 'dji-matrice-5t'])
  const selected = selectLaunchIds({
    pageSlugs: cameraDroneSlugs(html),
    sitemapSlugs: sitemap,
    catalogIds: ['dji-mini-5-pro', 'antigravity-a1'],
    antiSlugs: antigravityDroneSlugs('<loc>https://www.antigravity.tech/cn/drone/antigravity-a1</loc><loc>https://www.antigravity.tech/cn/drone/antigravity-a1-follow-me</loc>'),
  })
  assert.deepEqual(selected.dji.sort(), ['dji-avata-360', 'dji-flip', 'dji-mavic-4-pro'])
  assert.deepEqual(selected.anti, [])
  assert.equal(isConsumerDroneSlug('dji-matrice-5t'), false)
  assert.equal(sitemapProductSlugs('<loc>https://store.dji.com/cn/product/dji-flip</loc>').has('dji-flip'), true)
})

test('keeps the last good price when a later fetch fails', () => {
  const kept = keepPrevious({ officialPrice: 4788, checkedAt: '2026-11-11T12:00:00+08:00', ok: true }, new Error('left /cn/'), '2026-11-11T18:00:00+08:00')
  assert.equal(kept.officialPrice, 4788)
  assert.equal(kept.ok, false)
  assert.equal(kept.checkedAt, '2026-11-11T12:00:00+08:00')
  assert.equal(keepPrevious(null, 'nope', '2026-11-11T18:00:00+08:00'), null)
})
