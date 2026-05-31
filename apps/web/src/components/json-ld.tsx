/** Renders a block of structured data as a <script type="application/ld+json">. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The data comes entirely from local config/translations, not user input, so injecting it after stringify is safe
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
