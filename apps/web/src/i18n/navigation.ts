import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// 这些是已绑定语言路由的包装组件 / hooks，使用它们而不是 next/link、next/navigation，
// 以便链接自动带上正确的语言前缀。
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
