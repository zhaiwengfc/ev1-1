import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_FILE = path.join(ROOT, 'public', 'data', 'news.json')
const MAX_AUTO = 60
const MAX_GOV = 30
const REPO = process.env.GITHUB_REPOSITORY || 'zhaiwengfc/ev1-1'
const ALLOWED_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR'])

const CATEGORY_BY_LABEL = {
  政府政策: 'policy',
  政策: 'policy',
  科技创新与供应链: 'tech',
  科技创新: 'tech',
  供应链: 'tech',
  比赛信息: 'contest',
  比赛: 'contest',
  无人机新品发布: 'release',
  产品发布: 'release',
  新品发布: 'release',
}

const RULES = {
  contest: [
    ['挑战赛', 4],
    ['锦标赛', 4],
    ['竞速赛', 4],
    ['邀请赛', 3],
    ['比赛', 3],
    ['大赛', 3],
    ['竞赛', 3],
    ['赛事', 3],
    ['联赛', 3],
    ['竞速', 2],
    ['报名', 1],
  ],
  release: [
    ['新品发布', 5],
    ['新品', 3],
    ['发布会', 4],
    ['首发', 3],
    ['开售', 3],
    ['上市', 2],
    ['亮相', 2],
  ],
  policy: [
    ['管理办法', 4],
    ['指导意见', 4],
    ['暂行条例', 4],
    ['征求意见', 3],
    ['白皮书', 3],
    ['新规', 4],
    ['规定', 3],
    ['政策', 3],
    ['法规', 3],
    ['条例', 3],
    ['民航局', 3],
    ['适飞', 3],
    ['禁飞', 3],
    ['监管', 2],
    ['空域', 2],
    ['试点', 2],
    ['国务院', 2],
  ],
  tech: [
    ['供应链', 4],
    ['电动垂直起降', 4],
    ['evtol', 4],
    ['飞行汽车', 3],
    ['飞控', 3],
    ['电池', 2],
    ['芯片', 2],
    ['科技', 2],
    ['研发', 2],
    ['感知', 2],
    ['算法', 2],
    ['材料', 1],
    ['技术', 1],
  ],
}

const QUERIES = [
  { q: '低空经济', category: 'policy' },
  { q: '无人机 政策', category: 'policy' },
  { q: '无人驾驶航空器 政策', category: 'policy' },
  { q: 'eVTOL', category: 'tech' },
  { q: '电动垂直起降', category: 'tech' },
  { q: '无人机 供应链', category: 'tech' },
  { q: '无人机 科技创新', category: 'tech' },
  { q: '飞行汽车', category: 'tech' },
  { q: '无人机 比赛', category: 'contest' },
  { q: '无人机 竞速', category: 'contest' },
  { q: '无人机 新品发布', category: 'release' },
  { q: '无人机 发布会', category: 'release' },
]

const RELEVANT_WORDS = [
  '无人机',
  '低空',
  '无人经济',
  'evtol',
  '电动垂直',
  '飞行汽车',
  '无人驾驶航空',
  '通航',
  '航拍',
  '多旋翼',
  '空中出租车',
  '飞校',
  '航线',
]

const CONFLICT_WORDS = [
  '乌军',
  '俄军',
  '美军',
  '以军',
  '轰炸',
  '导弹',
  '战场',
  '击落',
  '空袭',
  '炮击',
  '前线',
  '袭击',
  '武装',
  '战争',
  '平民',
  '间谍',
  '抓捕',
  '总统',
]

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; EV1News/1.0; +https://github.com/zhaiwengfc/ev1-1)',
  Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
}

