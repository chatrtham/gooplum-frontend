"use client";

import { useState, useEffect, useRef } from "react";
import {
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  ChevronDown,
  ChevronRight,
  ActivityIcon,
  ClipboardListIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  executeFlowFromArtifact,
  isFlowExecutionArtifact,
  getFlowRunStatus,
} from "@/lib/agentFlowExecutionApi";
import type { FlowEvent } from "@/lib/flowsApi";
import { toNormalCase, cn } from "@/lib/utils";

interface FlowExecutionToolUIProps {
  artifact?: unknown;
  toolName?: string;
  argsText?: string;
  result?: any;
}

export function FlowExecutionToolUI({
  artifact,
  toolName,
  argsText,
  result,
}: FlowExecutionToolUIProps) {
  const [status, setStatus] = useState<
    "loading" | "idle" | "running" | "completed" | "failed"
  >("loading");
  const [logs, setLogs] = useState<
    {
      message: string;
      timestamp: string;
      status?: "success" | "failed" | "running";
    }[]
  >([]);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  // Type guard validation - must be a flow execution artifact
  const validArtifact = isFlowExecutionArtifact(artifact) ? artifact : null;

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const startExecution = async () => {
    if (status === "running" || !validArtifact) return;

    setStatus("running");
    setLogs([]);
    setExecutionResult(null);
    setError(null);
    setIsExpanded(true);

    await executeFlowFromArtifact(validArtifact, (event: FlowEvent) => {
      if (event.type === "stream") {
        setLogs((prev) => [
          ...prev,
          {
            message: event.message,
            timestamp: new Date(event.timestamp).toISOString(),
            status: event.status,
          },
        ]);
      } else if (event.type === "complete") {
        if (event.success) {
          setStatus("completed");
          setExecutionResult(event.data);
          setLogs((prev) => [
            ...prev,
            {
              message: "Flow completed successfully.",
              timestamp: new Date().toISOString(),
              status: "success",
            },
          ]);
        } else {
          setStatus("failed");
          setError(event.error || "Unknown error");
          setLogs((prev) => [
            ...prev,
            {
              message: `Error: ${event.error || "Unknown error"}`,
              timestamp: new Date().toISOString(),
              status: "failed",
            },
          ]);
        }
      }
    });
  };

  // Auto-start execution or check status on mount
  useEffect(() => {
    if (status !== "loading" || hasStartedRef.current || !validArtifact) return;

    const checkAndStart = async () => {
      hasStartedRef.current = true;

      try {
        // Check if run already exists
        const runStatus = await getFlowRunStatus(validArtifact.run_id);

        if (runStatus.status === "COMPLETED") {
          setStatus("completed");
          setExecutionResult(runStatus.result);
          // Keep collapsed by default for completed runs
        } else if (runStatus.status === "FAILED") {
          setStatus("failed");
          setError(runStatus.error || "Flow execution failed");
          setIsExpanded(true); // Expand for errors
        } else {
          // If RUNNING or PENDING, show running state
          setStatus("running");
          setIsExpanded(true);
        }
      } catch (e) {
        // Run not found (404) or other error -> Start new execution
        startExecution();
      }
    };

    checkAndStart();
  }, [validArtifact, status]);

  // Return null if not a valid artifact
  if (!validArtifact) {
    return null;
  }

  // Helper to get summary text
  const getSummary = () => {
    if (!executionResult) return null;
    if (
      typeof executionResult === "object" &&
      executionResult !== null &&
      "summary" in executionResult
    ) {
      return executionResult.summary;
    }
    return null;
  };

  // Check if inner status indicates success
  const isFlowSuccessful = () => {
    if (!executionResult) return status === "completed";
    const hasInnerStatus =
      typeof executionResult === "object" &&
      executionResult !== null &&
      "status" in executionResult;
    return !hasInnerStatus || executionResult.status === "success";
  };

  const isFinished = status === "completed" || status === "failed";

  return (
    <div className="mb-4 flex w-full flex-col rounded-xl border border-border/60 bg-card/50 shadow-sm backdrop-blur-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              status === "loading" || status === "running"
                ? "bg-primary/10 text-primary"
                : status === "completed" && isFlowSuccessful()
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : status === "completed" && !isFlowSuccessful()
                    ? "bg-destructive/10 text-destructive"
                    : status === "failed"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground",
            )}
          >
            {status === "loading" || status === "running" ? (
              <RefreshCwIcon className="size-4 animate-spin" />
            ) : status === "completed" && isFlowSuccessful() ? (
              <CheckCircleIcon className="size-4" />
            ) : status === "completed" || status === "failed" ? (
              <XCircleIcon className="size-4" />
            ) : (
              <PlayIcon className="size-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium tracking-tight text-foreground">
              {toNormalCase(validArtifact.flow_name)}
            </p>
            {/* Show summary inline for finished states */}
            {isFinished ? (
              <p className="text-xs text-muted-foreground">
                {getSummary() ||
                  (status === "completed" && isFlowSuccessful()
                    ? "Completed successfully"
                    : status === "completed" && !isFlowSuccessful()
                      ? "Flow returned an error"
                      : error || "Execution failed")}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {status === "loading"
                  ? "Loading..."
                  : status === "running"
                    ? "Running..."
                    : "Ready to start"}
              </p>
            )}
          </div>
        </div>

        {/* Only show expand button when running */}
        {status === "running" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        )}

        {/* Retry button for failed state */}
        {status === "failed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={startExecution}
            className="shrink-0 text-xs"
          >
            Retry
          </Button>
        )}
      </div>

      {/* Expanded Details - Only show when running and expanded */}
      {status === "running" && isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 space-y-5 border-t border-border/50 px-5 py-5">
          {/* Parameters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardListIcon className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-normal tracking-wider text-muted-foreground uppercase">
                Inputs
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/50 p-4 shadow-sm backdrop-blur-md">
              <div className="grid gap-4">
                {Object.entries(validArtifact.parameters).map(
                  ([key, value]) => (
                    <div key={key} className="space-y-1.5">
                      <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        {toNormalCase(key)}
                      </p>
                      <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2 font-mono text-xs break-all whitespace-pre-wrap text-foreground shadow-sm">
                        {typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Live Activity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ActivityIcon className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-normal tracking-wider text-muted-foreground uppercase">
                Live Activity
              </p>
            </div>
            <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCwIcon className="size-3 animate-spin" />
                    <span>Starting execution...</span>
                  </div>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className="animate-in fade-in slide-in-from-bottom-2 flex gap-3 rounded-xl border border-border/60 bg-card/50 p-3 shadow-xs backdrop-blur-md transition-all hover:shadow-sm"
                  >
                    <div className="mt-0.5 shrink-0">
                      {log.status === "success" ? (
                        <div className="flex size-6 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                          <CheckCircleIcon className="size-3.5" />
                        </div>
                      ) : log.status === "failed" ? (
                        <div className="flex size-6 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                          <XCircleIcon className="size-3.5" />
                        </div>
                      ) : (
                        <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <RefreshCwIcon className="size-3.5 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-normal break-words text-foreground">
                        {log.message}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
