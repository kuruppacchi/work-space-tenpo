import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const {
  stores,
  appUsers,
  storeMemberships,
  storeAssignees,
  issues,
  causes,
  measures,
  tasks,
} = schema;

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log("Seeding stores...");
  const storeNames = [
    "WSO",
    "ももち浜",
    "ピウ",
    "西新",
    "春日",
    "出島",
    "13階宴会",
    "モーニング",
  ];

  let allStores = await db.select().from(stores).orderBy(stores.name);

  if (allStores.length === 0) {
    allStores = await db
      .insert(stores)
      .values(storeNames.map((name) => ({ name })))
      .returning();
  }

  console.log("Seeding users...");
  const userSeeds = [
    {
      email: "nishida@example.com",
      displayName: "西田",
      globalRole: "admin" as const,
      storeIndex: null,
    },
    {
      email: "wso@example.com",
      displayName: "WSO 店長",
      globalRole: "user" as const,
      storeIndex: 0,
    },
    {
      email: "momochi@example.com",
      displayName: "ももち浜 店長",
      globalRole: "user" as const,
      storeIndex: 1,
    },
    {
      email: "piu@example.com",
      displayName: "ピウ 店長",
      globalRole: "user" as const,
      storeIndex: 2,
    },
    {
      email: "nishijin@example.com",
      displayName: "西新 店長",
      globalRole: "user" as const,
      storeIndex: 3,
    },
    {
      email: "kasuga@example.com",
      displayName: "春日 店長",
      globalRole: "user" as const,
      storeIndex: 4,
    },
    {
      email: "dejima@example.com",
      displayName: "出島 店長",
      globalRole: "user" as const,
      storeIndex: 5,
    },
    {
      email: "morning@example.com",
      displayName: "モーニング 店長",
      globalRole: "user" as const,
      storeIndex: 7,
    },
  ];

  const seededUsers = [];
  for (const userSeed of userSeeds) {
    const [existing] = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.email, userSeed.email))
      .limit(1);

    if (existing) {
      seededUsers.push(existing);
      continue;
    }

    const [created] = await db
      .insert(appUsers)
      .values({
        email: userSeed.email,
        displayName: userSeed.displayName,
        globalRole: userSeed.globalRole,
      })
      .returning();
    seededUsers.push(created);
  }

  const adminUser = seededUsers[0];

  console.log("Seeding memberships...");
  for (let i = 1; i < userSeeds.length; i++) {
    const user = seededUsers[i];
    const storeIndex = userSeeds[i].storeIndex;
    if (storeIndex === null) continue;

    const store = allStores[storeIndex];
    const [existing] = await db
      .select()
      .from(storeMemberships)
      .where(eq(storeMemberships.userId, user.id))
      .limit(1);

    if (!existing) {
      await db.insert(storeMemberships).values({
        userId: user.id,
        storeId: store.id,
        storeRole: "manager",
      });
    }
  }

  const momochiStore = allStores[1];
  const momochiManager = seededUsers[2];

  console.log("Seeding sample data for ももち浜...");
  const [existingIssue] = await db
    .select()
    .from(issues)
    .where(eq(issues.title, "ランチピークの提供時間が遅い"))
    .limit(1);

  if (!existingIssue) {
    const [assigneeA] = await db
      .insert(storeAssignees)
      .values({
        storeId: momochiStore.id,
        name: "田中",
        createdBy: momochiManager.id,
      })
      .returning();

    await db.insert(storeAssignees).values({
      storeId: momochiStore.id,
      name: "アルバイトA",
      createdBy: momochiManager.id,
    });

    const [issue] = await db
      .insert(issues)
      .values({
        storeId: momochiStore.id,
        title: "ランチピークの提供時間が遅い",
        description: "12時〜13時のランチ提供に平均5分の遅れが発生している",
        currentValue: "平均18分",
        targetValue: "12分以内",
        impact: "クレーム増加、回転率低下",
        priority: "high",
        status: "in_progress",
        createdBy: momochiManager.id,
      })
      .returning();

    const [cause] = await db
      .insert(causes)
      .values({
        issueId: issue.id,
        storeId: momochiStore.id,
        category: "people",
        title: "ピーク時の人手不足",
        description: "ランチピーク時にホール・キッチンともに人手が足りない",
        evidence: "12時台のオーダー待ち時間ログ",
        checkMethod: "ピーク時の稼働人数と提供時間を1週間計測",
        confidence: "high",
        createdBy: momochiManager.id,
      })
      .returning();

    const [measure] = await db
      .insert(measures)
      .values({
        causeId: cause.id,
        storeId: momochiStore.id,
        title: "ランチピークのシフト見直し",
        description: "11:30〜13:30のシフトを1名増員",
        purpose: "ピーク時の提供キャパを確保",
        expectedEffect: "high",
        difficulty: "medium",
        cost: "人件費 月3万円程度",
        sideEffect: "他時間帯の人員が薄くなる可能性",
        status: "adopted",
        createdBy: momochiManager.id,
      })
      .returning();

    await db.insert(tasks).values({
      measureId: measure.id,
      storeId: momochiStore.id,
      title: "来月シフト表の作成",
      description: "ランチピーク増員を反映したシフト表を作成",
      assigneeId: assigneeA.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "doing",
      completionCondition: "店長承認済みシフト表が共有フォルダにアップロードされている",
      createdBy: momochiManager.id,
    });
  }

  console.log("Seed complete.");
  console.log(`Admin user: ${adminUser.email}`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
