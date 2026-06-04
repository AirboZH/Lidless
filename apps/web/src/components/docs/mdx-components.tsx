import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";
import { Link } from "@/i18n/navigation";
import { Callout } from "./callout";
import { Pre } from "./pre";
import { Step, Steps } from "./steps";
import { Tab, Tabs } from "./tabs";

/**
 * Renders markdown links: internal ("/…") paths go through the next-intl <Link>
 * so they keep the current locale prefix; everything else is a plain anchor
 * (external links open in a new tab).
 */
function MdxLink({ href = "", ...props }: ComponentPropsWithoutRef<"a">) {
  if (href.startsWith("/")) {
    return <Link href={href} {...props} />;
  }
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    />
  );
}

/**
 * The component map handed to <MDXRemote>. Element overrides (a, pre) restyle
 * default markdown; the capitalized entries are the building blocks authors can
 * drop straight into .mdx (see content/docs/_templates/*).
 */
export const mdxComponents: MDXComponents = {
  a: MdxLink,
  pre: Pre,
  Callout,
  Steps,
  Step,
  Tabs,
  Tab,
};