export function decodeXml(value) {
  const withoutCdata = String(value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  return withoutCdata
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => fromCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => fromCode(Number(num)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
}

function fromCode(code) {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return ''
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

export function stripTags(value) {
  return decodeXml(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[【】[\]（）()「」《》:：,，.。!！?？\-—_|·]/g, '')
}

export function safeHttpUrl(value) {
  const text = String(value || '').trim()
  if (!text || text === '_No response_' || text === '无') return ''
  try {
    const url = new URL(text)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString()
  } catch {
    return ''
  }
  return ''
}

export function directLink(link) {
  const safe = safeHttpUrl(link)
  if (!safe) return ''
  try {
    const url = new URL(safe)
    const inner = url.searchParams.get('url')
    const direct = safeHttpUrl(inner)
    if (direct) return direct
  } catch {
    return safe
  }
  return safe
}

export function canonicalLink(link) {
  const direct = directLink(link)
  if (!direct) return ''
  try {
    const url = new URL(direct)
    url.hash = ''
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || key === 'ref' || key === 'spm') url.searchParams.delete(key)
    }
    return url.toString()
  } catch {
    return direct
  }
}

function linkQuality(link) {
  try {
    const host = new URL(link).hostname
    if (host === 'news.google.com' || host.endsWith('.news.google.com')) return 0
    if (host === 'www.bing.com' || host === 'bing.com') return 1
    return 3
  } catch {
    return 0
  }
}

export function isRelevantText(text) {
  const folded = String(text || '').toLowerCase()
  return RELEVANT_WORDS.some((word) => folded.includes(word.toLowerCase()))
}

export function isConflictTitle(title) {
  const text = String(title || '')
  return CONFLICT_WORDS.some((word) => text.includes(word))
}

export function titleSimilarity(a, b) {
  const left = normalizeTitle(a)
  const right = normalizeTitle(b)
  if (!left || !right) return 0
  if (left === right) return 1
  if (left.length >= 8 && right.length >= 8 && (left.includes(right) || right.includes(left))) return 0.95
  if (left.length < 8 || right.length < 8) return 0
  const grams = (value) => {
    const set = new Set()
    for (let index = 0; index < value.length - 1; index += 1) set.add(value.slice(index, index + 2))
    return set
  }
  const leftGrams = grams(left)
  const rightGrams = grams(right)
  let shared = 0
  for (const gram of leftGrams) if (rightGrams.has(gram)) shared += 1
  const union = leftGrams.size + rightGrams.size - shared
  return union ? shared / union : 0
}

export function categoryScore(title, summary) {
  const text = `${title || ''} ${summary || ''}`.toLowerCase()
  const scores = { policy: 0, tech: 0, contest: 0, release: 0 }
  for (const [id, words] of Object.entries(RULES)) {
    for (const [word, weight] of words) {
      if (text.includes(word.toLowerCase())) scores[id] += weight
    }
  }
  let best = ''
  let bestScore = 0
  for (const id of ['policy', 'tech', 'contest', 'release']) {
    if (scores[id] > bestScore) {
      best = id
      bestScore = scores[id]
    }
  }
  return { category: best, score: bestScore }
}

export function classify(title, summary, defaultCategory = 'tech') {
  const { category } = categoryScore(title, summary)
  return category || defaultCategory || 'tech'
}

function clip(text, max) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).trim()}…`
}

function stripSourceSuffix(title, source) {
  const text = String(title || '').trim()
  if (!source) return text
  for (const suffix of [` - ${source}`, ` – ${source}`, ` — ${source}`, `-${source}`]) {
    if (text.endsWith(suffix)) return text.slice(0, -suffix.length).trim()
  }
  return text
}

function buildSummary(title, description, source) {
  let text = stripTags(description)
  const folded = normalizeTitle(text)
  const titleFold = normalizeTitle(title)
  if (!folded || folded === titleFold) return ''
  if (titleFold && folded.startsWith(titleFold)) {
    const rest = text.slice(title.length).replace(/^[\s\-—:：|·]+/, '').trim()
    if (!rest || normalizeTitle(rest) === normalizeTitle(source)) return ''
    text = rest
  }
  return clip(text, 120)
}

function extractRaw(block, tagName) {
  const re = new RegExp(
    `<(?:[\\w.-]+:)?${tagName}\\b([^>]*)>([\\s\\S]*?)</(?:[\\w.-]+:)?${tagName}>`,
    'i',
  )
  const match = block.match(re)
  if (!match) return { attrs: '', text: '' }
  return { attrs: match[1] || '', text: decodeXml(match[2]).trim() }
}

function hostnameSource(link) {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function cleanSource(source, link) {
  const text = stripTags(source).replace(/\s+/g, ' ').trim()
  if (!text || /^https?:/i.test(text) || text.includes('://') || text.length > 40 || isAggregator(text)) {
    return hostnameSource(link) || '未知来源'
  }
  return text
}

function isAggregator(source) {
  const text = String(source || '').toLowerCase()
  return (
    text.includes('news.google.') ||
    text.includes('bing.com') ||
    text === 'google 新闻' ||
    text === 'google news'
  )
}

function rssId(title, link) {
  const hash = createHash('sha1')
    .update(`${normalizeTitle(title)}|${canonicalLink(link)}`)
    .digest('hex')
    .slice(0, 12)
  return `rss-${hash}`
}

export function parseRssItems(xml, defaultCategory) {
  const blocks = String(xml || '').split(/<item\b/i).slice(1)
  const items = []
  for (const chunk of blocks) {
    const block = chunk.split(/<\/item>/i)[0]
    let titleRaw = stripTags(extractRaw(block, 'title').text)
    const trailingUrl = titleRaw.match(/^(.*)\s+[-–—|]\s+(https?:\/\/\S+)\s*$/i)
    const extraUrl = trailingUrl ? trailingUrl[2] : ''
    if (trailingUrl) titleRaw = trailingUrl[1].trim()
    const link = directLink(extractRaw(block, 'link').text) || directLink(extraUrl)
    const sourceTag = extractRaw(block, 'source')
    let source = cleanSource(sourceTag.text, extraUrl || link)
    if (isAggregator(source)) source = hostnameSource(extraUrl) || '未知来源'
    const title = stripSourceSuffix(titleRaw, source)
    const description = extractRaw(block, 'description').text
    const published = new Date(extractRaw(block, 'pubDate').text)
    if (!title || !link || Number.isNaN(published.getTime())) continue
    if (/(.)\1{3,}/.test(title)) continue
    const plainDescription = stripTags(description)
    const summary = buildSummary(title, plainDescription, source)
    const haystack = `${title} ${plainDescription}`
    if (!isRelevantText(haystack) || isConflictTitle(title)) continue
    const scored = categoryScore(title, `${summary} ${plainDescription}`)
    items.push({
      id: rssId(title, link),
      title,
      summary,
      category: scored.category || defaultCategory,
      matched: scored.score > 0,
      date: published.toISOString().slice(0, 10),
      publishedAt: published.toISOString(),
      link,
      source: source || '未知来源',
      official: false,
    })
  }
  return items
}

export function selectAutoItems(items, limit = MAX_AUTO) {
  const sorted = [...items].sort(
    (a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0),
  )
  const byTitle = new Map()
  const byLink = new Map()
  const chosen = []
  for (const item of sorted) {
    const titleKey = normalizeTitle(item.title)
    const linkKey = canonicalLink(item.link)
    const exact = (titleKey && byTitle.get(titleKey)) || (linkKey && byLink.get(linkKey))
    const similar = exact || chosen.find((kept) => titleSimilarity(kept.title, item.title) >= 0.55)
    if (!similar) {
      chosen.push(item)
      if (titleKey) byTitle.set(titleKey, item)
      if (linkKey) byLink.set(linkKey, item)
      continue
    }
    const sim = titleSimilarity(similar.title, item.title)
    if (linkQuality(item.link) > linkQuality(similar.link) && (exact || sim >= 0.85)) {
      similar.link = item.link
      similar.id = rssId(similar.title, item.link)
      if (item.source) similar.source = item.source
      if (linkKey) byLink.set(linkKey, similar)
    }
  }
  const perCategory = Math.max(8, Math.floor(limit / 5))
  const picked = []
  const seen = new Set()
  for (const category of ['policy', 'tech', 'contest', 'release']) {
    const bucket = chosen.filter((item) => item.category === category && item.matched).slice(0, perCategory)
    for (const item of bucket) {
      if (picked.length >= limit) break
      picked.push(item)
      seen.add(item.id)
    }
  }
  for (const item of chosen) {
    if (picked.length >= limit) break
    if (seen.has(item.id)) continue
    picked.push(item)
    seen.add(item.id)
  }
  return picked
    .sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0))
    .slice(0, limit)
}

function blankField(value) {
  const text = String(value || '').trim()
  if (!text || text === '_No response_' || text === '无' || text === '无。') return ''
  return text
}

export function parseIssueFields(body) {
  const text = String(body || '').replace(/\r\n/g, '\n')
  const regex = /^###\s+(.+)\s*$/gm
  const matches = [...text.matchAll(regex)]
  const sections = {}
  for (let index = 0; index < matches.length; index += 1) {
    const name = matches[index][1].trim()
    const start = matches[index].index + matches[index][0].length
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length
    sections[name] = text.slice(start, end).trim()
  }
  return sections
}

function paragraphs(text) {
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim()
  if (!normalized) return []
  const blocks = normalized.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  return blocks.length > 0 ? blocks : [normalized]
}

export function toOfficialItem(issue) {
  if (!issue || issue.pull_request) return null
  if (issue.state && issue.state !== 'open') return null
  if (!ALLOWED_ASSOCIATIONS.has(issue.author_association)) return null
  const labels = (issue.labels || []).map((label) => (typeof label === 'string' ? label : label.name))
  if (!labels.includes('资讯')) return null

  const fields = parseIssueFields(issue.body)
  const title = blankField(fields['标题']) || String(issue.title || '').replace(/^\s*\[资讯\]\s*/, '').trim()
  const bodyText = blankField(fields['摘要/正文']) || blankField(issue.body)
  if (!title || !bodyText) return null
  const categoryLabel = blankField(fields['分类'])
  const category = CATEGORY_BY_LABEL[categoryLabel] || classify(title, bodyText, 'tech')
  const published = new Date(issue.created_at || Date.now())
  const when = Number.isNaN(published.getTime()) ? new Date() : published
  const link = safeHttpUrl(blankField(fields['原文链接']))
  const image = safeHttpUrl(blankField(fields['图片链接']))
  const item = {
    id: `official-${issue.number}`,
    title,
    summary: clip(bodyText.replace(/\s+/g, ' '), 120),
    body: paragraphs(bodyText),
    category,
    date: when.toISOString().slice(0, 10),
    publishedAt: when.toISOString(),
    source: 'EV1平台',
    official: true,
  }
  if (link) item.link = link
  if (image) item.image = image
  return item
}

function googleUrl(query) {
  const params = new URLSearchParams({
    q: query,
    hl: 'zh-CN',
    gl: 'CN',
    ceid: 'CN:zh-Hans',
  })
  return `https://news.google.com/rss/search?${params.toString()}`
}

