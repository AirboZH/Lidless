import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// These are locale-aware wrappers around the routing components / hooks. Use them
// instead of next/link and next/navigation so links automatically carry the correct locale prefix.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
