"use client";

import { useState } from "react";
import type { NextAction, ResultStatus } from "@/lib/types";

type ReviewValues = {
  resultStatus: ResultStatus;
  note: string;
  nextAction: NextAction;
};

type ReviewModalProps = {
  isOpen: boolean;
  task: string;
  clarifiedTask: string;
  interruptionCount: number;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: ReviewValues) => Promise<void>;
};

const resultOptions: Array<{ value: ResultStatus; label: string }> = [
  { value: "completed", label: "完成" },
  { value: "partial", label: "部分完成" },
  { value: "incomplete", label: "未完成" },
  { value: "blocked", label: "卡住" },
];

const nextActionOptions: Array<{ value: NextAction; label: string }> = [
  { value: "continue", label: "继续当前任务" },
  { value: "switch", label: "切换其他任务" },
  { value: "later", label: "稍后再做" },
];

export function ReviewModal({
  isOpen,
  task,
  clarifiedTask,
  interruptionCount,
  submitting,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const [resultStatus, setResultStatus] = useState<ResultStatus>("partial");
  const [note, setNote] = useState("");
  const [nextAction, setNextAction] = useState<NextAction>("continue");

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">番茄结束复盘</p>
            <h2 id="review-title">用 20 秒留下这一轮推进记录</h2>
          </div>
          <button
            className="ghost-button"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            关闭
          </button>
        </div>

        <div className="modal-body">
          <div className="review-context">
            <div>
              <span className="context-label">当前任务</span>
              <strong>{task}</strong>
            </div>
            <div>
              <span className="context-label">AI 本轮目标</span>
              <strong>{clarifiedTask || "尚未澄清，沿用原任务"}</strong>
            </div>
            <div>
              <span className="context-label">中断次数</span>
              <strong>{interruptionCount}</strong>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>结果状态</span>
              <select
                value={resultStatus}
                onChange={(event) =>
                  setResultStatus(event.target.value as ResultStatus)
                }
              >
                {resultOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>下一步动作</span>
              <select
                value={nextAction}
                onChange={(event) =>
                  setNextAction(event.target.value as NextAction)
                }
              >
                {nextActionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>一句话说明</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="例如：已经定位到回调参数有问题，还需要继续验证。"
            />
          </label>
        </div>

        <div className="modal-footer">
          <button
            className="secondary-button"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            稍后再说
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => onSubmit({ resultStatus, note, nextAction })}
            disabled={submitting}
          >
            {submitting ? "AI 整理中..." : "提交并生成记录"}
          </button>
        </div>
      </div>
    </div>
  );
}
