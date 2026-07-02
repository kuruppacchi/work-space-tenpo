import { redirect } from "next/navigation";
import { AdminBackLink, UserManager } from "@/components/admin/user-manager";
import { getAllAppUsers } from "@/lib/actions/admin";
import { getCurrentAppUser, isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await getCurrentAppUser();
  if (!user || !isAdmin(user)) redirect("/");

  const users = await getAllAppUsers();

  return (
    <main className="mx-auto max-w-4xl flex-1 p-6">
      <AdminBackLink />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
        ユーザー管理
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        アプリユーザーの追加とロール管理を行います。
      </p>
      <div className="mt-6">
        <UserManager users={users as never} />
      </div>
    </main>
  );
}
