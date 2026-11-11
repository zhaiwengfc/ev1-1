import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classify,
  combineNews,
  decodeXml,
  govLinkRank,
  hasGovKeyword,
  mergeGovResults,
  parseRssItems,
  selectAutoItems,
  extractDatedLinks,
  makeGovItem,
  normalizeGovSource,
  selectGovItems,
  toOfficialItem,
} from './fetch-news.mjs'

const googleXml = `<?xml version="1.0"?>
<rss><channel>
<item>
  <title>某地发布低空经济试点政策 - 示例报</title>
  <link>https://news.google.com/rss/articles/abc</link>
  <pubDate>Wed, 11 Nov 2026 01:00:00 GMT</pubDate>
  <description>某地发布低空经济试点政策</description>
  <source url="https://example.com">示例报</source>
</item>
<item>
  <title>全国无人机大赛开赛 - 体育报</title>
  <link>https://news.google.com/rss/articles/race</link>
  <pubDate>Tue, 10 Nov 2026 01:00:00 GMT</pubDate>
  <description>全国无人机大赛开赛</description>
  <source url="https://sports.example">体育报</source>
</item>
<item>
  <title>连云港半程马拉松赛举行 - 体育报</title>
  <link>https://example.com/marathon</link>
  <pubDate>Mon, 09 Nov 2026 01:00:00 GMT</pubDate>
  <description>市民参与长跑</description>
  <source url="https://sports.example">体育报</source>
</item>
<item>
  <title>被乌军无人机打怕了 - 军事报</title>
  <link>https://example.com/war</link>
  <pubDate>Mon, 09 Nov 2026 01:00:00 GMT</pubDate>
  <description>前线继续轰炸</description>
  <source url="https://war.example">军事报</source>
</item>
</channel></rss>`

test('decodes html spaces in feed text', () => {
  assert.equal(decodeXml('标题&nbsp;&amp;nbsp;正文').replace(/\s+/g, ' '), '标题 正文')
})

test('classifies policy, contest, and release by keyword', () => {
  assert.equal(classify('低空经济管理办法公开', '', 'tech'), 'policy')
  assert.equal(classify('校园无人机竞速赛报名', '', 'policy'), 'contest')
  assert.equal(classify('新款无人机发布会亮相', '', 'tech'), 'release')
  assert.equal(classify('行业动态', '', 'tech'), 'tech')
})

test('parses RSS, strips the source suffix, and prefers a direct link', () => {
  const parsed = parseRssItems(googleXml, 'policy')
  assert.equal(parsed.length, 2)
  assert.equal(parsed.some((item) => item.title.includes('马拉松')), false)
  assert.equal(parsed.some((item) => item.title.includes('乌军')), false)
  assert.equal(parsed[0].title, '某地发布低空经济试点政策')
  assert.equal(parsed[0].source, '示例报')
  assert.equal(parsed[0].category, 'policy')
  assert.equal(parsed[1].category, 'contest')

  const bingDuplicate = {
    ...parsed[0],
    link: 'https://example.com/story',
    source: '示例报',
    publishedAt: '2026-11-11T02:00:00.000Z',
  }
  const selected = selectAutoItems([parsed[0], bingDuplicate, parsed[1]], 60)
  assert.equal(selected.length, 2)
  const policy = selected.find((item) => item.category === 'policy')
  assert.equal(policy.link, 'https://example.com/story')
  assert.equal(policy.source, '示例报')

  const nearDupes = selectAutoItems(
    [
      {
        id: 'a',
        title: '小鹏汇天宣布飞行汽车今年量产',
        link: 'https://news.google.com/rss/articles/a',
        source: '甲',
        publishedAt: '2026-11-11T03:00:00.000Z',
        category: 'tech',
        official: false,
      },
      {
        id: 'b',
        title: '小鹏汇天宣布飞行汽车年内量产计划',
        link: 'https://example.com/xpeng',
        source: '乙',
        publishedAt: '2026-11-11T02:00:00.000Z',
        category: 'tech',
        official: false,
      },
    ],
    60,
  )
  assert.equal(nearDupes.length, 1)
  assert.equal(nearDupes[0].title, '小鹏汇天宣布飞行汽车今年量产')
})

