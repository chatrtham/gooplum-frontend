"use client";

import { useState, useEffect, useRef } from "react";
import {
  RefreshCwIcon,
  CheckCircle2,
  XCircle,
  PlayIcon,
  ChevronDown,
  ChevronRight,
  TerminalSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  executeFlowFromArtifact,
  FlowExecutionRequestArtifact,
  isFlowExecutionArtifact,
} from "@/lib/agentFlowExecutionApi";
import type { FlowEvent } from "@/lib/flowsApi";
import { toNormalCase } from "@/lib/utils";

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
    "idle" | "running" | "completed" | "failed"
  >("idle");
  const [logs, setLogs] = useState<string[]>([]);
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
        setLogs((prev) => [...prev, event.message]);
      } else if (event.type === "complete") {
        if (event.success) {
          setStatus("completed");
          setExecutionResult(event.data);
          setLogs((prev) => [...prev, "Execution completed successfully."]);
        } else {
          setStatus("failed");
          setError(event.error || "Unknown error");
          setLogs((prev) => [
            ...prev,
            `Error: ${event.error || "Unknown error"}`,
          ]);
        }
      }
    });
  };

  // Auto-start execution when component mounts
  useEffect(() => {
    if (status === "idle" && !hasStartedRef.current && validArtifact) {
      hasStartedRef.current = true;
      startExecution();
    }
  }, [validArtifact]);

  // Return null if not a valid artifact
  if (!validArtifact) {
    return null;
  }

  return (
    <div className="mb-4 flex w-full flex-col gap-4 rounded-xl border border-border bg-card py-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
              status === "running"
                ? "bg-primary/10 text-primary"
                : status === "completed"
                  ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                  : status === "failed"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            {status === "running" ? (
              <RefreshCwIcon className="size-4 animate-spin" />
            ) : status === "completed" ? (
              <CheckCircle2 className="size-4" />
            ) : status === "failed" ? (
              <XCircle className="size-4" />
            ) : (
              <PlayIcon className="size-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {toNormalCase(validArtifact.flow_name)}
            </p>
            <p className="text-xs text-muted-foreground">
              {status === "running"
                ? "Working on it..."
                : status === "completed"
                  ? "Done"
                  : status === "failed"
                    ? "Something went wrong"
                    : "Ready"}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </div>

      {/* Parameters Preview (Collapsed) */}
      {!isExpanded && (
        <div className="px-5 text-xs text-muted-foreground">
          {Object.keys(validArtifact.parameters).length} parameters set
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-5 border-t border-border/50 px-5 pt-4">
          {/* Parameters */}
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Parameters
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs text-foreground">
              <pre className="overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(validArtifact.parameters, null, 2)}
              </pre>
            </div>
          </div>

          {/* Logs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TerminalSquare className="size-3 text-muted-foreground" />
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Activity Log
              </p>
            </div>
            <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs text-foreground">
              {logs.length === 0 ? (
                <span className="text-muted-foreground">
                  Waiting for activity...
                </span>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className="border-l-2 border-transparent pl-2 break-words whitespace-pre-wrap hover:border-primary/20"
                  >
                    <span className="mr-2 text-muted-foreground select-none">
                      {new Date().toLocaleTimeString([], {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Result */}
          {status === "completed" && executionResult && (
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Output
              </p>
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-xs">
                <pre className="overflow-x-auto whitespace-pre-wrap text-green-700 dark:text-green-400">
                  {typeof executionResult === "object"
                    ? JSON.stringify(executionResult, null, 2)
                    : String(executionResult)}
                </pre>
              </div>
            </div>
          )}

          {/* Error */}
          {status === "failed" && error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              <p className="mb-1 font-medium">What went wrong:</p>
              <p className="font-mono">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={startExecution}
                className="mt-3 h-7 border-destructive/20 text-xs hover:bg-destructive/10 hover:text-destructive"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
