import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all paths, but skip api, Next's internal static assets, and files with an extension (images, sitemap.xml, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
