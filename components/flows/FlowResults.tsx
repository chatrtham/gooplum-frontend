"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { StreamMessage } from "@/lib/flowsApi";

interface FlowResultsProps {
  status: "executing" | "success" | "error";
  data?: unknown;
  stream?: StreamMessage[];
  progress?: number;
  executionTime?: number;
  error?: string;
}

export function FlowResults({
  status,
  data,
  stream,
  progress,
  executionTime,
  error,
}: FlowResultsProps) {
  if (status === "executing") {
    return (
      <div className="space-y-3">
        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {stream && stream.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Execution Log</h4>
            <div className="max-h-40 overflow-y-auto rounded-md bg-muted p-3 font-mono text-sm">
              {stream.map((entry, index) => (
                <div key={index} className="mb-1">
                  <span className="text-muted-foreground">
                    [
                    {entry.timestamp
                      ? new Date(entry.timestamp).toLocaleTimeString()
                      : new Date().toLocaleTimeString()}
                    ]
                  </span>{" "}
                  {entry.message || entry.status}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-blue-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Executing flow...</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-red-500">
          <XCircle className="h-4 w-4" />
          <span className="font-medium">Execution Failed</span>
        </div>
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm">
          <p className="text-destructive">
            {error || "An unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Execution Completed</span>
          </div>
          {executionTime && (
            <span className="text-sm text-muted-foreground">
              {executionTime.toFixed(2)}s
            </span>
          )}
        </div>

        <div className="rounded-md bg-muted p-3">
          <h4 className="mb-2 text-sm font-medium">Result</h4>
          <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
            {typeof data === "object"
              ? JSON.stringify(data, null, 2)
              : String(data)}
          </pre>
        </div>
      </div>
    );
  }

  return null;
}
