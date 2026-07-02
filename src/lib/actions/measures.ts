"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { measures, tasks } from "@/lib/db/schema";
import { assertStoreAccess } from "@/lib/permissions";
import { count, eq } from "drizzle-orm";

function revalidateWorkspace() {
  revalidatePath("/");
}

export async function getMeasures(causeId: string, storeId: string) {
  await assertStoreAccess(storeId);
  return db
    .select()
    .from(measures)
    .where(eq(measures.causeId, causeId))
    .orderBy(measures.updatedAt);
}

export async function createMeasure(
  causeId: string,
  storeId: string,
  data: {
    title: string;
    description?: string;
    purpose?: string;
    targetValue?: string;
    targetValueRationale?: string;
    expectedEffect: "high" | "medium" | "low";
    difficulty: "high" | "medium" | "low";
    status: "draft" | "adopted" | "pending" | "rejected";
  },
) {
  const user = await assertStoreAccess(storeId);
  const [created] = await db
    .insert(measures)
    .values({
      causeId,
      storeId,
      title: data.title,
      description: data.description,
      purpose: data.purpose,
      targetValue: data.targetValue,
      targetValueRationale: data.targetValueRationale,
      expectedEffect: data.expectedEffect,
      difficulty: data.difficulty,
      status: data.status,
      createdBy: user.id,
    })
    .returning();
  revalidateWorkspace();
  return created;
}

export async function updateMeasure(
  id: string,
  storeId: string,
  data: {
    title: string;
    description?: string;
    purpose?: string;
    targetValue?: string;
    targetValueRationale?: string;
    expectedEffect: "high" | "medium" | "low";
    difficulty: "high" | "medium" | "low";
    status: "draft" | "adopted" | "pending" | "rejected";
  },
) {
  await assertStoreAccess(storeId);
  const [updated] = await db
    .update(measures)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(measures.id, id))
    .returning();
  revalidateWorkspace();
  return updated;
}

export async function deleteMeasure(id: string, storeId: string) {
  await assertStoreAccess(storeId);
  await db.delete(tasks).where(eq(tasks.measureId, id));
  await db.delete(measures).where(eq(measures.id, id));
  revalidateWorkspace();
}

export async function getMeasureById(id: string) {
  const [measure] = await db
    .select()
    .from(measures)
    .where(eq(measures.id, id))
    .limit(1);
  if (!measure) return null;
  await assertStoreAccess(measure.storeId);
  return measure;
}

export async function getMeasureChildCount(id: string) {
  const [result] = await db
    .select({ value: count() })
    .from(tasks)
    .where(eq(tasks.measureId, id));
  return result.value;
}
