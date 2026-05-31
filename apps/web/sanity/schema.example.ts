/**
 * Sanity content model reference — this is the other end of the integration point.
 *
 * This file is not referenced by the website build; it's purely a sample for
 * when you wire up Sanity: drop it into the schema of your Sanity Studio
 * project, making sure the field shapes match
 * apps/web/src/lib/cms/types.ts and queries.ts.
 *
 * For multiple languages, we recommend the document-level i18n plugin
 * @sanity/document-internationalization. It adds a `language` field
 * ("en" / "zh") to each document, which lines up exactly with the query in
 * queries.ts.
 *
 * The integration steps roughly are:
 *   1. Create a new Sanity project and get its projectId
 *   2. Set NEXT_PUBLIC_SANITY_PROJECT_ID in the website's environment (see .env.example)
 *   3. Drop the schema below into Studio and publish a few useCase entries
 *   4. The website will automatically switch from demo data to Sanity content
 */
import { defineField, defineType } from "sanity";

export const useCase = defineType({
  name: "useCase",
  title: "Use case",
  type: "document",
  fields: [
    defineField({
      name: "tag",
      title: "Tag (short label, e.g. Claude Code)",
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
      // Keep in sync with UseCaseIconKey in apps/web/src/lib/cms/types.ts
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
      title: "Order (lower comes first)",
      type: "number",
      initialValue: 100,
    }),
    // The `language` field is managed automatically by
    // @sanity/document-internationalization; no need to write it by hand.
    // It's mentioned here only for clarity.
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
