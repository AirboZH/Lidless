import type { MDXRemoteOptions } from "next-mdx-remote-client/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, {
  type Options as PrettyCodeOptions,
} from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const prettyCodeOptions: PrettyCodeOptions = {
  // Shiki theme used for build-time highlighting (zero client JS). "keepBackground:
  // false" hands the background back to our CSS so code blocks match the brand surface.
  theme: "github-dark-default",
  keepBackground: false,
  defaultLang: "plaintext",
};

/**
 * Shared MDX compile options for every doc (see [...slug]/page.tsx and the docs
 * landing page). All plugins run at build time, so the output is static HTML.
 */
export const mdxOptions: MDXRemoteOptions["mdxOptions"] = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    // Wrap each heading in an anchor link so "#section" deep-links are shareable
    [
      rehypeAutolinkHeadings,
      { behavior: "wrap", properties: { className: ["heading-anchor"] } },
    ],
    [rehypePrettyCode, prettyCodeOptions],
  ],
};
