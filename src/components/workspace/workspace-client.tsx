"use client";

import type { Cause, Issue, Measure, StoreAssignee } from "@/lib/db/schema";
import { WorkspaceResponsive } from "./workspace";
import {
  WorkspaceProvider,
  type WorkspaceProviderProps,
} from "./workspace-context";

type TaskWithAssignee = {
  id: string;
  measureId: string;
  storeId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: Date | null;
  status: "todo" | "doing" | "waiting_review" | "done";
  completionCondition: string | null;
  memo: string | null;
  googleDriveUrl: string | null;
  googleCalendarEventId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

type WorkspaceClientProps = Omit<WorkspaceProviderProps, "children">;

export function WorkspaceClient(props: WorkspaceClientProps) {
  return (
    <WorkspaceProvider {...props}>
      <WorkspaceResponsive />
    </WorkspaceProvider>
  );
}

export type { TaskWithAssignee, Issue, Cause, Measure, StoreAssignee };
