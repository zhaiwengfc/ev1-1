import { useEffect, useState } from 'react'
import { news as exampleNews } from './content.js'

export const PUBLISH_URL =
  'https://github.com/zhaiwengfc/ev1-1/issues/new?template=' +
  encodeURIComponent('发布资讯.yml')

const CATEGORY_IDS = new Set(['policy', 'tech', 'contest', 'release'])

export function safeHttpUrl(value) {
  if (typeof value !== 'string') return ''
  try {
    const url = new URL(value.trim())
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString()
  } catch {
    return ''
  }
  return ''
}

function timeValue(item) {
  const fromIso = Date.parse(item?.publishedAt || '')
  if (!Number.isNaN(fromIso)) return fromIso
  const fromDay = Date.parse(item?.date || '')
  if (!Number.isNaN(fromDay)) return fromDay
  return 0
}

export function sortNews(items) {
  return [...items].sort((a, b) => {
    if (Boolean(a.official) !== Boolean(b.official)) return a.official ? -1 : 1
    return timeValue(b) - timeValue(a)
  })
}

export function formatUpdated(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const text = date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `最后更新时间：${text}`
}

export function formatItemDate(item) {
  if (item?.publishedAt) {
    const date = new Date(item.publishedAt)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }
  return item?.date || ''
}

function exampleItems() {
  return exampleNews.map((item) => ({
    ...item,
    sample: true,
    official: false,
    source: '示例内容',
  }))
}

function usableItem(item) {
  return Boolean(item && item.id && item.title && CATEGORY_IDS.has(item.category))
}

let pending = null

export function loadNewsFeed() {
  if (!pending) pending = fetchFeed()
  return pending
}

async function fetchFeed() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/news.json`, { cache: 'no-cache' })
    if (!response.ok) throw new Error(`status ${response.status}`)
    const data = await response.json()
    const items = Array.isArray(data?.items) ? data.items.filter(usableItem) : []
    if (items.length === 0) return { items: sortNews(exampleItems()), updatedAt: null, sample: true }
    return { items: sortNews(items), updatedAt: data.updatedAt || null, sample: false }
  } catch {
    return { items: sortNews(exampleItems()), updatedAt: null, sample: true }
  }
}

export function useNewsFeed() {
  const [state, setState] = useState({
    status: 'loading',
    items: [],
    updatedAt: null,
    sample: false,
  })

  useEffect(() => {
    let alive = true
    loadNewsFeed().then((result) => {
      if (alive) setState({ status: 'ready', ...result })
    })
    return () => {
      alive = false
    }
  }, [])

  return state
}
