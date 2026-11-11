import { intros, officialNews, labArticles, labReviews } from './writtenContent.js'
import { products, productCategories, priceFilters } from './catalog.js'

export { intros, officialNews, labArticles, labReviews, products, productCategories, priceFilters }

export const SITE = {
  name: 'EV1平台',
  tagline: intros.tagline,
  heroKicker: intros.heroKicker,
  heroLead: intros.heroLead,
  disclaimer: intros.disclaimer,
}

export const newsCategories = [
  { id: 'all', name: '全部' },
  { id: 'policy', name: '政府政策' },
  { id: 'tech', name: '科技创新与供应链' },
  { id: 'contest', name: '比赛信息' },
  { id: 'release', name: '无人机新品发布' },
]

export const news = [
  {
    id: 'n-contest-01',
    category: 'contest',
    title: '低空创新挑战赛报名说明（示意赛程）',
    date: '2026-10-05',
    summary: '用虚构赛程展示比赛资讯页：组别、报名窗口与评审维度均为占位信息。',
    body: [
      '本文为示例内容，并不存在此处描述的真实赛事或报名通道。',
      '示意赛程：创意组、巡检应用组与物流场景组，时间窗用“示例月份”表示，不含报名链接。',
      '示意规则：作品提交格式、安全检查与展示环节，仅用于还原比赛通知的阅读结构。',
    ],
  },
  {
    id: 'n-contest-02',
    category: 'contest',
    title: '校园无人机竞速联赛分区赛通知（示意）',
    date: '2026-09-16',
    summary: '面向校园组别的示意通知，包含场地、组别与观赛提示等占位段落。',
    body: [
      '本文为示例内容，未对应任何学校、联盟或真实开赛日期。',
      '示意通知：分区赛采用统一赛道元素，强调安全围挡与裁判流程的版式演示。',
      '如后续接入真实比赛，需替换全部时间、地点与主办方信息。',
    ],
  },
  {
    id: 'n-contest-03',
    category: 'contest',
    title: '行业应用技能大赛参赛须知（示意）',
    date: '2026-08-21',
    summary: '演示测绘、巡检等应用向技能赛的须知排版，项目设置均为虚构。',
    body: [
      '本文为示例内容，竞赛项目与评分表都是占位草稿。',
      '示意项目：航线规划、数据采集完整度与成果报告规范性，分数权重为随意填写。',
      '本条目用于填充“比赛信息”分类，便于切换标签时仍有足够列表密度。',
    ],
  },
]

export const highlights = [
  { kind: 'product', id: 'p-mini5pro' },
  { kind: 'product', id: 'p-air3s' },
  { kind: 'product', id: 'p-neo2' },
  { kind: 'product', id: 'p-a1' },
]

export function getNews(id) {
  return [...officialNews, ...news].find((item) => item.id === id)
}

export function getProduct(id) {
  return products.find((item) => item.id === id)
}

export function getLabItem(id) {
  return [...labArticles, ...labReviews].find((item) => item.id === id)
}

export function categoryLabel(id) {
  return newsCategories.find((item) => item.id === id)?.name ?? id
}

export function productCategoryLabel(id) {
  return productCategories.find((item) => item.id === id)?.name ?? id
}

export function formatSamplePrice(value) {
  return `¥${value.toLocaleString('zh-CN')}`
}
