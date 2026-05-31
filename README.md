# Lidless

> 锁屏不睡眠 · 网络不掉线

让电脑在**锁屏状态下保持唤醒、Wi-Fi 不断**，方便远程使用 Claude Code、RustDesk 等。
名字取自 *lidless eye*——机器看起来睡着了（锁屏），那只不闭的眼睛却始终醒着。

这是一个 **pnpm monorepo**，包含桌面 app 与官网两个 package。

## 仓库结构

```
.
├── apps/
│   ├── desktop/   # Tauri 桌面端（macOS / Windows）锁屏保活 app
│   └── web/       # 官网（Next.js + next-intl 中英双语）
├── packages/      # 预留：未来跨 app 复用的共享包
├── pnpm-workspace.yaml
└── package.json   # 根 workspace（脚本入口）
```

## 环境要求

- [Node.js](https://nodejs.org/) ≥ 20、[pnpm](https://pnpm.io/) 10
- 桌面端额外需要 [Rust](https://rustup.rs/)；Windows 还需 WebView2（Win11 自带）

```bash
pnpm install   # 在仓库根执行，安装所有 workspace 依赖
```

## 常用命令

根目录脚本（都是对子包的转发，省得手动 `cd`）：

| 命令 | 作用 |
| --- | --- |
| `pnpm desktop:dev` | 开发模式运行桌面 app（`tauri dev`） |
| `pnpm desktop:build` | 打包桌面安装程序（`tauri build`） |
| `pnpm web:dev` | 本地起官网（默认 http://localhost:3000） |
| `pnpm web:build` | 构建官网（生产） |
| `pnpm web:start` | 跑构建产物 |
| `pnpm web:lint` | 官网 lint + 类型检查 |

> 也可以直接 `pnpm --filter @lidless/desktop <script>` / `pnpm --filter @lidless/web <script>`。

---

## apps/desktop — 桌面端

锁屏保活的 Tauri app。功能、技术原理与后续计划见 [`apps/desktop/README.md`](apps/desktop/README.md)。
目录移动后 `tauri.conf.json` 的 `frontendDist: "../src"` 仍然成立，开发/打包流程不变。

---

## apps/web — 官网

Next.js（App Router）+ Tailwind CSS v4 + [next-intl](https://next-intl.dev/) 中英双语营销站。

### 本地开发

```bash
pnpm web:dev
# http://localhost:3000        → 英文（默认语言，无前缀）
# http://localhost:3000/zh     → 中文
```

### 配置（环境变量）

复制 `apps/web/.env.example` 为 `.env.local` 并按需填写。关键项：

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 规范域名，用于 canonical / hreflang / sitemap / OG |
| `NEXT_PUBLIC_DOWNLOAD_URL` | **首页「Download for macOS」的真实下载链接**（待填） |
| `NEXT_PUBLIC_GITHUB_URL` | GitHub 仓库地址 |
| `NEXT_PUBLIC_SANITY_*` | Sanity CMS（可选，见下） |

> ⚠️ 下载链接现在是占位默认值（GitHub Releases），把真实 `.dmg` / Release 链接填进 `NEXT_PUBLIC_DOWNLOAD_URL` 即可。

### SEO

官网已内置一整套 SEO：

- **多语言**：`/`（en）与 `/zh`，自动生成 `hreflang` + `x-default` + canonical
- **结构化数据（JSON-LD）**：`SoftwareApplication`、`FAQPage`、`WebSite`
- **动态 OG 图**：`next/og` 按语言生成 1200×630（`/opengraph-image`、`/zh/opengraph-image`）
- `sitemap.xml`、`robots.txt`、`manifest.webmanifest`、favicon 全部自动生成
- 语义化标签、`lang` 属性、skip-to-content、`prefers-reduced-motion`

源码位置：SEO 工具 [`src/lib/seo.ts`](apps/web/src/lib/seo.ts)、元数据在 [`src/app/[locale]/layout.tsx`](apps/web/src/app/[locale]/layout.tsx)。

### Headless CMS（Sanity）——已留好口子

用例区块（「Use cases」）的内容走一个抽象层 [`src/lib/cms`](apps/web/src/lib/cms)：

- **未配置 Sanity** → 直接用本地 demo 数据 [`demo-data.ts`](apps/web/src/lib/cms/demo-data.ts)（含 Claude Code 远程编程等场景），站点照常构建运行。
- **配置了 Sanity**（设置 `NEXT_PUBLIC_SANITY_PROJECT_ID`）→ 自动改走 GROQ 查询 [`queries.ts`](apps/web/src/lib/cms/queries.ts)；查询为空或失败仍回退到 demo 数据，页面永远有内容。

接入步骤：

1. 新建 Sanity 项目，拿到 `projectId`，填进 `.env.local`
2. 把 [`apps/web/sanity/schema.example.ts`](apps/web/sanity/schema.example.ts) 的 `useCase` schema 放进你的 Sanity Studio
3. 多语言建议用文档级 i18n 插件（`@sanity/document-internationalization`，给文档加 `language` 字段，正好对应查询）
4. 发布几条 `useCase`，官网即自动从 demo 切换到 CMS 内容

数据形状定义在 [`src/lib/cms/types.ts`](apps/web/src/lib/cms/types.ts)，与 schema、查询三者保持一致即可。

### 部署

任意支持 Next.js 的平台（Vercel / Node）。记得把上面的环境变量配上，尤其是 `NEXT_PUBLIC_SITE_URL` 和 `NEXT_PUBLIC_DOWNLOAD_URL`。
