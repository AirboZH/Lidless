import { createClient, type SanityClient } from "@sanity/client";

/**
 * The integration point for the Sanity client.
 *
 * Design goal: the entire site can still build/run when Sanity is not
 * configured (falling back to demo data), and as soon as
 * NEXT_PUBLIC_SANITY_PROJECT_ID is set in the environment it automatically
 * switches over to the real CMS.
 *
 * Required environment variables (see .env.example):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID   required; Sanity is only enabled when set
 *   NEXT_PUBLIC_SANITY_DATASET      optional, defaults to "production"
 *   NEXT_PUBLIC_SANITY_API_VERSION  optional, defaults to a pinned date version
 */
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-10-01";

/** Whether Sanity is configured. When it isn't, everything falls back to demo data. */
export const isSanityConfigured = Boolean(projectId);

export const sanityClient: SanityClient | null = isSanityConfigured
  ? createClient({
      projectId: projectId as string,
      dataset,
      apiVersion,
      // The marketing site reads public content, so the CDN is fine
      useCdn: true,
    })
  : null;
