import { useEffect, useState } from 'react'
import { news as sampleNews, officialNews } from './content.js'
import { publicAssetUrl } from './publicUrl.js'

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

export function isFetchedGov(item) {
  return Boolean(item?.govSource) || String(item?.id || '').startsWith('gov-')
}

export function showOfficialBadge(item) {
  return Boolean(item?.official) && !isFetchedGov(item)
}

export function sortNews(items) {
  return [...items].sort((a, b) => {
    const pinA = showOfficialBadge(a)
    const pinB = showOfficialBadge(b)
    if (pinA !== pinB) return pinA ? -1 : 1
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

function contestExamples() {
  return sampleNews
    .filter((item) => item.category === 'contest')
    .map((item) => ({
      ...item,
      sample: true,
      official: false,
      source: '示例内容',
    }))
}

function pinnedOfficial() {
  return officialNews.map((item) => ({
    ...item,
    official: true,
    sample: false,
    source: item.source || 'EV1平台',
  }))
}

export function officialStatus(item, now = new Date()) {
  if (!item?.statusAfter || !item?.statusLabel) return ''
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` > item.statusAfter ? item.statusLabel : ''
}

function mergeNews(remoteItems) {
  const pinned = pinnedOfficial()
  const pinnedIds = new Set(pinned.map((item) => item.id))
  const remote = remoteItems.filter((item) => item && !pinnedIds.has(item.id))
  return sortNews([...pinned, ...remote, ...contestExamples()])
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
    const response = await fetch(publicAssetUrl('data/news.json'), { cache: 'no-cache' })
    if (!response.ok) throw new Error(`status ${response.status}`)
    const data = await response.json()
    const remote = Array.isArray(data?.items) ? data.items.filter(usableItem) : []
    const items = mergeNews(remote)
    const sample = items.length > 0 && items.every((item) => item.sample)
    return { items, updatedAt: remote.length > 0 ? data.updatedAt || null : null, sample }
  } catch {
    const items = mergeNews([])
    return {
      items,
      updatedAt: null,
      sample: items.length > 0 && items.every((item) => item.sample),
    }
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
