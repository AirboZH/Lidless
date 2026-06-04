# 写文档

文档是 `content/docs/<locale>/` 下的 MDX 文件。整个站点是静态生成的，所以新文件在下一次
构建后就上线——没有 CMS，也没有数据库。

## 新增一篇

1. 从本 `_templates/` 目录复制一个骨架。
2. 放到对应语言下，例如：
   - `content/docs/en/guides/my-page.mdx`
   - `content/docs/zh/guides/my-page.mdx`（同一路径 = 同一 slug → 语言切换才能对应上）
3. 填好 frontmatter，开始写。

文件路径即 URL：`en/guides/my-page.mdx` → `/docs/guides/my-page`（以及
`/zh/docs/guides/my-page`）。`index.mdx` 对应所在目录的根。

以 `_`（如本文件）或 `.` 开头的文件和目录会被忽略——它们永远不会上线。

## Frontmatter

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 页面标题（同时是 `<h1>` 和侧边栏/目录标签）。 |
| `description` | 否 | 用于 `<meta>` 和文档索引卡片的摘要。 |
| `template` | 否 | `default`（文字）、`tutorial`（步骤）或 `reference`（紧凑）。默认 `default`。 |
| `group` | 否 | 侧边栏分组标题。不分组的排在最前。 |
| `order` | 否 | 组内排序（越小越靠前）。默认 100。 |
| `updated` | 否 | ISO 日期，显示为"最后更新"。**请加引号**，例如 `"2026-01-01"`。 |
| `draft` | 否 | `true` 时该页不进生产构建和 sitemap。 |

## 组件

任意 `.mdx` 里都可直接使用（无需 import）：

- `<Callout type="note|tip|warning|danger" title="...">…</Callout>`
- `<Steps>` / `<Step title="...">…</Step>` —— 自动编号的教程步骤
- `<Tabs>` / `<Tab label="...">…</Tab>` —— 平台 / Shell 切换
- 代码围栏 —— 构建期高亮，并自带复制按钮

在 `<Tab>` 里放代码块时，围栏前后各留一个空行，且围栏不要缩进（顶格）。参见 `tutorial.mdx`。

## 标题

用 `##` 和 `###` 来分节——它们会获得锚点链接，并填充右侧的"本页目录"。正文里不要写单个
`#`；`<h1>` 由 `title` 渲染。
