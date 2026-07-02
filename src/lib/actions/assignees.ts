"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { storeAssignees, tasks } from "@/lib/db/schema";
import { assertStoreAccess } from "@/lib/permissions";
import { count, eq } from "drizzle-orm";

function revalidateSettings(storeId: string) {
  revalidatePath(`/stores/${storeId}/settings`);
  revalidatePath("/");
}

export async function getStoreAssignees(storeId: string) {
  await assertStoreAccess(storeId);
  return db
    .select()
    .from(storeAssignees)
    .where(eq(storeAssignees.storeId, storeId))
    .orderBy(storeAssignees.name);
}

export async function createStoreAssignee(storeId: string, name: string) {
  const user = await assertStoreAccess(storeId);
  const [created] = await db
    .insert(storeAssignees)
    .values({
      storeId,
      name: name.trim(),
      createdBy: user.id,
    })
    .returning();
  revalidateSettings(storeId);
  return created;
}

export async function updateStoreAssignee(
  id: string,
  storeId: string,
  name: string,
) {
  await assertStoreAccess(storeId);
  const [updated] = await db
    .update(storeAssignees)
    .set({ name: name.trim(), updatedAt: new Date() })
    .where(eq(storeAssignees.id, id))
    .returning();
  revalidateSettings(storeId);
  return updated;
}

export async function deleteStoreAssignee(id: string, storeId: string) {
  await assertStoreAccess(storeId);

  const [assignedCount] = await db
    .select({ value: count() })
    .from(tasks)
    .where(eq(tasks.assigneeId, id));

  if (assignedCount.value > 0) {
    throw new Error(
      `この担当者は ${assignedCount.value} 件のタスクに割り当て中です。先に変更してください。`,
    );
  }

  await db.delete(storeAssignees).where(eq(storeAssignees.id, id));
  revalidateSettings(storeId);
}
