/** An icon key, mapping to a shape rendered by the front-end <UseCaseIcon> */
export type UseCaseIconKey =
  | "terminal"
  | "remote"
  | "download"
  | "build"
  | "media"
  | "moon";

/** A use case (one entry in the landing page's "Use cases" section) */
export interface UseCase {
  /** Stable id (a hand-written slug) */
  id: string;
  /** The small label shown above, e.g. "Claude Code" */
  tag: string;
  title: string;
  description: string;
  icon: UseCaseIconKey;
}
