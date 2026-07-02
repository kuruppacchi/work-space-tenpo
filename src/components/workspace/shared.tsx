"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

type WorkspaceSelection = {
  storeId: string;
  issueId?: string;
  causeId?: string;
  measureId?: string;
  taskId?: string;
  step?: "issue" | "cause" | "measure" | "task";
};

type PaneAccent = "issue" | "cause" | "measure" | "task";

export type { PaneAccent };

type PaneAccentStyles = {
  header: string;
  title: string;
  paneBg: string;
  listBg: string;
  selected: string;
  unselected: string;
  formPanel: string;
  formLabel: string;
  newButton: string;
};

const PANE_ACCENT_STYLES: Record<PaneAccent, PaneAccentStyles> = {
  issue: {
    header: "border-t-[4px] border-t-blue-600 bg-blue-100",
    title: "text-blue-950",
    paneBg: "bg-slate-50",
    listBg: "bg-slate-200/60",
    selected:
      "border-l-4 border-l-blue-600 border-blue-300 bg-blue-50 text-blue-950 shadow-md ring-2 ring-blue-200/80",
    unselected:
      "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-blue-200 hover:bg-blue-50/40",
    formPanel: "border-2 border-blue-200 border-l-4 border-l-blue-600 bg-white shadow-md",
    formLabel: "text-blue-800",
    newButton:
      "rounded-md bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400",
  },
  cause: {
    header: "border-t-[4px] border-t-amber-500 bg-amber-100",
    title: "text-amber-950",
    paneBg: "bg-stone-50",
    listBg: "bg-stone-200/60",
    selected:
      "border-l-4 border-l-amber-500 border-amber-300 bg-amber-50 text-amber-950 shadow-md ring-2 ring-amber-200/80",
    unselected:
      "border border-stone-200 bg-white text-stone-800 shadow-sm hover:border-amber-200 hover:bg-amber-50/40",
    formPanel: "border-2 border-amber-200 border-l-4 border-l-amber-500 bg-white shadow-md",
    formLabel: "text-amber-900",
    newButton:
      "rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400",
  },
  measure: {
    header: "border-t-[4px] border-t-emerald-600 bg-emerald-100",
    title: "text-emerald-950",
    paneBg: "bg-zinc-50",
    listBg: "bg-zinc-200/60",
    selected:
      "border-l-4 border-l-emerald-600 border-emerald-300 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-200/80",
    unselected:
      "border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:border-emerald-200 hover:bg-emerald-50/40",
    formPanel: "border-2 border-emerald-200 border-l-4 border-l-emerald-600 bg-white shadow-md",
    formLabel: "text-emerald-900",
    newButton:
      "rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400",
  },
  task: {
    header: "border-t-[4px] border-t-violet-600 bg-violet-100",
    title: "text-violet-950",
    paneBg: "bg-neutral-50",
    listBg: "bg-neutral-200/60",
    selected:
      "border-l-4 border-l-violet-600 border-violet-300 bg-violet-50 text-violet-950 shadow-md ring-2 ring-violet-200/80",
    unselected:
      "border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:border-violet-200 hover:bg-violet-50/40",
    formPanel: "border-2 border-violet-200 border-l-4 border-l-violet-600 bg-white shadow-md",
    formLabel: "text-violet-900",
    newButton:
      "rounded-md bg-violet-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400",
  },
};

export function newButtonClass(accent: PaneAccent) {
  return PANE_ACCENT_STYLES[accent].newButton;
}

export function useWorkspaceNavigation() {
  const router = useRouter();

  function navigate(selection: WorkspaceSelection) {
    const params = new URLSearchParams();
    params.set("storeId", selection.storeId);
    if (selection.issueId) params.set("issueId", selection.issueId);
    if (selection.causeId) params.set("causeId", selection.causeId);
    if (selection.measureId) params.set("measureId", selection.measureId);
    if (selection.taskId) params.set("taskId", selection.taskId);
    if (selection.step) params.set("step", selection.step);
    router.push(`/?${params.toString()}`);
  }

  function selectIssue(storeId: string, issueId?: string) {
    navigate({ storeId, issueId, step: "issue" });
  }

  function selectCause(storeId: string, issueId: string, causeId?: string) {
    navigate({ storeId, issueId, causeId, step: "cause" });
  }

  function selectMeasure(
    storeId: string,
    issueId: string,
    causeId: string,
    measureId?: string,
  ) {
    navigate({ storeId, issueId, causeId, measureId, step: "measure" });
  }

  function selectTask(
    storeId: string,
    issueId: string,
    causeId: string,
    measureId: string,
    taskId?: string,
  ) {
    navigate({
      storeId,
      issueId,
      causeId,
      measureId,
      taskId,
      step: "task",
    });
  }

  function goToStep(
    step: "issue" | "cause" | "measure" | "task",
    current: WorkspaceSelection,
  ) {
    navigate({ ...current, step });
  }

  return {
    navigate,
    selectIssue,
    selectCause,
    selectMeasure,
    selectTask,
    goToStep,
  };
}

export function EmptyPaneMessage({
  children,
  accent,
}: {
  children: ReactNode;
  accent?: PaneAccent;
}) {
  const styles = accent ? PANE_ACCENT_STYLES[accent] : null;
  return (
    <div
      className={`flex flex-1 items-center justify-center p-6 text-center ${styles?.listBg ?? "bg-zinc-100"}`}
    >
      <p className="max-w-xs text-sm leading-relaxed text-zinc-600">{children}</p>
    </div>
  );
}

