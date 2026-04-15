import { NextRequest, NextResponse } from "next/server";
import { createJsonCompletion } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      records?: Array<{
        task?: string;
        clarifiedTask?: string;
        resultStatus?: string;
        interruptionCount?: number;
        digest?: {
          progress?: string;
          blocker?: string;
          nextStep?: string;
        };
      }>;
    };

    const records = body.records ?? [];

    if (records.length === 0) {
      return NextResponse.json(
        { error: "Missing records." },
        { status: 400 },
      );
    }

    const recordSummary = records
      .map((record, index) =>
        [
          `记录 ${index + 1}`,
          `任务：${record.task || "未命名任务"}`,
          `本轮目标：${record.clarifiedTask || record.task || "无"}`,
          `结果：${record.resultStatus || "unknown"}`,
          `进展：${record.digest?.progress || "无"}`,
          `阻塞：${record.digest?.blocker || "无"}`,
          `下一步：${record.digest?.nextStep || "无"}`,
          `中断次数：${record.interruptionCount ?? 0}`,
        ].join("\n"),
      )
      .join("\n\n");

    const payload = await createJsonCompletion(
      [
        "你是 Workloop 的 AI 日总结助手。",
        "请根据用户今天的番茄记录，生成清晰的推进摘要。",
        '只返回 JSON，格式为 {"dailySummary":{"summary":"...","inProgress":["..."],"blocked":["..."],"recommendedFirstStep":"..."}}。',
        "输出要适合收工复盘阅读，避免空话和套话。",
      ].join("\n"),
      `以下是用户今天的全部番茄记录：\n\n${recordSummary}`,
    );

    const dailySummary = payload.dailySummary as Record<string, unknown> | undefined;

    return NextResponse.json({
      dailySummary: {
        summary: String(dailySummary?.summary || "今天已经完成多轮专注。"),
        inProgress: toStringArray(dailySummary?.inProgress),
        blocked: toStringArray(dailySummary?.blocked),
        recommendedFirstStep: String(
          dailySummary?.recommendedFirstStep || "从当前最重要的未完成事项开始。",
        ),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate daily summary.",
      },
      { status: 500 },
    );
  }
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}
