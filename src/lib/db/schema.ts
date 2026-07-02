import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const globalRoleEnum = pgEnum("global_role", ["admin", "user"]);
export const storeRoleEnum = pgEnum("store_role", ["manager", "viewer"]);
export const issuePriorityEnum = pgEnum("issue_priority", [
  "high",
  "medium",
  "low",
]);
export const issueStatusEnum = pgEnum("issue_status", [
  "open",
  "in_progress",
  "resolved",
  "archived",
]);
export const causeCategoryEnum = pgEnum("cause_category", [
  "people",
  "material",
  "method",
  "information",
  "environment",
  "other",
]);
export const confidenceEnum = pgEnum("confidence", ["high", "medium", "low"]);
export const effectLevelEnum = pgEnum("effect_level", [
  "high",
  "medium",
  "low",
]);
export const measureStatusEnum = pgEnum("measure_status", [
  "draft",
  "adopted",
  "pending",
  "rejected",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "doing",
  "waiting_review",
  "done",
]);

export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appUsers = pgTable("app_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  authUserId: uuid("auth_user_id"),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  globalRole: globalRoleEnum("global_role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const storeMemberships = pgTable("store_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  storeRole: storeRoleEnum("store_role").notNull().default("manager"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const storeAssignees = pgTable("store_assignees", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => appUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const issues = pgTable("issues", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  currentValue: text("current_value"),
  targetValue: text("target_value"),
  impact: text("impact"),
  priority: issuePriorityEnum("priority").notNull().default("medium"),
  status: issueStatusEnum("status").notNull().default("open"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => appUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const causes = pgTable("causes", {
  id: uuid("id").defaultRandom().primaryKey(),
  issueId: uuid("issue_id")
    .notNull()
    .references(() => issues.id, { onDelete: "cascade" }),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  category: causeCategoryEnum("category").notNull().default("other"),
  title: text("title").notNull(),
  description: text("description"),
  evidence: text("evidence"),
  checkMethod: text("check_method"),
  confidence: confidenceEnum("confidence").notNull().default("medium"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => appUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const measures = pgTable("measures", {
  id: uuid("id").defaultRandom().primaryKey(),
  causeId: uuid("cause_id")
    .notNull()
    .references(() => causes.id, { onDelete: "cascade" }),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  purpose: text("purpose"),
  targetValue: text("target_value"),
  targetValueRationale: text("target_value_rationale"),
  expectedEffect: effectLevelEnum("expected_effect")
    .notNull()
    .default("medium"),
  difficulty: effectLevelEnum("difficulty").notNull().default("medium"),
  cost: text("cost"),
  sideEffect: text("side_effect"),
  status: measureStatusEnum("status").notNull().default("draft"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => appUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  measureId: uuid("measure_id")
    .notNull()
    .references(() => measures.id, { onDelete: "cascade" }),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  assigneeId: uuid("assignee_id").references(() => storeAssignees.id, {
    onDelete: "set null",
  }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: taskStatusEnum("status").notNull().default("todo"),
  completionCondition: text("completion_condition"),
  memo: text("memo"),
  googleDriveUrl: text("google_drive_url"),
  googleCalendarEventId: text("google_calendar_event_id"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => appUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const storesRelations = relations(stores, ({ many }) => ({
  memberships: many(storeMemberships),
  assignees: many(storeAssignees),
  issues: many(issues),
}));

export const appUsersRelations = relations(appUsers, ({ many }) => ({
  memberships: many(storeMemberships),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  store: one(stores, {
    fields: [issues.storeId],
    references: [stores.id],
  }),
  causes: many(causes),
}));

export const causesRelations = relations(causes, ({ one, many }) => ({
  issue: one(issues, {
    fields: [causes.issueId],
    references: [issues.id],
  }),
  measures: many(measures),
}));

export const measuresRelations = relations(measures, ({ one, many }) => ({
  cause: one(causes, {
    fields: [measures.causeId],
    references: [causes.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  measure: one(measures, {
    fields: [tasks.measureId],
    references: [measures.id],
  }),
  assignee: one(storeAssignees, {
    fields: [tasks.assigneeId],
    references: [storeAssignees.id],
  }),
}));

export type Store = typeof stores.$inferSelect;
export type AppUser = typeof appUsers.$inferSelect;
export type StoreMembership = typeof storeMemberships.$inferSelect;
export type StoreAssignee = typeof storeAssignees.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type Cause = typeof causes.$inferSelect;
export type Measure = typeof measures.$inferSelect;
export type Task = typeof tasks.$inferSelect;
