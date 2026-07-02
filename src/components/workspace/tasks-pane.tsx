"use client";

import { useEffect, useState, useTransition } from "react";
import type { Task } from "@/lib/db/schema";
import { createTask, deleteTask, updateTask } from "@/lib/actions/tasks";
import { formatDate, TASK_STATUS_LABELS, toDateInputValue } from "@/lib/labels";
import {
  EmptyPaneMessage,
  FormActions,
  FormField,
  ItemList,
  PaneShell,
  buttonDangerClassName,
  newButtonClass,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  inputClassName,
  textareaClassName,
  textareaLargeClassName,
} from "./shared";
import { useWorkspace } from "./workspace-context";

export function TasksPane({
  loading = false,
  compact = false,
}: {
  loading?: boolean;
  compact?: boolean;
}) {
  const {
    storeId,
    tasks,
    assignees,
    selection,
    selectTask,
    upsertTask,
    removeTask,
  } = useWorkspace();
  const issueId = selection.issueId;
  const causeId = selection.causeId;
  const measureId = selection.measureId;
  const selectedTaskId = selection.taskId;
  const [isPending, startTransition] = useTransition();
  const selected = tasks.find((t) => t.id === selectedTaskId);
  const [form, setForm] = useState<{
    title?: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    status?: Task["status"];
    completionCondition?: string;
    memo?: string;
    googleDriveUrl?: string;
  }>({});

  function loadForm(task?: (typeof tasks)[number]) {
    if (!task) {
      setForm({
        title: "",
        description: "",
        assigneeId: "",
        dueDate: "",
        status: "todo",
        completionCondition: "",
        memo: "",
        googleDriveUrl: "",
      });
      return;
    }
    setForm({
      title: task.title,
      description: task.description ?? "",
      assigneeId: task.assigneeId ?? "",
      dueDate: toDateInputValue(task.dueDate),
      status: task.status,
      completionCondition: task.completionCondition ?? "",
      memo: task.memo ?? "",
      googleDriveUrl: task.googleDriveUrl ?? "",
    });
  }

  useEffect(() => {
    if (selectedTaskId === "new") {
      loadForm();
      return;
    }
    if (selectedTaskId) {
      loadForm(tasks.find((t) => t.id === selectedTaskId));
    }
  }, [selectedTaskId, tasks]);

  if (
    !issueId ||
    issueId === "new" ||
    !causeId ||
    causeId === "new" ||
    !measureId ||
    measureId === "new"
  ) {
    return (
      <PaneShell title="実行タスク">
        <EmptyPaneMessage accent="task">対策案ペインで対策を選択してください</EmptyPaneMessage>
      </PaneShell>
    );
  }

  const activeIssueId = issueId;
  const activeCauseId = causeId;
  const activeMeasureId = measureId;

  function toTaskWithAssignee(task: Task) {
    return {
      ...task,
      assigneeName:
        assignees.find((a) => a.id === task.assigneeId)?.name ?? null,
    };
  }

  function handleNew() {
    loadForm();
    selectTask("new");
  }

  function handleSelect(id: string) {
    loadForm(tasks.find((t) => t.id === id));
    selectTask(id);
  }

  function handleSave(continueAdding = false) {
    if (!form.title?.trim()) return;
    startTransition(async () => {
      const payload = {
        title: form.title!.trim(),
        description: form.description || undefined,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
        status: (form.status ?? "todo") as Task["status"],
        completionCondition: form.completionCondition || undefined,
        memo: form.memo || undefined,
        googleDriveUrl: form.googleDriveUrl || undefined,
      };

      if (selectedTaskId && selectedTaskId !== "new") {
        const updated = await updateTask(selectedTaskId, storeId, payload);
        upsertTask(toTaskWithAssignee(updated));
        if (continueAdding) {
          loadForm();
          selectTask("new");
        }
      } else {
        const created = await createTask(activeMeasureId, storeId, payload);
        upsertTask(toTaskWithAssignee(created));
        if (continueAdding) {
          loadForm();
          selectTask("new");
        } else {
          selectTask(created.id);
        }
      }
    });
  }

  function handleDelete() {
    if (!selectedTaskId || selectedTaskId === "new") return;
    if (!window.confirm("このタスクを削除しますか？")) return;
    startTransition(async () => {
      await deleteTask(selectedTaskId, storeId);
      const remaining = tasks.filter((t) => t.id !== selectedTaskId);
      removeTask(selectedTaskId);
      selectTask(remaining[0]?.id);
    });
  }

  const showForm = selectedTaskId === "new" || selected;

  const formContent = showForm ? (
    <>
      <FormField label="タスク名">
        <input
          className={inputClassName}
          value={form.title ?? ""}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </FormField>
      {!compact && (
        <FormField label="タスク内容">
          <textarea
            className={textareaLargeClassName}
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>
      )}
      <div className="grid grid-cols-2 gap-2">
        <FormField label="担当者">
          <select
            className={inputClassName}
            value={form.assigneeId ?? ""}
            onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
          >
            <option value="">未設定</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="期限">
          <input
            type="date"
            className={inputClassName}
            value={form.dueDate ?? ""}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </FormField>
      </div>
      <FormField label="ステータス">
        <select
          className={inputClassName}
          value={form.status ?? "todo"}
          onChange={(e) =>
            setForm({
              ...form,
              status: e.target.value as Task["status"],
            })
          }
        >
          {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </FormField>
      {!compact && (
        <>
          <FormField label="完了条件">
            <textarea
              className={textareaLargeClassName}
              value={form.completionCondition ?? ""}
              onChange={(e) =>
                setForm({ ...form, completionCondition: e.target.value })
              }
            />
          </FormField>
          <FormField label="メモ">
            <textarea
              className={textareaLargeClassName}
              value={form.memo ?? ""}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
            />
          </FormField>
          <FormField label="Google Drive リンク">
            <input
              className={inputClassName}
              value={form.googleDriveUrl ?? ""}
              onChange={(e) =>
                setForm({ ...form, googleDriveUrl: e.target.value })
              }
              placeholder="https://"
            />
          </FormField>
        </>
      )}
      <FormActions>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleSave(false)}
          className={buttonPrimaryClassName}
        >
          保存
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleSave(true)}
          className={buttonSecondaryClassName}
        >
          保存して続けて追加
        </button>
        {selectedTaskId && selectedTaskId !== "new" && (
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
      accent="task"
      title={`実行タスク${tasks.length > 0 ? ` (${tasks.length})` : ""}`}
      loading={loading}
      action={
        <button type="button" onClick={handleNew} className={newButtonClass("task")}>
          + 新規
        </button>
      }
    >
      <ItemList
        accent="task"
        items={tasks}
        selectedId={selectedTaskId === "new" ? undefined : selectedTaskId}
        isNewSelected={selectedTaskId === "new"}
        formContent={formContent}
        emptyMessage="タスクを選択するか、新規作成してください"
        onSelect={handleSelect}
        renderLabel={(item) =>
          tasks.find((t) => t.id === item.id)?.title ?? ""
        }
        renderMeta={(item) => {
          const task = tasks.find((t) => t.id === item.id);
          if (!task) return null;
          return (
            <div className="mt-0.5 text-xs text-zinc-500">
              {TASK_STATUS_LABELS[task.status]}
              {task.assigneeName ? ` · ${task.assigneeName}` : ""}
              {task.dueDate ? ` · ${formatDate(task.dueDate)}` : ""}
            </div>
          );
        }}
      />
    </PaneShell>
  );
}