test('keeps owner posts and drops other people', () => {
  const body = `### 标题

官方标题

### 分类

政府政策

### 摘要/正文

第一段说明。

第二段说明。

### 原文链接

_No response_

### 图片链接

javascript:alert(1)`
  const owner = toOfficialItem({
    number: 7,
    state: 'open',
    author_association: 'OWNER',
    title: '[资讯] 忽略这个标题',
    created_at: '2026-11-11T00:00:00.000Z',
    labels: [{ name: '资讯' }],
    body,
  })
  assert.equal(owner.title, '官方标题')
  assert.equal(owner.category, 'policy')
  assert.equal(owner.official, true)
  assert.equal(owner.link, undefined)
  assert.equal(owner.image, undefined)
  assert.deepEqual(owner.body, ['第一段说明。', '第二段说明。'])

  assert.equal(
    toOfficialItem({
      number: 8,
      state: 'open',
      author_association: 'NONE',
      labels: [{ name: '资讯' }],
      title: '陌生人',
      body: '### 标题\n\n陌生人\n\n### 分类\n\n比赛信息\n\n### 摘要/正文\n\n不行',
    }),
    null,
  )
  assert.equal(
    toOfficialItem({
      number: 9,
      state: 'open',
      author_association: 'CONTRIBUTOR',
      labels: [{ name: '资讯' }],
      title: '贡献者',
      body: '### 标题\n\n贡献者\n\n### 分类\n\n比赛信息\n\n### 摘要/正文\n\n不行',
    }),
    null,
  )
  assert.equal(
    toOfficialItem({
      number: 10,
      state: 'closed',
      author_association: 'COLLABORATOR',
      labels: [{ name: '资讯' }],
      title: '已关闭',
      body: '### 标题\n\n已关闭\n\n### 分类\n\n比赛信息\n\n### 摘要/正文\n\n不行',
    }),
    null,
  )
})

test('matches whole low-altitude words and ignores split-word noise', () => {
  assert.equal(hasGovKeyword('通航建筑物施工方案'), false)
  assert.equal(hasGovKeyword('国民经济和社会发展'), false)
  assert.equal(hasGovKeyword('低空经济标准体系建设指南'), true)
  assert.equal(hasGovKeyword('通用航空经营管理规定'), true)
  assert.equal(hasGovKeyword('通用 航空 经营管理规定'), true)
  assert.equal(hasGovKeyword('低空 经济 标准体系建设指南'), true)
  assert.equal(hasGovKeyword('eVTOL 试点'), true)
})

test('keeps the agency URL ahead of a gov.cn reprint and drops Google wrappers', () => {
  const when = { date: '2026-02-02', publishedAt: '2026-02-02T00:00:00.000Z' }
  const agency = {
    id: 'gov-agency',
    title: '低空经济标准体系建设指南',
    link: 'https://www.ndrc.gov.cn/xxgk/zcfb/202602/t20260202_1.html',
    source: '国家发展改革委',
    govSource: 'ndrc-dks',
    official: true,
    category: 'policy',
    date: when.date,
    publishedAt: when.publishedAt,
  }
  const reprint = {
    ...agency,
    id: 'gov-reprint',
    link: 'https://www.gov.cn/zhengce/zhengceku/202602/content_7056835.htm',
    source: '中国政府网',
    govSource: 'gov-library',
  }
  const google = {
    ...agency,
    id: 'gov-google',
    link: 'https://news.google.com/rss/articles/abc',
    source: '中国政府网',
  }
  assert.equal(govLinkRank(google.link), 0)
  assert.ok(govLinkRank(reprint.link) < govLinkRank(agency.link))
  const selected = selectGovItems([reprint, google, agency], 30)
  assert.equal(selected.length, 1)
  assert.equal(selected[0].link, agency.link)
  assert.equal(selected[0].source, '国家发展改革委')
})

