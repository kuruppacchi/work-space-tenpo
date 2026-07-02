"use client";

import { useEffect, useState, useTransition } from "react";
import type { Cause } from "@/lib/db/schema";
import {
  createCause,
  deleteCause,
  updateCause,
} from "@/lib/actions/causes";
import {
  CAUSE_CATEGORY_LABELS,
  CONFIDENCE_LABELS,
} from "@/lib/labels";
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

export function CausesPane({ loading = false }: { loading?: boolean }) {
  const {
    storeId,
    causes,
    selection,
    selectCause,
    upsertCause,
    removeCause,
  } = useWorkspace();
  const issueId = selection.issueId;
  const selectedCauseId = selection.causeId;
  const [isPending, startTransition] = useTransition();
  const selected = causes.find((c) => c.id === selectedCauseId);
  const [form, setForm] = useState<Partial<Cause>>({});

  function loadForm(cause?: Cause) {
    if (!cause) {
      setForm({
        title: "",
        description: "",
        evidence: "",
        category: "other",
        confidence: "medium",
      });
      return;
    }
    setForm(cause);
  }

  useEffect(() => {
    if (selectedCauseId === "new") {
      loadForm();
      return;
    }
    if (selectedCauseId) {
      loadForm(causes.find((c) => c.id === selectedCauseId));
    }
  }, [selectedCauseId, causes]);

  if (!issueId || issueId === "new") {
    return (
      <PaneShell title="原因分析">
        <EmptyPaneMessage accent="cause">左のペインで課題を選択してください</EmptyPaneMessage>
      </PaneShell>
    );
  }

  const activeIssueId = issueId;

  function handleNew() {
    loadForm();
    selectCause("new");
  }

  function handleSelect(id: string) {
    loadForm(causes.find((c) => c.id === id));
    selectCause(id);
  }

  function handleSave(continueAdding = false) {
    if (!form.title?.trim()) return;
    startTransition(async () => {
      const payload = {
        title: form.title!.trim(),
        category: (form.category ?? "other") as Cause["category"],
        description: form.description ?? undefined,
        evidence: form.evidence ?? undefined,
        confidence: (form.confidence ?? "medium") as Cause["confidence"],
      };

      if (selectedCauseId && selectedCauseId !== "new") {
        const updated = await updateCause(selectedCauseId, storeId, payload);
        upsertCause(updated);
        if (continueAdding) {
          loadForm();
          selectCause("new");
        }
      } else {
        const created = await createCause(activeIssueId, storeId, payload);
        upsertCause(created);
        if (continueAdding) {
          loadForm();
          selectCause("new");
        } else {
          selectCause(created.id);
        }
      }
    });
  }

  function handleDelete() {
    if (!selectedCauseId || selectedCauseId === "new") return;
    if (
      !window.confirm(
        "この原因と紐づく対策・タスクもすべて削除されます。続行しますか？",
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteCause(selectedCauseId, storeId);
      const remaining = causes.filter((c) => c.id !== selectedCauseId);
      removeCause(selectedCauseId);
      selectCause(remaining[0]?.id ?? "new");
    });
  }

  const showForm = selectedCauseId === "new" || selected;

  const formContent = showForm ? (
    <>
      <FormField label="原因タイトル">
        <input
          className={inputClassName}
          value={form.title ?? ""}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="原因カテゴリ">
          <select
            className={inputClassName}
            value={form.category ?? "other"}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value as Cause["category"],
              })
            }
          >
            {Object.entries(CAUSE_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="確度">
          <select
            className={inputClassName}
            value={form.confidence ?? "medium"}
            onChange={(e) =>
              setForm({
                ...form,
                confidence: e.target.value as Cause["confidence"],
              })
            }
          >
            {Object.entries(CONFIDENCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="内容">
        <textarea
          className={textareaLargeClassName}
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormField>
      <FormField label="根拠">
        <textarea
          className={textareaLargeClassName}
          value={form.evidence ?? ""}
          onChange={(e) => setForm({ ...form, evidence: e.target.value })}
        />
      </FormField>
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
        {selectedCauseId && selectedCauseId !== "new" && (
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
      accent="cause"
      title={`原因分析${causes.length > 0 ? ` (${causes.length})` : ""}`}
      loading={loading}
      action={
        <button type="button" onClick={handleNew} className={newButtonClass("cause")}>
          + 新規
        </button>
      }
    >
      <ItemList
        accent="cause"
        items={causes}
        selectedId={selectedCauseId === "new" ? undefined : selectedCauseId}
        isNewSelected={selectedCauseId === "new"}
        formContent={formContent}
        emptyMessage="原因を選択するか、新規作成してください"
        onSelect={handleSelect}
        renderLabel={(item) =>
          causes.find((c) => c.id === item.id)?.title ?? ""
        }
        renderMeta={(item) => {
          const cause = causes.find((c) => c.id === item.id);
          if (!cause) return null;
          return (
            <div className="mt-0.5 text-xs text-zinc-500">
              {CAUSE_CATEGORY_LABELS[cause.category]} · 確度{" "}
              {CONFIDENCE_LABELS[cause.confidence]}
            </div>
          );
        }}
      />
    </PaneShell>
  );
}
