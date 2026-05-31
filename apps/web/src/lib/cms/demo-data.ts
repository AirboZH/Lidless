import type { Locale } from "@/i18n/routing";
import type { UseCase } from "./types";

/**
 * 用例的兜底数据。Sanity 未配置（或查询失败）时使用。
 * 接入 CMS 后，这些就是「内容长什么样」的参考样例。
 */
export const demoUseCases: Record<Locale, UseCase[]> = {
  en: [
    {
      id: "demo-claude-code",
      tag: "Claude Code",
      title: "Walk away while Claude Code keeps coding",
      description:
        "Kick off a long agentic run, then lock your Mac and step out. Lidless keeps the system awake so the task finishes — instead of stalling the moment the lid closes.",
      icon: "terminal",
    },
    {
      id: "demo-remote",
      tag: "Remote access",
      title: "Reconnect from anywhere",
      description:
        "SSH, RustDesk, VNC or Screen Sharing back to your machine. The Mac stays online and reachable while locked, so your tunnel doesn't drop.",
      icon: "remote",
    },
    {
      id: "demo-builds",
      tag: "Long builds & CI",
      title: "Don't babysit the build",
      description:
        "Compiles, Docker images, local CI and test suites that take an hour keep running. Lock the screen, save power on the display, finish the job.",
      icon: "build",
    },
    {
      id: "demo-downloads",
      tag: "Big transfers",
      title: "Let large downloads finish",
      description:
        "Model weights, datasets, container layers, OS images — multi-gigabyte transfers complete overnight without the system dozing off mid-download.",
      icon: "download",
    },
    {
      id: "demo-media",
      tag: "Render & encode",
      title: "Overnight renders and exports",
      description:
        "Video encodes, audio batches and 3D renders run to completion while you sleep. Wake up to finished files, not a paused job.",
      icon: "media",
    },
    {
      id: "demo-online",
      tag: "Always reachable",
      title: "Stay present for your team",
      description:
        "Keep chat, collaboration and self-hosted services responsive on a locked Mac — no \"away\" status the moment you step out for coffee.",
      icon: "moon",
    },
  ],
  zh: [
    {
      id: "demo-claude-code",
      tag: "Claude Code",
      title: "人走开，Claude Code 继续写代码",
      description:
        "丢给它一个跑很久的 agentic 任务，然后锁屏离开。Lidless 让系统保持唤醒，任务一路跑完——而不是合上盖子就卡住。",
      icon: "terminal",
    },
    {
      id: "demo-remote",
      tag: "远程回连",
      title: "随时从别处连回来",
      description:
        "SSH、RustDesk、VNC 或屏幕共享回连你的机器。锁屏期间 Mac 保持在线可达，隧道不掉线。",
      icon: "remote",
    },
    {
      id: "demo-builds",
      tag: "长编译 / CI",
      title: "不用守着编译进度条",
      description:
        "动辄一小时的编译、Docker 构建、本地 CI 和测试套件继续跑。锁屏、让屏幕熄掉省电，活儿照样干完。",
      icon: "build",
    },
    {
      id: "demo-downloads",
      tag: "大文件传输",
      title: "让大下载安心跑完",
      description:
        "模型权重、数据集、镜像层、系统镜像——几十 GB 的传输整夜完成，不会下到一半系统就睡过去。",
      icon: "download",
    },
    {
      id: "demo-media",
      tag: "渲染 / 转码",
      title: "整夜渲染与导出",
      description:
        "视频转码、音频批处理、3D 渲染在你睡觉时跑到结束。醒来收到的是成品文件，而不是被暂停的任务。",
      icon: "media",
    },
    {
      id: "demo-online",
      tag: "始终在线",
      title: "为团队保持在场",
      description:
        "锁屏的 Mac 上让 IM、协作工具和自建服务保持响应——不会刚去倒杯咖啡就被标成「离开」。",
      icon: "moon",
    },
  ],
};