function bingUrl(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'rss',
    setlang: 'zh-CN',
  })
  return `https://www.bing.com/news/search?${params.toString()}`
}

async function mapPool(list, limit, task) {
  const results = new Array(list.length)
  let cursor = 0
  async function worker() {
    while (cursor < list.length) {
      const index = cursor
      cursor += 1
      results[index] = await task(list[index], index)
    }
  }
  const size = Math.min(limit, list.length)
  await Promise.all(Array.from({ length: size }, () => worker()))
  return results
}

async function fetchFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })
    if (!response.ok) {
      console.warn(`[news] fail ${feed.label}: HTTP ${response.status}`)
      return []
    }
    const xml = await response.text()
    if (!/<item\b/i.test(xml)) {
      console.warn(`[news] fail ${feed.label}: response has no RSS items`)
      return []
    }
    const items = parseRssItems(xml, feed.category)
    console.log(`[news] ok ${feed.label}: ${items.length}`)
    return items
  } catch (error) {
    console.warn(`[news] fail ${feed.label}: ${error.message}`)
    return []
  }
}

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ev1-news-bot',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return headers
}

async function fetchOfficialIssues(repo) {
  const [owner, name] = String(repo).split('/')
  if (!owner || !name) throw new Error(`invalid repository ${repo}`)
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`
  const items = []
  for (let page = 1; page <= 5; page += 1) {
    const url = `${base}/issues?state=open&labels=${encodeURIComponent('资讯')}&per_page=100&page=${page}`
    const response = await fetch(url, {
      headers: githubHeaders(),
      signal: AbortSignal.timeout(15000),
    })
    if (response.status === 404) {
      console.warn('[news] issues lookup returned 404, no official posts')
      return []
    }
    if (!response.ok) throw new Error(`GitHub issues HTTP ${response.status}`)
    const batch = await response.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    for (const issue of batch) {
      const item = toOfficialItem(issue)
      if (item) items.push(item)
      else if (issue && !issue.pull_request) {
        console.warn(
          `[news] skip issue #${issue.number} association=${issue.author_association || 'unknown'}`,
        )
      }
    }
    if (batch.length < 100) break
  }
  return items
}

