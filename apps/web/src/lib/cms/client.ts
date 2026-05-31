import { createClient, type SanityClient } from "@sanity/client";

/**
 * Sanity 客户端的「口子」。
 *
 * 设计目标：未配置 Sanity 时整个站点照常构建/运行（用 demo 数据兜底），
 * 一旦在环境里填上 NEXT_PUBLIC_SANITY_PROJECT_ID 就自动切到真实 CMS。
 *
 * 需要的环境变量（见 .env.example）：
 *   NEXT_PUBLIC_SANITY_PROJECT_ID   必填，填了才会启用 Sanity
 *   NEXT_PUBLIC_SANITY_DATASET      可选，默认 "production"
 *   NEXT_PUBLIC_SANITY_API_VERSION  可选，默认锁定一个日期版本
 */
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-10-01";

/** 是否已配置 Sanity。未配置时各处会回退到 demo 数据。 */
export const isSanityConfigured = Boolean(projectId);

export const sanityClient: SanityClient | null = isSanityConfigured
  ? createClient({
      projectId: projectId as string,
      dataset,
      apiVersion,
      // 营销站读公开内容，走 CDN 即可
      useCdn: true,
    })
  : null;
