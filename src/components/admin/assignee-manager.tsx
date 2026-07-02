"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { StoreAssignee } from "@/lib/db/schema";
import {
  createStoreAssignee,
  deleteStoreAssignee,
  updateStoreAssignee,
} from "@/lib/actions/assignees";
import {
  buttonDangerClassName,
  buttonPrimaryClassName,
  cardClassName,
  inputClassName,
  listContainerClassName,
} from "@/components/workspace/shared";

export function AssigneeManager({
  storeId,
  assignees: initialAssignees,
}: {
  storeId: string;
  assignees: StoreAssignee[];
}) {
  const [assignees, setAssignees] = useState(initialAssignees);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!newName.trim()) return;
    setError("");
    startTransition(async () => {
      try {
        const created = await createStoreAssignee(storeId, newName);
        setAssignees((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ja")),
        );
        setNewName("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      }
    });
  }

  function handleUpdate(id: string, name: string) {
    startTransition(async () => {
      const updated = await updateStoreAssignee(id, storeId, name);
      setAssignees((prev) =>
        prev.map((a) => (a.id === id ? updated : a)),
      );
    });
  }

  function handleDelete(id: string) {
    setError("");
    startTransition(async () => {
      try {
        await deleteStoreAssignee(id, storeId);
        setAssignees((prev) => prev.filter((a) => a.id !== id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className={`${cardClassName} flex gap-2`}>
        <input
          className={inputClassName}
          placeholder="担当者名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="button"
          disabled={isPending}
          onClick={handleCreate}
          className={buttonPrimaryClassName}
        >
          追加
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className={listContainerClassName}>
        {assignees.length === 0 ? (
          <li className="p-4 text-center text-sm text-zinc-500">
            担当者が登録されていません
          </li>
        ) : (
          assignees.map((assignee) => (
            <AssigneeRow
              key={assignee.id}
              assignee={assignee}
              disabled={isPending}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </ul>
    </div>
  );
}

function AssigneeRow({
  assignee,
  disabled,
  onUpdate,
  onDelete,
}: {
  assignee: StoreAssignee;
  disabled: boolean;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(assignee.name);

  return (
    <li className="flex items-center gap-2 p-3">
      <input
        className={inputClassName}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onUpdate(assignee.id, name)}
        className={buttonPrimaryClassName}
      >
        保存
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDelete(assignee.id)}
        className={buttonDangerClassName}
      >
        削除
      </button>
    </li>
  );
}

export function SettingsBackLink({
  storeId,
  returnTo,
}: {
  storeId: string;
  returnTo?: string;
}) {
  const href =
    returnTo && returnTo.startsWith("/") ? returnTo : `/?storeId=${storeId}`;

  return (
    <Link href={href} className="text-sm text-blue-600 hover:underline">
      ← ワークスペースに戻る
    </Link>
  );
}