function readPrevious(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    return Array.isArray(data.items) ? data.items : []
  } catch {
    return []
  }
}

function usableAuto(item) {
  return item && item.official !== true && item.title && item.link && item.category && item.id
}

function usableOfficial(item) {
  return item && item.official === true && item.title && item.category && item.id
}

const GOV_WORDS = ['低空经济', '低空', '无人机', '无人驾驶航空器', 'eVTOL', '电动垂直起降', '通用航空', '飞行汽车']
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9',
}

export function hasGovKeyword(text) {
  const folded = String(text || '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\s\u00a0\u2002\u2003]+/g, '')
    .toLowerCase()
  return GOV_WORDS.some((word) => folded.includes(word.toLowerCase()))
}

export function govLinkRank(link) {
  let host = ''
  try {
    host = new URL(link).hostname.toLowerCase()
  } catch {
    return 0
  }
  if (host.includes('news.google.com')) return 0
  if (host.includes('bing.com')) return 1
  if (host === 'www.gov.cn' || host === 'gov.cn') return 2
  if (host.endsWith('.gov.cn')) return 3
  return 0
}

export function looseGovTitle(title) {
  return normalizeTitle(title)
    .replace(/关于印发/g, '')
    .replace(/关于/g, '')
    .replace(/的通知/g, '')
    .replace(/的通告/g, '')
    .replace(/通知/g, '')
}

function govId(title, link) {
  const hash = createHash('sha1').update(`${looseGovTitle(title)}|${canonicalLink(link)}`).digest('hex').slice(0, 12)
  return `gov-${hash}`
}

function parseGovDate(value) {
  const match = String(value || '').match(/(20\d{2})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})/)
  if (!match) return null
  const date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  const published = new Date(`${date}T00:00:00+08:00`)
  if (Number.isNaN(published.getTime())) return null
  const check = published.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
  if (check !== date) return null
  return { date, publishedAt: published.toISOString() }
}

