"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FlowInfo,
  StreamMessage,
  FlowParameters as FlowParametersType,
} from "@/lib/flowsApi";
import { FlowParameters } from "./FlowParameters";
import { FlowResults } from "./FlowResults";
import { useFlowSchema, useExecuteFlowStream } from "@/hooks/useFlows";
import { Play, RotateCcw } from "lucide-react";

interface FlowCardProps {
  flow: FlowInfo;
}

export function FlowCard({ flow }: FlowCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<
    "idle" | "executing" | "success" | "error"
  >("idle");
  const [executionResult, setExecutionResult] = useState<unknown>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [streamMessages, setStreamMessages] = useState<StreamMessage[]>([]);
  const [progress, setProgress] = useState<number | null>(null);

  const { data: schema } = useFlowSchema(flow.name);
  const executeFlowStream = useExecuteFlowStream();

  const handleExecute = async (params: FlowParametersType) => {
    if (!schema) return;

    setExecutionStatus("executing");
    setExecutionResult(null);
    setExecutionError(null);
    setExecutionTime(null);
    setStreamMessages([]);
    setProgress(null);
    setExpandedSection("results");

    const startTime = Date.now();

    try {
      await executeFlowStream.mutateAsync({
        flowName: flow.name,
        parameters: params,
        onMessage: (message: StreamMessage) => {
          setStreamMessages((prev) => [...prev, message]);

          if (message.type === "start") {
            // Flow execution started
          } else if (message.type === "stream") {
            // Update progress if available
            if (message.status && message.status.includes("Step")) {
              const match = message.status.match(/Step (\d+)\/(\d+)/);
              if (match) {
                const current = parseInt(match[1]);
                const total = parseInt(match[2]);
                setProgress(Math.round((current / total) * 100));
              }
            }
          } else if (message.type === "complete") {
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            setExecutionTime(duration);

            if (message.success) {
              setExecutionStatus("success");
              setExecutionResult(message.data);
            } else {
              setExecutionStatus("error");
              setExecutionError(message.error || "Execution failed");
            }
          } else if (message.type === "error") {
            setExecutionStatus("error");
            setExecutionError(message.message || "An error occurred");
          }
        },
        onError: (error: Error) => {
          setExecutionStatus("error");
          setExecutionError(error.message);
        },
      });
    } catch (error) {
      setExecutionStatus("error");
      setExecutionError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  };

  const handleRunAgain = () => {
    setExecutionStatus("idle");
    setExecutionResult(null);
    setExecutionError(null);
    setExecutionTime(null);
    setStreamMessages([]);
    setProgress(null);
    setExpandedSection("parameters");
  };

  return (
    <div className="rounded-lg border p-4 transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-medium">{flow.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{flow.description}</p>
        </div>

        <div className="flex gap-2">
          {executionStatus === "idle" && (
            <Button
              size="sm"
              onClick={() =>
                setExpandedSection(
                  expandedSection === "parameters" ? null : "parameters",
                )
              }
            >
              <Play className="mr-1 h-4 w-4" />
              Run
            </Button>
          )}

          {(executionStatus === "success" || executionStatus === "error") && (
            <Button size="sm" variant="outline" onClick={handleRunAgain}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Run Again
            </Button>
          )}
        </div>
      </div>

      <Accordion
        type="single"
        collapsible
        value={expandedSection || undefined}
        onValueChange={setExpandedSection}
      >
        {schema && (
          <AccordionItem value="parameters">
            <AccordionTrigger>Parameters</AccordionTrigger>
            <AccordionContent>
              <FlowParameters
                schema={schema}
                onSubmit={handleExecute}
                isLoading={executionStatus === "executing"}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {executionStatus !== "idle" && (
          <AccordionItem value="results">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                {executionStatus === "executing" && (
                  <>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                    Executing...
                  </>
                )}
                {executionStatus === "success" && (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Completed
                  </>
                )}
                {executionStatus === "error" && (
                  <>
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    Failed
                  </>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <FlowResults
                status={executionStatus}
                data={executionResult}
                stream={streamMessages}
                progress={progress || undefined}
                executionTime={executionTime || undefined}
                error={executionError || undefined}
              />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
