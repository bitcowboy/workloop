import {
  type DashboardState,
  type DailySummary,
  type Goal,
  type SessionDigest,
  type TimerPhase,
  type TimerState,
  type TimerStatus,
  type TimelineRecord,
} from "@/lib/types";

export const STORAGE_KEY = "workloop.dashboard.v1";
export const FOCUS_DURATION_SECONDS = 25 * 60;
export const BREAK_DURATION_SECONDS = 5 * 60;
export const TIMER_ADJUST_STEP_SECONDS = 5 * 60;
export const MIN_FOCUS_DURATION_SECONDS = 5 * 60;
export const MAX_FOCUS_DURATION_SECONDS = 60 * 60;

const sampleDigest: SessionDigest = {
  task: "排查 SSO 回调失败原因",
  completion: "部分完成",
  progress: "已将问题缩小到回调参数解析链路，下一步可以直接验证状态校验逻辑。",
  blocker: "暂无明确外部阻塞，主要是需要继续验证。",
  nextStep: "继续检查回调参数解析与状态校验逻辑。",
};

const sampleSummary: DailySummary = {
  summary:
    "今天主要推进了登录链路排查与 PRD 梳理，已经缩小问题范围，并形成了下一轮明确行动点。",
  inProgress: ["登录问题排查", "PRD 目标章节完善"],
  blocked: ["尚未确认回调参数解析是否为唯一根因"],
  recommendedFirstStep: "明天第一轮优先验证回调参数处理链路。",
  updatedAt: new Date().toISOString(),
};

export const sampleGoals: Goal[] = [
  { id: createId(), text: "完成登录问题排查" },
  { id: createId(), text: "改完 PRD 第一版" },
];

export const sampleRecords: TimelineRecord[] = [
  {
    id: createId(),
    task: "排查 SSO 回调失败原因",
    clarifiedTask: "确认 SSO 回调失败是否由参数解析或状态校验导致",
    startedAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    endedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    durationSeconds: FOCUS_DURATION_SECONDS,
    interruptionCount: 1,
    resultStatus: "partial",
    note: "大概定位到了，是回调参数有问题。",
    nextAction: "continue",
    digest: sampleDigest,
  },
];

export const sampleState: DashboardState = {
  goals: sampleGoals,
  currentTask: "继续完善 Dashboard 交互原型",
  clarifiedTask: "完成 Workloop Dashboard 的主流程交互并检查空状态",
  records: sampleRecords,
  dailySummary: sampleSummary,
  timer: {
    phase: "focus",
    status: "idle",
    totalSeconds: FOCUS_DURATION_SECONDS,
    remainingSeconds: FOCUS_DURATION_SECONDS,
    startedAt: null,
    interruptionCount: 0,
    lastTickedAt: null,
  },
};

export function createInitialState(): DashboardState {
  return {
    goals: [],
    currentTask: "",
    clarifiedTask: "",
    records: [],
    dailySummary: null,
    timer: {
      phase: "focus",
      status: "idle",
      totalSeconds: FOCUS_DURATION_SECONDS,
      remainingSeconds: FOCUS_DURATION_SECONDS,
      startedAt: null,
      interruptionCount: 0,
      lastTickedAt: null,
    },
  };
}

export function loadState(): DashboardState {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialState();
  }

  try {
    const parsed = JSON.parse(raw) as DashboardState;
    const nextState: DashboardState = {
      ...createInitialState(),
      ...parsed,
      timer: hydrateTimer(parsed.timer),
    };

    return nextState;
  } catch {
    return createInitialState();
  }
}

export function saveState(state: DashboardState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetToSampleState() {
  saveState(sampleState);
  return sampleState;
}

export function clearStoredState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
}

function hydrateTimer(timer: DashboardState["timer"] | undefined): TimerState {
  if (!timer) {
    return createInitialState().timer;
  }

  const merged: TimerState = {
    ...createInitialState().timer,
    ...timer,
    phase: normalizePhase(timer.phase),
    status: normalizeStatus(timer.status),
    totalSeconds: normalizeTotalSeconds(
      timer.totalSeconds,
      normalizePhase(timer.phase),
      timer.remainingSeconds,
    ),
  };

  if (merged.status !== "running" || !merged.lastTickedAt) {
    return merged;
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(merged.lastTickedAt).getTime()) / 1000),
  );

  return {
    ...merged,
    status: "paused",
    remainingSeconds: Math.max(0, merged.remainingSeconds - elapsedSeconds),
    lastTickedAt: new Date().toISOString(),
  };
}

function normalizePhase(phase: unknown): TimerPhase {
  return phase === "break" ? "break" : "focus";
}

function normalizeStatus(status: unknown): TimerStatus {
  if (
    status === "idle" ||
    status === "running" ||
    status === "paused" ||
    status === "review"
  ) {
    return status;
  }

  return "idle";
}

function normalizeTotalSeconds(
  totalSeconds: unknown,
  phase: TimerPhase,
  remainingSeconds: unknown,
) {
  if (typeof totalSeconds === "number" && Number.isFinite(totalSeconds) && totalSeconds > 0) {
    return totalSeconds;
  }

  if (
    typeof remainingSeconds === "number" &&
    Number.isFinite(remainingSeconds) &&
    remainingSeconds > 0
  ) {
    return remainingSeconds;
  }

  return phase === "break" ? BREAK_DURATION_SECONDS : FOCUS_DURATION_SECONDS;
}
