# apps/web — Lidless 官网 + 文档系统

Lidless 的营销官网，基于 Next.js 15（App Router），内置**自建的 MDX 文档系统**。
中英双语（en/zh，走 next-intl），Tailwind v4，**全静态（SSG）**——没有服务端运行时、
没有数据库、没有 CMS。

## 命令

在仓库根目录执行：

- `pnpm web:dev` —— 开发服务器（localhost:3000）
- `pnpm web:build` —— 生产构建，**真正的验收门**（同时做类型检查、lint，并静态生成每一页
  ——内容和 metadata 的错误都在这一步暴露）
- `pnpm --filter @lidless/web typecheck` —— `tsc --noEmit`
- `pnpm web:lint`

声明改动完成前，务必先跑构建（至少跑 `typecheck`）。可在浏览器里看到效果的改动，要用开发
服务器自行验证，别让用户手动检查。

---

## ⚠️ 内容的首要目的是 SEO

文档和营销文案首先是一盘**自然搜索流量**的棋——它们存在是为了拿排名、引来流量，而不是做
穷尽式的产品手册。写或改任何内容时，都以"被搜到"为目标来优化：

- **每篇瞄准一个关键词簇。** 关键词集合在 `messages/{en,zh}.json` 的 `Meta.keywords` 里
  （如 _keep Mac awake_、_prevent Mac from sleeping_、_Amphetamine alternative_、
  _keep awake for Claude Code_、_remote access keep awake_）。围绕它们写，一篇一个主题。
- **`title` + `description` 是杠杆最高的 SEO 字段。** 它们会变成 `<title>`、
  `<meta description>` 以及 OG/Twitter 卡片。每篇文档**必须**有独一无二、带关键词、有吸引力
  的 `description`，**绝不能留空**。
- **写真正有分量的正文。** 开头先给答案。篇幅和深度直接影响排名——占位式的短文不会有排名。
  （`content/docs/` 里现有的示例文档都是占位内容，要替换成真实的长文。）
- **标题有权重。** 用 `##` / `###` 并带上目标措辞——它们会变成锚点、右侧目录，并被搜索引擎加权。
- **互相内链**（`/docs/...`）——有助于抓取和主题权威度。
- 先为人写，**不要堆砌关键词**。

已经接好的 SEO 设施（别删，新路由要照做）：按语言的 `canonical` + `hreflang`
（en/zh/x-default）、OpenGraph `type:article` + `article:modified_time`、Twitter 卡片、
`TechArticle` + `BreadcrumbList` 结构化数据，以及带每篇 `lastModified` 的 `sitemap.xml`。
辅助函数在 `src/lib/seo.ts`。

---

## 怎么写一篇文档

文档是 `content/docs/<locale>/` 下的 `.mdx` 文件。**文件路径 = URL**：
`en/guides/x.mdx` → `/docs/guides/x`（以及 `/zh/docs/guides/x`）。`index.mdx` → 文档着陆页。
以 `_` 或 `.` 开头的文件/目录会被忽略（永不上线）。先从 `content/docs/_templates/` 复制一个
骨架（那个目录里还有完整的作者说明 `README.md`）。

1. **始终同时创建两种语言**——`en/` 和 `zh/` 下同一个 slug。这是 hreflang 和语言切换能工作的
   前提。绝不要只发一种语言的文档。
2. 填好 frontmatter（见下表）。
3. 写正文。

### Frontmatter

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 同时作为 `<h1>` 和侧边栏/目录标签 |
| `description` | **是（SEO）** | meta description + OG/Twitter + 索引卡片；每篇唯一 |
| `template` | 否 | `default` \| `tutorial` \| `reference`（默认 `default`） |
| `group` | 否 | 侧边栏分组标题；不分组的排在最前 |
| `order` | 否 | 组内排序，越小越靠前（默认 100） |
| `updated` | 否 | **加引号：`updated: "2026-06-04"`**——见下方"坑"。会喂给 sitemap 的 `lastModified` 和 `article:modified_time` |
| `icon` | 否 | 可选的图标 key |
| `draft` | 否 | `true` 时该文档不进生产构建和 sitemap |

### MDX 组件（任意 `.mdx` 里可直接用，无需 import）

