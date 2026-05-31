import type { Locale } from "@/i18n/routing";
import { isSanityConfigured, sanityClient } from "./client";
import { demoUseCases } from "./demo-data";
import { useCasesQuery } from "./queries";
import type { UseCase } from "./types";

export type { UseCase, UseCaseIconKey } from "./types";
export { isSanityConfigured } from "./client";

/**
 * Fetches the use cases for the landing page.
 * - Sanity not configured → return demo data directly
 * - Sanity configured → run the query; if it returns empty or errors, still
 *   fall back to demo data so the page always has content
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
      // Incremental Static Regeneration: revalidate hourly, so edits go live within 1 hour at most
      { next: { revalidate: 3600 } },
    );
    return data && data.length > 0 ? data : fallback;
  } catch (error) {
    console.warn(
      "[cms] Sanity query failed, falling back to demo use-case data:",
      error,
    );
    return fallback;
  }
}
