import type { TimelineRecord } from "@/lib/types";

type TimelineSectionProps = {
  records: TimelineRecord[];
};

export function TimelineSection({ records }: TimelineSectionProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">今日时间轴</p>
          <h2>看到你今天推进了什么，而不只是专注了多久</h2>
        </div>
        <span className="muted-text">{records.length} 条记录</span>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <strong>还没有番茄记录</strong>
          <p>完成第一轮专注并提交复盘后，这里会自动生成结构化时间轴。</p>
        </div>
      ) : (
        <div className="timeline-list">
          {records.map((record) => (
            <article key={record.id} className="timeline-card">
              <div className="timeline-topline">
                <span>{formatTimeRange(record.startedAt, record.endedAt)}</span>
                <span className={`status-tag ${record.resultStatus}`}>
                  {resultLabels[record.resultStatus]}
                </span>
              </div>

              <div className="timeline-main">
                <h3>{record.task}</h3>
                <p>{record.clarifiedTask}</p>
              </div>

              <div className="timeline-summary">
                <div>
                  <span className="context-label">本轮产出</span>
                  <strong>{record.digest.progress}</strong>
                </div>
                <div>
                  <span className="context-label">下一步建议</span>
                  <strong>{record.digest.nextStep}</strong>
                </div>
              </div>

              <div className="timeline-footer">
                <span>中断 {record.interruptionCount} 次</span>
                <span>{Math.round(record.durationSeconds / 60)} min</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

const resultLabels = {
  completed: "完成",
  partial: "部分完成",
  incomplete: "未完成",
  blocked: "卡住",
} as const;

function formatTimeRange(startedAt: string, endedAt: string) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(startedAt))} - ${formatter.format(
    new Date(endedAt),
  )}`;
}
