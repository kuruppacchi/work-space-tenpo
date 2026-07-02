"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { storeAssignees, tasks } from "@/lib/db/schema";
import { assertStoreAccess } from "@/lib/permissions";
import { eq } from "drizzle-orm";

function revalidateWorkspace() {
  revalidatePath("/");
}

export async function getTasks(measureId: string, storeId: string) {
  await assertStoreAccess(storeId);
  return db
    .select({
      id: tasks.id,
      measureId: tasks.measureId,
      storeId: tasks.storeId,
      title: tasks.title,
      description: tasks.description,
      assigneeId: tasks.assigneeId,
      assigneeName: storeAssignees.name,
      dueDate: tasks.dueDate,
      status: tasks.status,
      completionCondition: tasks.completionCondition,
      memo: tasks.memo,
      googleDriveUrl: tasks.googleDriveUrl,
      googleCalendarEventId: tasks.googleCalendarEventId,
      createdBy: tasks.createdBy,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(storeAssignees, eq(tasks.assigneeId, storeAssignees.id))
    .where(eq(tasks.measureId, measureId))
    .orderBy(tasks.updatedAt);
}

export async function createTask(
  measureId: string,
  storeId: string,
  data: {
    title: string;
    description?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    status: "todo" | "doing" | "waiting_review" | "done";
    completionCondition?: string;
    memo?: string;
    googleDriveUrl?: string;
  },
) {
  const user = await assertStoreAccess(storeId);
  const [created] = await db
    .insert(tasks)
    .values({
      measureId,
      storeId,
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: data.status,
      completionCondition: data.completionCondition,
      memo: data.memo,
      googleDriveUrl: data.googleDriveUrl,
      createdBy: user.id,
    })
    .returning();
  revalidateWorkspace();
  return created;
}

export async function updateTask(
  id: string,
  storeId: string,
  data: {
    title: string;
    description?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    status: "todo" | "doing" | "waiting_review" | "done";
    completionCondition?: string;
    memo?: string;
    googleDriveUrl?: string;
  },
) {
  await assertStoreAccess(storeId);
  const [updated] = await db
    .update(tasks)
    .set({
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: data.status,
      completionCondition: data.completionCondition,
      memo: data.memo,
      googleDriveUrl: data.googleDriveUrl,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  revalidateWorkspace();
  return updated;
}

export async function deleteTask(id: string, storeId: string) {
  await assertStoreAccess(storeId);
  await db.delete(tasks).where(eq(tasks.id, id));
  revalidateWorkspace();
}

export async function getTaskById(id: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task) return null;
  await assertStoreAccess(task.storeId);
  return task;
}
