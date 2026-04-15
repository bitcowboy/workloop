import { NextRequest, NextResponse } from "next/server";
import { createJsonCompletion } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      task?: string;
      clarifiedTask?: string;
      resultStatus?: string;
      note?: string;
      nextAction?: string;
      interruptionCount?: number;
    };

    if (!body.task?.trim()) {
      return NextResponse.json(
        { error: "Missing task." },
        { status: 400 },
      );
    }

    const payload = await createJsonCompletion(
      [
        "你是 Workloop 的 AI 单轮整理助手。",
        "请把一轮番茄复盘整理成结构化记录，语言自然但要精炼。",
        '只返回 JSON，格式为 {"digest":{"task":"...","completion":"...","progress":"...","blocker":"...","nextStep":"..."}}。',
        "如果用户没有写很多信息，也要基于上下文给出尽量可信的简洁总结。",
      ].join("\n"),
      [
        `当前任务：${body.task}`,
        `AI 本轮目标：${body.clarifiedTask || body.task}`,
        `结果状态：${body.resultStatus || "partial"}`,
        `一句话说明：${body.note?.trim() || "无"}`,
        `下一步动作：${body.nextAction || "continue"}`,
        `中断次数：${body.interruptionCount ?? 0}`,
      ].join("\n"),
    );

    const digest = payload.digest as Record<string, unknown> | undefined;

    return NextResponse.json({
      digest: {
        task: String(digest?.task || body.task),
        completion: String(digest?.completion || body.resultStatus || "部分完成"),
        progress: String(digest?.progress || body.note || "本轮已结束。"),
        blocker: String(digest?.blocker || "暂无明显阻塞。"),
        nextStep: String(digest?.nextStep || "继续当前任务。"),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate session digest.",
      },
      { status: 500 },
    );
  }
}
