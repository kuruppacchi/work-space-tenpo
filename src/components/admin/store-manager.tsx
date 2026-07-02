"use client";

import { useState, useTransition } from "react";
import type { Store } from "@/lib/db/schema";
import {
  createStore,
  deleteStoreMembership,
  upsertStoreMembership,
} from "@/lib/actions/admin";
import { STORE_ROLE_LABELS } from "@/lib/labels";
import {
  buttonDangerClassName,
  buttonPrimaryClassName,
  cardClassName,
  cardTitleClassName,
  inputClassName,
  listContainerClassName,
} from "@/components/workspace/shared";
import { AdminBackLink } from "./user-manager";

type MembershipRow = {
  id: string;
  userId: string;
  storeId: string;
  storeRole: "manager" | "viewer";
  displayName: string;
  email: string;
};

type AppUserOption = {
  id: string;
  displayName: string;
  email: string;
};

export function StoreManager({
  stores: initialStores,
  memberships: initialMemberships,
  users,
}: {
  stores: Store[];
  memberships: MembershipRow[];
  users: AppUserOption[];
}) {
  const [stores, setStores] = useState(initialStores);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [newStoreName, setNewStoreName] = useState("");
  const [membershipForm, setMembershipForm] = useState({
    userId: users[0]?.id ?? "",
    storeId: stores[0]?.id ?? "",
    storeRole: "manager" as "manager" | "viewer",
  });
  const [isPending, startTransition] = useTransition();

  function handleCreateStore() {
    if (!newStoreName.trim()) return;
    startTransition(async () => {
      const created = await createStore(newStoreName);
      setStores((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ja")),
      );
      setNewStoreName("");
    });
  }

  function handleUpsertMembership() {
    if (!membershipForm.userId || !membershipForm.storeId) return;
    startTransition(async () => {
      await upsertStoreMembership(membershipForm);
      window.location.reload();
    });
  }

  function handleDeleteMembership(id: string) {
    startTransition(async () => {
      await deleteStoreMembership(id);
      setMemberships((prev) => prev.filter((m) => m.id !== id));
    });
  }

  return (
    <div className="space-y-8">
      <section className={cardClassName}>
        <h2 className={cardTitleClassName}>店舗追加</h2>
        <div className="mt-3 flex gap-2">
          <input
            className={inputClassName}
            placeholder="店舗名"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={handleCreateStore}
            className={buttonPrimaryClassName}
          >
            追加
          </button>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {stores.map((store) => (
            <li
              key={store.id}
              className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200"
            >
              {store.name}
            </li>
          ))}
        </ul>
      </section>

      <section className={cardClassName}>
        <h2 className={cardTitleClassName}>所属店舗設定</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <select
            className={inputClassName}
            value={membershipForm.userId}
            onChange={(e) =>
              setMembershipForm({ ...membershipForm, userId: e.target.value })
            }
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName} ({u.email})
              </option>
            ))}
          </select>
          <select
            className={inputClassName}
            value={membershipForm.storeId}
            onChange={(e) =>
              setMembershipForm({ ...membershipForm, storeId: e.target.value })
            }
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className={inputClassName}
            value={membershipForm.storeRole}
            onChange={(e) =>
              setMembershipForm({
                ...membershipForm,
                storeRole: e.target.value as "manager" | "viewer",
              })
            }
          >
            {Object.entries(STORE_ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isPending}
            onClick={handleUpsertMembership}
            className={buttonPrimaryClassName}
          >
            設定
          </button>
        </div>
      </section>

      <ul className={listContainerClassName}>
        {memberships.length === 0 ? (
          <li className="p-4 text-center text-sm text-zinc-500">
            所属設定がありません
          </li>
        ) : (
          memberships.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 p-4 text-sm"
            >
              <div>
                <div className="font-medium">{m.displayName}</div>
                <div className="text-zinc-500">
                  {stores.find((s) => s.id === m.storeId)?.name} ·{" "}
                  {STORE_ROLE_LABELS[m.storeRole]}
                </div>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDeleteMembership(m.id)}
                className={buttonDangerClassName}
              >
                解除
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export { AdminBackLink };
