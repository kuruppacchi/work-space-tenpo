"use client";

import { useEffect, useState, useTransition } from "react";
import type { Issue } from "@/lib/db/schema";
import {
  createIssue,
  deleteIssue,
  updateIssue,
} from "@/lib/actions/issues";
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
} from "@/lib/labels";
import {
  FormActions,
  FormField,
  ItemList,
  PaneShell,
  buttonDangerClassName,
  newButtonClass,
  buttonPrimaryClassName,
  inputClassName,
  textareaClassName,
  textareaLargeClassName,
} from "./shared";
import { useWorkspace } from "./workspace-context";

export function IssuesPane() {
  const { storeId, issues, selection, selectIssue, reload } = useWorkspace();
  const selectedIssueId = selection.issueId;
  const [isPending, startTransition] = useTransition();
  const selected = issues.find((i) => i.id === selectedIssueId);
  const [form, setForm] = useState<Partial<Issue>>({});

  function loadForm(issue?: Issue) {
    if (!issue) {
      setForm({
        title: "",
        description: "",
        currentValue: "",
        targetValue: "",
        impact: "",
        priority: "medium",
        status: "open",
      });
      return;
    }
    setForm(issue);
  }

  useEffect(() => {
    if (selectedIssueId === "new") {
      loadForm();
      return;
    }
    if (selectedIssueId) {
      loadForm(issues.find((i) => i.id === selectedIssueId));
    }
  }, [selectedIssueId, issues]);

  function handleNew() {
    loadForm();
    selectIssue("new");
  }

  function handleSelect(id: string) {
    loadForm(issues.find((i) => i.id === id));
    selectIssue(id);
  }

  function handleSave() {
    if (!form.title?.trim()) return;
    startTransition(async () => {
      const payload = {
        title: form.title!.trim(),
        description: form.description ?? undefined,
        currentValue: form.currentValue ?? undefined,
        targetValue: form.targetValue ?? undefined,
        impact: form.impact ?? undefined,
        priority: (form.priority ?? "medium") as Issue["priority"],
        status: (form.status ?? "open") as Issue["status"],
      };

      if (selectedIssueId && selectedIssueId !== "new") {
        await updateIssue(selectedIssueId, storeId, payload);
        reload();
      } else {
        const created = await createIssue(storeId, payload);
        selectIssue(created.id);
      }
    });
  }

  function handleDelete() {
    if (!selectedIssueId || selectedIssueId === "new") return;
    if (
      !window.confirm(
        "この課題を削除しますか？\n\n紐づく原因・対策・タスクもすべて削除されます。",
      )
    ) {
      return;
    }

    startTransition(async () => {
      await deleteIssue(selectedIssueId, storeId);
      reload();
      selectIssue(issues[0]?.id ?? "new");
    });
  }

  const showForm = selectedIssueId === "new" || selected;

  const formContent = showForm ? (
    <>
      <FormField label="課題名">
        <input
          className={inputClassName}
          value={form.title ?? ""}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </FormField>
      <FormField label="課題内容">
        <textarea
          className={textareaLargeClassName}
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="現状数値">
          <input
            className={inputClassName}
            value={form.currentValue ?? ""}
            onChange={(e) =>
              setForm({ ...form, currentValue: e.target.value })
            }
          />
        </FormField>
        <FormField label="目標数値">
          <input
            className={inputClassName}
            value={form.targetValue ?? ""}
            onChange={(e) =>
              setForm({ ...form, targetValue: e.target.value })
            }
          />
        </FormField>
      </div>
      <FormField label="影響">
        <textarea
          className={textareaLargeClassName}
          value={form.impact ?? ""}
          onChange={(e) => setForm({ ...form, impact: e.target.value })}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="優先度">
          <select
            className={inputClassName}
            value={form.priority ?? "medium"}
            onChange={(e) =>
              setForm({
                ...form,
                priority: e.target.value as Issue["priority"],
              })
            }
          >
            {Object.entries(ISSUE_PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="ステータス">
          <select
            className={inputClassName}
            value={form.status ?? "open"}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as Issue["status"],
              })
            }
          >
            {Object.entries(ISSUE_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormActions>
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className={buttonPrimaryClassName}
        >
          保存
        </button>
        {selectedIssueId && selectedIssueId !== "new" && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className={buttonDangerClassName}
          >
            削除
          </button>
        )}
      </FormActions>
    </>
  ) : undefined;

  return (
    <PaneShell
      accent="issue"
      title={`課題${issues.length > 0 ? ` (${issues.length})` : ""}`}
      action={
        <button type="button" onClick={handleNew} className={newButtonClass("issue")}>
          + 新規
        </button>
      }
    >
      <ItemList
        accent="issue"
        items={issues}
        selectedId={selectedIssueId === "new" ? undefined : selectedIssueId}
        isNewSelected={selectedIssueId === "new"}
        formContent={formContent}
        emptyMessage="課題を選択するか、新規作成してください"
        onSelect={handleSelect}
        renderLabel={(item) =>
          issues.find((i) => i.id === item.id)?.title ?? ""
        }
        renderMeta={(item) => {
          const issue = issues.find((i) => i.id === item.id);
          if (!issue) return null;
          return (
            <div className="mt-0.5 text-xs text-zinc-500">
              {ISSUE_STATUS_LABELS[issue.status]} ·{" "}
              {ISSUE_PRIORITY_LABELS[issue.priority]}
            </div>
          );
        }}
      />
    </PaneShell>
  );
}
