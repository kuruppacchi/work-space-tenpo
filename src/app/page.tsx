import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { WorkspaceClient } from "@/components/workspace/workspace-client";
import { fetchWorkspaceData } from "@/lib/actions/workspace";
import { getAccessibleStores, getCurrentAppUser } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    storeId?: string;
    issueId?: string;
    causeId?: string;
    measureId?: string;
    taskId?: string;
    step?: "issue" | "cause" | "measure" | "task";
  }>;
};

async function WorkspaceContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/no-access");
  }

  const stores = await getAccessibleStores(user);
  if (stores.length === 0) {
    redirect("/no-access");
  }

  const storeId =
    params.storeId && stores.some((s) => s.id === params.storeId)
      ? params.storeId
      : stores[0].id;

  const storeName = stores.find((s) => s.id === storeId)?.name ?? "";

  const initialSelection = {
    issueId: params.issueId,
    causeId: params.causeId,
    measureId: params.measureId,
    taskId: params.taskId,
    step: params.step,
  };

  const data = await fetchWorkspaceData(storeId, initialSelection);

  const resolvedSelection = {
    ...initialSelection,
    ...data.resolvedSelection,
  };

  if (params.issueId === "new") resolvedSelection.issueId = "new";
  if (params.causeId === "new") resolvedSelection.causeId = "new";
  if (params.measureId === "new") resolvedSelection.measureId = "new";
  if (params.taskId === "new") resolvedSelection.taskId = "new";

  return (
    <>
      <AppHeader user={user} stores={stores} currentStoreId={storeId} />
      <WorkspaceClient
        storeId={storeId}
        storeName={storeName}
        initialIssues={data.issues}
        initialCauses={data.causes}
        initialMeasures={data.measures}
        initialTasks={data.tasks}
        initialAssignees={data.assignees}
        initialSelection={resolvedSelection}
      />
    </>
  );
}

export default function HomePage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center bg-zinc-50 p-8 text-sm text-zinc-500">
          読み込み中...
        </div>
      }
    >
      <WorkspaceContent {...props} />
    </Suspense>
  );
}
