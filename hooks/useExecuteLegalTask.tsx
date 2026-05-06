"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { legalApiClient } from "@/lib/api/legal";
import { emitLegalTaskInvoked } from "@/lib/legal/telemetry";
import type { LegalTask } from "@/lib/legal/task-types";
import { TaskExecuteModal } from "@/components/legal/TaskExecuteModal";

type ExecuteContextValue = {
  open: (task: LegalTask) => void;
  close: () => void;
  activeTask: LegalTask | null;
};

const LegalTaskExecuteContext = createContext<ExecuteContextValue | null>(null);

function buildUserId(auth: ReturnType<typeof useAuth>): string {
  if (!auth.isAuthenticated) return "anonymous";
  return `${auth.tenantName}:${auth.role}`;
}

export function LegalTaskExecuteProvider({ children }: { children: ReactNode }) {
  const [activeTask, setActiveTask] = useState<LegalTask | null>(null);
  const router = useRouter();
  const { tenantId } = useTenant();
  const auth = useAuth();

  const open = useCallback(
    (task: LegalTask) => {
      const tid = tenantId?.trim() || "";
      emitLegalTaskInvoked({
        tenant_id: tid || "unknown",
        task_id: task.task_id,
        user_id: buildUserId(auth),
        timestamp: new Date().toISOString(),
        sync_mode: task.sync_mode,
      });
      if (task.output_type === "navigate" && task.navigate_path) {
        const url = task.navigate_path.includes("?")
          ? `${task.navigate_path}&task=${encodeURIComponent(task.task_id)}`
          : `${task.navigate_path}?task=${encodeURIComponent(task.task_id)}`;
        router.push(url);
        return;
      }
      setActiveTask(task);
    },
    [auth, router, tenantId]
  );

  const close = useCallback(() => setActiveTask(null), []);

  const value = useMemo(
    () => ({
      open,
      close,
      activeTask,
    }),
    [open, close, activeTask]
  );

  return (
    <LegalTaskExecuteContext.Provider value={value}>
      {children}
      {activeTask ? (
        <TaskExecuteModal
          task={activeTask}
          tenantId={tenantId?.trim() || ""}
          onClose={close}
          runExecute={(tid, taskId, body) => legalApiClient.executeTask(tid, taskId, body)}
        />
      ) : null}
    </LegalTaskExecuteContext.Provider>
  );
}

export function useExecuteLegalTask(): ExecuteContextValue {
  const ctx = useContext(LegalTaskExecuteContext);
  if (!ctx) {
    throw new Error("useExecuteLegalTask debe usarse dentro de LegalTaskExecuteProvider");
  }
  return ctx;
}
