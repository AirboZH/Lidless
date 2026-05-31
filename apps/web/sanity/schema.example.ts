/**
 * Sanity 内容模型参考 —— 这是「口子」的另一端。
 *
 * 这个文件不会被官网构建引用，纯粹是给你接 Sanity 时的样例：
 * 在你的 Sanity Studio 项目里把它放进 schema，字段形状要和
 * apps/web/src/lib/cms/types.ts、queries.ts 对得上即可。
 *
 * 多语言建议用文档级 i18n 插件 @sanity/document-internationalization，
 * 它会给每个文档加一个 `language` 字段（"en" / "zh"），正好对应 queries.ts 里的查询。
 *
 * 接入步骤大致是：
 *   1. 新建 Sanity 项目，拿到 projectId
 *   2. 在官网环境里设 NEXT_PUBLIC_SANITY_PROJECT_ID（见 .env.example）
 *   3. 把下面的 schema 放进 Studio，发布几条 useCase
 *   4. 官网会自动从 demo 数据切换到 Sanity 内容
 */
import { defineField, defineType } from "sanity";

export const useCase = defineType({
  name: "useCase",
  title: "Use case",
  type: "document",
  fields: [
    defineField({
      name: "tag",
      title: "Tag（小标签，如 Claude Code）",
      type: "string",
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(280),
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      // 与 apps/web/src/lib/cms/types.ts 的 UseCaseIconKey 保持一致
      options: {
        list: [
          { title: "Terminal", value: "terminal" },
          { title: "Remote", value: "remote" },
          { title: "Download", value: "download" },
          { title: "Build", value: "build" },
          { title: "Media", value: "media" },
          { title: "Moon", value: "moon" },
        ],
        layout: "dropdown",
      },
      initialValue: "moon",
    }),
    defineField({
      name: "order",
      title: "Order（排序，越小越靠前）",
      type: "number",
      initialValue: 100,
    }),
    // `language` 字段由 @sanity/document-internationalization 自动管理，
    // 无需手写；这里仅作说明。
  ],
  orderings: [
    {
      title: "Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "tag" },
  },
});

export const schemaTypes = [useCase];