export function normalizeGovSource(source) {
  return String(source || '')
    .replaceAll('中国民航局', '中国民用航空局')
    .replaceAll('民航局', '中国民用航空局')
    .replace(/\s+/g, ' ')
    .trim()
}

function dateFromGovUrl(link) {
  const match = String(link || '').match(/t(20\d{2})(\d{2})(\d{2})/i)
  if (!match) return null
  return parseGovDate(`${match[1]}-${match[2]}-${match[3]}`)
}

export function makeGovItem({ title, link, summary = '', source, sourceId, when, titleHit = true }) {
  const cleanTitle = stripTags(title)
    .replace(/([《「『（(])\s+/gu, '$1')
    .replace(/\s+([》」』）)])/gu, '$1')
    .replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff《》（）()])/gu, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  const namedSource = normalizeGovSource(source)
  const namedSummary = summary ? normalizeGovSource(summary) : ''
  const direct = directLink(link)
  if (!cleanTitle || govLinkRank(direct) < 2 || !when) return null
  if (/首页|网站首页/.test(cleanTitle)) return null
  const scored = categoryScore(cleanTitle, summary)
  return {
    id: govId(cleanTitle, direct),
    title: cleanTitle,
    summary: titleHit ? namedSummary || `${namedSource}公开发布。` : '文件中提及。',
    category: scored.score > 0 ? scored.category : 'policy',
    date: when.date,
    publishedAt: when.publishedAt,
    link: direct,
    source: namedSource,
    official: true,
    govSource: sourceId,
  }
}

