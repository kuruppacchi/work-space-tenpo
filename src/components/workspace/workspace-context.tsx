"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Cause, Issue, Measure, StoreAssignee } from "@/lib/db/schema";
import { fetchWorkspaceData } from "@/lib/actions/workspace";

type TaskWithAssignee = {
  id: string;
  measureId: string;
  storeId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: Date | null;
  status: "todo" | "doing" | "waiting_review" | "done";
  completionCondition: string | null;
  memo: string | null;
  googleDriveUrl: string | null;
  googleCalendarEventId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

type WorkspaceSelection = {
  issueId?: string;
  causeId?: string;
  measureId?: string;
  taskId?: string;
  step?: "issue" | "cause" | "measure" | "task";
};

type WorkspaceContextValue = {
  storeId: string;
  storeName: string;
  issues: Issue[];
  causes: Cause[];
  measures: Measure[];
  tasks: TaskWithAssignee[];
  assignees: StoreAssignee[];
  selection: WorkspaceSelection;
  loadingPane: "causes" | "measures" | "tasks" | "all" | null;
  selectIssue: (issueId?: string) => void;
  selectCause: (causeId?: string) => void;
  selectMeasure: (measureId?: string) => void;
  selectTask: (taskId?: string) => void;
  goToStep: (step: "issue" | "cause" | "measure" | "task") => void;
  reload: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function isNewSelection(selection: WorkspaceSelection) {
  return (
    selection.issueId === "new" ||
    selection.causeId === "new" ||
    selection.measureId === "new" ||
    selection.taskId === "new"
  );
}

function toFetchSelection(selection: WorkspaceSelection): WorkspaceSelection {
  return {
    issueId:
      selection.issueId && selection.issueId !== "new"
        ? selection.issueId
        : undefined,
    causeId:
      selection.causeId && selection.causeId !== "new"
        ? selection.causeId
        : undefined,
    measureId:
      selection.measureId && selection.measureId !== "new"
        ? selection.measureId
        : undefined,
    taskId:
      selection.taskId && selection.taskId !== "new"
        ? selection.taskId
        : undefined,
    step: selection.step,
  };
}

type CacheRef = {
  causes: Map<string, Cause[]>;
  measures: Map<string, Measure[]>;
  tasks: Map<string, TaskWithAssignee[]>;
};

function resolveFromCache(
  selection: WorkspaceSelection,
  cache: CacheRef,
  autoCascade: boolean,
) {
  const issueId =
    selection.issueId && selection.issueId !== "new"
      ? selection.issueId
      : undefined;

  const causes =
    issueId && cache.causes.has(issueId)
      ? (cache.causes.get(issueId) ?? [])
      : [];

  let causeId =
    selection.causeId &&
    selection.causeId !== "new" &&
    causes.some((c) => c.id === selection.causeId)
      ? selection.causeId
      : undefined;

  if (autoCascade && issueId && !causeId && causes.length > 0) {
    causeId = causes[0].id;
  }

  const measures =
    causeId && cache.measures.has(causeId)
      ? (cache.measures.get(causeId) ?? [])
      : [];

  let measureId =
    selection.measureId &&
    selection.measureId !== "new" &&
    measures.some((m) => m.id === selection.measureId)
      ? selection.measureId
      : undefined;

  if (autoCascade && causeId && !measureId && measures.length > 0) {
    measureId = measures[0].id;
  }

  const tasks =
    measureId && cache.tasks.has(measureId)
      ? (cache.tasks.get(measureId) ?? [])
      : [];

  let taskId =
    selection.taskId &&
    selection.taskId !== "new" &&
    tasks.some((t) => t.id === selection.taskId)
      ? selection.taskId
      : undefined;

  if (autoCascade && measureId && !taskId && tasks.length > 0) {
    taskId = tasks[0].id;
  }

  const resolved: WorkspaceSelection = {
    ...selection,
    issueId: issueId ?? selection.issueId,
    causeId,
    measureId,
    taskId,
  };

  if (selection.issueId === "new") resolved.issueId = "new";
  if (selection.causeId === "new") resolved.causeId = "new";
  if (selection.measureId === "new") resolved.measureId = "new";
  if (selection.taskId === "new") resolved.taskId = "new";

  const causesCached = !issueId || issueId === "new" || cache.causes.has(issueId);
  const measuresCached =
    !causeId || causeId === "new" || cache.measures.has(causeId);
  const tasksCached =
    !measureId || measureId === "new" || cache.tasks.has(measureId);

  const complete =
    causesCached &&
    measuresCached &&
    tasksCached &&
    (!autoCascade ||
      !issueId ||
      issueId === "new" ||
      (causes.length === 0
        ? !resolved.causeId
        : Boolean(resolved.causeId)));

  return { resolved, causes, measures, tasks, complete };
}

function applyResolvedData(
  cache: CacheRef,
  data: {
    issueId?: string;
    causeId?: string;
    measureId?: string;
    causes: Cause[];
    measures: Measure[];
    tasks: TaskWithAssignee[];
  },
) {
  if (data.issueId && data.issueId !== "new") {
    cache.causes.set(data.issueId, data.causes);
  }
  if (data.causeId && data.causeId !== "new") {
    cache.measures.set(data.causeId, data.measures);
  }
  if (data.measureId && data.measureId !== "new") {
    cache.tasks.set(data.measureId, data.tasks);
  }
}

function selectionChanged(a: WorkspaceSelection, b: WorkspaceSelection) {
  return (
    a.issueId !== b.issueId ||
    a.causeId !== b.causeId ||
    a.measureId !== b.measureId ||
    a.taskId !== b.taskId
  );
}

function buildUrl(storeId: string, selection: WorkspaceSelection) {
  const params = new URLSearchParams();
  params.set("storeId", storeId);
  if (selection.issueId && selection.issueId !== "new") {
    params.set("issueId", selection.issueId);
  }
  if (selection.causeId && selection.causeId !== "new") {
    params.set("causeId", selection.causeId);
  }
  if (selection.measureId && selection.measureId !== "new") {
    params.set("measureId", selection.measureId);
  }
  if (selection.taskId && selection.taskId !== "new") {
    params.set("taskId", selection.taskId);
  }
  if (selection.step) params.set("step", selection.step);
  return `/?${params.toString()}`;
}

export type WorkspaceProviderProps = {
  storeId: string;
  storeName: string;
  initialIssues: Issue[];
  initialCauses: Cause[];
  initialMeasures: Measure[];
  initialTasks: TaskWithAssignee[];
  initialAssignees: StoreAssignee[];
  initialSelection: WorkspaceSelection;
  children: ReactNode;
};

export function WorkspaceProvider({
  storeId,
  storeName,
  initialIssues,
  initialCauses,
  initialMeasures,
  initialTasks,
  initialAssignees,
  initialSelection,
  children,
}: WorkspaceProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [issues, setIssues] = useState(initialIssues);
  const [causes, setCauses] = useState(initialCauses);
  const [measures, setMeasures] = useState(initialMeasures);
  const [tasks, setTasks] = useState(initialTasks);
  const [assignees, setAssignees] = useState(initialAssignees);
  const [selection, setSelection] = useState(initialSelection);
  const [loadingPane, setLoadingPane] = useState<
    "causes" | "measures" | "tasks" | "all" | null
  >(null);

  const cacheRef = useRef({
    causes: new Map<string, Cause[]>(),
    measures: new Map<string, Measure[]>(),
    tasks: new Map<string, TaskWithAssignee[]>(),
  });
  const isInternalNavRef = useRef(false);
  const selectionRef = useRef(initialSelection);
  const loadGenerationRef = useRef(0);

  selectionRef.current = selection;

  const invalidatePendingLoads = useCallback(() => {
    loadGenerationRef.current += 1;
  }, []);

  const syncUrl = useCallback(
    (next: WorkspaceSelection) => {
      isInternalNavRef.current = true;
      router.replace(buildUrl(storeId, next), { scroll: false });
    },
    [router, storeId],
  );

  const loadData = useCallback(
    (
      nextSelection: WorkspaceSelection,
      pane: "causes" | "measures" | "tasks" | "all",
      autoCascade = true,
    ) => {
      if (isNewSelection(nextSelection)) {
        return;
      }

      const generation = loadGenerationRef.current;
      const allowCascade = autoCascade && !isNewSelection(nextSelection);

      const cached = resolveFromCache(
        nextSelection,
        cacheRef.current,
        allowCascade,
      );

      if (!nextSelection.issueId || nextSelection.issueId === "new") {
        setCauses([]);
        setMeasures([]);
        setTasks([]);
      } else if (cached.complete) {
        setCauses(cached.causes);
        setMeasures(cached.measures);
        setTasks(cached.tasks);

        if (
          generation === loadGenerationRef.current &&
          !isNewSelection(selectionRef.current) &&
          selectionChanged(nextSelection, cached.resolved)
        ) {
          setSelection(cached.resolved);
          syncUrl(cached.resolved);
        }

        setLoadingPane(null);
        return;
      } else {
        setCauses(cached.causes);
        setMeasures(cached.measures);
        setTasks(cached.tasks);
      }

      setLoadingPane(pane);
      startTransition(async () => {
        const data = await fetchWorkspaceData(storeId, nextSelection, {
          autoCascade: allowCascade,
        });

        if (generation !== loadGenerationRef.current) {
          return;
        }

        const resolvedIssueId =
          data.resolvedSelection.issueId &&
          data.resolvedSelection.issueId !== "new"
            ? data.resolvedSelection.issueId
            : undefined;
        const resolvedCauseId = data.resolvedSelection.causeId;
        const resolvedMeasureId = data.resolvedSelection.measureId;

        applyResolvedData(cacheRef.current, {
          issueId: resolvedIssueId,
          causeId: resolvedCauseId,
          measureId: resolvedMeasureId,
          causes: data.causes,
          measures: data.measures,
          tasks: data.tasks,
        });

        setCauses(data.causes);
        setMeasures(data.measures);
        setTasks(data.tasks);

        if (isNewSelection(selectionRef.current)) {
          setLoadingPane(null);
          return;
        }

        setIssues(data.issues);
        setAssignees(data.assignees);

        const resolved: WorkspaceSelection = {
          ...nextSelection,
          ...data.resolvedSelection,
        };

        if (nextSelection.issueId === "new") resolved.issueId = "new";
        if (nextSelection.causeId === "new") resolved.causeId = "new";
        if (nextSelection.measureId === "new") resolved.measureId = "new";
        if (nextSelection.taskId === "new") resolved.taskId = "new";

        if (
          !isNewSelection(selectionRef.current) &&
          selectionChanged(nextSelection, resolved)
        ) {
          setSelection(resolved);
          syncUrl(resolved);
        }

        setLoadingPane(null);
      });
    },
    [storeId, syncUrl],
  );

  const applySelection = useCallback(
    (
      next: WorkspaceSelection,
      pane: "causes" | "measures" | "tasks" | "all",
      autoCascade = true,
    ) => {
      setSelection(next);
      syncUrl(next);
      loadData(next, pane, autoCascade);
    },
    [loadData, syncUrl],
  );

  const selectIssue = useCallback(
    (issueId?: string) => {
      if (issueId === "new") {
        invalidatePendingLoads();
        const next: WorkspaceSelection = {
          issueId: "new",
          step: selection.step ?? "issue",
        };
        setSelection(next);
        setCauses([]);
        setMeasures([]);
        setTasks([]);
        return;
      }

      applySelection(
        { issueId, step: selection.step ?? "issue" },
        "causes",
      );
    },
    [applySelection, selection.step, invalidatePendingLoads],
  );

  const selectCause = useCallback(
    (causeId?: string) => {
      if (causeId === "new") {
        invalidatePendingLoads();
        const next: WorkspaceSelection = {
          issueId: selection.issueId,
          causeId: "new",
          step: selection.step ?? "cause",
        };
        setSelection(next);
        setMeasures([]);
        setTasks([]);
        return;
      }

      applySelection(
        {
          issueId: selection.issueId,
          causeId,
          step: selection.step ?? "cause",
        },
        "measures",
      );
    },
    [applySelection, selection.issueId, selection.step, invalidatePendingLoads],
  );

  const selectMeasure = useCallback(
    (measureId?: string) => {
      if (measureId === "new") {
        invalidatePendingLoads();
        const next: WorkspaceSelection = {
          issueId: selection.issueId,
          causeId: selection.causeId,
          measureId: "new",
          step: selection.step ?? "measure",
        };
        setSelection(next);
        setTasks([]);
        return;
      }

      applySelection(
        {
          issueId: selection.issueId,
          causeId: selection.causeId,
          measureId,
          step: selection.step ?? "measure",
        },
        "tasks",
      );
    },
    [applySelection, selection.causeId, selection.issueId, selection.step, invalidatePendingLoads],
  );

  const selectTask = useCallback(
    (taskId?: string) => {
      if (taskId === "new") {
        invalidatePendingLoads();
      }
      const next = {
        ...selection,
        taskId,
        step: selection.step ?? ("task" as const),
      };
      setSelection(next);
      if (taskId !== "new") {
        syncUrl(next);
      }
    },
    [selection, syncUrl, invalidatePendingLoads],
  );

  const goToStep = useCallback(
    (step: "issue" | "cause" | "measure" | "task") => {
      const next = { ...selection, step };
      setSelection(next);
      if (!isNewSelection(next)) {
        syncUrl(next);
      }
    },
    [selection, syncUrl],
  );

  const reload = useCallback(async () => {
    const current = selectionRef.current;
    const fetchSelection = toFetchSelection(current);

    if (!fetchSelection.issueId) {
      return;
    }

    cacheRef.current.causes.clear();
    cacheRef.current.measures.clear();
    cacheRef.current.tasks.clear();

    const generation = loadGenerationRef.current;
    setLoadingPane("all");

    try {
      const data = await fetchWorkspaceData(storeId, fetchSelection, {
        autoCascade: !isNewSelection(current),
      });

      if (generation !== loadGenerationRef.current) {
        return;
      }

      const resolvedIssueId =
        data.resolvedSelection.issueId &&
        data.resolvedSelection.issueId !== "new"
          ? data.resolvedSelection.issueId
          : undefined;
      const resolvedCauseId = data.resolvedSelection.causeId;
      const resolvedMeasureId = data.resolvedSelection.measureId;

      applyResolvedData(cacheRef.current, {
        issueId: resolvedIssueId,
        causeId: resolvedCauseId,
        measureId: resolvedMeasureId,
        causes: data.causes,
        measures: data.measures,
        tasks: data.tasks,
      });

      setIssues(data.issues);
      setAssignees(data.assignees);
      setCauses(data.causes);
      setMeasures(data.measures);
      setTasks(data.tasks);

      if (!isNewSelection(selectionRef.current)) {
        const resolved: WorkspaceSelection = {
          ...fetchSelection,
          ...data.resolvedSelection,
          step: current.step,
        };
        setSelection(resolved);
        syncUrl(resolved);
      }
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoadingPane(null);
      }
    }
  }, [storeId, syncUrl]);

  useEffect(() => {
    if (isInternalNavRef.current) {
      isInternalNavRef.current = false;
      return;
    }

    const urlSelection: WorkspaceSelection = {
      issueId: searchParams.get("issueId") ?? undefined,
      causeId: searchParams.get("causeId") ?? undefined,
      measureId: searchParams.get("measureId") ?? undefined,
      taskId: searchParams.get("taskId") ?? undefined,
      step:
        (searchParams.get("step") as WorkspaceSelection["step"]) ?? undefined,
    };

    if (isNewSelection(selectionRef.current)) {
      return;
    }

    setSelection(urlSelection);

    if (isNewSelection(urlSelection)) {
      return;
    }

    loadData(urlSelection, "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    setIssues(initialIssues);
    setAssignees(initialAssignees);
    cacheRef.current.causes.clear();
    cacheRef.current.measures.clear();
    cacheRef.current.tasks.clear();
    if (initialSelection.issueId && initialSelection.issueId !== "new") {
      cacheRef.current.causes.set(initialSelection.issueId, initialCauses);
    }
    if (initialSelection.causeId && initialSelection.causeId !== "new") {
      cacheRef.current.measures.set(initialSelection.causeId, initialMeasures);
    }
    if (initialSelection.measureId && initialSelection.measureId !== "new") {
      cacheRef.current.tasks.set(initialSelection.measureId, initialTasks);
    }
    setCauses(initialCauses);
    setMeasures(initialMeasures);
    setTasks(initialTasks);
    setSelection((current) =>
      isNewSelection(current) ? current : initialSelection,
    );
  }, [
    storeId,
    initialIssues,
    initialCauses,
    initialMeasures,
    initialTasks,
    initialAssignees,
    initialSelection,
  ]);

  return (
    <WorkspaceContext.Provider
      value={{
        storeId,
        storeName,
        issues,
        causes,
        measures,
        tasks,
        assignees,
        selection,
        loadingPane: isPending ? loadingPane : null,
        selectIssue,
        selectCause,
        selectMeasure,
        selectTask,
        goToStep,
        reload,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}
