/**
 * Site-level config lives here so it can be changed in one place.
 * Anything that needs a real value comes from an environment variable with a
 * placeholder default, so the build never fails just because a value is missing.
 */

// Canonical site origin (used for canonical / hreflang / sitemap / OG). Set NEXT_PUBLIC_SITE_URL when deploying.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lidless.cc"
).replace(/\/$/, "");

// The real download link the primary CTA "Download for macOS" points to (.dmg / Release page).
// TODO: set NEXT_PUBLIC_DOWNLOAD_URL to the real link before deploying.
export const downloadUrl =
  process.env.NEXT_PUBLIC_DOWNLOAD_URL ??
  "https://github.com/AirboZH/Lidless/releases/latest";

// Platform-specific download links. Default to the releases page (which lists every
// asset); point the env vars straight at the .dmg / .msi once those direct links exist.
export const macDownloadUrl =
  process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL ?? downloadUrl;

export const windowsDownloadUrl =
  process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL ?? downloadUrl;

// GitHub repository URL (secondary CTA / footer).
export const githubUrl =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/AirboZH/Lidless";

// Public feedback / feature-request board (Fider).
export const feedbackUrl =
  process.env.NEXT_PUBLIC_FEEDBACK_URL ?? "https://lidless.fider.io/";

export const siteConfig = {
  name: "Lidless",
  url: siteUrl,
  downloadUrl,
  macDownloadUrl,
  windowsDownloadUrl,
  githubUrl,
  feedbackUrl,
  // Current released version and system requirement (shown near the download button)
  appVersion: "0.1.0",
  minMacOS: "12.0",
  // Social / contact (used by OG and JSON-LD)
  twitter: process.env.NEXT_PUBLIC_TWITTER ?? "",
  email: "hi@lidless.cc",
} as const;

export type SiteConfig = typeof siteConfig;
