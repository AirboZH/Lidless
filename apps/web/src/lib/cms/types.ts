/** 一个图标 key，对应前端 <UseCaseIcon> 里渲染的图形 */
export type UseCaseIconKey =
  | "terminal"
  | "remote"
  | "download"
  | "build"
  | "media"
  | "moon";

/** 用例（落地页「Use cases」区块的一条），CMS 与 demo 数据共用同一形状 */
export interface UseCase {
  /** 稳定 id（Sanity 为 _id；demo 为手写 slug） */
  id: string;
  /** 上方的小标签，例如 "Claude Code" */
  tag: string;
  title: string;
  description: string;
  icon: UseCaseIconKey;
}