export function selectGovItems(items, limit = MAX_GOV) {
  const sorted = [...items].sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0))
  const chosen = []
  for (const item of sorted) {
    if (!item?.title || govLinkRank(item.link) < 2) continue
    const keys = [normalizeTitle(item.title), looseGovTitle(item.title)].filter((key) => key && key.length >= 8)
    const linkKey = canonicalLink(item.link)
    const existing = chosen.find((kept) => {
      if (linkKey && canonicalLink(kept.link) === linkKey) return true
      const keptKeys = [normalizeTitle(kept.title), looseGovTitle(kept.title)]
      return keys.some((key) => keptKeys.includes(key))
    })
    if (!existing) {
      chosen.push({
        ...item,
        source: normalizeGovSource(item.source),
        summary: item.summary ? normalizeGovSource(item.summary) : item.summary,
      })
      continue
    }
    if (govLinkRank(item.link) > govLinkRank(existing.link)) {
      existing.link = item.link
      existing.source = normalizeGovSource(item.source)
      existing.govSource = item.govSource
      existing.id = govId(existing.title, item.link)
    }
  }
  return chosen.slice(0, limit)
}

export function mergeGovResults(results, previousGov) {
  const previousBySource = new Map()
  for (const item of previousGov) {
    const key = item.govSource || 'legacy'
    if (!previousBySource.has(key)) previousBySource.set(key, [])
    previousBySource.get(key).push(item)
  }
  if (results.length > 0 && results.every((result) => !result.ok)) {
    return selectGovItems(previousGov)
  }
  const collected = []
  for (const result of results) {
    if (result.ok) collected.push(...result.items)
    else collected.push(...(previousBySource.get(result.id) || []))
  }
  return selectGovItems(collected)
}

function resolveHref(pageUrl, href) {
  try {
    return new URL(decodeXml(href), pageUrl).toString()
  } catch {
    return ''
  }
}

function dateForListLink(html, match, href) {
  const end = match.index + match[0].length
  const nextAnchor = html.slice(end).search(/<a\b/i)
  const after = html.slice(end, nextAnchor === -1 ? Math.min(html.length, end + 160) : end + nextAnchor)
  return parseGovDate(match[2]) || parseGovDate(after) || dateFromGovUrl(href)
}

