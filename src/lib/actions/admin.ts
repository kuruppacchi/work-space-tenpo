"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  appUsers,
  storeMemberships,
  stores,
} from "@/lib/db/schema";
import { isAdmin, requireAppUser } from "@/lib/permissions";
import { eq } from "drizzle-orm";

function revalidateAdmin() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/stores");
}

export async function getAllAppUsers() {
  const user = await requireAppUser();
  if (!isAdmin(user)) {
    throw new Error("権限がありません");
  }

  return db
    .select({
      id: appUsers.id,
      email: appUsers.email,
      displayName: appUsers.displayName,
      globalRole: appUsers.globalRole,
      authUserId: appUsers.authUserId,
      createdAt: appUsers.createdAt,
    })
    .from(appUsers)
    .orderBy(appUsers.displayName);
}

export async function createAppUser(data: {
  email: string;
  displayName: string;
  globalRole: "admin" | "user";
}) {
  const user = await requireAppUser();
  if (!isAdmin(user)) {
    throw new Error("権限がありません");
  }

  const [created] = await db
    .insert(appUsers)
    .values({
      email: data.email.trim().toLowerCase(),
      displayName: data.displayName.trim(),
      globalRole: data.globalRole,
    })
    .returning();
  revalidateAdmin();
  return created;
}

export async function updateAppUser(
  id: string,
  data: {
    displayName: string;
    globalRole: "admin" | "user";
  },
) {
  const user = await requireAppUser();
  if (!isAdmin(user)) {
    throw new Error("権限がありません");
  }

  const [updated] = await db
    .update(appUsers)
    .set({
      displayName: data.displayName.trim(),
      globalRole: data.globalRole,
      updatedAt: new Date(),
    })
    .where(eq(appUsers.id, id))
    .returning();
  revalidateAdmin();
  return updated;
}

export async function getAllStoresWithMemberships() {
  const user = await requireAppUser();
  if (!isAdmin(user)) {
    throw new Error("権限がありません");
  }

  const allStores = await db.select().from(stores).orderBy(stores.name);
  const memberships = await db
    .select({
      id: storeMemberships.id,
      userId: storeMemberships.userId,
      storeId: storeMemberships.storeId,
      storeRole: storeMemberships.storeRole,
      displayName: appUsers.displayName,
      email: appUsers.email,
    })
    .from(storeMemberships)
    .innerJoin(appUsers, eq(storeMemberships.userId, appUsers.id));

  return { stores: allStores, memberships };
}

export async function createStore(name: string) {
  const user = await requireAppUser();
  if (!isAdmin(user)) {
    throw new Error("権限がありません");
  }

  const [created] = await db
    .insert(stores)
    .values({ name: name.trim() })
    .returning();
  revalidateAdmin();
  return created;
}

export async function upsertStoreMembership(data: {
  userId: string;
  storeId: string;
  storeRole: "manager" | "viewer";
}) {
  const user = await requireAppUser();
  if (!isAdmin(user)) {
    throw new Error("権限がありません");
  }

  const [existing] = await db
    .select()
    .from(storeMemberships)
    .where(eq(storeMemberships.userId, data.userId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(storeMemberships)
      .set({
        storeId: data.storeId,
        storeRole: data.storeRole,
        updatedAt: new Date(),
      })
      .where(eq(storeMemberships.id, existing.id))
      .returning();
    revalidateAdmin();
    return updated;
  }

  const [created] = await db
    .insert(storeMemberships)
    .values(data)
    .returning();
  revalidateAdmin();
  return created;
}

export async function deleteStoreMembership(id: string) {
  const user = await requireAppUser();
  if (!isAdmin(user)) {
    throw new Error("権限がありません");
  }

  await db.delete(storeMemberships).where(eq(storeMemberships.id, id));
  revalidateAdmin();
}
