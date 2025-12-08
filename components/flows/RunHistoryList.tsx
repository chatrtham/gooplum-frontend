import React from "react";
import { FlowRun } from "@/lib/flowsApi";
import {
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RunHistoryListProps {
  runs: FlowRun[];
  onSelectRun: (run: FlowRun) => void;
  selectedRunId?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function RunHistoryList({
  runs,
  onSelectRun,
  selectedRunId,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: RunHistoryListProps) {
  if (runs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <div className="mb-3 rounded-full bg-muted p-3">
          <ClockIcon className="size-6 opacity-40" />
        </div>
        <p className="font-medium">No run history available</p>
        <p className="mt-1 text-sm font-normal">
          Run this flow to see history here.
        </p>
      </div>
    );
  }

  const PaginationControls = ({ className }: { className?: string }) => {
    if (totalPages <= 1 || !onPageChange) return null;

    return (
      <div className={cn("flex items-center justify-between py-2", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onPageChange(currentPage - 1);
          }}
          disabled={currentPage <= 1}
          className="h-8 px-2 text-muted-foreground"
        >
          <ChevronLeftIcon className="mr-1 size-4" />
          Prev
        </Button>
        <span className="text-xs font-medium text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onPageChange(currentPage + 1);
          }}
          disabled={currentPage >= totalPages}
          className="h-8 px-2 text-muted-foreground"
        >
          Next
          <ChevronRightIcon className="ml-1 size-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto pt-1 pr-1">
        {runs.map((run) => {
          const isRunning = run.status === "RUNNING";
          const isLogicalSuccess =
            run.status === "COMPLETED" && run.result?.status !== "failed";
          const isFailed =
            run.status === "FAILED" || (!isRunning && !isLogicalSuccess);

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
                "group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm",
                selectedRunId === run.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isLogicalSuccess ? (
                    <Badge
                      variant="outline"
                      className="h-5 border-green-500/20 bg-green-500/10 px-1.5 text-[10px] font-bold tracking-wider text-green-600 uppercase dark:bg-green-500/20 dark:text-green-400"
                    >
                      Success
                    </Badge>
                  ) : isFailed ? (
                    <Badge
                      variant="destructive"
                      className="h-5 px-1.5 text-[10px] font-bold tracking-wider uppercase"
                    >
                      Failed
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="h-5 animate-pulse px-1.5 text-[10px] font-bold tracking-wider uppercase"
                    >
                      Running
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(run.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </span>
                </div>
                <ArrowRightIcon
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    selectedRunId === run.id
                      ? "opacity-100"
                      : "opacity-0 group-hover:translate-x-1 group-hover:opacity-100",
                  )}
                />
              </div>

              <p className="line-clamp-2 text-sm leading-snug font-normal">
                {summary ||
                  (isLogicalSuccess
                    ? "Completed successfully"
                    : "Execution failed")}
              </p>

              {run.execution_time_ms && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ClockIcon className="size-3" />
                  <span className="font-mono tabular-nums">
                    {(run.execution_time_ms / 1000).toFixed(2)}s
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <PaginationControls className="mt-2 border-t pt-2" />
    </div>
  );
}
