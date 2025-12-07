// Agent Flow Execution API - Handles flow execution artifacts from agent tool calls
// When an agent calls a flow tool, it returns an artifact with a pre-generated run_id
// This API handles streaming execution using that run_id

import type { FlowEvent } from "./flowsApi";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:2024";

/**
 * Artifact returned by agent when it calls a flow tool
 * The run_id is pre-generated so the agent can later check the flow's status
 */
export interface FlowExecutionRequestArtifact {
  type: "flow_execution_request";
  flow_id: string;
  flow_name: string;
  run_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: Record<string, any>;
}

/**
 * Check if an artifact is a flow execution request
 */
export function isFlowExecutionArtifact(
  artifact: unknown,
): artifact is FlowExecutionRequestArtifact {
  return (
    typeof artifact === "object" &&
    artifact !== null &&
    (artifact as any).type === "flow_execution_request" &&
    typeof (artifact as any).flow_id === "string" &&
    typeof (artifact as any).run_id === "string"
  );
}

/**
 * Execute a flow from an agent's flow execution request artifact
 * Uses the pre-generated run_id from the artifact so the agent can track the flow's status
 *
 * @param artifact - The flow execution request artifact from the agent
 * @param onEvent - Callback for streaming events
 * @param timeout - Execution timeout in seconds (default: 300)
 */
export async function executeFlowFromArtifact(
  artifact: FlowExecutionRequestArtifact,
  onEvent: (event: FlowEvent) => void,
  timeout = 300,
): Promise<void> {
  try {
    const response = await fetch(
      `${BASE_URL}/flows/${artifact.flow_id}/execute-stream`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameters: artifact.parameters,
          timeout,
          run_id: artifact.run_id, // Use agent's pre-generated run_id!
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is missing");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as FlowEvent;
              onEvent(event);
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error("Flow execution streaming error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Flow execution failed";

    onEvent({
      type: "stream",
      status: "failed",
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });

    onEvent({
      type: "complete",
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get the status of a flow run by its run_id
 * Useful for checking flow completion status
 */
export async function getFlowRunStatus(runId: string) {
  const response = await fetch(`${BASE_URL}/flows/runs/${runId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to get run status: ${response.status}`);
  }

  return response.json();
}