export function extractDatedLinks(html, pageUrl) {
  const found = []
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match = pattern.exec(html)
  while (match) {
    const title = stripTags(match[2]).replace(/\s+/g, ' ').trim()
    const link = resolveHref(pageUrl, match[1])
    const when = dateForListLink(html, match, match[1])
    if (title.length >= 8 && title.length <= 140 && when && link && !/javascript:|^#/.test(match[1])) {
      found.push({ title, link, when })
    }
    match = pattern.exec(html)
  }
  return found
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

async function fetchGovLibrary() {
  const queries = [
    ['低空经济', 'title'],
    ['无人驾驶航空器', 'title'],
    ['通用航空', 'title'],
    ['无人机', 'title'],
    ['eVTOL', 'title'],
    ['电动垂直起降', 'title'],
    ['飞行汽车', 'title'],
    ['低空', 'title'],
    ['低空经济', 'title:content:summary'],
    ['无人机', 'title:content:summary'],
  ]
  const items = []
  let raw = 0
  let successes = 0
  for (const [query, searchfield] of queries) {
    const url = `https://sousuo.www.gov.cn/search-gov/data?${new URLSearchParams({
      t: 'zhengcelibrary_gw_bm_gb',
      q: query,
      searchfield,
      sort: 'pubtime',
      sortType: '1',
      p: '1',
      n: '20',
    })}`
    try {
      const response = await fetch(url, {
        headers: { ...BROWSER_HEADERS, Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const catMap = data?.searchVO?.catMap
      if (!catMap || typeof catMap !== 'object') throw new Error('missing catMap')
      successes += 1
      for (const bucket of Object.values(catMap)) {
        const list = Array.isArray(bucket?.listVO) ? bucket.listVO : []
        for (const record of list) {
          raw += 1
          const title = stripTags(record.title || '')
          if (!hasGovKeyword(title)) continue
          const when = parseGovDate(record.pubtimeStr || record.pubtime || '')
          const item = makeGovItem({
            title,
            link: record.url,
            summary: `${record.puborg || '中国政府网'}公开发布。`,
            source: String(record.puborg || '中国政府网').trim() || '中国政府网',
            sourceId: 'gov-library',
            when,
          })
          if (item) items.push(item)
        }
      }
    } catch (error) {
      console.warn(`[gov] gov-library query ${query} failed: ${error.message}`)
    }
  }
  if (successes === 0) throw new Error('all policy-library queries failed')
  return { raw, items }
}

async function fetchHtmlSource(source) {
  const html = await fetchText(source.url)
  const found = extractDatedLinks(html, source.url)
  if (found.length === 0) throw new Error('no dated links')
  const items = []
  for (const entry of found) {
    if (!hasGovKeyword(entry.title)) continue
    const item = makeGovItem({
      title: entry.title,
      link: entry.link,
      summary: `${source.source}公开发布。`,
      source: source.source,
      sourceId: source.id,
      when: entry.when,
    })
    if (item) items.push(item)
  }
  return { raw: found.length, items: items.slice(0, 12) }
}

async function fetchBingGov(source) {
  const items = []
  let raw = 0
  let successes = 0
  for (const query of ['低空经济', '无人机', '无人驾驶航空器']) {
    const url = bingUrl(`${query} site:${source.site}`)
    try {
      const xml = await fetchText(url)
      if (!/<item\b/i.test(xml)) throw new Error('no RSS items')
      successes += 1
      const parsed = parseRssItems(xml, 'policy')
      raw += parsed.length
      for (const entry of parsed) {
        if (govLinkRank(entry.link) < 2) continue
        if (!hasGovKeyword(entry.title)) continue
        const item = makeGovItem({
          title: entry.title,
          link: entry.link,
          summary: `${source.source}公开发布。`,
          source: source.source,
          sourceId: source.id,
          when: { date: entry.date, publishedAt: entry.publishedAt },
        })
        if (item) items.push(item)
      }
    } catch (error) {
      console.warn(`[gov] ${source.id} query ${query} failed: ${error.message}`)
    }
  }
  if (successes === 0) throw new Error('all Bing queries failed')
  return { raw, items }
}

function govSources() {
  return [
    { id: 'gov-library', label: '中国政府网·政策文件库', kind: 'library' },
    {
      id: 'ndrc-dks',
      label: '国家发展改革委低空经济发展司',
      source: '国家发展改革委',
      url: 'https://www.ndrc.gov.cn/fzggw/jgsj/dks/zygz/',
      kind: 'html',
    },
    {
      id: 'caac-yjzj',
      label: '中国民用航空局·征求意见',
      source: '中国民用航空局',
      url: 'https://www.caac.gov.cn/HDJL/YJZJ/',
      kind: 'html',
    },
    {
      id: 'mot-news',
      label: '交通运输部·交通要闻',
      source: '交通运输部',
      url: 'https://www.mot.gov.cn/xinwen/jiaotongyaowen/index.html',
      kind: 'html',
    },
    {
      id: 'mot-zcjd',
      label: '交通运输部·政策解读',
      source: '交通运输部',
      url: 'https://www.mot.gov.cn/gongkai/zcjd/index.html',
      kind: 'html',
    },
    {
      id: 'beijing',
      label: '北京市人民政府·政策法规',
      source: '北京市人民政府',
      url: 'https://www.beijing.gov.cn/zhengce/zhengcefagui/',
      kind: 'html',
    },
    {
      id: 'shanghai',
      label: '上海市人民政府·规章与部门文件',
      source: '上海市人民政府',
      url: 'https://www.shanghai.gov.cn/nw12344/index.html',
      kind: 'html',
    },
    {
      id: 'guangdong',
      label: '广东省人民政府·全部文件',
      source: '广东省人民政府',
      url: 'https://www.gd.gov.cn/zwgk/wjk/qbwj/',
      kind: 'html',
    },
    {
      id: 'chongqing',
      label: '重庆市政府信息公开',
      source: '重庆市人民政府',
      url: 'https://www.cq.gov.cn/zwgk/',
      kind: 'html',
    },
    {
      id: 'hunan',
      label: '湖南省人民政府门户',
      source: '湖南省人民政府',
      url: 'https://www.hunan.gov.cn/',
      kind: 'html',
    },
    {
      id: 'sichuan',
      label: '四川省人民政府门户',
      source: '四川省人民政府',
      url: 'https://www.sc.gov.cn/',
      kind: 'html',
    },
    {
      id: 'jiangsu',
      label: '江苏省人民政府门户',
      source: '江苏省人民政府',
      url: 'https://www.jiangsu.gov.cn/',
      kind: 'html',
    },
    { id: 'bing-shenzhen', label: '深圳市人民政府（Bing）', source: '深圳市人民政府', site: 'sz.gov.cn', kind: 'bing' },
    { id: 'bing-zhejiang', label: '浙江省人民政府（Bing）', source: '浙江省人民政府', site: 'zj.gov.cn', kind: 'bing' },
    { id: 'bing-anhui', label: '安徽省人民政府（Bing）', source: '安徽省人民政府', site: 'ah.gov.cn', kind: 'bing' },
  ]
}

async function runGovSource(source) {
  try {
    const result =
      source.kind === 'library'
        ? await fetchGovLibrary()
        : source.kind === 'bing'
          ? await fetchBingGov(source)
          : await fetchHtmlSource(source)
    console.log(`[gov] ok ${source.label}: raw ${result.raw}, kept ${result.items.length}`)
    return { id: source.id, ok: true, items: result.items }
  } catch (error) {
    console.warn(`[gov] fail ${source.label}: ${error.message}`)
    return { id: source.id, ok: false, items: [] }
  }
}

export function combineNews({ official = [], auto = [], previous = [], rssOk = false, officialOk = false }) {
  const officialItems = (officialOk ? official : previous).filter(usableOfficial)
  const freshAuto = rssOk ? selectAutoItems(auto.filter(usableAuto)) : []
  const nextAuto = freshAuto.length > 0 ? freshAuto : previous.filter(usableAuto)
  const titles = new Set(officialItems.map((item) => normalizeTitle(item.title)).filter(Boolean))
  const links = new Set(officialItems.map((item) => canonicalLink(item.link)).filter(Boolean))
  const filteredAuto = nextAuto.filter((item) => {
    const title = normalizeTitle(item.title)
    const link = canonicalLink(item.link)
    if (title && titles.has(title)) return false
    if (link && links.has(link)) return false
    return true
  })
  const officialSorted = [...officialItems].sort(
    (a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0),
  )
  return [...officialSorted, ...filteredAuto]
}

function feeds() {
  const list = []
  for (const query of QUERIES) {
    list.push({
      label: `google ${query.q}`,
      url: googleUrl(query.q),
      category: query.category,
    })
    list.push({
      label: `bing ${query.q}`,
      url: bingUrl(query.q),
      category: query.category,
    })
  }
  return list
}

export async function main() {
  const previous = readPrevious(OUT_FILE)
  const feedList = feeds()
  const batches = await mapPool(feedList, 4, fetchFeed)
  const fetched = batches.flat()
  const failedFeeds = feedList.length - batches.filter((batch) => batch.length > 0).length
  console.log(`[news] rss items ${fetched.length}, failed feeds ${failedFeeds}/${feedList.length}`)

  let issueOfficial = []
  let officialOk = false
  try {
    issueOfficial = await fetchOfficialIssues(REPO)
    officialOk = true
    console.log(`[news] issue official ${issueOfficial.length}`)
  } catch (error) {
    console.warn(`[news] official issues failed: ${error.message}`)
  }

  const govSourceList = govSources()
  const govResults = await mapPool(govSourceList, 4, runGovSource)
  const govItems = mergeGovResults(
    govResults,
    previous.filter((item) => String(item?.id || '').startsWith('gov-')),
  )
  const govOk = govResults.filter((result) => result.ok).length
  console.log(`[gov] sources ok ${govOk}/${govSourceList.length}, kept ${govItems.length}`)

  const keptIssueOfficial = officialOk
    ? issueOfficial
    : previous.filter((item) => item?.official === true && !String(item.id || '').startsWith('gov-'))

  const items = combineNews({
    official: [...keptIssueOfficial, ...govItems],
    auto: fetched,
    previous: previous.filter((item) => !String(item?.id || '').startsWith('gov-')),
    rssOk: fetched.length > 0,
    officialOk: true,
  }).map(({ matched: _matched, ...item }) => item)
  const payload = {
    updatedAt: new Date().toISOString(),
    items,
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`)
  console.log(`[news] wrote ${items.length} items to ${path.relative(ROOT, OUT_FILE)}`)
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectRun) {
  main().catch((error) => {
    console.error('[news] fatal', error)
    process.exitCode = 1
  })
}
