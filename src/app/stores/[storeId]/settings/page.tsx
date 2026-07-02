import { redirect } from "next/navigation";
import {
  AssigneeManager,
  SettingsBackLink,
} from "@/components/admin/assignee-manager";
import { getStoreAssignees } from "@/lib/actions/assignees";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema";
import {
  assertStoreAccess,
  getCurrentAppUser,
} from "@/lib/permissions";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ storeId: string }>;
};

export default async function StoreSettingsPage({ params }: PageProps) {
  const { storeId } = await params;
  const user = await getCurrentAppUser();
  if (!user) redirect("/no-access");

  try {
    await assertStoreAccess(storeId);
  } catch {
    redirect("/no-access");
  }

  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  const assignees = await getStoreAssignees(storeId);

  return (
    <main className="mx-auto max-w-2xl flex-1 p-6">
      <SettingsBackLink />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
        {store?.name ?? "店舗"} — 担当者設定
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        タスクの担当者として選択できるスタッフ名を管理します。
      </p>
      <div className="mt-6">
        <AssigneeManager storeId={storeId} assignees={assignees} />
      </div>
    </main>
  );
}
