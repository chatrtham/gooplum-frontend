"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  TrashIcon,
  PlayIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  FileTextIcon,
  HistoryIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon,
  ActivityIcon,
  Settings2Icon,
  WorkflowIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  flowsAPI,
  FlowSchema,
  ExecutionResponse,
  FlowStreamEvent,
  FlowRun,
} from "@/lib/flowsApi";
import { RunHistoryList } from "@/components/flows/RunHistoryList";
import { FlowExplanation } from "@/components/flows/FlowExplanation";
import { RunDetails } from "@/components/flows/RunDetails";
import { cn, toNormalCase } from "@/lib/utils";

interface FlowExecutionState {
  isExecuting: boolean;
  result: ExecutionResponse | null;
  error: string | null;
}

type TabType = "output" | "explanation" | "history";

export default function FlowDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;

  // State
  const [activeTab, setActiveTab] = useState<TabType>("output");
  const [flowSchema, setFlowSchema] = useState<FlowSchema | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [executionState, setExecutionState] = useState<FlowExecutionState>({
    isExecuting: false,
    result: null,
    error: null,
  });
  const [streamEvents, setStreamEvents] = useState<FlowStreamEvent[]>([]);
  const [runHistory, setRunHistory] = useState<FlowRun[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRuns, setTotalRuns] = useState(0);
  const pageSize = 10;
  const [selectedRun, setSelectedRun] = useState<FlowRun | null>(null);
  const [selectedRunDetails, setSelectedRunDetails] = useState<FlowRun | null>(
    null,
  );
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (activeTab === "output" && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamEvents, activeTab]);

  // Log system errors to console
  useEffect(() => {
    if (
      executionState.result &&
      !executionState.result.success &&
      executionState.result.error
    ) {
      console.error("System Error:", executionState.result.error);
    }
  }, [executionState.result]);

  // Fetch flow data from API
  const fetchFlowData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch flow schema and explanation in parallel
      const [schemaData, explanationData] = await Promise.all([
        flowsAPI.getFlowSchema(flowId),
        flowsAPI.getFlowExplanation(flowId).catch(() => ({
          explanation: "No explanation available for this flow.",
        })),
      ]);

      setFlowSchema(schemaData);
      setExplanation(explanationData.explanation);

      // Initialize form data with default values from schema
      const initialData: Record<string, any> = {};

      // The API returns parameters as a flat object: { paramName: { type, description, required, default } }
      if (schemaData.parameters) {
        Object.entries(schemaData.parameters).forEach(
          ([paramName, paramSchema]) => {
            initialData[paramName] =
              paramSchema.default !== undefined
                ? paramSchema.default
                : paramSchema.type === "boolean"
                  ? false
                  : "";
          },
        );
      } else {
        console.warn("No parameters found in schema");
      }

      setFormData(initialData);
    } catch (err) {
      console.error("Failed to fetch flow data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load flow details",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRunHistory = async (page = currentPage) => {
    try {
      const response = await flowsAPI.getFlowRuns(flowId, page, pageSize);
      setRunHistory(response.runs);
      setTotalRuns(response.total);
      setCurrentPage(response.page);
    } catch (err) {
      console.error("Failed to fetch run history:", err);
    }
  };

  useEffect(() => {
    fetchFlowData();
    fetchRunHistory(1);
  }, [flowId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCwIcon className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading flow details...</p>
        </div>
      </div>
    );
  }

  if (error || !flowSchema) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="max-w-md text-center">
          <AlertCircleIcon className="mx-auto mb-4 size-12 text-destructive" />
          <h1 className="mb-2 text-2xl font-semibold">Failed to Load Flow</h1>
          <p className="mb-4 text-muted-foreground">
            {error || "Flow not found"}
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={fetchFlowData} variant="outline">
              Try Again
            </Button>
            <Link href="/">
              <Button>Back to Flows</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRunFlow = async () => {
    try {
      setExecutionState({ isExecuting: true, result: null, error: null });
      setStreamEvents([]); // Clear previous events
      setActiveTab("output"); // Switch to output tab
      setSelectedRun(null); // Clear selected run

      // Client-side validation for required fields
      if (flowSchema?.parameters) {
        const missingFields: string[] = [];
        Object.entries(flowSchema.parameters).forEach(([key, param]) => {
          if (param.required) {
            const value = formData[key];
            if (
              value === undefined ||
              value === null ||
              (typeof value === "string" && value.trim() === "")
            ) {
              missingFields.push(key);
            }
          }
        });

        if (missingFields.length > 0) {
          setExecutionState({
            isExecuting: false,
            result: null,
            error: `Missing required fields: ${missingFields.join(", ")}`,
          });
          return;
        }
      }

      // Validate parameters first
      const validation = await flowsAPI.validateFlow(flowId, formData);
      if (!validation.is_valid) {
        setExecutionState({
          isExecuting: false,
          result: null,
          error: `Validation failed: ${validation.errors.join(", ")}`,
        });
        return;
      }

      // Execute the flow with streaming
      await flowsAPI.executeFlowStream(flowId, formData, (event) => {
        if (event.type === "stream") {
          setStreamEvents((prev) => [...prev, event]);
        } else if (event.type === "complete") {
          setExecutionState((prev) => ({
            ...prev,
            isExecuting: false,
            result: {
              success: event.success,
              data: event.data,
              error: event.error,
              execution_time: event.execution_time || 0,
              metadata: event.metadata || {},
            },
            error: event.success ? null : event.error || "Execution failed",
          }));
        }
      });

      // Refresh run history
      fetchRunHistory();
    } catch (err) {
      setExecutionState({
        isExecuting: false,
        result: null,
        error: err instanceof Error ? err.message : "Failed to execute flow",
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await flowsAPI.deleteFlow(flowId);
      router.push("/");
    } catch (err) {
      alert(
        `Failed to delete flow: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleRunSelect = async (run: FlowRun) => {
    try {
      setSelectedRun(run);
      setSelectedRunDetails(null); // Clear previous details while loading

      const runDetails = await flowsAPI.getFlowRunDetails(run.id);
      setSelectedRunDetails(runDetails);
    } catch (err) {
      console.error("Failed to load run details:", err);
    }
  };

  const handleBackToHistory = () => {
    setSelectedRun(null);
    setSelectedRunDetails(null);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-card/50 px-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-all duration-150 ease-out hover:text-foreground active:scale-[0.98]"
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <WorkflowIcon className="size-3.5" />
            </div>
            <h1 className="text-sm font-semibold tracking-tight">
              {toNormalCase(flowSchema.name)}
            </h1>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
          className="h-8 cursor-pointer text-xs font-medium text-muted-foreground transition-all duration-150 ease-out hover:text-destructive active:scale-[0.98]"
        >
          <TrashIcon className="mr-1.5 size-3.5" />
          Delete Flow
        </Button>
      </header>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangleIcon className="size-5 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight">
                  Delete Flow
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm font-normal">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-foreground">
                    "{toNormalCase(flowSchema.name)}"
                  </span>
                  ? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="flex-1 cursor-pointer transition-all duration-150 ease-out active:scale-[0.98] sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 cursor-pointer transition-all duration-150 ease-out active:scale-[0.98] sm:flex-none"
            >
              {isDeleting ? (
                <>
                  <RefreshCwIcon className="mr-1.5 size-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Flow"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Inputs (40%) */}
        <div className="w-[400px] bg-muted/20 p-3">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-sm backdrop-blur-md dark:bg-card/40">
            <div className="flex items-center gap-2 px-6 py-4 pb-3">
              <Settings2Icon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-medium tracking-tight text-foreground">
                Inputs
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {flowSchema.parameters &&
              Object.keys(flowSchema.parameters).length > 0 ? (
                <div className="space-y-5">
                  {Object.entries(flowSchema.parameters).map(([key, param]) => (
                    <div key={key} className="space-y-1.5">
                      <Label
                        htmlFor={key}
                        className="text-xs font-normal tracking-wider text-muted-foreground uppercase"
                      >
                        {key}
                        {param.required && (
                          <span className="ml-0.5 text-destructive">*</span>
                        )}
                      </Label>
                      {param.type === "boolean" ? (
                        <div className="flex h-9 items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={formData[key] || false}
                            onCheckedChange={(checked) =>
                              handleInputChange(key, checked)
                            }
                          />
                          <label
                            htmlFor={key}
                            className="text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable {key}
                          </label>
                        </div>
                      ) : (
                        <Input
                          id={key}
                          type={
                            param.type === "integer" || param.type === "number"
                              ? "number"
                              : "text"
                          }
                          placeholder={`Enter ${key}...`}
                          value={formData[key] || ""}
                          onChange={(e) =>
                            handleInputChange(key, e.target.value)
                          }
                          className="h-9 bg-background/50 font-mono text-sm"
                        />
                      )}
                      {param.description && (
                        <p className="text-[10px] text-muted-foreground/80">
                          {param.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <p className="text-sm">No inputs required for this flow.</p>
                </div>
              )}
            </div>

            <div className="border-t bg-card p-6">
              <Button
                onClick={handleRunFlow}
                disabled={executionState.isExecuting}
                className="h-11 w-full text-base font-medium shadow-sm"
                size="lg"
              >
                {executionState.isExecuting ? (
                  <>
                    <RefreshCwIcon className="mr-2 size-5 animate-spin" />
                    Running Flow...
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 size-5" />
                    Run Flow
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Output & Context (60%) */}
        <div className="flex flex-1 flex-col bg-muted/20 p-3">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-sm backdrop-blur-md dark:bg-card/40">
            {/* Tabs Header */}
            <div className="flex items-center gap-1 bg-transparent px-3 py-3">
              <button
                onClick={() => setActiveTab("output")}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium tracking-tight transition-all duration-150 ease-out active:scale-[0.98]",
                  activeTab === "output"
                    ? "bg-secondary/15 font-semibold text-secondary"
                    : "text-muted-foreground hover:bg-secondary/5 hover:text-secondary",
                )}
              >
                <FileTextIcon className="size-4" />
                Output
              </button>
              <button
                onClick={() => setActiveTab("explanation")}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium tracking-tight transition-all duration-150 ease-out active:scale-[0.98]",
                  activeTab === "explanation"
                    ? "bg-secondary/15 font-semibold text-secondary"
                    : "text-muted-foreground hover:bg-secondary/5 hover:text-secondary",
                )}
              >
                <BookOpenIcon className="size-4" />
                How it Works
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium tracking-tight transition-all duration-150 ease-out active:scale-[0.98]",
                  activeTab === "history"
                    ? "bg-secondary/15 font-semibold text-secondary"
                    : "text-muted-foreground hover:bg-secondary/5 hover:text-secondary",
                )}
              >
                <HistoryIcon className="size-4" />
                Run History
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "output" && (
                <div className="mx-auto flex h-full max-w-3xl flex-col space-y-6">
                  {/* Status Banner */}
                  {executionState.isExecuting && (
                    <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-primary">
                      <RefreshCwIcon className="size-5 animate-spin" />
                      <span className="font-medium">Running flow...</span>
                    </div>
                  )}

                  {executionState.result &&
                    (() => {
                      const resultData = executionState.result.data as any;

                      // Check if the flow returned a structured status
                      const hasInnerStatus =
                        typeof resultData === "object" &&
                        resultData !== null &&
                        "status" in resultData;

                      // Determine overall success:
                      // 1. Outer API execution must be successful
                      // 2. If inner status exists, it must be "success"
                      const isFlowSuccessful =
                        executionState.result.success &&
                        (!hasInnerStatus || resultData.status === "success");

                      let summary = "";

                      if (
                        typeof resultData === "object" &&
                        resultData !== null &&
                        "summary" in resultData
                      ) {
                        // Case 2 & Success with summary: Use the summary returned by the flow
                        summary = resultData.summary;
                      } else {
                        // Fallback (Case 1 & others)
                        summary = isFlowSuccessful
                          ? "Flow completed successfully"
                          : "Flow execution failed, please try again";
                      }

                      return (
                        <div
                          className={cn(
                            "animate-in fade-in slide-in-from-top-2 flex items-start gap-3 rounded-xl border p-5 shadow-sm",
                            isFlowSuccessful
                              ? "border-green-500/20 bg-green-500/5"
                              : "border-destructive/20 bg-destructive/5",
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-full",
                              isFlowSuccessful
                                ? "bg-green-500/10 text-green-600"
                                : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {isFlowSuccessful ? (
                              <CheckCircleIcon className="size-5" />
                            ) : (
                              <XCircleIcon className="size-5" />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <h3
                              className={cn(
                                "mb-1 leading-none font-medium",
                                isFlowSuccessful
                                  ? "text-green-700 dark:text-green-400"
                                  : "text-destructive",
                              )}
                            >
                              {isFlowSuccessful ? "Success" : "Failed"}
                            </h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {summary}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-auto">
                            {executionState.result.execution_time.toFixed(2)}s
                          </Badge>
                        </div>
                      );
                    })()}

                  {executionState.error && !executionState.result && (
                    <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-destructive">
                      <AlertCircleIcon className="size-5" />
                      <span className="font-medium">
                        {executionState.error}
                      </span>
                    </div>
                  )}

                  {/* Streaming Logs */}
                  {(streamEvents.length > 0 || executionState.isExecuting) && (
                    <div className="flex flex-1 flex-col space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <ActivityIcon className="size-4 text-muted-foreground" />
                        <span>Live Activity</span>
                      </div>

                      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                        {streamEvents.length === 0 &&
                          executionState.isExecuting && (
                            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCwIcon className="size-3 animate-spin" />
                                <span>Starting execution...</span>
                              </div>
                            </div>
                          )}

                        {streamEvents.map((event, index) => (
                          <div
                            key={index}
                            className="animate-in fade-in slide-in-from-bottom-2 flex gap-3 rounded-xl border border-border/60 bg-card/50 p-3 shadow-xs backdrop-blur-md transition-all hover:shadow-sm"
                          >
                            <div className="mt-0.5 shrink-0">
                              {event.status === "success" ? (
                                <div className="flex size-6 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                                  <CheckCircleIcon className="size-3.5" />
                                </div>
                              ) : event.status === "failed" ? (
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
                                {event.message}
                              </p>
                              <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={logsEndRef} />
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!executionState.isExecuting &&
                    !executionState.result &&
                    !executionState.error && (
                      <div className="flex h-full flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <div className="mb-6 rounded-full bg-secondary/10 p-6">
                          <PlayIcon className="size-10 text-secondary opacity-60" />
                        </div>
                        <h3 className="text-xl font-medium tracking-tight text-foreground">
                          Ready to Start
                        </h3>
                        <p className="mt-2 mb-6 max-w-lg font-normal whitespace-nowrap">
                          {flowSchema?.parameters &&
                          Object.keys(flowSchema.parameters).length > 0
                            ? 'Fill in the inputs on the left and click "Run Flow" to get started.'
                            : 'Click "Run Flow" to get started'}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("explanation")}
                          className="gap-2"
                        >
                          <BookOpenIcon className="size-4" />
                          See how this flow works
                        </Button>
                      </div>
                    )}
                </div>
              )}

              {activeTab === "explanation" && (
                <div className="mx-auto h-full max-w-3xl">
                  <FlowExplanation explanation={explanation} />
                </div>
              )}

              {activeTab === "history" && (
                <div className="mx-auto h-full max-w-3xl pt-2">
                  {selectedRun ? (
                    selectedRunDetails ? (
                      <RunDetails
                        run={selectedRunDetails}
                        onBack={handleBackToHistory}
                      />
                    ) : (
                      <div className="flex justify-center py-12">
                        <RefreshCwIcon className="size-8 animate-spin text-primary" />
                      </div>
                    )
                  ) : (
                    <RunHistoryList
                      runs={runHistory}
                      onSelectRun={handleRunSelect}
                      currentPage={currentPage}
                      totalPages={Math.ceil(totalRuns / pageSize)}
                      onPageChange={(page) => fetchRunHistory(page)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