export function PaneShell({
  title,
  action,
  loading,
  accent,
  children,
}: {
  title: string;
  action?: ReactNode;
  loading?: boolean;
  accent?: PaneAccent;
  children: ReactNode;
}) {
  const accentStyle = accent ? PANE_ACCENT_STYLES[accent] : null;

  return (
    <section
      className={`relative flex min-h-0 flex-1 flex-col border-r border-zinc-300 last:border-r-0 ${accentStyle?.paneBg ?? "bg-white"}`}
    >
      <div
        className={`flex items-center justify-between border-b border-zinc-300 px-4 py-3 ${
          accentStyle?.header ?? "border-t-[4px] border-t-zinc-400 bg-zinc-100"
        }`}
      >
        <h2
          className={`text-sm font-bold tracking-tight ${accentStyle?.title ?? "text-zinc-900"}`}
        >
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-zinc-500 animate-pulse">更新中…</span>
          )}
          {action}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </section>
  );
}

export function ItemList({
  items,
  selectedId,
  onSelect,
  renderLabel,
  renderMeta,
  accent = "issue",
  formContent,
  isNewSelected = false,
  emptyMessage,
}: {
  items: { id: string }[];
  selectedId?: string;
  onSelect: (id: string) => void;
  renderLabel: (item: { id: string }) => string;
  renderMeta?: (item: { id: string }) => ReactNode;
  accent?: PaneAccent;
  formContent?: ReactNode;
  isNewSelected?: boolean;
  emptyMessage?: ReactNode;
}) {
  const accentStyle = PANE_ACCENT_STYLES[accent];
  const selectedRef = useRef<HTMLLIElement>(null);
  const hasSelection = isNewSelected || !!selectedId;

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId, isNewSelected]);

  if (items.length === 0 && !hasSelection && emptyMessage) {
    return <EmptyPaneMessage accent={accent}>{emptyMessage}</EmptyPaneMessage>;
  }

  return (
    <ul
      className={`min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5 ${accentStyle.listBg}`}
    >
      {isNewSelected && formContent && (
        <li ref={selectedRef}>
          <ListItemCard
            accent={accent}
            cardKey="new"
            isNew
            label="新規作成"
            formContent={formContent}
          />
        </li>
      )}
      {items.length === 0 && !isNewSelected ? (
        <li className="rounded-lg border-2 border-dashed border-zinc-300 bg-white px-3 py-6 text-center text-xs font-medium text-zinc-500">
          項目がありません
        </li>
      ) : (
        items.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <li key={item.id} ref={isSelected ? selectedRef : undefined}>
              <ListItemCard
                accent={accent}
                cardKey={item.id}
                selected={isSelected}
                onSelect={() => onSelect(item.id)}
                label={renderLabel(item)}
                meta={renderMeta?.(item)}
                formContent={isSelected ? formContent : undefined}
              />
            </li>
          );
        })
      )}
    </ul>
  );
}

function ListItemCard({
  accent,
  cardKey,
  selected = true,
  isNew = false,
  onSelect,
  label,
  meta,
  formContent,
}: {
  accent: PaneAccent;
  cardKey: string;
  selected?: boolean;
  isNew?: boolean;
  onSelect?: () => void;
  label: ReactNode;
  meta?: ReactNode;
  formContent?: ReactNode;
}) {
  const accentStyle = PANE_ACCENT_STYLES[accent];
  const [formOpen, setFormOpen] = useState(isNew);
  const hasForm = !!formContent;

  useEffect(() => {
    setFormOpen(isNew);
  }, [cardKey, isNew]);

  const cardClass = isNew || selected ? accentStyle.selected : accentStyle.unselected;

  if (!hasForm) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${cardClass}`}
      >
        <div className="leading-snug">{label}</div>
        {meta}
      </button>
    );
  }

  return (
    <div className={`rounded-lg px-3 py-2.5 text-sm ${cardClass}`}>
      {isNew ? (
        <div className="font-bold leading-snug">{label}</div>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className="w-full text-left transition"
        >
          <div className="font-bold leading-snug">{label}</div>
          {meta}
        </button>
      )}

      <div className="mt-2 flex justify-end border-t border-black/10 pt-2">
        <button
          type="button"
          onClick={() => setFormOpen((prev) => !prev)}
          className="rounded-md border border-zinc-300 bg-white/80 px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-white"
          aria-expanded={formOpen}
        >
          {formOpen ? "入力欄を閉じる ▲" : "入力欄を開く ▼"}
        </button>
      </div>

      {formOpen && (
        <div className="mt-3 space-y-3 border-t border-black/10 pt-3">
          {formContent}
        </div>
      )}
    </div>
  );
}

/** @deprecated Use ItemList with formContent for inline editing */
export function FormPanel({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 p-3">
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          詳細編集
        </p>
        {children}
      </div>
    </div>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 border-t-2 border-zinc-200 pt-3">
      {children}
    </div>
  );
}

export function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-zinc-800">{label}</span>
      {children}
    </label>
  );
}

export const inputClassName =
  "w-full rounded-lg border-2 border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-zinc-100 disabled:text-zinc-500";

export const textareaClassName = `${inputClassName} min-h-[88px] resize-y`;

/** 長文入力向け（説明・根拠・メモなど） */
export const textareaLargeClassName = `${inputClassName} min-h-[152px] resize-y`;

export const buttonPrimaryClassName =
  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50";

export const buttonSecondaryClassName =
  "rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300/50 disabled:opacity-50";

export const buttonDangerClassName =
  "rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50";

export const buttonNewClassName =
  "rounded-md bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700";

export const cardClassName =
  "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm";

export const cardTitleClassName = "text-base font-semibold text-zinc-900";

export const cardDescriptionClassName = "mt-1 text-sm text-zinc-500";

export const listContainerClassName =
  "divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm";
