/**
 * `groq` 只是个恒等模板标签（返回拼好的字符串），本地定义即可，
 * 既能让编辑器把内容识别成 GROQ 高亮，又不必额外引入依赖。
 */
const groq = (strings: TemplateStringsArray, ...values: unknown[]): string =>
  strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");

/**
 * 取某语言下、按 order 排序的全部 useCase。
 *
 * 约定 Sanity 文档里有一个 `language` 字段（"en" / "zh"），
 * 这是 Sanity 文档级 i18n（@sanity/document-internationalization 插件）最常见的形态。
 * 如果你改用字段级 i18n，把这里换成 `coalesce(title[$locale], title.en)` 之类即可。
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
