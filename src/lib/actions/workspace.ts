"use server";

import { getStoreAssignees } from "@/lib/actions/assignees";
import { getCauses } from "@/lib/actions/causes";
import { getIssues } from "@/lib/actions/issues";
import { getMeasures } from "@/lib/actions/measures";
import { getTasks } from "@/lib/actions/tasks";
import { assertStoreAccess } from "@/lib/permissions";

export type WorkspaceSelectionInput = {
  issueId?: string;
  causeId?: string;
  measureId?: string;
  taskId?: string;
};

export type ResolvedWorkspaceSelection = {
  issueId?: string;
  causeId?: string;
  measureId?: string;
  taskId?: string;
};

function isNewSelection(selection: WorkspaceSelectionInput) {
  return (
    selection.issueId === "new" ||
    selection.causeId === "new" ||
    selection.measureId === "new" ||
    selection.taskId === "new"
  );
}

export async function fetchWorkspaceData(
  storeId: string,
  selection: WorkspaceSelectionInput,
  options?: { autoCascade?: boolean },
) {
  await assertStoreAccess(storeId);

  const autoCascade = options?.autoCascade ?? true;
  const allowCascade = autoCascade && !isNewSelection(selection);

  const [issues, assignees] = await Promise.all([
    getIssues(storeId),
    getStoreAssignees(storeId),
  ]);

  let issueId =
    selection.issueId && selection.issueId !== "new"
      ? selection.issueId
      : undefined;

  if (!issueId && allowCascade && issues.length > 0) {
    issueId = issues[0].id;
  }

  const causes =
    issueId && issues.some((i) => i.id === issueId)
      ? await getCauses(issueId, storeId)
      : [];

  let causeId =
    selection.causeId &&
    selection.causeId !== "new" &&
    causes.some((c) => c.id === selection.causeId)
      ? selection.causeId
      : undefined;

  if (allowCascade && issueId && !causeId && causes.length > 0) {
    causeId = causes[0].id;
  }

  const measures = causeId ? await getMeasures(causeId, storeId) : [];

  let measureId =
    selection.measureId &&
    selection.measureId !== "new" &&
    measures.some((m) => m.id === selection.measureId)
      ? selection.measureId
      : undefined;

  if (allowCascade && causeId && !measureId && measures.length > 0) {
    measureId = measures[0].id;
  }

  const tasks = measureId ? await getTasks(measureId, storeId) : [];

  let taskId =
    selection.taskId &&
    selection.taskId !== "new" &&
    tasks.some((t) => t.id === selection.taskId)
      ? selection.taskId
      : undefined;

  if (allowCascade && measureId && !taskId && tasks.length > 0) {
    taskId = tasks[0].id;
  }

  return {
    issues,
    causes,
    measures,
    tasks,
    assignees,
    resolvedSelection: {
      issueId:
        selection.issueId === "new" ? "new" : (issueId ?? selection.issueId),
      causeId: selection.causeId === "new" ? "new" : causeId,
      measureId: selection.measureId === "new" ? "new" : measureId,
      taskId: selection.taskId === "new" ? "new" : taskId,
    } satisfies ResolvedWorkspaceSelection,
  };
}
