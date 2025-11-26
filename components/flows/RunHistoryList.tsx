import React from "react";
import { FlowRun } from "@/lib/flowsApi";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  RefreshCwIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RunHistoryListProps {
  runs: FlowRun[];
  onSelectRun: (run: FlowRun) => void;
  selectedRunId?: string;
}

export function RunHistoryList({
  runs,
  onSelectRun,
  selectedRunId,
}: RunHistoryListProps) {
  if (runs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <ClockIcon className="mb-2 size-8 opacity-20" />
        <p>No run history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => {
        // Determine if the run was logically successful
        // It's a success only if status is COMPLETED AND the inner result status is not "failed"
        const isRunning = run.status === "RUNNING";
        const isLogicalSuccess =
          run.status === "COMPLETED" && run.result?.status !== "failed";
        const isFailed =
          run.status === "FAILED" || (!isRunning && !isLogicalSuccess);

        // Extract summary from result if available
        const summary =
          run.result &&
          typeof run.result === "object" &&
          "summary" in run.result
            ? (run.result.summary as string)
            : null;

        return (
          <div
            key={run.id}
            onClick={() => onSelectRun(run)}
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50",
              selectedRunId === run.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="shrink-0">
                {isLogicalSuccess ? (
                  <div className="flex size-8 items-center justify-center rounded-full bg-success/10 text-success">
                    <CheckCircleIcon className="size-4" />
                  </div>
                ) : isFailed ? (
                  <div className="flex size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <XCircleIcon className="size-4" />
                  </div>
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <RefreshCwIcon className="size-4 animate-spin" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">
                  {summary || new Date(run.created_at).toLocaleString()}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {summary && (
                    <>
                      <span>{new Date(run.created_at).toLocaleString()}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>
                    {run.execution_time_ms
                      ? `${(run.execution_time_ms / 1000).toFixed(2)}s`
                      : "Running..."}
                  </span>
                </div>
              </div>
            </div>
            <div className="ml-3 shrink-0 text-right">
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-xs font-medium",
                  isLogicalSuccess
                    ? "bg-success/10 text-success"
                    : isFailed
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary",
                )}
              >
                {isLogicalSuccess
                  ? "COMPLETED"
                  : isFailed
                    ? "FAILED"
                    : run.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
