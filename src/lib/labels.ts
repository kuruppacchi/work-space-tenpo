export const ISSUE_PRIORITY_LABELS = {
  high: "高",
  medium: "中",
  low: "低",
} as const;

export const ISSUE_STATUS_LABELS = {
  open: "未着手",
  in_progress: "進行中",
  resolved: "解決済",
  archived: "アーカイブ",
} as const;

export const CAUSE_CATEGORY_LABELS = {
  people: "人",
  material: "物",
  method: "方法",
  information: "情報",
  environment: "環境",
  other: "その他",
} as const;

export const CONFIDENCE_LABELS = {
  high: "高",
  medium: "中",
  low: "低",
} as const;

export const EFFECT_LEVEL_LABELS = {
  high: "高",
  medium: "中",
  low: "低",
} as const;

export const MEASURE_STATUS_LABELS = {
  draft: "未検討",
  adopted: "採用",
  pending: "保留",
  rejected: "却下",
} as const;

export const TASK_STATUS_LABELS = {
  todo: "未着手",
  doing: "進行中",
  waiting_review: "確認待ち",
  done: "完了",
} as const;

export const STORE_ROLE_LABELS = {
  manager: "責任者",
  viewer: "閲覧",
} as const;

export const GLOBAL_ROLE_LABELS = {
  admin: "管理者",
  user: "一般",
} as const;

export function formatDate(date: Date | string | null) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ja-JP");
}

export function toDateInputValue(date: Date | string | null) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}
