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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

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
  const [selectedRun, setSelectedRun] = useState<FlowRun | null>(null);
  const [selectedRunDetails, setSelectedRunDetails] = useState<FlowRun | null>(
    null,
  );

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

  const fetchRunHistory = async () => {
    try {
      const runs = await flowsAPI.getFlowRuns(flowId);
      setRunHistory(runs);
    } catch (err) {
      console.error("Failed to fetch run history:", err);
    }
  };

  useEffect(() => {
    fetchFlowData();
    fetchRunHistory();
  }, [flowId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCwIcon className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading flow details...</p>
        </div>
      </div>
    );
  }

  if (error || !flowSchema) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
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
    if (confirm("Are you sure you want to delete this flow?")) {
      try {
        await flowsAPI.deleteFlow(flowId);
        router.push("/");
      } catch (err) {
        alert(
          `Failed to delete flow: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
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
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeftIcon className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {flowSchema.name}
            </h1>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {flowSchema.description}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <TrashIcon className="mr-2 size-4" />
          Delete Flow
        </Button>
      </header>

      {/* Main Content - Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Configuration (40%) */}
        <div className="flex w-[400px] min-w-[350px] flex-col border-r border-border bg-card lg:w-[450px]">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <PlayIcon className="size-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Flow Inputs</h2>
              </div>

              <div className="space-y-5">
                {flowSchema.parameters &&
                Object.keys(flowSchema.parameters).length > 0 ? (
                  Object.entries(flowSchema.parameters).map(
                    ([paramName, paramSchema]) => {
                      const isRequired = paramSchema.required || false;

                      return (
                        <div key={paramName} className="space-y-2">
                          <Label
                            htmlFor={paramName}
                            className="text-sm font-medium text-foreground"
                          >
                            {paramName}
                            {isRequired && (
                              <span className="ml-1 text-destructive">*</span>
                            )}
                          </Label>

                          {paramSchema.description && (
                            <p className="text-xs text-muted-foreground">
                              {paramSchema.description}
                            </p>
                          )}

                          {paramSchema.type === "boolean" ? (
                            <div className="flex items-center space-x-2 rounded-md border border-input p-3">
                              <Checkbox
                                id={paramName}
                                checked={Boolean(formData[paramName])}
                                onCheckedChange={(checked) =>
                                  handleInputChange(paramName, checked)
                                }
                              />
                              <Label
                                htmlFor={paramName}
                                className="cursor-pointer text-sm text-muted-foreground"
                              >
                                {paramSchema.description ||
                                  "Enable this option"}
                              </Label>
                            </div>
                          ) : (
                            <Input
                              id={paramName}
                              type={
                                paramSchema.type === "integer" ||
                                paramSchema.type === "number"
                                  ? "number"
                                  : "text"
                              }
                              value={formData[paramName] || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  paramName,
                                  paramSchema.type === "integer" ||
                                    paramSchema.type === "number"
                                    ? Number(e.target.value)
                                    : e.target.value,
                                )
                              }
                              placeholder={`Enter ${paramName}...`}
                              className="bg-background"
                            />
                          )}
                        </div>
                      );
                    },
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <div className="mb-4 rounded-full bg-muted p-3">
                      <PlayIcon className="size-6 opacity-20" />
                    </div>
                    <p className="text-sm">
                      This flow does not require any inputs. You can click the
                      "Run Flow" button below to execute it.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Footer for Run Button */}
          <div className="border-t border-border bg-card p-4">
            <Button
              onClick={handleRunFlow}
              disabled={executionState.isExecuting}
              className="w-full text-base font-medium shadow-xs"
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

        {/* Right Panel - Output & Context (60%) */}
        <div className="flex flex-1 flex-col bg-muted/30">
          {/* Tabs Header */}
          <div className="flex items-center border-b border-border bg-card px-4">
            <button
              onClick={() => setActiveTab("output")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "output"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <FileTextIcon className="size-4" />
              Output
            </button>
            <button
              onClick={() => setActiveTab("explanation")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "explanation"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <BookOpenIcon className="size-4" />
              How it Works
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <HistoryIcon className="size-4" />
              Run History
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "output" && (
              <div className="mx-auto max-w-3xl space-y-6">
                {/* Status Banner */}
                {executionState.isExecuting && (
                  <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-primary">
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
                          "flex items-start gap-3 rounded-lg border p-4",
                          isFlowSuccessful
                            ? "border-success/20 bg-success/5 text-success"
                            : "border-destructive/20 bg-destructive/5 text-destructive",
                        )}
                      >
                        <div className="shrink-0">
                          {isFlowSuccessful ? (
                            <CheckCircleIcon className="size-5" />
                          ) : (
                            <XCircleIcon className="size-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{summary}</p>
                        </div>
                        <span className="ml-auto text-sm whitespace-nowrap opacity-80">
                          {executionState.result.execution_time.toFixed(2)}s
                        </span>
                      </div>
                    );
                  })()}

                {executionState.error && !executionState.result && (
                  <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-destructive">
                    <AlertCircleIcon className="size-5" />
                    <span className="font-medium">{executionState.error}</span>
                  </div>
                )}

                {/* Streaming Logs */}
                {(streamEvents.length > 0 || executionState.isExecuting) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <ActivityIcon className="size-4" />
                      <span>Activities</span>
                    </div>

                    <div className="space-y-3">
                      {streamEvents.length === 0 &&
                        executionState.isExecuting && (
                          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCwIcon className="size-3 animate-spin" />
                              <span>Starting execution...</span>
                            </div>
                          </div>
                        )}

                      {streamEvents.map((event, index) => (
                        <div
                          key={index}
                          className="flex gap-3 rounded-lg border border-border bg-card p-3 shadow-xs transition-all hover:shadow-sm"
                        >
                          <div className="mt-0.5 shrink-0">
                            {event.status === "success" ? (
                              <div className="flex size-6 items-center justify-center rounded-full bg-success/10 text-success">
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
                            <p className="text-sm break-words text-foreground">
                              {event.message}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
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
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <div className="mb-4 rounded-full bg-muted p-4">
                        <PlayIcon className="size-8 opacity-20" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground">
                        Ready to Start
                      </h3>
                      <p className="max-w-sm">
                        {flowSchema?.parameters &&
                        Object.keys(flowSchema.parameters).length > 0
                          ? 'Fill in the inputs on the left and click "Run Flow" to get started.'
                          : 'Click "Run Flow" to get started'}
                      </p>
                      <button
                        onClick={() => setActiveTab("explanation")}
                        className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 hover:underline"
                      >
                        <BookOpenIcon className="size-3" />
                        See how this flow works
                      </button>
                    </div>
                  )}
              </div>
            )}

            {activeTab === "explanation" && (
              <div className="mx-auto max-w-3xl">
                <FlowExplanation explanation={explanation} />
              </div>
            )}

            {activeTab === "history" && (
              <div className="mx-auto max-w-3xl">
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
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
