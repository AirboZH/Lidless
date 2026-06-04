import type { Locale } from "@/i18n/routing";
import { useCases } from "./use-cases";
import type { UseCase } from "./types";

export type { UseCase, UseCaseIconKey } from "./types";

/**
 * Returns the use cases for the landing page in the given locale.
 * Content lives in ./use-cases.ts — edit that file to change the copy.
 */
export function getUseCases(locale: Locale): UseCase[] {
  return useCases[locale] ?? useCases.en;
}