test('uses each list item’s own date and falls back to the URL stamp', () => {
  const html = `
    <ul class="u-list">
      <li><a href="./202605/t20260509_1405133.html" title="国家发展改革委低空经济发展司2026年研究课题征集公告">国家发展改革委低空经济发展司2026年研究课题征集公告</a><span>2026/05/09</span></li>
      <li><a href="./202508/t20250812_1399767.html" title="国家发展改革委低空司举办推进低空经济高质量发展专题培训">国家发展改革委低空司举办推进低空经济高质量发展专题培训</a><span>2025/08/12</span></li>
      <li><a href="./202507/t20250718_1399292.html">国家发展改革委召开推动低空经济安全健康发展专题会议</a></li>
    </ul>`
  const found = extractDatedLinks(html, 'https://www.ndrc.gov.cn/fzggw/jgsj/dks/zygz/')
  assert.deepEqual(
    found.map((item) => [item.link.split('/').pop(), item.when.date]),
    [
      ['t20260509_1405133.html', '2026-05-09'],
      ['t20250812_1399767.html', '2025-08-12'],
      ['t20250718_1399292.html', '2025-07-18'],
    ],
  )
})

test('writes 中国民用航空局 for both short source names', () => {
  assert.equal(normalizeGovSource('民航局'), '中国民用航空局')
  assert.equal(normalizeGovSource('中国民航局'), '中国民用航空局')
  assert.equal(normalizeGovSource('中国民用航空局'), '中国民用航空局')
  assert.equal(normalizeGovSource('民航局航空器适航审定司'), '中国民用航空局航空器适航审定司')
  assert.equal(
    normalizeGovSource('工业和信息化部 科技部 财政部 中国民航局'),
    '工业和信息化部 科技部 财政部 中国民用航空局',
  )
})

test('keeps every fetched government item in policy', () => {
  const when = { date: '2026-02-02', publishedAt: '2026-02-02T00:00:00.000Z' }
  const item = makeGovItem({
    title: '关于征求民航行业标准意见的函：无人机供应链与新品发布会',
    link: 'https://www.caac.gov.cn/HDJL/YJZJ/202602/t20260202_1.html',
    source: '中国民用航空局',
    sourceId: 'caac-yjzj',
    when,
  })
  assert.equal(item.category, 'policy')
  const kept = selectGovItems([{ ...item, category: 'tech' }], 30)
  assert.equal(kept[0].category, 'policy')
})

test('keeps the previous official items when that source fails', () => {
  const previous = [
    {
      id: 'gov-old',
      title: '北京市无人驾驶航空器特殊保障规定',
      link: 'https://www.beijing.gov.cn/zhengce/202609/t20260917_1.html',
      source: '北京市人民政府',
      govSource: 'beijing',
      official: true,
      category: 'policy',
      date: '2026-09-17',
      publishedAt: '2026-09-17T00:00:00.000Z',
    },
  ]
  const kept = mergeGovResults([{ id: 'beijing', ok: false, items: [] }], previous)
  assert.equal(kept.length, 1)
  assert.equal(kept[0].id, 'gov-old')
  const replaced = mergeGovResults(
    [
      {
        id: 'beijing',
        ok: true,
        items: [
          {
            ...previous[0],
            id: 'gov-new',
            title: '北京市促进低空经济产业高质量发展行动方案',
            publishedAt: '2026-10-01T00:00:00.000Z',
          },
        ],
      },
    ],
    previous,
  )
  assert.deepEqual(replaced.map((item) => item.id), ['gov-new'])
})

test('keeps the previous auto list when this fetch finds nothing', () => {
  const previous = [
    {
      id: 'rss-old',
      title: '旧报道',
      link: 'https://example.com/old',
      category: 'tech',
      official: false,
      publishedAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'official-1',
      title: '旧官方',
      category: 'policy',
      official: true,
      publishedAt: '2026-11-02T00:00:00.000Z',
    },
  ]
  const kept = combineNews({
    official: [],
    auto: [],
    previous,
    rssOk: false,
    officialOk: true,
  })
  assert.deepEqual(kept.map((item) => item.id), ['rss-old'])

  const replaced = combineNews({
    official: [
      {
        id: 'official-3',
        title: '新官方',
        category: 'contest',
        official: true,
        publishedAt: '2026-11-11T00:00:00.000Z',
      },
    ],
    auto: [
      {
        id: 'rss-new',
        title: '新报道',
        link: 'https://example.com/new',
        category: 'tech',
        official: false,
        publishedAt: '2026-11-11T00:00:00.000Z',
      },
    ],
    previous,
    rssOk: true,
    officialOk: true,
  })
  assert.deepEqual(replaced.map((item) => item.id), ['official-3', 'rss-new'])
})
