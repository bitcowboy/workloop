import { NextRequest, NextResponse } from "next/server";
import { createJsonCompletion } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      task?: string;
      goals?: Array<{ text?: string }>;
    };

    const task = body.task?.trim();

    if (!task) {
      return NextResponse.json(
        { error: "Missing task." },
        { status: 400 },
      );
    }

    const goals = (body.goals ?? [])
      .map((goal) => goal.text?.trim())
      .filter(Boolean)
      .join("；");

    const payload = await createJsonCompletion(
      [
        "你是 Workloop 的嵌入式 AI 助手。",
        "你的任务是把模糊的当前任务改写为更适合单轮番茄执行的行动目标。",
        "输出必须简短、明确、可执行，不要无端扩写。",
        '只返回 JSON，格式为 {"clarifiedTask":"..."}。',
      ].join("\n"),
      `用户原始任务：${task}\n今日目标：${goals || "无"}\n请给出一条更清晰的本轮目标。`,
    );

    return NextResponse.json({
      clarifiedTask: String(payload.clarifiedTask || task),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to clarify task.",
      },
      { status: 500 },
    );
  }
}
