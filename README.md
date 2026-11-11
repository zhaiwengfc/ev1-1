# EV1平台（示例原型）

低空行业资讯交流 + 无人机商城 / 研究室 的前端原型。全部文案为简体中文，资讯、政策、价格、评测等均标记为「示例内容」，便于后续替换真实数据。

## 技术栈

- Vite 8 + React 19
- React Router 7（前端路由）
- 本地 JSON/JS 数据：`src/data/content.js`
- 购物车为浏览器端状态（Context + localStorage），无后端

## 本地运行

```bash
npm install
npm run dev
```

默认地址：http://localhost:5173/（使用 Hash 路由，如 `/#/news`）。

若要得到可在浏览器里直接双击打开的单文件页面：

```bash
npm run build
```

构建结果在 `dist/index.html`，已内联全部 JS/CSS，可用 `file://` 打开，无需 Node 或本地服务器。

生产预览：

```bash
npm run preview
```

## 页面

- `/` 首页
- `/news` 行业资讯（四个分类标签 + 详情 `/news/:id`）
- `/shop` 无人机商城（筛选、卡片、详情 `/shop/:id`、客户端购物车）
- `/lab` 研究室（技术研究 + 产品评测，详情 `/lab/:id`）

视觉方向为街机涂鸦风，主色为醒目黄，标志使用文字字标「EV1平台」，不使用图片 Logo。
