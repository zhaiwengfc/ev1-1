import assert from 'node:assert/strict'
import test from 'node:test'
import { publicAssetUrl } from '../src/data/publicUrl.js'

test('keeps product photos inside the GitHub Pages project path', () => {
  const image = 'images/products/dji-mini-5-pro.webp'
  assert.equal(publicAssetUrl(image, { pathname: '/ev1-1' }), '/ev1-1/images/products/dji-mini-5-pro.webp')
  assert.equal(publicAssetUrl(image, { pathname: '/ev1-1/' }), '/ev1-1/images/products/dji-mini-5-pro.webp')
  assert.equal(
    publicAssetUrl(image, { pathname: '/ev1-1/index.html' }),
    '/ev1-1/images/products/dji-mini-5-pro.webp',
  )
  assert.equal(publicAssetUrl(image, { pathname: '/' }), '/images/products/dji-mini-5-pro.webp')
  assert.equal(publicAssetUrl('https://example.com/a.webp'), '')
})
