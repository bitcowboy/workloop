"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CurrentWorkspace } from "@/components/current-workspace";
import { DailySummarySection } from "@/components/daily-summary-section";
import { GoalsSection } from "@/components/goals-section";
import { OverviewSection } from "@/components/overview-section";
import { ReviewModal } from "@/components/review-modal";
import { TimelineSection } from "@/components/timeline-section";
import {
  BREAK_DURATION_SECONDS,
  FOCUS_DURATION_SECONDS,
  MAX_FOCUS_DURATION_SECONDS,
  MIN_FOCUS_DURATION_SECONDS,
  TIMER_ADJUST_STEP_SECONDS,
  clearStoredState,
  createId,
  createInitialState,
  loadState,
  resetToSampleState,
  saveState,
} from "@/lib/storage";
import type {
  DailySummary,
  DailySummaryResponse,
  ReviewDraft,
  SessionDigest,
  SessionDigestResponse,
  ResultStatus,
  NextAction,
  TimelineRecord,
  ClarifyTaskResponse,
  DashboardState,
} from "@/lib/types";

type ReviewValues = {
  resultStatus: ResultStatus;
  note: string;
  nextAction: NextAction;
};

export function Dashboard() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [state, setState] = useState<DashboardState>(createInitialState());
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const endFocusSession = useCallback(
    (autoEnded: boolean) => {
      const endedAt = new Date().toISOString();
      const startedAt = state.timer.startedAt ?? endedAt;
      const elapsedSeconds = autoEnded
        ? state.timer.totalSeconds
        : Math.max(60, state.timer.totalSeconds - state.timer.remainingSeconds);

      setReviewDraft({
        startedAt,
        endedAt,
        durationSeconds: elapsedSeconds,
        interruptionCount: state.timer.interruptionCount,
      });
      setIsReviewOpen(true);
      setState((previous) => ({
        ...previous,
        timer: {
          ...previous.timer,
          status: "review",
          remainingSeconds: 0,
          lastTickedAt: endedAt,
        },
      }));
    },
    [
      state.timer.interruptionCount,
      state.timer.remainingSeconds,
      state.timer.startedAt,
      state.timer.totalSeconds,
    ],
  );

  const completeBreak = useCallback(() => {
    setState((previous) => ({
      ...previous,
      timer: {
        phase: "focus",
        status: "idle",
        totalSeconds: FOCUS_DURATION_SECONDS,
        remainingSeconds: FOCUS_DURATION_SECONDS,
        startedAt: null,
        interruptionCount: 0,
        lastTickedAt: null,
      },
    }));
    setNotice("休息结束，下一轮专注已准备好。");
  }, []);

  useEffect(() => {
    setState(loadState());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveState(state);
  }, [isHydrated, state]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!isHydrated || state.timer.status !== "running") {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (state.timer.remainingSeconds <= 1) {
        if (state.timer.phase === "focus") {
          endFocusSession(true);
          return;
        }

        completeBreak();
        return;
      }

      setState((previous) => ({
        ...previous,
        timer: {
          ...previous.timer,
          remainingSeconds: previous.timer.remainingSeconds - 1,
          lastTickedAt: new Date().toISOString(),
        },
      }));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [completeBreak, endFocusSession, isHydrated, state.timer]);

  const completedPomodoros = state.records.length;
  const focusedMinutes = useMemo(
    () =>
      Math.round(
        state.records.reduce((sum, record) => sum + record.durationSeconds, 0) /
          60,
      ),
    [state.records],
  );
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(new Date()),
    [],
  );

  const timerLabel = formatRemainingTime(state.timer.remainingSeconds);
  const timerDurationLabel = `${Math.round(state.timer.totalSeconds / 60)} 分钟`;

  async function handleClarifyTask() {
    if (!state.currentTask.trim()) {
      return;
    }

    setClarifyLoading(true);
    setAiError(null);

    try {
      const response = await fetch("/api/clarify-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: state.currentTask,
          goals: state.goals,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as ClarifyTaskResponse;

      setState((previous) => ({
        ...previous,
        clarifiedTask: payload.clarifiedTask,
      }));
      setNotice("AI 已整理出更清晰的本轮目标。");
    } catch (error) {
      setAiError(
        getReadableError(error, "AI 任务澄清失败，请检查 DeepSeek 配置。"),
      );
    } finally {
      setClarifyLoading(false);
    }
  }

  function handleStartTimer() {
    if (state.timer.phase === "focus" && !state.currentTask.trim()) {
      setAiError("开始番茄前，请先填写当前任务。");
      return;
    }

    const now = new Date().toISOString();
    setAiError(null);
    setState((previous) => ({
      ...previous,
      timer: {
        ...previous.timer,
        status: "running",
        startedAt:
          previous.timer.phase === "focus" && previous.timer.startedAt
            ? previous.timer.startedAt
            : now,
        lastTickedAt: now,
      },
    }));
  }

  function handlePauseTimer() {
    setState((previous) => ({
      ...previous,
      timer: {
        ...previous.timer,
        status: "paused",
        lastTickedAt: new Date().toISOString(),
      },
    }));
  }

  function handleEndTimer() {
    if (state.timer.phase === "focus") {
      endFocusSession(false);
      return;
    }

    completeBreak();
  }

  function handleLogInterruption() {
    setState((previous) => ({
      ...previous,
      timer: {
        ...previous.timer,
        interruptionCount: previous.timer.interruptionCount + 1,
      },
    }));
  }

  async function handleSubmitReview(values: ReviewValues) {
    if (!reviewDraft) {
      return;
    }

    setReviewLoading(true);
    setAiError(null);

    const digest = await createDigest(values);
    const record: TimelineRecord = {
      id: createId(),
      task: state.currentTask,
      clarifiedTask: state.clarifiedTask || state.currentTask,
      startedAt: reviewDraft.startedAt,
      endedAt: reviewDraft.endedAt,
      durationSeconds: reviewDraft.durationSeconds,
      interruptionCount: reviewDraft.interruptionCount,
      resultStatus: values.resultStatus,
      note: values.note.trim(),
      nextAction: values.nextAction,
      digest,
    };

    const nextRecords = [record, ...state.records];
    const nextState: DashboardState = {
      ...state,
      records: nextRecords,
      dailySummary: state.dailySummary,
      currentTask: values.nextAction === "switch" ? "" : state.currentTask,
      clarifiedTask:
        values.nextAction === "continue" ? state.clarifiedTask : "",
      timer: {
        phase: "break",
        status: "idle",
        totalSeconds: BREAK_DURATION_SECONDS,
        remainingSeconds: BREAK_DURATION_SECONDS,
        startedAt: null,
        interruptionCount: 0,
        lastTickedAt: null,
      },
    };

    if (values.nextAction === "later") {
      nextState.currentTask = "";
      nextState.clarifiedTask = "";
    }

    setState(nextState);
    setReviewDraft(null);
    setIsReviewOpen(false);
    setNotice("本轮记录已写入时间轴。");

    try {
      await generateDailySummary(nextRecords);
    } finally {
      setReviewLoading(false);
    }
  }

  async function createDigest(values: ReviewValues): Promise<SessionDigest> {
    try {
      const response = await fetch("/api/session-digest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: state.currentTask,
          clarifiedTask: state.clarifiedTask || state.currentTask,
          resultStatus: values.resultStatus,
          note: values.note,
          nextAction: values.nextAction,
          interruptionCount: reviewDraft?.interruptionCount ?? 0,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as SessionDigestResponse;
      return payload.digest;
    } catch (error) {
      setAiError(
        getReadableError(error, "AI 单轮整理失败，已使用本地摘要保留本轮记录。"),
      );

      return {
        task: state.currentTask,
        completion: translateResultStatus(values.resultStatus),
        progress:
          values.note.trim() || "本轮已结束，但 AI 整理失败，请稍后重试。",
        blocker:
          values.resultStatus === "blocked"
            ? "本轮存在明确阻塞，需要下一轮先解除卡点。"
            : "暂无 AI 阻塞判断。",
        nextStep: deriveNextStep(values.nextAction, state.currentTask),
      };
    }
  }

  async function generateDailySummary(records = state.records) {
    if (records.length === 0) {
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const response = await fetch("/api/daily-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as DailySummaryResponse;

      setState((previous) => ({
        ...previous,
        dailySummary: payload.dailySummary,
      }));
    } catch (error) {
      setSummaryError(
        getReadableError(error, "AI 日总结生成失败，请检查 DeepSeek 配置后重试。"),
      );
    } finally {
      setSummaryLoading(false);
    }
  }

  function handleLoadSample() {
    setState({ ...resetToSampleState() });
    setReviewDraft(null);
    setIsReviewOpen(false);
    setAiError(null);
    setSummaryError(null);
    setNotice("已载入示例数据，方便直接演示。");
  }

  function handleClearWorkspace() {
    clearStoredState();
    setState(createInitialState());
    setReviewDraft(null);
    setIsReviewOpen(false);
    setAiError(null);
    setSummaryError(null);
    setNotice("工作台已清空。");
  }

  if (!isHydrated) {
    return <main className="app-shell loading-shell">正在加载 Workloop...</main>;
  }

  return (
    <main className="app-shell">
      <div className="dashboard-layout">
        <OverviewSection
          todayLabel={todayLabel}
          goalCount={state.goals.length}
          completedPomodoros={completedPomodoros}
          focusedMinutes={focusedMinutes}
        />

        <div className="toolbar">
          <div className="toolbar-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleLoadSample}
            >
              加载示例数据
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleClearWorkspace}
            >
              清空工作台
            </button>
            {state.timer.status === "review" && reviewDraft ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => setIsReviewOpen(true)}
              >
                继续复盘
              </button>
            ) : null}
          </div>
          <span className="muted-text">
            默认节奏：25 分钟专注 + 5 分钟休息，开始前可按 5 分钟调整本轮专注时长
          </span>
        </div>

        {notice ? <div className="notice-banner">{notice}</div> : null}

        <div className="two-column-layout">
          <CurrentWorkspace
            currentTask={state.currentTask}
            clarifiedTask={state.clarifiedTask}
            timerLabel={timerLabel}
            timerPhase={state.timer.phase}
            timerStatus={state.timer.status}
            timerDurationLabel={timerDurationLabel}
            interruptionCount={state.timer.interruptionCount}
            clarifyLoading={clarifyLoading}
            aiError={aiError}
            onTaskChange={(value) =>
              setState((previous) => ({
                ...previous,
                currentTask: value,
              }))
            }
            onClarifyTask={handleClarifyTask}
            onAcceptClarifiedTask={() =>
              setState((previous) => ({
                ...previous,
                currentTask: previous.clarifiedTask || previous.currentTask,
              }))
            }
            onResetClarifiedTask={() =>
              setState((previous) => ({
                ...previous,
                clarifiedTask: "",
              }))
            }
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onEndTimer={handleEndTimer}
            onLogInterruption={handleLogInterruption}
            onAdjustDuration={(direction) =>
              setState((previous) => {
                if (previous.timer.phase !== "focus" || previous.timer.status !== "idle") {
                  return previous;
                }

                const delta =
                  direction === "increase"
                    ? TIMER_ADJUST_STEP_SECONDS
                    : -TIMER_ADJUST_STEP_SECONDS;
                const nextDuration = clamp(
                  previous.timer.totalSeconds + delta,
                  MIN_FOCUS_DURATION_SECONDS,
                  MAX_FOCUS_DURATION_SECONDS,
                );

                return {
                  ...previous,
                  timer: {
                    ...previous.timer,
                    totalSeconds: nextDuration,
                    remainingSeconds: nextDuration,
                  },
                };
              })
            }
          />

          <GoalsSection
            goals={state.goals}
            currentTask={state.currentTask}
            onAddGoal={(value) =>
              setState((previous) => ({
                ...previous,
                goals: [...previous.goals, { id: createId(), text: value }],
              }))
            }
            onUpdateGoal={(goalId, value) =>
              setState((previous) => ({
                ...previous,
                goals: previous.goals.map((goal) =>
                  goal.id === goalId ? { ...goal, text: value } : goal,
                ),
              }))
            }
            onDeleteGoal={(goalId) =>
              setState((previous) => ({
                ...previous,
                goals: previous.goals.filter((goal) => goal.id !== goalId),
              }))
            }
            onUseGoalAsTask={(value) =>
              setState((previous) => ({
                ...previous,
                currentTask: value,
                clarifiedTask: "",
              }))
            }
          />
        </div>

        <TimelineSection records={state.records} />

        <DailySummarySection
          summary={state.dailySummary as DailySummary | null}
          loading={summaryLoading}
          canGenerate={state.records.length > 0}
          error={summaryError}
          onGenerate={() => generateDailySummary()}
        />
      </div>

      <ReviewModal
        key={reviewDraft?.endedAt ?? "review-modal"}
        isOpen={isReviewOpen}
        task={state.currentTask || "未命名任务"}
        clarifiedTask={state.clarifiedTask}
        interruptionCount={reviewDraft?.interruptionCount ?? state.timer.interruptionCount}
        submitting={reviewLoading}
        onClose={() => {
          setIsReviewOpen(false);
          setNotice("复盘尚未提交，可稍后继续补充。");
        }}
        onSubmit={handleSubmitReview}
      />
    </main>
  );
}

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function translateResultStatus(resultStatus: ResultStatus) {
  const labels: Record<ResultStatus, string> = {
    completed: "完成",
    partial: "部分完成",
    incomplete: "未完成",
    blocked: "卡住",
  };

  return labels[resultStatus];
}

function deriveNextStep(nextAction: NextAction, currentTask: string) {
  if (nextAction === "continue") {
    return `继续推进：${currentTask}`;
  }

  if (nextAction === "switch") {
    return "切换到新的任务，并重新澄清下一轮目标。";
  }

  return "先暂存这一轮结果，稍后回到该任务继续推进。";
}

function getReadableError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
