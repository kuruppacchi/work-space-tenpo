"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { causes, issues } from "@/lib/db/schema";
import { assertStoreAccess } from "@/lib/permissions";
import { count, eq } from "drizzle-orm";

function revalidateWorkspace() {
  revalidatePath("/");
}

export async function getIssues(storeId: string) {
  await assertStoreAccess(storeId);
  return db
    .select()
    .from(issues)
    .where(eq(issues.storeId, storeId))
    .orderBy(issues.updatedAt);
}

export async function createIssue(
  storeId: string,
  data: {
    title: string;
    description?: string;
    currentValue?: string;
    targetValue?: string;
    impact?: string;
    priority: "high" | "medium" | "low";
    status: "open" | "in_progress" | "resolved" | "archived";
  },
) {
  const user = await assertStoreAccess(storeId);
  const [created] = await db
    .insert(issues)
    .values({
      storeId,
      title: data.title,
      description: data.description,
      currentValue: data.currentValue,
      targetValue: data.targetValue,
      impact: data.impact,
      priority: data.priority,
      status: data.status,
      createdBy: user.id,
    })
    .returning();
  revalidateWorkspace();
  return created;
}

export async function updateIssue(
  id: string,
  storeId: string,
  data: {
    title: string;
    description?: string;
    currentValue?: string;
    targetValue?: string;
    impact?: string;
    priority: "high" | "medium" | "low";
    status: "open" | "in_progress" | "resolved" | "archived";
  },
) {
  await assertStoreAccess(storeId);
  const [updated] = await db
    .update(issues)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(issues.id, id))
    .returning();
  revalidateWorkspace();
  return updated;
}

export async function deleteIssue(id: string, storeId: string) {
  await assertStoreAccess(storeId);
  const [causeCount] = await db
    .select({ value: count() })
    .from(causes)
    .where(eq(causes.issueId, id));

  if (causeCount.value > 0) {
    await db.delete(causes).where(eq(causes.issueId, id));
  }

  await db.delete(issues).where(eq(issues.id, id));
  revalidateWorkspace();
}

export async function getIssueById(id: string) {
  const [issue] = await db.select().from(issues).where(eq(issues.id, id)).limit(1);
  if (!issue) return null;
  await assertStoreAccess(issue.storeId);
  return issue;
}
