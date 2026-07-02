"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { AppUser } from "@/lib/db/schema";
import { createAppUser, updateAppUser } from "@/lib/actions/admin";
import { GLOBAL_ROLE_LABELS } from "@/lib/labels";
import {
  buttonPrimaryClassName,
  cardClassName,
  cardDescriptionClassName,
  cardTitleClassName,
  inputClassName,
  listContainerClassName,
} from "@/components/workspace/shared";

export function UserManager({ users: initialUsers }: { users: AppUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    globalRole: "user" as "admin" | "user",
  });

  function handleCreate() {
    if (!form.email.trim() || !form.displayName.trim()) return;
    startTransition(async () => {
      const created = await createAppUser(form);
      setUsers((prev) => [...prev, created as AppUser]);
      setForm({ email: "", displayName: "", globalRole: "user" });
    });
  }

  function handleUpdate(
    id: string,
    data: { displayName: string; globalRole: "admin" | "user" },
  ) {
    startTransition(async () => {
      const updated = await updateAppUser(id, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    });
  }

  return (
    <div className="space-y-6">
      <section className={cardClassName}>
        <h2 className={cardTitleClassName}>新規ユーザー追加</h2>
        <p className={cardDescriptionClassName}>
          追加後、Neon Auth から同じメールアドレスで招待してください。
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input
            className={inputClassName}
            placeholder="メールアドレス"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className={inputClassName}
            placeholder="表示名"
            value={form.displayName}
            onChange={(e) =>
              setForm({ ...form, displayName: e.target.value })
            }
          />
          <select
            className={inputClassName}
            value={form.globalRole}
            onChange={(e) =>
              setForm({
                ...form,
                globalRole: e.target.value as "admin" | "user",
              })
            }
          >
            {Object.entries(GLOBAL_ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={handleCreate}
          className={`${buttonPrimaryClassName} mt-3`}
        >
          追加
        </button>
      </section>

      <ul className={listContainerClassName}>
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            disabled={isPending}
            onUpdate={handleUpdate}
          />
        ))}
      </ul>
    </div>
  );
}

function UserRow({
  user,
  disabled,
  onUpdate,
}: {
  user: AppUser;
  disabled: boolean;
  onUpdate: (
    id: string,
    data: { displayName: string; globalRole: "admin" | "user" },
  ) => void;
}) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [globalRole, setGlobalRole] = useState(user.globalRole);

  return (
    <li className="grid gap-2 p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
      <span className="text-sm text-zinc-600">{user.email}</span>
      <input
        className={inputClassName}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <select
        className={inputClassName}
        value={globalRole}
        onChange={(e) =>
          setGlobalRole(e.target.value as "admin" | "user")
        }
      >
        {Object.entries(GLOBAL_ROLE_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onUpdate(user.id, { displayName, globalRole })}
        className={buttonPrimaryClassName}
      >
        保存
      </button>
      <span className="text-xs text-zinc-400 sm:col-span-4">
        {user.authUserId ? "ログイン済み" : "未ログイン（招待待ち）"}
      </span>
    </li>
  );
}

export function AdminBackLink() {
  return (
    <Link href="/" className="text-sm text-blue-600 hover:underline">
      ← ワークスペースに戻る
    </Link>
  );
}
