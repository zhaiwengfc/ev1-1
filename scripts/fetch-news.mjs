import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_FILE = path.join(ROOT, 'public', 'data', 'news.json')
const MAX_AUTO = 60
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

  let official = []
  let officialOk = false
  try {
    official = await fetchOfficialIssues(REPO)
    officialOk = true
    console.log(`[news] official ${official.length}`)
  } catch (error) {
    console.warn(`[news] official issues failed: ${error.message}`)
  }

  const items = combineNews({
    official,
    auto: fetched,
    previous,
    rssOk: fetched.length > 0,
    officialOk,
  }).map(({ matched, ...item }) => item)
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
