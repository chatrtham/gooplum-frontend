import React from "react";
import { FlowRun } from "@/lib/flowsApi";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ClipboardListIcon,
  ActivityIcon,
  RefreshCwIcon,
  ClockIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="-ml-2 h-8 w-8 rounded-full"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div>
          <h2 className="text-lg leading-none font-semibold">
            Activity Details
          </h2>
        </div>
        <div className="ml-auto">
          {isSuccess ? (
            <Badge
              variant="outline"
              className="border-green-500/20 bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400"
            >
              Done
            </Badge>
          ) : isFailed ? (
            <Badge variant="destructive">Stopped</Badge>
          ) : (
            <Badge variant="secondary" className="animate-pulse">
              Working...
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2">
        {/* Status Card */}
        <div
          className={cn(
            "flex flex-col gap-3 rounded-xl border p-5",
            isSuccess
              ? "border-green-500/20 bg-green-500/5"
              : isFailed
                ? "border-destructive/20 bg-destructive/5"
                : "border-primary/20 bg-primary/5",
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                isSuccess
                  ? "bg-green-500/10 text-green-600"
                  : isFailed
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary",
              )}
            >
              {isSuccess ? (
                <CheckCircleIcon className="size-5" />
              ) : isFailed ? (
                <XCircleIcon className="size-5" />
              ) : (
                <RefreshCwIcon className="size-5 animate-spin" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <h3
                className={cn(
                  "mb-1 leading-none font-medium",
                  isSuccess
                    ? "text-green-700 dark:text-green-400"
                    : isFailed
                      ? "text-destructive"
                      : "text-primary",
                )}
              >
                {isSuccess ? "Success" : isFailed ? "Stopped" : "Working..."}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {summary ||
                  (isSuccess
                    ? "Everything went well."
                    : isFailed
                      ? "Something went wrong."
                      : "Working on it...")}
              </p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="size-4 opacity-70" />
              <span>{new Date(run.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClockIcon className="size-4 opacity-70" />
              <span>
                {run.execution_time_ms
                  ? `${(run.execution_time_ms / 1000).toFixed(2)}s duration`
                  : isRunning
                    ? "Running..."
                    : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Inputs Section */}
        {run.parameters && Object.keys(run.parameters).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardListIcon className="size-4" />
              <span>Inputs</span>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/50 p-4 shadow-sm backdrop-blur-md">
              <div className="grid gap-4">
                {Object.entries(run.parameters).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <p className="text-xs font-normal tracking-wider text-muted-foreground uppercase">
                      {key}
                    </p>
                    <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2 font-mono text-sm break-words text-foreground shadow-sm">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </div>
                  </div>
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
                  className="flex gap-3 rounded-xl border border-border/60 bg-card/50 p-3 shadow-xs backdrop-blur-md transition-all hover:shadow-sm"
                >
                  <div className="mt-0.5 shrink-0">
                    {event.payload.status === "success" ? (
                      <div className="flex size-6 items-center justify-center rounded-full bg-green-500/10 text-green-600">
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
                    <p className="text-sm font-normal break-words text-foreground">
                      {event.payload.message}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
