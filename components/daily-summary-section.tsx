import type { DailySummary } from "@/lib/types";

type DailySummarySectionProps = {
  summary: DailySummary | null;
  loading: boolean;
  canGenerate: boolean;
  error: string | null;
  onGenerate: () => Promise<void>;
};

export function DailySummarySection({
  summary,
  loading,
  canGenerate,
  error,
  onGenerate,
}: DailySummarySectionProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">AI 日总结</p>
          <h2>收工前看清楚今天推进了什么，明天先做什么</h2>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={onGenerate}
          disabled={!canGenerate || loading}
        >
          {loading ? "生成中..." : summary ? "刷新总结" : "生成总结"}
        </button>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {!summary ? (
        <div className="empty-state">
          <strong>还没有 AI 日总结</strong>
          <p>当天至少有 1 条番茄记录后即可生成总结和明日建议第一步。</p>
        </div>
      ) : (
        <div className="summary-grid">
          <article className="summary-card summary-wide">
            <span className="context-label">今日推进摘要</span>
            <strong>{summary.summary}</strong>
          </article>

          <article className="summary-card">
            <span className="context-label">仍在推进中</span>
            {summary.inProgress.length === 0 ? (
              <strong>暂无</strong>
            ) : (
              <ul>
                {summary.inProgress.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>

          <article className="summary-card">
            <span className="context-label">当前卡点</span>
            {summary.blocked.length === 0 ? (
              <strong>暂无明显阻塞</strong>
            ) : (
              <ul>
                {summary.blocked.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>

          <article className="summary-card summary-wide">
            <span className="context-label">明日建议第一步</span>
            <strong>{summary.recommendedFirstStep}</strong>
          </article>
        </div>
      )}
    </section>
  );
}
