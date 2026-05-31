import { notFound } from "next/navigation";

// Any unmatched subpath under a known locale (and any unknown locale prefix) falls through to the localized 404
export default function CatchAllPage() {
  notFound();
}
