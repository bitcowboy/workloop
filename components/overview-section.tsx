type OverviewSectionProps = {
  todayLabel: string;
  goalCount: number;
  completedPomodoros: number;
  focusedMinutes: number;
};

export function OverviewSection({
  todayLabel,
  goalCount,
  completedPomodoros,
  focusedMinutes,
}: OverviewSectionProps) {
  const stats = [
    { label: "今日目标数", value: goalCount.toString().padStart(2, "0") },
    { label: "已完成番茄", value: completedPomodoros.toString().padStart(2, "0") },
    { label: "累计专注时长", value: `${focusedMinutes} min` },
  ];

  return (
    <section className="panel hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Workloop Dashboard</p>
        <h1>围绕当前任务进入专注，并自然留下推进记录。</h1>
        <p className="hero-subtitle">
          让番茄钟服务于真实进展，而不是只做时长打卡。今天是 {todayLabel}。
        </p>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
