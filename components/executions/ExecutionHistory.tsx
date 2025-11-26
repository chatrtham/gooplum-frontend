"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Filter, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { flowsAPI, FlowExecution, ExecutionStatus } from "@/lib/flowsApi";
import { cn } from "@/lib/utils";

interface ExecutionHistoryProps {
  flowId?: string;
  global?: boolean;
  className?: string;
  onExecutionSelect?: (execution: FlowExecution) => void;
}

interface ExecutionRowProps {
  execution: FlowExecution;
  onClick?: () => void;
  className?: string;
}

const ExecutionRow: React.FC<ExecutionRowProps> = ({ execution, onClick, className }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (executionTimeMs?: number) => {
    if (!executionTimeMs) return "N/A";
    if (executionTimeMs < 1000) return `${executionTimeMs}ms`;
    return `${(executionTimeMs / 1000).toFixed(1)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/50 cursor-pointer transition-colors",
        "first:mt-0 mt-2",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <StatusBadge status={execution.status} showIcon />

        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm text-foreground truncate">
            {execution.flow_name}
          </div>

          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatDate(execution.created_at)}
            </span>

            {execution.execution_time_ms && (
              <span>Duration: {formatDuration(execution.execution_time_ms)}</span>
            )}

            {execution.streams.length > 0 && (
              <span>{execution.streams.length} stream items</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {execution.error && (
          <div className="text-xs text-destructive max-w-48 truncate">
            {execution.error}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  flowId,
  global = false,
  className,
  onExecutionSelect,
}) => {
  const [executions, setExecutions] = useState<FlowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | "all">("all");
  const pageSize = 20;

  const fetchExecutions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = global
        ? await flowsAPI.getAllExecutions(page, pageSize, statusFilter !== "all" ? statusFilter : undefined, flowId)
        : await flowsAPI.getFlowExecutions(
            flowId!,
            page,
            pageSize,
            statusFilter !== "all" ? statusFilter : undefined
          );

      setExecutions(response.executions);
      setTotalCount(response.total_count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch executions";
      setError(errorMessage);
      console.error("Error fetching executions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, [flowId, global, page, statusFilter]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const statusOptions: (ExecutionStatus | "all")[] = [
    "all",
    "running",
    "pending",
    "completed",
    "failed",
    "cancelled",
  ];

  const handleExecutionClick = (execution: FlowExecution) => {
    onExecutionSelect?.(execution);
  };

  if (error) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-sm text-destructive mb-2">Error loading executions</div>
            <div className="text-xs text-muted-foreground">{error}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExecutions}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Status Filter:</span>
        </div>

        <div className="flex items-center gap-2">
          {statusOptions.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(status);
                setPage(1); // Reset to first page when filter changes
              }}
              className="text-xs"
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <Card className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              <span className="text-sm">Loading executions...</span>
            </div>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!loading && executions.length === 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <Clock className="size-8 mx-auto mb-3 opacity-50" />
              <div className="text-sm">
                {statusFilter === "all"
                  ? "No executions found"
                  : `No ${statusFilter} executions found`
                }
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Execution list */}
      {!loading && executions.length > 0 && (
        <Card className="p-4">
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {executions.map((execution) => (
                <ExecutionRow
                  key={execution.id}
                  execution={execution}
                  onClick={() => handleExecutionClick(execution)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} executions
              </div>

              <div className="flex items-center gap-2">
                <TooltipIconButton
                  tooltip="Previous page"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="icon"
                  className="size-8"
                >
                  <ChevronLeft className="size-4" />
                </TooltipIconButton>

                <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                  {page} / {totalPages}
                </span>

                <TooltipIconButton
                  tooltip="Next page"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="icon"
                  className="size-8"
                >
                  <ChevronRight className="size-4" />
                </TooltipIconButton>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ExecutionHistory;