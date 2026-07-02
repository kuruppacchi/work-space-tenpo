"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@neondatabase/auth-ui";
import type { Store } from "@/lib/db/schema";
import type { CurrentUser } from "@/lib/permissions";

type AppHeaderProps = {
  user: CurrentUser;
  stores: Store[];
  currentStoreId: string;
};

export function AppHeader({ user, stores, currentStoreId }: AppHeaderProps) {
  const router = useRouter();
  const isAdmin = user.globalRole === "admin";

  function handleStoreChange(storeId: string) {
    const params = new URLSearchParams();
    params.set("storeId", storeId);
    router.push(`/?${params.toString()}`);
  }

  const settingsHref = `/stores/${currentStoreId}/settings`;

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-300 bg-white px-4 py-3 shadow-md">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
          店舗改善WS
        </Link>
        {isAdmin ? (
          <select
            value={currentStoreId}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-zinc-600">
            {stores.find((s) => s.id === currentStoreId)?.name ?? ""}
          </span>
        )}
      </div>

      <nav className="flex items-center gap-4 text-sm">
        <Link
          href="/"
          className="font-medium text-zinc-600 transition hover:text-zinc-900"
        >
          ワークスペース
        </Link>
        <Link
          href={settingsHref}
          className="font-medium text-zinc-600 transition hover:text-zinc-900"
        >
          店舗設定
        </Link>
        {isAdmin && (
          <>
            <Link
              href="/admin/users"
              className="font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              ユーザー管理
            </Link>
            <Link
              href="/admin/stores"
              className="font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              店舗管理
            </Link>
          </>
        )}
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
          {user.displayName}
        </span>
        <UserButton size="icon" />
      </nav>
    </header>
  );
}
