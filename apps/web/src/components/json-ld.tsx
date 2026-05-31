/** 把一段结构化数据渲染成 <script type="application/ld+json">。 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // 数据均来自本地配置/翻译，非用户输入，stringify 后注入是安全的
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
