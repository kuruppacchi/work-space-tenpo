"use client";

import { CausesPane } from "./causes-pane";
import { IssuesPane } from "./issues-pane";
import { MeasuresPane } from "./measures-pane";
import { TasksPane } from "./tasks-pane";
import type { PaneAccent } from "./shared";
import { useWorkspace } from "./workspace-context";

const STEPS: { key: PaneAccent; label: string; active: string; idle: string }[] = [
  {
    key: "issue",
    label: "課題",
    active: "border-b-[3px] border-blue-600 bg-blue-100 text-blue-950",
    idle: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800",
  },
  {
    key: "cause",
    label: "原因",
    active: "border-b-[3px] border-amber-500 bg-amber-100 text-amber-950",
    idle: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800",
  },
  {
    key: "measure",
    label: "対策",
    active: "border-b-[3px] border-emerald-600 bg-emerald-100 text-emerald-950",
    idle: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800",
  },
  {
    key: "task",
    label: "タスク",
    active: "border-b-[3px] border-violet-600 bg-violet-100 text-violet-950",
    idle: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800",
  },
];

export function WorkspaceDesktop() {
  const { loadingPane } = useWorkspace();

  return (
    <div className="relative flex min-h-0 flex-1 divide-x-2 divide-zinc-300 bg-zinc-200">
      <IssuesPane />
      <CausesPane loading={loadingPane === "causes" || loadingPane === "all"} />
      <MeasuresPane
        loading={loadingPane === "measures" || loadingPane === "all"}
      />
      <TasksPane loading={loadingPane === "tasks" || loadingPane === "all"} />
    </div>
  );
}

export function WorkspaceMobile() {
  const { storeName, selection, goToStep, loadingPane } = useWorkspace();
  const step = selection.step ?? "issue";

  const breadcrumb = [storeName].filter(Boolean).join(" > ");

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-zinc-200">
      {breadcrumb && (
        <div className="border-b border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm">
          {breadcrumb}
        </div>
      )}
      <div className="flex border-b border-zinc-300 bg-zinc-100">
        {STEPS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => goToStep(s.key)}
            className={`flex-1 px-2 py-3 text-xs font-bold transition ${
              step === s.key ? s.active : s.idle
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {step === "issue" && <IssuesPane />}
        {step === "cause" && (
          <CausesPane
            loading={loadingPane === "causes" || loadingPane === "all"}
          />
        )}
        {step === "measure" && (
          <MeasuresPane
            loading={loadingPane === "measures" || loadingPane === "all"}
          />
        )}
        {step === "task" && (
          <TasksPane
            loading={loadingPane === "tasks" || loadingPane === "all"}
            compact
          />
        )}
      </div>
    </div>
  );
}

export function WorkspaceResponsive() {
  return (
    <>
      <div className="hidden min-h-0 flex-1 lg:flex">
        <WorkspaceDesktop />
      </div>
      <div className="flex min-h-0 flex-1 lg:hidden">
        <WorkspaceMobile />
      </div>
    </>
  );
}
