"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Play, Square, Loader2, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { ExecutionHistory } from "@/components/executions/ExecutionHistory";
import { ExecutionDetails } from "@/components/executions/ExecutionDetails";
import { flowsAPI, FlowExecution, FlowSchema, ExecutionStatus } from "@/lib/flowsApi";
import { useExecutionPolling } from "@/hooks/useExecutionPolling";
import { cn } from "@/lib/utils";

interface FlowExecutorProps {
  flowId: string;
  flowName: string;
  flowSchema: FlowSchema;
  className?: string;
}

export const FlowExecutor: React.FC<FlowExecutorProps> = ({
  flowId,
  flowName,
  flowSchema,
  className,
}) => {
  const [executing, setExecuting] = useState(false);
  const [executions, setExecutions] = useState<FlowExecution[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<FlowExecution | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);

  // Use the polling hook for real-time updates
  const {
    isPolling,
    currentStatus,
    execution: currentExecution,
    error: pollingError,
    stopPolling,
  } = useExecutionPolling({
    executionId: currentExecutionId || undefined,
    enabled: !!currentExecutionId,
    onComplete: (completedExecution) => {
      setExecuting(false);
      // Add the completed execution to our list
      setExecutions(prev => [completedExecution, ...prev.slice(0, 9)]); // Keep last 10
    },
    onError: (error) => {
      console.error("Execution polling error:", error);
      setExecuting(false);
    },
    onStatusChange: (status) => {
      // We could update UI based on status changes here
    },
  });

  // Fetch initial execution history
  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        const response = await flowsAPI.getFlowExecutions(flowId, 1, 10);
        setExecutions(response.executions);
      } catch (error) {
        console.error("Error fetching execution history:", error);
      }
    };

    fetchExecutions();
  }, [flowId]);

  const executeFlow = async (parameters: Record<string, any>) => {
    setExecuting(true);
    setShowHistory(false); // Hide history when starting new execution

    try {
      // Execute the flow
      const executionResponse = await flowsAPI.executeFlow(flowId, parameters);

      if (executionResponse.success) {
        // The execution was successful, find the new execution
        // In a real implementation, the execute endpoint should return the execution_id
        // For now, we'll fetch the latest execution
        const executionsResponse = await flowsAPI.getFlowExecutions(flowId, 1, 1);
        if (executionsResponse.executions.length > 0) {
          const newExecution = executionsResponse.executions[0];
          setCurrentExecutionId(newExecution.id);
        }
      } else {
        setExecuting(false);
        // Handle execution error
        alert(`Execution failed: ${executionResponse.error}`);
      }
    } catch (error) {
      setExecuting(false);
      console.error("Error executing flow:", error);
      alert(`Error executing flow: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const cancelExecution = async () => {
    if (!currentExecutionId) return;

    try {
      await flowsAPI.cancelExecution(currentExecutionId);
      setCurrentExecutionId(null);
      setExecuting(false);
      stopPolling();
    } catch (error) {
      console.error("Error cancelling execution:", error);
    }
  };

  const handleExecutionClick = (execution: FlowExecution) => {
    setSelectedExecution(execution);
    setShowDetails(true);
  };

  const getStatusMessage = () => {
    if (!currentStatus) return "";
    switch (currentStatus) {
      case "pending":
        return "Queuing execution...";
      case "running":
        return "Executing flow...";
      case "completed":
        return "Execution completed successfully!";
      case "failed":
        return "Execution failed";
      case "cancelled":
        return "Execution cancelled";
      default:
        return "";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Execution Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{flowName}</h2>

          <div className="flex items-center gap-2">
            {executing && currentExecutionId && (
              <TooltipIconButton
                tooltip="Cancel execution"
                onClick={cancelExecution}
                variant="destructive"
                size="icon"
                className="size-8"
              >
                <Square className="size-4" />
              </TooltipIconButton>
            )}

            <TooltipIconButton
              tooltip="Show execution history"
              onClick={() => setShowHistory(!showHistory)}
              variant="outline"
              size="icon"
              className="size-8"
            >
              <History className="size-4" />
            </TooltipIconButton>
          </div>
        </div>

        {/* Real-time status display */}
        {(executing || currentExecution) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-3 rounded-lg border mb-4",
              currentStatus === "failed"
                ? "bg-destructive/10 border-destructive/20 text-destructive"
                : currentStatus === "completed"
                ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
            )}
          >
            <div className="flex items-center gap-3">
              {isPolling && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {currentStatus && (
                <StatusBadge status={currentStatus} showIcon />
              )}

              <span className="text-sm">
                {getStatusMessage()}
              </span>

              {currentExecution?.execution_time_ms && (
                <span className="text-sm opacity-75">
                  ({currentExecution.execution_time_ms}ms)
                </span>
              )}
            </div>

            {pollingError && (
              <div className="mt-2 text-sm text-destructive">
                Error: {pollingError.message}
              </div>
            )}
          </motion.div>
        )}

        {/* Recent executions preview */}
        {executions.length > 0 && !showHistory && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Recent Executions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="text-xs"
              >
                View All ({executions.length})
              </Button>
            </div>

            <div className="space-y-1">
              {executions.slice(0, 3).map((execution) => (
                <motion.div
                  key={execution.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleExecutionClick(execution)}
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status={execution.status} showIcon={false} />
                    <span className="text-sm text-muted-foreground">
                      {new Date(execution.created_at).toLocaleString()}
                    </span>
                  </div>

                  {execution.error && (
                    <span className="text-xs text-destructive truncate max-w-32">
                      {execution.error}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Full execution history */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <ExecutionHistory
            flowId={flowId}
            onExecutionSelect={handleExecutionClick}
            className="mb-6"
          />
        </motion.div>
      )}

      {/* Execution details modal */}
      <ExecutionDetails
        execution={selectedExecution}
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedExecution(null);
        }}
      />
    </div>
  );
};

export default FlowExecutor;