- `<Callout type="note|tip|warning|danger" title="…">…</Callout>`
- `<Steps>` / `<Step title="…">…</Step>` —— 自动编号的教程步骤
- `<Tabs>` / `<Tab label="macOS">…</Tab>` —— 平台 / Shell 切换
- 代码围栏 —— 构建期高亮（Shiki）并自带复制按钮

两条不注意就会出错的 MDX 规则：
- **`<Tab>` 里的代码**：围栏前后各空一行，且围栏不要缩进（顶格，列 0）。参见
  `_templates/tutorial.mdx`。
- **标题**：只用 `##`/`###`。`<h1>` 由 `title` 渲染——正文里不要写单个 `#`。

### 发布前清单

- [ ] `en/` + `zh/` 两个版本，slug 相同
- [ ] 两边都有唯一、带关键词的 `description`
- [ ] 正文是真实长文而非占位；标题用目标措辞
- [ ] 内链到相关文档
- [ ] `updated` 加了引号；`template`/`group`/`order` 已设置
- [ ] `pnpm web:build` 通过（它会静态生成该页）

---

## i18n 规则

- 语言：**en**（默认，URL 无前缀）和 **zh**（`/zh`）。`localePrefix: "as-needed"`。
- UI 文案放在 `messages/{en,zh}.json`，按命名空间分组——**两个文件都要加**。文档 UI 用
  `Docs` 命名空间，导航用 `Nav`，页脚用 `Footer`，等等。
- **内链**：用 `@/i18n/navigation` 里的 `Link` / `usePathname` / `useRouter`（会自动带语言
  前缀），**不要**用 `next/link`。外链用普通 `<a target="_blank" rel="noopener noreferrer">`。
- 每个可路由页面都要在 `generateMetadata` 里设置 `alternates: buildAlternates(locale, path)`
  （canonical + hreflang）。新路由也要保留这一步。
- `src/middleware.ts` 的 matcher 排除了 `api`/`_next`/静态文件——别破坏它。

## 样式

- Tailwind v4，**CSS 优先**配置在 `src/app/globals.css`（`@theme`）。只有暗色主题。
- **用品牌 token，别写死十六进制色值**：颜色 `bg`、`bg-soft`、`ink`、`muted`、`accent`、
  `accent-bright`；工具类 `border-hairline`、`bg-surface`、`shadow-glow`。
- 长文用 `prose prose-invert prose-docs`（Tailwind Typography，已在 globals.css 调成品牌色）。
  减弱动效（reduced-motion）已全局处理。

## 架构地图（别重复造轮子）

- **文档管线**：`src/lib/docs/` —— `source.ts`（fs + frontmatter + 侧边栏 + 上/下篇）、
  `mdx.ts`（remark/rehype 插件、Shiki）、`toc.ts`、`types.ts`
- **文档路由**：`src/app/[locale]/docs/{layout,page,[...slug]/page}.tsx`（SSG，
  `dynamicParams = false`）
- **文档组件**：`src/components/docs/`（templates、sidebar、toc、pager、breadcrumbs、
  callout、steps、tabs、pre[复制]、mdx-components）
- **SEO**：`src/lib/seo.ts`（`buildAlternates`、`localizedUrl`、`*JsonLd`）；通过
  `src/components/json-ld.tsx` 渲染
- **站点配置**：`src/config/site.ts`（URL、版本号——可用环境变量覆盖）。爬虫相关文件在
  `src/app/{sitemap,robots,manifest}.ts`。
- **营销页的"使用场景"** 内容是 TS，在 `src/lib/content/`（不属于文档系统）。

## 坑 / 历史

- **没有 CMS。** Sanity 和内嵌的 `/studio` 是被刻意移除的；内容就是本地的 MDX + TS。
  不要再引入 CMS。
- **YAML 日期**：不加引号的 `updated: 2026-06-04` 会被解析成 JS `Date`，从而破坏 next-intl
  的 `{date}` 消息。`source.ts` 里有兜底转换，但仍然**请给日期加引号**。
- `next-mdx-remote-client` 在构建期编译 MDX；`@types/mdx` 提供 `mdx/types` 的
  `MDXComponents` 类型——保持安装。
- 加一篇**文档**不需要改代码（只加 `.mdx` 文件）。加新的**模板或组件**才需要改代码。
