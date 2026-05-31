import type { Locale } from "@/i18n/routing";
import { isSanityConfigured, sanityClient } from "./client";
import { demoUseCases } from "./demo-data";
import { useCasesQuery } from "./queries";
import type { UseCase } from "./types";

export type { UseCase, UseCaseIconKey } from "./types";
export { isSanityConfigured } from "./client";

/**
 * 取落地页用例。
 * - 未配置 Sanity → 直接返回 demo 数据
 * - 配置了 Sanity → 查询；查询为空或报错时仍回退到 demo 数据，保证页面永远有内容
 */
export async function getUseCases(locale: Locale): Promise<UseCase[]> {
  const fallback = demoUseCases[locale] ?? demoUseCases.en;

  if (!isSanityConfigured || !sanityClient) {
    return fallback;
  }

  try {
    const data = await sanityClient.fetch<UseCase[]>(
      useCasesQuery,
      { locale },
      // 增量静态再生：每小时回源一次，编辑发布后最多 1 小时见效
      { next: { revalidate: 3600 } },
    );
    return data && data.length > 0 ? data : fallback;
  } catch (error) {
    console.warn(
      "[cms] Sanity 查询失败，回退到 demo 用例数据：",
      error,
    );
    return fallback;
  }
}
