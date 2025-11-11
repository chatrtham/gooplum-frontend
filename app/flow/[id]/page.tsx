"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  TrashIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  AlertCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { flowsAPI, FlowSchema, ExecutionResponse } from "@/lib/flowsApi";
import MarkdownPreview from "@uiw/react-markdown-preview";
import "./markdown.css";

interface FlowExecutionState {
  isExecuting: boolean;
  result: ExecutionResponse | null;
  error: string | null;
}

export default function FlowDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
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

  // Fetch flow data from API
  const fetchFlowData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch flow schema and explanation in parallel
      const [schemaData, explanationData] = await Promise.all([
        flowsAPI.getFlowSchema(flowId),
        flowsAPI
          .getFlowExplanation(flowId)
          .catch(() => ({
            explanation: "No explanation available for this flow.",
          })),
      ]);

      setFlowSchema(schemaData);
      setExplanation(explanationData.explanation);

      // Initialize form data with default values from schema
      const initialData: Record<string, any> = {};
      Object.entries(schemaData.parameters.properties).forEach(
        ([paramName, paramSchema]) => {
          initialData[paramName] =
            paramSchema.default !== undefined
              ? paramSchema.default
              : paramSchema.type === "boolean"
                ? false
                : "";
        },
      );
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

  useEffect(() => {
    fetchFlowData();
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

      // Execute the flow
      const result = await flowsAPI.executeFlow(flowId, formData);

      setExecutionState({
        isExecuting: false,
        result,
        error: result.success ? null : result.error || "Unknown error",
      });
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeftIcon className="size-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-foreground">
                {flowSchema.name}
              </h1>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <TrashIcon className="mr-2 size-4" />
              Delete
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Execution Form */}
        <Card className="border-border bg-card p-6 shadow-sm">
          <div className="space-y-6">
            {/* Form Header */}
            <div className="flex items-center gap-2">
              <PlayIcon className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Run Flow
              </h2>
              {flowSchema.description && (
                <p className="text-sm text-muted-foreground">
                  {flowSchema.description}
                </p>
              )}
            </div>

            {/* Dynamic Input Fields */}
            <div className="space-y-4">
              {Object.entries(flowSchema.parameters.properties).map(
                ([paramName, paramSchema]) => {
                  const isRequired =
                    flowSchema.parameters.required.includes(paramName);

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
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={paramName}
                            checked={Boolean(formData[paramName])}
                            onCheckedChange={(checked) =>
                              handleInputChange(paramName, checked)
                            }
                          />
                          <Label
                            htmlFor={paramName}
                            className="text-sm text-muted-foreground"
                          >
                            {paramSchema.description || "Enable this option"}
                          </Label>
                        </div>
                      ) : paramSchema.type === "integer" ||
                        paramSchema.type === "number" ? (
                        <Input
                          id={paramName}
                          type="number"
                          placeholder={
                            paramSchema.description || `Enter ${paramName}`
                          }
                          value={
                            formData[paramName] ?? paramSchema.default ?? ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              paramName,
                              paramSchema.type === "integer"
                                ? parseInt(e.target.value) || 0
                                : parseFloat(e.target.value) || 0,
                            )
                          }
                          className="border-border bg-background"
                        />
                      ) : paramSchema.type === "object" ||
                        paramSchema.type === "array" ? (
                        <textarea
                          id={paramName}
                          placeholder={
                            paramSchema.description ||
                            `Enter ${paramName} as JSON`
                          }
                          value={JSON.stringify(
                            formData[paramName] || paramSchema.default || {},
                            null,
                            2,
                          )}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              handleInputChange(paramName, parsed);
                            } catch (e) {
                              // Invalid JSON, ignore
                            }
                          }}
                          className="h-24 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
                        />
                      ) : (
                        <Input
                          id={paramName}
                          type="text"
                          placeholder={
                            paramSchema.description || `Enter ${paramName}`
                          }
                          value={
                            formData[paramName] ?? paramSchema.default ?? ""
                          }
                          onChange={(e) =>
                            handleInputChange(paramName, e.target.value)
                          }
                          className="border-border bg-background"
                        />
                      )}
                    </div>
                  );
                },
              )}
            </div>

            {/* Execution Result/Error Display */}
            {executionState.error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircleIcon className="mt-0.5 size-5 text-destructive" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-destructive">
                      Execution Failed
                    </h4>
                    <p className="mt-1 text-sm text-destructive/80">
                      {executionState.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {executionState.result && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                <h4 className="mb-2 font-semibold text-green-700">
                  Execution Successful
                </h4>
                <p className="mb-2 text-sm text-green-600">
                  Executed in {executionState.result.execution_time.toFixed(2)}s
                </p>
                {executionState.result.data && (
                  <div className="mt-3">
                    <h5 className="mb-1 text-sm font-medium text-green-700">
                      Result:
                    </h5>
                    <pre className="overflow-x-auto rounded border border-green-500/20 bg-white/50 p-2 text-xs">
                      {JSON.stringify(executionState.result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Run Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleRunFlow}
                disabled={executionState.isExecuting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                size="lg"
              >
                {executionState.isExecuting ? (
                  <>
                    <RefreshCwIcon className="mr-2 size-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 size-4" />
                    Run Flow
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Collapsible Details Section */}
        <Card className="overflow-hidden border-border bg-card shadow-xs">
          <button
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                What does this flow do?
              </span>
            </div>
            {isDetailsExpanded ? (
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            )}
          </button>

          {isDetailsExpanded && (
            <div className="border-t border-border px-6 pb-6">
              <div className="mt-4 text-foreground">
                <MarkdownPreview
                  source={explanation}
                  className="markdown-custom"
                  data-color-mode="auto"
                />
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
