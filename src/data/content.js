import { intros, officialNews, labArticles, labReviews } from './writtenContent.js'

export { intros, officialNews, labArticles, labReviews }

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

export const productCategories = [
  { id: 'all', name: '全部类型' },
  { id: 'aerial', name: '航拍' },
  { id: 'fpv', name: '穿越 / FPV' },
  { id: 'mapping', name: '测绘' },
  { id: 'edu', name: '教学' },
  { id: 'inspect', name: '巡检' },
]

export const priceFilters = [
  { id: 'all', name: '全部价位（示例）' },
  { id: 'low', name: '3,000 元以下', min: 0, max: 3000 },
  { id: 'mid', name: '3,000 – 8,000 元', min: 3000, max: 8000 },
  { id: 'high', name: '8,000 元以上', min: 8000, max: Infinity },
]

export const products = [
  {
    id: 'p-a1',
    name: '示例航拍无人机 A1',
    category: 'aerial',
    price: 2499,
    tag: '入门航拍',
    blurb: '面向日常景致记录的入门示意机型，参数与售价均为示例。',
    accent: '#FFE500',
    variant: 'quad',
    specs: [
      ['示意轴距', '250 mm 级'],
      ['示意航时', '约 25 分钟'],
      ['示意图传', '基础数字图传'],
      ['示意重量', '约 450 g'],
    ],
    desc: 'A1 是用于商城演示的虚构入门航拍机。页面提供规格表、示例价格与加购流程，不代表任何在售商品。',
  },
  {
    id: 'p-a2',
    name: '示例航拍无人机 A2 Pro',
    category: 'aerial',
    price: 4899,
    tag: '进阶航拍',
    blurb: '在 A1 基础上增加示意级避障与成像能力，便于对比商品卡片。',
    accent: '#FFC107',
    variant: 'quad-pro',
    specs: [
      ['示意轴距', '350 mm 级'],
      ['示意航时', '约 32 分钟'],
      ['示意图传', '增强数字图传'],
      ['示意重量', '约 720 g'],
    ],
    desc: 'A2 Pro 为虚构进阶机型。所有成像规格、避障描述与价格均为占位，仅用于演示筛选与详情页。',
  },
  {
    id: 'p-mini',
    name: '示例便携航拍机 Mini S',
    category: 'aerial',
    price: 1899,
    tag: '便携',
    blurb: '强调收纳体积的示意产品，适合展示较低价位筛选结果。',
    accent: '#FFF3A0',
    variant: 'mini',
    specs: [
      ['示意轴距', '180 mm 级'],
      ['示意航时', '约 18 分钟'],
      ['示意图传', '基础数字图传'],
      ['示意重量', '约 249 g'],
    ],
    desc: 'Mini S 是虚构的便携机型。重量与航时数字为随意填写的示意值，请勿与真实产品对照。',
  },
  {
    id: 'p-fpv',
    name: '示例穿越机 FPV-X',
    category: 'fpv',
    price: 3299,
    tag: '竞速操控',
    blurb: '用于展示穿越机组装感与操控向卖点的占位商品。',
    accent: '#FFE500',
    variant: 'fpv',
    specs: [
      ['示意轴距', '5 寸框架'],
      ['示意图传', '低延迟模拟/数字示意'],
      ['示意动力', '示例套装动力'],
      ['示意重量', '约 480 g'],
    ],
    desc: 'FPV-X 为虚构穿越机。页面中的套装内容、延迟数据与售价都是示例，研究室评测亦为示意评测。',
  },
  {
    id: 'p-m200',
    name: '示例测绘无人机 M200',
    category: 'mapping',
    price: 12800,
    tag: '测绘入门',
    blurb: '行业应用向的示意机型，用于高价位筛选与规格表演示。',
    accent: '#F5D000',
    variant: 'mapping',
    specs: [
      ['示意航时', '约 40 分钟'],
      ['示意载荷', '模块化测绘舱（示意）'],
      ['示意精度', '占位指标，非实测'],
      ['示意重量', '约 2.1 kg'],
    ],
    desc: 'M200 并不存在于真实市场。精度、载荷与售后条款均为占位文案，不能作为采购或投标材料。',
  },
  {
    id: 'p-m300',
    name: '示例长续航测绘机 M300',
    category: 'mapping',
    price: 18600,
    tag: '长航时',
    blurb: '在 M200 基础上拉长示意航时，用于列表对比与高价位段展示。',
    accent: '#FFE566',
    variant: 'mapping-long',
    specs: [
      ['示意航时', '约 55 分钟'],
      ['示意载荷', '双舱占位配置'],
      ['示意精度', '占位指标，非实测'],
      ['示意重量', '约 2.8 kg'],
    ],
    desc: 'M300 为虚构长航时机型。所有续航与精度数字均不可用于真实作业评估。',
  },
  {
    id: 'p-t1',
    name: '示例教学无人机 T1',
    category: 'edu',
    price: 1299,
    tag: '课堂套件',
    blurb: '面向教学演示的保护桨套件占位商品，价格位于较低区间。',
    accent: '#FFE500',
    variant: 'edu',
    specs: [
      ['示意场景', '室内课堂 / 户外空旷场地'],
      ['示意模式', '教师管控、低速保护'],
      ['示意课程', '示例编程课包'],
      ['示意重量', '约 180 g'],
    ],
    desc: 'T1 是虚构教学机。课程包、安全模式与价位都是为演示准备的占位数据。',
  },
  {
    id: 'p-i10',
    name: '示例室内巡检机 I10',
    category: 'inspect',
    price: 6500,
    tag: '室内巡检',
    blurb: '用于厂房或廊道巡检场景的示意产品，展示中价位与特殊类型筛选。',
    accent: '#FFD54A',
    variant: 'inspect',
    specs: [
      ['示意防护', '全向保护框（示意）'],
      ['示意传感器', '视觉 + 距离感知占位'],
      ['示意航时', '约 14 分钟'],
      ['示意重量', '约 610 g'],
    ],
    desc: 'I10 为虚构巡检机型。防护等级与传感器能力都是示意描述，不保证任何工业现场适用性。',
  },
]

export const highlights = [
  { kind: 'review', id: 'v-mini5pro' },
  { kind: 'product', id: 'p-fpv' },
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
