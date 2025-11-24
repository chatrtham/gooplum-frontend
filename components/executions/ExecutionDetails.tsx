"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Clock, CheckCircle, XCircle, AlertCircle, Calendar, ChevronDown, ChevronUp, Copy } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { flowsAPI, FlowExecution, StreamItem } from "@/lib/flowsApi";
import { cn } from "@/lib/utils";

interface ExecutionDetailsProps {
  execution: FlowExecution | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: string) => void;
}

interface StreamItemRowProps {
  stream: StreamItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const StreamItemRow: React.FC<StreamItemRowProps> = ({ stream, index, isExpanded, onToggle }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="size-3 text-green-500" />;
      case "error":
        return <XCircle className="size-3 text-red-500" />;
      case "running":
        return <div className="size-3 animate-spin rounded-full border border-blue-500 border-t-transparent" />;
      case "pending":
        return <AlertCircle className="size-3 text-yellow-500" />;
      default:
        return <div className="size-3 border-2 border-gray-300 rounded-full" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="border border-border rounded-lg overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {getStatusIcon(stream.status)}
          <span className="font-medium text-sm">Item {index + 1}</span>
          <span className={cn(
          "text-xs px-2 py-1 rounded-full font-medium",
          stream.status === "success" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
          stream.status === "error" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
          stream.status === "running" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
          stream.status === "pending" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
        )}>
          {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
        </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(stream.timestamp)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
          >
            {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-3 space-y-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Message</div>
                <div className="text-sm text-foreground">{stream.message}</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground">Input Data</div>
                  <TooltipIconButton
                    tooltip="Copy input data"
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(stream.input, null, 2))}
                    variant="ghost"
                    size="icon"
                    className="size-6"
                  >
                    <Copy className="size-3" />
                  </TooltipIconButton>
                </div>
                <pre className="text-xs bg-background border border-border rounded p-2 overflow-auto max-h-48">
                  {JSON.stringify(stream.input, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const ExecutionDetails: React.FC<ExecutionDetailsProps> = ({
  execution,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [currentExecution, setCurrentExecution] = useState<FlowExecution | null>(execution);
  const [expandedStreamItems, setExpandedStreamItems] = useState<Record<number, boolean>>({});
  const [isPolling, setIsPolling] = useState(false);

  // Update current execution when prop changes
  useEffect(() => {
    setCurrentExecution(execution);
  }, [execution]);

  // Start polling if execution is running
  useEffect(() => {
    if (!currentExecution || !["pending", "running"].includes(currentExecution.status)) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await flowsAPI.getExecutionStatus(currentExecution.id);
        const fullExecution = await flowsAPI.getExecution(currentExecution.id);

        setCurrentExecution(fullExecution);
        onStatusChange?.(statusResponse.status);

        if (["completed", "failed", "cancelled"].includes(statusResponse.status)) {
          setIsPolling(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Error polling execution status:", error);
        setIsPolling(false);
        clearInterval(pollInterval);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [currentExecution?.id, currentExecution?.status, onStatusChange]);

  const toggleStreamItem = (index: number) => {
    setExpandedStreamItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (executionTimeMs?: number) => {
    if (!executionTimeMs) return "N/A";
    if (executionTimeMs < 1000) return `${executionTimeMs}ms`;
    if (executionTimeMs < 60000) return `${(executionTimeMs / 1000).toFixed(1)}s`;
    return `${(executionTimeMs / 60000).toFixed(1)}m`;
  };

  if (!currentExecution) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg">Execution Details</DialogTitle>
            <StatusBadge status={currentExecution.status} showIcon />
            {isPolling && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                Live
              </div>
            )}
          </div>

          <TooltipIconButton
            tooltip="Close"
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <X className="size-4" />
          </TooltipIconButton>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Flow</div>
                <div className="text-foreground">{currentExecution.flow_name}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Duration</div>
                <div className="text-foreground">
                  {formatDuration(currentExecution.execution_time_ms)}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="size-3" />
                  Created
                </div>
                <div className="text-foreground">{formatDate(currentExecution.created_at)}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="size-3" />
                  Started
                </div>
                <div className="text-foreground">{formatDate(currentExecution.started_at)}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Completed</div>
                <div className="text-foreground">{formatDate(currentExecution.completed_at)}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Success</div>
                <div className={cn(
                  "font-medium",
                  currentExecution.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {currentExecution.success ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </Card>

          {/* Error Display */}
          {currentExecution.error && (
            <Card className="p-4 border-destructive bg-destructive/5 dark:bg-destructive/10">
              <h3 className="font-semibold text-destructive mb-3">Error</h3>
              <pre className="text-sm text-destructive whitespace-pre-wrap">
                {currentExecution.error}
              </pre>
            </Card>
          )}

          {/* Parameters */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Parameters</h3>
              <TooltipIconButton
                tooltip="Copy parameters"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(currentExecution.parameters, null, 2))}
                variant="ghost"
                size="icon"
                className="size-6"
              >
                <Copy className="size-3" />
              </TooltipIconButton>
            </div>
            <pre className="text-xs bg-muted/30 border border-border rounded p-3 overflow-auto max-h-48">
              {JSON.stringify(currentExecution.parameters, null, 2)}
            </pre>
          </Card>

          {/* Stream Progress */}
          {currentExecution.streams && currentExecution.streams.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  Stream Progress ({currentExecution.streams.length} items)
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedStreamItems({})}
                >
                  Collapse All
                </Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentExecution.streams.map((stream, index) => (
                  <StreamItemRow
                    key={index}
                    stream={stream}
                    index={index}
                    isExpanded={expandedStreamItems[index] || false}
                    onToggle={() => toggleStreamItem(index)}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Result */}
          {currentExecution.result && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Result</h3>
                <TooltipIconButton
                  tooltip="Copy result"
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(currentExecution.result, null, 2))}
                  variant="ghost"
                  size="icon"
                  className="size-6"
                >
                  <Copy className="size-3" />
                </TooltipIconButton>
              </div>
              <pre className="text-xs bg-muted/30 border border-border rounded p-3 overflow-auto max-h-64">
                {JSON.stringify(currentExecution.result, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExecutionDetails;