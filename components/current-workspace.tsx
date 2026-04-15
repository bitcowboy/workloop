"use client";

import type { TimerPhase, TimerStatus } from "@/lib/types";

type CurrentWorkspaceProps = {
  currentTask: string;
  clarifiedTask: string;
  timerLabel: string;
  timerPhase: TimerPhase;
  timerStatus: TimerStatus;
  timerDurationLabel: string;
  interruptionCount: number;
  clarifyLoading: boolean;
  aiError: string | null;
  onTaskChange: (value: string) => void;
  onClarifyTask: () => Promise<void>;
  onAcceptClarifiedTask: () => void;
  onResetClarifiedTask: () => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onEndTimer: () => void;
  onLogInterruption: () => void;
  onAdjustDuration: (direction: "decrease" | "increase") => void;
};

export function CurrentWorkspace({
  currentTask,
  clarifiedTask,
  timerLabel,
  timerPhase,
  timerStatus,
  timerDurationLabel,
  interruptionCount,
  clarifyLoading,
  aiError,
  onTaskChange,
  onClarifyTask,
  onAcceptClarifiedTask,
  onResetClarifiedTask,
  onStartTimer,
  onPauseTimer,
  onEndTimer,
  onLogInterruption,
  onAdjustDuration,
}: CurrentWorkspaceProps) {
  const isRunning = timerStatus === "running";
  const isPaused = timerStatus === "paused";
  const isReview = timerStatus === "review";
  const isFocus = timerPhase === "focus";
  const canAdjustDuration = isFocus && timerStatus === "idle";

  return (
    <section className="panel workspace-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">当前工作区</p>
          <h2>{isFocus ? "让这一轮只服务于一个清晰目标" : "进入短休息，给下一轮留出余量"}</h2>
        </div>
        <span className={`status-pill ${timerStatus}`}>{labelStatus(timerPhase, timerStatus)}</span>
      </div>

      {aiError ? <div className="error-banner">{aiError}</div> : null}

      <label className="field">
        <span>当前任务</span>
        <textarea
          value={currentTask}
          rows={3}
          onChange={(event) => onTaskChange(event.target.value)}
          placeholder="例如：排查 SSO 回调失败原因"
          disabled={isRunning || isReview}
        />
      </label>

      <div className="clarify-card">
        <div>
          <span className="context-label">AI 澄清后的本轮目标</span>
          <strong>{clarifiedTask || "还没有生成，建议开始前先让 AI 帮你收敛目标。"}</strong>
        </div>
        <div className="row-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClarifyTask}
            disabled={!currentTask.trim() || clarifyLoading || isRunning || isReview}
          >
            {clarifyLoading ? "生成中..." : "AI 澄清任务"}
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={onAcceptClarifiedTask}
            disabled={!clarifiedTask.trim() || isRunning || isReview}
          >
            接受改写
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={onResetClarifiedTask}
            disabled={!clarifiedTask.trim() || isRunning || isReview}
          >
            保留原文
          </button>
        </div>
      </div>

      <div className="timer-shell">
        <div className="timer-meta">
          <span>{isFocus ? "专注倒计时" : "休息倒计时"}</span>
          <strong>{timerLabel}</strong>
        </div>
        {isFocus ? (
          <div className="duration-control">
            <span className="context-label">本轮时长</span>
            <div className="duration-control-main">
              <button
                type="button"
                className="ghost-button duration-button"
                onClick={() => onAdjustDuration("decrease")}
                disabled={!canAdjustDuration}
              >
                - 5 分钟
              </button>
              <strong>{timerDurationLabel}</strong>
              <button
                type="button"
                className="ghost-button duration-button"
                onClick={() => onAdjustDuration("increase")}
                disabled={!canAdjustDuration}
              >
                + 5 分钟
              </button>
            </div>
            <span className="muted-text">
              默认 25 分钟，只有在开始前可以按 5 分钟调整。
            </span>
          </div>
        ) : null}
        <div className="timer-actions">
          {!isRunning ? (
            <button type="button" className="primary-button" onClick={onStartTimer} disabled={!currentTask.trim() && isFocus}>
              {isPaused ? "继续" : isFocus ? "开始番茄" : "开始休息"}
            </button>
          ) : (
            <button type="button" className="secondary-button" onClick={onPauseTimer}>
              暂停
            </button>
          )}

          <button
            type="button"
            className="ghost-button"
            onClick={onEndTimer}
            disabled={timerStatus === "idle" || isReview}
          >
            {isFocus ? "结束本轮" : "跳过休息"}
          </button>

          <button
            type="button"
            className="ghost-button"
            onClick={onLogInterruption}
            disabled={!isFocus || (!isRunning && !isPaused)}
          >
            记录中断 ({interruptionCount})
          </button>
        </div>
      </div>
    </section>
  );
}

function labelStatus(phase: TimerPhase, status: TimerStatus) {
  if (status === "review") {
    return "待复盘";
  }

  if (status === "paused") {
    return phase === "focus" ? "专注暂停" : "休息暂停";
  }

  if (status === "running") {
    return phase === "focus" ? "专注中" : "休息中";
  }

  return phase === "focus" ? "待开始" : "待休息";
}
