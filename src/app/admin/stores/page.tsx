import { redirect } from "next/navigation";
import {
  AdminBackLink,
  StoreManager,
} from "@/components/admin/store-manager";
import { getAllAppUsers, getAllStoresWithMemberships } from "@/lib/actions/admin";
import { getCurrentAppUser, isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  const user = await getCurrentAppUser();
  if (!user || !isAdmin(user)) redirect("/");

  const { stores, memberships } = await getAllStoresWithMemberships();
  const users = await getAllAppUsers();

  return (
    <main className="mx-auto max-w-4xl flex-1 p-6">
      <AdminBackLink />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
        店舗管理
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        店舗マスタとユーザーの所属店舗を管理します。
      </p>
      <div className="mt-6">
        <StoreManager
          stores={stores}
          memberships={memberships}
          users={users.map((u) => ({
            id: u.id,
            displayName: u.displayName,
            email: u.email,
          }))}
        />
      </div>
    </main>
  );
}
