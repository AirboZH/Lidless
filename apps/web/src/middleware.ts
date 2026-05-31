import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // 匹配所有路径，但跳过 api、Next 内部静态资源，以及带扩展名的文件（图片、sitemap.xml 等）
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
