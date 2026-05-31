import { notFound } from "next/navigation";

// 已知语言下的任意未匹配子路径（以及未知语言前缀）都落到本地化 404
export default function CatchAllPage() {
  notFound();
}
