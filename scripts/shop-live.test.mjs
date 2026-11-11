import assert from 'node:assert/strict'
import test from 'node:test'
import { applyLiveProduct, isPriceStale, isPriceUncertain, mergeShop } from '../src/data/shopLive.js'

const catalog = [
  {
    id: 'dji-mini-5-pro',
    name: 'DJI Mini 5 Pro',
    price: 4788,
    priceLabel: '单机套装',
    priceNote: '官方商城价，截至 2026-11-11。',
    intro: ['手写介绍'],
    highlights: ['手写亮点'],
    techBody: ['手写解读'],
    specs: [['传感器', '一英寸']],
    sources: [{ label: '商城', url: 'https://store.dji.com/cn/product/dji-mini-5-pro' }],
  },
]

test('overlays the official price and leaves the hand-written copy alone', () => {
  const now = Date.parse('2026-11-11T20:00:00+08:00')
  const [product] = mergeShop(
    catalog,
    {
      products: {
        'dji-mini-5-pro': {
          officialPrice: 4699,
          listPrice: 4788,
          priceLabel: 'DJI Mini 5 Pro',
          availability: 'in_stock',
          bundles: [{ id: 'base', name: 'DJI Mini 5 Pro', price: 4699 }],
          specs: [
            ['起飞重量', '249.9 克'],
            ['最长飞行时间', '36 分钟'],
            ['镜头', '等效 24mm'],
          ],
          specSource: '大疆官网规格页',
          sourceUrl: 'https://store.dji.com/cn/product/dji-mini-5-pro',
          image: 'images/products/dji-mini-5-pro.webp',
          checkedAt: '2026-11-11T18:00:00+08:00',
          ok: true,
        },
      },
      newLaunches: [
        {
          id: 'dji-avata-360',
          name: 'DJI Avata 360',
          brand: 'DJI',
          officialPrice: 2788,
          sourceUrl: 'https://store.dji.com/cn/product/dji-avata-360',
          checkedAt: '2026-11-11T18:00:00+08:00',
          status: 'pending_copy',
        },
      ],
    },
    now,
  )
  assert.equal(product.price, 4699)
  assert.equal(product.listPrice, 4788)
  assert.deepEqual(product.intro, ['手写介绍'])
  assert.deepEqual(product.highlights, ['手写亮点'])
  assert.deepEqual(product.techBody, ['手写解读'])
  assert.equal(product.specs[0][0], '起飞重量')
  assert.equal(product.specSource, '大疆官网规格页')
  assert.equal(product.priceStale, false)
  assert.equal(product.priceUncertain, false)
  assert.equal(product.image, 'images/products/dji-mini-5-pro.webp')
  const launch = mergeShop(catalog, {
    newLaunches: [
      {
        id: 'dji-avata-360',
        name: 'DJI Avata 360',
        officialPrice: 2788,
        currency: 'CNY',
        sourceUrl: 'https://store.dji.com/cn/product/dji-avata-360',
        image: 'images/products/dji-avata-360.webp',
        checkedAt: '2026-11-11T18:00:00+08:00',
        status: 'pending_copy',
      },
    ],
  }, now).find((item) => item.id === 'dji-avata-360')
  assert.equal(launch.pendingCopy, true)
  assert.equal(isPriceUncertain(launch), true)
  assert.equal(launch.image, 'images/products/dji-avata-360.webp')
})

test('marks a kept price 价格待更新 after 48 hours', () => {
  const checkedAt = '2026-11-09T00:00:00+08:00'
  const now = Date.parse('2026-11-11T12:00:00+08:00')
  assert.equal(isPriceStale(checkedAt, now), true)
  const product = applyLiveProduct(
    catalog[0],
    { officialPrice: 4788, checkedAt, ok: false, priceLabel: 'DJI Mini 5 Pro' },
    now,
  )
  assert.equal(product.price, 4788)
  assert.equal(product.priceStale, true)
  assert.equal(isPriceUncertain(product), true)
  assert.deepEqual(product.intro, ['手写介绍'])
  const missing = applyLiveProduct(catalog[0], null, now)
  assert.equal(missing.officialFetched, false)
  assert.equal(isPriceUncertain(missing), true)
})
