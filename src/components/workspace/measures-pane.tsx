"use client";

import { useEffect, useState, useTransition } from "react";
import type { Measure } from "@/lib/db/schema";
import {
  createMeasure,
  deleteMeasure,
  updateMeasure,
} from "@/lib/actions/measures";
import {
  EFFECT_LEVEL_LABELS,
  MEASURE_STATUS_LABELS,
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

export function MeasuresPane({ loading = false }: { loading?: boolean }) {
  const {
    storeId,
    measures,
    selection,
    selectMeasure,
    reload,
  } = useWorkspace();
  const issueId = selection.issueId;
  const causeId = selection.causeId;
  const selectedMeasureId = selection.measureId;
  const [isPending, startTransition] = useTransition();
  const selected = measures.find((m) => m.id === selectedMeasureId);
  const [form, setForm] = useState<Partial<Measure>>({});

  function loadForm(measure?: Measure) {
    if (!measure) {
      setForm({
        title: "",
        description: "",
        purpose: "",
        targetValue: "",
        targetValueRationale: "",
        expectedEffect: "medium",
        difficulty: "medium",
        status: "draft",
      });
      return;
    }
    setForm(measure);
  }

  useEffect(() => {
    if (selectedMeasureId === "new") {
      loadForm();
      return;
    }
    if (selectedMeasureId) {
      loadForm(measures.find((m) => m.id === selectedMeasureId));
    }
  }, [selectedMeasureId, measures]);

  if (
    !issueId ||
    issueId === "new" ||
    !causeId ||
    causeId === "new"
  ) {
    return (
      <PaneShell title="対策案">
        <EmptyPaneMessage accent="measure">原因分析ペインで原因を選択してください</EmptyPaneMessage>
      </PaneShell>
    );
  }

  const activeIssueId = issueId;
  const activeCauseId = causeId;

  function handleNew() {
    loadForm();
    selectMeasure("new");
  }

  function handleSelect(id: string) {
    loadForm(measures.find((m) => m.id === id));
    selectMeasure(id);
  }

  function handleSave(continueAdding = false) {
    if (!form.title?.trim()) return;
    startTransition(async () => {
      const payload = {
        title: form.title!.trim(),
        description: form.description ?? undefined,
        purpose: form.purpose ?? undefined,
        targetValue: form.targetValue ?? undefined,
        targetValueRationale: form.targetValueRationale ?? undefined,
        expectedEffect: (form.expectedEffect ??
          "medium") as Measure["expectedEffect"],
        difficulty: (form.difficulty ?? "medium") as Measure["difficulty"],
        status: (form.status ?? "draft") as Measure["status"],
      };

      if (selectedMeasureId && selectedMeasureId !== "new") {
        await updateMeasure(selectedMeasureId, storeId, payload);
        reload();
        if (continueAdding) {
          loadForm();
          selectMeasure("new");
        }
      } else {
        const created = await createMeasure(activeCauseId, storeId, payload);
        reload();
        if (continueAdding) {
          loadForm();
          selectMeasure("new");
        } else {
          selectMeasure(created.id);
        }
      }
    });
  }

  function handleDelete() {
    if (!selectedMeasureId || selectedMeasureId === "new") return;
    if (
      !window.confirm(
        "この対策と紐づくタスクもすべて削除されます。続行しますか？",
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteMeasure(selectedMeasureId, storeId);
      reload();
      selectMeasure(measures[0]?.id ?? "new");
    });
  }

  const showForm = selectedMeasureId === "new" || selected;

  const formContent = showForm ? (
    <>
      <FormField label="対策名">
        <input
          className={inputClassName}
          value={form.title ?? ""}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </FormField>
      <FormField label="対策内容">
        <textarea
          className={textareaLargeClassName}
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormField>
      <FormField label="目的">
        <textarea
          className={textareaClassName}
          value={form.purpose ?? ""}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
        />
      </FormField>
      <FormField label="目標数値">
        <input
          className={inputClassName}
          value={form.targetValue ?? ""}
          onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
          placeholder="例: 提供時間12分以内"
        />
      </FormField>
      <FormField label="目標数値設定の根拠">
        <textarea
          className={textareaLargeClassName}
          value={form.targetValueRationale ?? ""}
          onChange={(e) =>
            setForm({ ...form, targetValueRationale: e.target.value })
          }
          placeholder="目標数値を設定した理由・算出方法など"
        />
      </FormField>
      <div className="grid grid-cols-3 gap-2">
        <FormField label="期待効果">
          <select
            className={inputClassName}
            value={form.expectedEffect ?? "medium"}
            onChange={(e) =>
              setForm({
                ...form,
                expectedEffect: e.target.value as Measure["expectedEffect"],
              })
            }
          >
            {Object.entries(EFFECT_LEVEL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="実行難易度">
          <select
            className={inputClassName}
            value={form.difficulty ?? "medium"}
            onChange={(e) =>
              setForm({
                ...form,
                difficulty: e.target.value as Measure["difficulty"],
              })
            }
          >
            {Object.entries(EFFECT_LEVEL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="採用ステータス">
          <select
            className={inputClassName}
            value={form.status ?? "draft"}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as Measure["status"],
              })
            }
          >
            {Object.entries(MEASURE_STATUS_LABELS).map(([k, v]) => (
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
        {selectedMeasureId && selectedMeasureId !== "new" && (
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
      accent="measure"
      title={`対策案${measures.length > 0 ? ` (${measures.length})` : ""}`}
      loading={loading}
      action={
        <button type="button" onClick={handleNew} className={newButtonClass("measure")}>
          + 新規
        </button>
      }
    >
      <ItemList
        accent="measure"
        items={measures}
        selectedId={selectedMeasureId === "new" ? undefined : selectedMeasureId}
        isNewSelected={selectedMeasureId === "new"}
        formContent={formContent}
        emptyMessage="対策を選択するか、新規作成してください"
        onSelect={handleSelect}
        renderLabel={(item) =>
          measures.find((m) => m.id === item.id)?.title ?? ""
        }
        renderMeta={(item) => {
          const measure = measures.find((m) => m.id === item.id);
          if (!measure) return null;
          return (
            <div className="mt-0.5 text-xs text-zinc-500">
              {MEASURE_STATUS_LABELS[measure.status]} · 効果{" "}
              {EFFECT_LEVEL_LABELS[measure.expectedEffect]}
              {measure.targetValue ? ` · 目標 ${measure.targetValue}` : ""}
            </div>
          );
        }}
      />
    </PaneShell>
  );
}
