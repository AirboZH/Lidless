/**
 * `groq` is just an identity template tag (it returns the assembled string),
 * so defining it locally is enough: it lets the editor recognize the content
 * as GROQ for syntax highlighting without pulling in an extra dependency.
 */
const groq = (strings: TemplateStringsArray, ...values: unknown[]): string =>
  strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");

/**
 * Fetches all useCase documents for a given language, sorted by order.
 *
 * This assumes each Sanity document has a `language` field ("en" / "zh"),
 * which is the most common shape for Sanity document-level i18n (the
 * @sanity/document-internationalization plugin). If you switch to field-level
 * i18n, replace this with something like `coalesce(title[$locale], title.en)`.
 */
export const useCasesQuery = groq`
  *[_type == "useCase" && language == $locale] | order(order asc) {
    "id": _id,
    tag,
    title,
    description,
    "icon": coalesce(icon, "moon")
  }
`;
