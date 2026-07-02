"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { causes, measures, tasks } from "@/lib/db/schema";
import { assertStoreAccess } from "@/lib/permissions";
import { count, eq } from "drizzle-orm";

function revalidateWorkspace() {
  revalidatePath("/");
}

export async function getCauses(issueId: string, storeId: string) {
  await assertStoreAccess(storeId);
  return db
    .select()
    .from(causes)
    .where(eq(causes.issueId, issueId))
    .orderBy(causes.updatedAt);
}

export async function createCause(
  issueId: string,
  storeId: string,
  data: {
    title: string;
    category: "people" | "material" | "method" | "information" | "environment" | "other";
    description?: string;
    evidence?: string;
    confidence: "high" | "medium" | "low";
  },
) {
  const user = await assertStoreAccess(storeId);
  const [created] = await db
    .insert(causes)
    .values({
      issueId,
      storeId,
      title: data.title,
      category: data.category,
      description: data.description,
      evidence: data.evidence,
      confidence: data.confidence,
      createdBy: user.id,
    })
    .returning();
  revalidateWorkspace();
  return created;
}

export async function updateCause(
  id: string,
  storeId: string,
  data: {
    title: string;
    category: "people" | "material" | "method" | "information" | "environment" | "other";
    description?: string;
    evidence?: string;
    confidence: "high" | "medium" | "low";
  },
) {
  await assertStoreAccess(storeId);
  const [updated] = await db
    .update(causes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(causes.id, id))
    .returning();
  revalidateWorkspace();
  return updated;
}

export async function deleteCause(id: string, storeId: string) {
  await assertStoreAccess(storeId);

  const causeMeasures = await db
    .select({ id: measures.id })
    .from(measures)
    .where(eq(measures.causeId, id));

  for (const measure of causeMeasures) {
    await db.delete(tasks).where(eq(tasks.measureId, measure.id));
  }

  await db.delete(measures).where(eq(measures.causeId, id));
  await db.delete(causes).where(eq(causes.id, id));
  revalidateWorkspace();
}

export async function getCauseById(id: string) {
  const [cause] = await db.select().from(causes).where(eq(causes.id, id)).limit(1);
  if (!cause) return null;
  await assertStoreAccess(cause.storeId);
  return cause;
}

export async function getCauseChildCount(id: string) {
  const [result] = await db
    .select({ value: count() })
    .from(measures)
    .where(eq(measures.causeId, id));
  return result.value;
}
