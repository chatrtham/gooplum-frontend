import { useState, useEffect, useRef, useCallback } from "react";
import { flowsAPI, ExecutionStatus, FlowExecution } from "@/lib/flowsApi";

interface UseExecutionPollingOptions {
  executionId?: string;
  enabled?: boolean;
  pollInterval?: number;
  onComplete?: (execution: FlowExecution) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: ExecutionStatus) => void;
  maxRetries?: number;
}

interface UseExecutionPollingReturn {
  isPolling: boolean;
  currentStatus: ExecutionStatus | null;
  execution: FlowExecution | null;
  error: Error | null;
  stopPolling: () => void;
  startPolling: () => void;
  retryCount: number;
}

export const useExecutionPolling = ({
  executionId,
  enabled = true,
  pollInterval = 2000,
  onComplete,
  onError,
  onStatusChange,
  maxRetries = 3,
}: UseExecutionPollingOptions = {}): UseExecutionPollingReturn => {
  const [isPolling, setIsPolling] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ExecutionStatus | null>(null);
  const [execution, setExecution] = useState<FlowExecution | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(() => {
    if (!executionId || !enabled) return;

    setIsPolling(true);
    setError(null);
    setRetryCount(0);
  }, [executionId, enabled]);

  const poll = useCallback(async () => {
    if (!executionId || !isMountedRef.current) return;

    try {
      // First get the lightweight status
      const statusResponse = await flowsAPI.getExecutionStatus(executionId);

      if (!isMountedRef.current) return;

      // Update status and notify listeners
      setCurrentStatus(statusResponse.status);
      onStatusChange?.(statusResponse.status);

      // If execution is complete, get full execution details
      if (["completed", "failed", "cancelled"].includes(statusResponse.status)) {
        const fullExecution = await flowsAPI.getExecution(executionId);

        if (!isMountedRef.current) return;

        setExecution(fullExecution);
        setCurrentStatus(statusResponse.status);
        onComplete?.(fullExecution);
        stopPolling();
        return;
      }

      // Continue polling if still running
      if (isMountedRef.current && isPolling) {
        pollTimeoutRef.current = setTimeout(poll, pollInterval);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorObj = err instanceof Error ? err : new Error("Polling failed");

      setRetryCount(prev => prev + 1);

      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        const backoffDelay = pollInterval * Math.pow(2, retryCount);
        console.warn(`Polling attempt ${retryCount + 1} failed, retrying in ${backoffDelay}ms...`);

        pollTimeoutRef.current = setTimeout(poll, backoffDelay);
      } else {
        setError(errorObj);
        onError?.(errorObj);
        stopPolling();
      }
    }
  }, [executionId, isPolling, pollInterval, maxRetries, retryCount, onComplete, onError, onStatusChange, stopPolling]);

  // Start polling when enabled and executionId is provided
  useEffect(() => {
    if (executionId && enabled) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [executionId, enabled, startPolling, stopPolling]);

  // Handle the actual polling
  useEffect(() => {
    if (isPolling && executionId) {
      // Initial poll
      poll();
    }

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [isPolling, executionId, poll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  return {
    isPolling,
    currentStatus,
    execution,
    error,
    stopPolling,
    startPolling,
    retryCount,
  };
};