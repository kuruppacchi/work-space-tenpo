import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { appUsers, storeMemberships, stores } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export class PermissionError extends Error {
  constructor(message = "権限がありません") {
    super(message);
    this.name = "PermissionError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "ログインが必要です") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export type CurrentUser = {
  id: string;
  authUserId: string;
  email: string;
  displayName: string;
  globalRole: "admin" | "user";
  storeIds: string[];
};

export async function getAuthSessionUser() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.email) {
    return null;
  }
  return session.user;
}

export async function linkAppUserByEmail(email: string, authUserId: string) {
  const [existing] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1);

  if (!existing) {
    return null;
  }

  if (!existing.authUserId) {
    const [updated] = await db
      .update(appUsers)
      .set({ authUserId, updatedAt: new Date() })
      .where(eq(appUsers.id, existing.id))
      .returning();
    return updated;
  }

  if (existing.authUserId !== authUserId) {
    return null;
  }

  return existing;
}

export async function getCurrentAppUser(): Promise<CurrentUser | null> {
  const sessionUser = await getAuthSessionUser();
  if (!sessionUser?.email || !sessionUser.id) {
    return null;
  }

  let appUser = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, sessionUser.email))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!appUser) {
    return null;
  }

  if (!appUser.authUserId) {
    appUser =
      (await linkAppUserByEmail(sessionUser.email, sessionUser.id)) ?? appUser;
  }

  const memberships = await db
    .select({ storeId: storeMemberships.storeId })
    .from(storeMemberships)
    .where(eq(storeMemberships.userId, appUser.id));

  return {
    id: appUser.id,
    authUserId: appUser.authUserId ?? sessionUser.id,
    email: appUser.email,
    displayName: appUser.displayName,
    globalRole: appUser.globalRole,
    storeIds: memberships.map((m) => m.storeId),
  };
}

export async function requireAppUser() {
  const user = await getCurrentAppUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export async function getAccessibleStores(user: CurrentUser) {
  if (user.globalRole === "admin") {
    return db.select().from(stores).orderBy(stores.name);
  }

  if (user.storeIds.length === 0) {
    return [];
  }

  return db
    .select()
    .from(stores)
    .where(inArray(stores.id, user.storeIds))
    .orderBy(stores.name);
}

export function canAccessStore(user: CurrentUser, storeId: string) {
  if (user.globalRole === "admin") {
    return true;
  }
  return user.storeIds.includes(storeId);
}

export async function assertStoreAccess(storeId: string) {
  const user = await requireAppUser();
  if (!canAccessStore(user, storeId)) {
    throw new PermissionError();
  }
  return user;
}

export function isAdmin(user: CurrentUser) {
  return user.globalRole === "admin";
}
