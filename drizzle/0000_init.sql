CREATE TYPE "public"."global_role" AS ENUM('admin', 'user');
CREATE TYPE "public"."store_role" AS ENUM('manager', 'viewer');
CREATE TYPE "public"."issue_priority" AS ENUM('high', 'medium', 'low');
CREATE TYPE "public"."issue_status" AS ENUM('open', 'in_progress', 'resolved', 'archived');
CREATE TYPE "public"."cause_category" AS ENUM('people', 'material', 'method', 'information', 'environment', 'other');
CREATE TYPE "public"."confidence" AS ENUM('high', 'medium', 'low');
CREATE TYPE "public"."effect_level" AS ENUM('high', 'medium', 'low');
CREATE TYPE "public"."measure_status" AS ENUM('draft', 'adopted', 'pending', 'rejected');
CREATE TYPE "public"."task_status" AS ENUM('todo', 'doing', 'waiting_review', 'done');

CREATE TABLE "stores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "app_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "auth_user_id" uuid,
  "email" text NOT NULL,
  "display_name" text NOT NULL,
  "global_role" "global_role" DEFAULT 'user' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "app_users_email_unique" UNIQUE("email")
);

CREATE TABLE "store_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "store_id" uuid NOT NULL,
  "store_role" "store_role" DEFAULT 'manager' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "store_assignees" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "name" text NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "issues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "current_value" text,
  "target_value" text,
  "impact" text,
  "priority" "issue_priority" DEFAULT 'medium' NOT NULL,
  "status" "issue_status" DEFAULT 'open' NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "causes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "issue_id" uuid NOT NULL,
  "store_id" uuid NOT NULL,
  "category" "cause_category" DEFAULT 'other' NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "evidence" text,
  "check_method" text,
  "confidence" "confidence" DEFAULT 'medium' NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "measures" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cause_id" uuid NOT NULL,
  "store_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "purpose" text,
  "target_value" text,
  "target_value_rationale" text,
  "expected_effect" "effect_level" DEFAULT 'medium' NOT NULL,
  "difficulty" "effect_level" DEFAULT 'medium' NOT NULL,
  "cost" text,
  "side_effect" text,
  "status" "measure_status" DEFAULT 'draft' NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "measure_id" uuid NOT NULL,
  "store_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "assignee_id" uuid,
  "due_date" timestamp with time zone,
  "status" "task_status" DEFAULT 'todo' NOT NULL,
  "completion_condition" text,
  "memo" text,
  "google_drive_url" text,
  "google_calendar_event_id" text,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "store_memberships" ADD CONSTRAINT "store_memberships_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "store_memberships" ADD CONSTRAINT "store_memberships_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "store_assignees" ADD CONSTRAINT "store_assignees_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "store_assignees" ADD CONSTRAINT "store_assignees_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "issues" ADD CONSTRAINT "issues_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "issues" ADD CONSTRAINT "issues_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "causes" ADD CONSTRAINT "causes_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "causes" ADD CONSTRAINT "causes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "causes" ADD CONSTRAINT "causes_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "measures" ADD CONSTRAINT "measures_cause_id_causes_id_fk" FOREIGN KEY ("cause_id") REFERENCES "public"."causes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "measures" ADD CONSTRAINT "measures_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "measures" ADD CONSTRAINT "measures_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_measure_id_measures_id_fk" FOREIGN KEY ("measure_id") REFERENCES "public"."measures"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_store_assignees_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."store_assignees"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;
