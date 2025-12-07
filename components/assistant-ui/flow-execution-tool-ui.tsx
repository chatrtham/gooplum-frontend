"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2,
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
    <div className="mb-4 flex w-full flex-col gap-4 rounded-lg border border-border bg-muted/30 py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-8 items-center justify-center rounded-full ${
              status === "running"
                ? "bg-blue-100 text-blue-600"
                : status === "completed"
                  ? "bg-green-100 text-green-600"
                  : status === "failed"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
            }`}
          >
            {status === "running" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : status === "completed" ? (
              <CheckCircle2 className="size-4" />
            ) : status === "failed" ? (
              <XCircle className="size-4" />
            ) : (
              <PlayIcon className="size-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              Executing Flow: {validArtifact.flow_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {status === "running"
                ? "Running..."
                : status === "completed"
                  ? "Completed"
                  : status === "failed"
                    ? "Failed"
                    : "Ready to start"}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 p-0"
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
        <div className="px-4 text-xs text-muted-foreground">
          {Object.keys(validArtifact.parameters).length} parameters
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-4 border-t border-border/50 px-4 pt-4">
          {/* Parameters */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Parameters
            </p>
            <div className="rounded-md border border-border bg-background p-2 font-mono text-xs">
              <pre className="overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(validArtifact.parameters, null, 2)}
              </pre>
            </div>
          </div>

          {/* Logs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TerminalSquare className="size-3 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                Execution Logs
              </p>
            </div>
            <div className="max-h-[200px] overflow-y-auto rounded-md bg-black/90 p-3 font-mono text-xs text-green-400 shadow-inner">
              {logs.length === 0 ? (
                <span className="text-gray-500">Waiting for logs...</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="break-words whitespace-pre-wrap">
                    <span className="mr-2 text-gray-500">
                      [{new Date().toLocaleTimeString()}]
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
              <p className="text-xs font-medium text-muted-foreground">
                Result
              </p>
              <div className="rounded-md border border-green-100 bg-green-50/50 p-3 text-xs">
                <pre className="overflow-x-auto whitespace-pre-wrap text-green-900">
                  {typeof executionResult === "object"
                    ? JSON.stringify(executionResult, null, 2)
                    : String(executionResult)}
                </pre>
              </div>
            </div>
          )}

          {/* Error */}
          {status === "failed" && error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={startExecution}
                className="mt-2 h-6 border-destructive/30 text-xs hover:bg-destructive/20"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
