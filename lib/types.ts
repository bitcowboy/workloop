export type Goal = {
  id: string;
  text: string;
};

export type ResultStatus = "completed" | "partial" | "incomplete" | "blocked";

export type NextAction = "continue" | "switch" | "later";

export type TimerPhase = "focus" | "break";

export type TimerStatus = "idle" | "running" | "paused" | "review";

export type SessionDigest = {
  task: string;
  completion: string;
  progress: string;
  blocker: string;
  nextStep: string;
};

export type TimelineRecord = {
  id: string;
  task: string;
  clarifiedTask: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  interruptionCount: number;
  resultStatus: ResultStatus;
  note: string;
  nextAction: NextAction;
  digest: SessionDigest;
};

export type DailySummary = {
  summary: string;
  inProgress: string[];
  blocked: string[];
  recommendedFirstStep: string;
  updatedAt: string;
};

export type TimerState = {
  phase: TimerPhase;
  status: TimerStatus;
  totalSeconds: number;
  remainingSeconds: number;
  startedAt: string | null;
  interruptionCount: number;
  lastTickedAt: string | null;
};

export type ReviewDraft = {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  interruptionCount: number;
};

export type DashboardState = {
  goals: Goal[];
  currentTask: string;
  clarifiedTask: string;
  records: TimelineRecord[];
  dailySummary: DailySummary | null;
  timer: TimerState;
};

export type ClarifyTaskResponse = {
  clarifiedTask: string;
};

export type SessionDigestResponse = {
  digest: SessionDigest;
};

export type DailySummaryResponse = {
  dailySummary: DailySummary;
};
