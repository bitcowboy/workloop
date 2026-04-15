"use client";

import { useState } from "react";
import type { Goal } from "@/lib/types";

type GoalsSectionProps = {
  goals: Goal[];
  currentTask: string;
  onAddGoal: (value: string) => void;
  onUpdateGoal: (goalId: string, value: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onUseGoalAsTask: (value: string) => void;
};

export function GoalsSection({
  goals,
  currentTask,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onUseGoalAsTask,
}: GoalsSectionProps) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">今日目标</p>
          <h2>维护 1-3 个今日锚点</h2>
        </div>
        <span className="muted-text">{goals.length}/3</span>
      </div>

      <div className="inline-form">
        <input
          value={draft}
          maxLength={60}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="例如：完成登录问题排查"
        />
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            const value = draft.trim();
            if (!value || goals.length >= 3) {
              return;
            }

            onAddGoal(value);
            setDraft("");
          }}
          disabled={goals.length >= 3}
        >
          新增目标
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state compact">
          <strong>还没有今日目标</strong>
          <p>先设定 1-3 个锚点，能更快进入第一轮专注。</p>
        </div>
      ) : (
        <div className="goal-list">
          {goals.map((goal, index) => {
            const isEditing = editingId === goal.id;
            const isCurrentTask = currentTask.trim() === goal.text.trim();

            return (
              <article key={goal.id} className="goal-card">
                <div className="goal-index">{index + 1}</div>
                <div className="goal-content">
                  {isEditing ? (
                    <input
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                    />
                  ) : (
                    <strong>{goal.text}</strong>
                  )}
                  <span className="muted-text">
                    {isCurrentTask ? "已用作当前任务" : "可快速衍生为本轮任务"}
                  </span>
                </div>

                <div className="goal-actions">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          const value = editingText.trim();
                          if (!value) {
                            return;
                          }

                          onUpdateGoal(goal.id, value);
                          setEditingId(null);
                          setEditingText("");
                        }}
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingText("");
                        }}
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => onUseGoalAsTask(goal.text)}
                      >
                        用作任务
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          setEditingId(goal.id);
                          setEditingText(goal.text);
                        }}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        className="ghost-button danger-button"
                        onClick={() => onDeleteGoal(goal.id)}
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
