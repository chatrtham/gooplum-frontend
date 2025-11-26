import React from "react";
import { FlowRun } from "@/lib/flowsApi";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ClipboardListIcon,
  ActivityIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RunDetailsProps {
  run: FlowRun;
  onBack: () => void;
}

export function RunDetails({ run, onBack }: RunDetailsProps) {
  const isSuccess =
    run.status === "COMPLETED" && run.result?.status !== "failed";
  const isRunning = run.status === "RUNNING";
  const isFailed = run.status === "FAILED" || (!isRunning && !isSuccess);

  // Extract summary from result if available
  const summary =
    run.result && typeof run.result === "object" && "summary" in run.result
      ? run.result.summary
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">Run Details</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{new Date(run.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border p-4",
          isSuccess
            ? "border-success/20 bg-success/5 text-success"
            : isFailed
              ? "border-destructive/20 bg-destructive/5 text-destructive"
              : "border-primary/20 bg-primary/5 text-primary",
        )}
      >
        <div className="shrink-0">
          {isSuccess ? (
            <CheckCircleIcon className="size-5" />
          ) : isFailed ? (
            <XCircleIcon className="size-5" />
          ) : (
            <RefreshCwIcon className="size-5 animate-spin text-primary" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium">
            {summary ||
              (isSuccess
                ? "Flow completed successfully"
                : isFailed
                  ? "Flow execution failed"
                  : "Flow is running...")}
          </p>
        </div>
        <span className="ml-auto text-sm whitespace-nowrap opacity-80">
          {run.execution_time_ms
            ? `${(run.execution_time_ms / 1000).toFixed(2)}s`
            : isRunning
              ? "Running..."
              : "-"}
        </span>
      </div>

      {/* Inputs Section */}
      {run.parameters && Object.keys(run.parameters).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ClipboardListIcon className="size-4" />
            <span>Inputs</span>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-xs">
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 text-sm">
              {Object.entries(run.parameters).map(([key, value]) => (
                <React.Fragment key={key}>
                  <span className="font-medium text-foreground">{key}:</span>
                  <span className="font-mono break-all text-muted-foreground">
                    {String(value)}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processed Items Feed */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ActivityIcon className="size-4" />
          <span>Activities</span>
        </div>

        {!run.stream_events || run.stream_events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No activity recorded for this run.
          </div>
        ) : (
          <div className="space-y-3">
            {run.stream_events.map((event, index) => (
              <div
                key={event.id || index}
                className="flex gap-3 rounded-lg border border-border bg-card p-3 shadow-xs transition-all hover:shadow-sm"
              >
                <div className="mt-0.5 shrink-0">
                  {event.payload.status === "success" ? (
                    <div className="flex size-6 items-center justify-center rounded-full bg-success/10 text-success">
                      <CheckCircleIcon className="size-3.5" />
                    </div>
                  ) : event.payload.status === "failed" ? (
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
                  <p className="text-sm break-words text-foreground">
                    {event.payload.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
