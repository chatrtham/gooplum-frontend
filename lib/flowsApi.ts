// Flow API Service - Connects to the Flow Execution Service backend

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:2024";

export interface FlowInfo {
  id: string;
  name: string;
  description: string;
  created_at?: string; // ISO timestamp
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface FlowSchema {
  id: string;
  name: string;
  description: string;
  parameters: Record<
    string,
    {
      type: "string" | "integer" | "number" | "boolean" | "array" | "object";
      description?: string;
      required?: boolean;
      default?: any;
    }
  >;
  return_type: string;
  created_at?: string; // ISO timestamp
}

export interface FlowExecutionRequest {
  parameters: Record<string, any>;
  timeout?: number;
}

export interface ExecutionResponse {
  success: boolean;
  data?: any;
  error?: string;
  execution_time: number;
  metadata: Record<string, any>;
}

export interface ValidationResponse {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized_parameters: Record<string, any>;
}

export interface CompilationResponse {
  success: boolean;
  flows: FlowInfo[];
  errors: string[];
  compiled_count: number;
}

export interface FlowStreamEvent {
  type: "stream";
  status: "success" | "failed";
  message: string;
  timestamp: string;
}

export interface FlowCompletionEvent {
  type: "complete";
  success: boolean;
  data?: any;
  error?: string;
  execution_time?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type FlowEvent = FlowStreamEvent | FlowCompletionEvent;

export interface FlowRun {
  id: string;
  flow_id: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  created_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  parameters?: Record<string, any>;
  result?: any;
  error?: string | null;
  metadata?: Record<string, any>;
  stream_events?: {
    id?: string;
    event_type: string;
    payload: {
      status: "success" | "failed";
      message: string;
    };
    sequence_order?: number;
    created_at: string;
  }[];
}

export interface PaginatedFlowRuns {
  runs: FlowRun[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedFlows {
  flows: FlowInfo[];
  total: number;
  offset: number;
  limit: number;
}

// Transform FlowInfo from API to our Flow interface
const transformFlowInfo = (flowInfo: FlowInfo): Flow => ({
  id: flowInfo.id,
  name: flowInfo.name,
  description: flowInfo.description,
  createdAt: flowInfo.created_at
    ? new Date(flowInfo.created_at).toLocaleDateString()
    : "Recently",
});

class FlowsAPI {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    return response.json() as Promise<T>;
  }

  // Compile flow code from Python source
  async compileFlow(
    code: string,
    flowName?: string,
  ): Promise<CompilationResponse> {
    const response = await fetch(`${BASE_URL}/flows/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, flow_name: flowName }),
    });
    return this.handleResponse<CompilationResponse>(response);
  }

  // Get paginated flows
  async getFlows(
    offset: number = 0,
    limit: number = 12,
  ): Promise<PaginatedFlows> {
    const response = await fetch(
      `${BASE_URL}/flows/?offset=${offset}&limit=${limit}`,
    );
    const paginatedFlows = await this.handleResponse<PaginatedFlows>(response);
    return paginatedFlows;
  }

  // Helper to get flows transformed to Flow[] for backwards compatibility
  async getFlowsList(offset: number = 0, limit: number = 12): Promise<Flow[]> {
    try {
      const paginatedFlows = await this.getFlows(offset, limit);
      return paginatedFlows.flows.map(transformFlowInfo);
    } catch (error) {
      console.error("Failed to fetch flows:", error);
      return [];
    }
  }

  // Get detailed schema for a specific flow
  async getFlowSchema(flowId: string): Promise<FlowSchema> {
    const response = await fetch(`${BASE_URL}/flows/${flowId}/schema`);
    return this.handleResponse<FlowSchema>(response);
  }

  // Validate flow parameters without executing
  async validateFlow(
    flowId: string,
    parameters: Record<string, any>,
  ): Promise<ValidationResponse> {
    const response = await fetch(`${BASE_URL}/flows/${flowId}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parameters),
    });
    return this.handleResponse<ValidationResponse>(response);
  }

  // Execute a flow with parameters
  async executeFlow(
    flowId: string,
    parameters: Record<string, any>,
    timeout = 300,
  ): Promise<ExecutionResponse> {
    const response = await fetch(`${BASE_URL}/flows/${flowId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parameters, timeout }),
    });
    return this.handleResponse<ExecutionResponse>(response);
  }

  // Execute a flow with streaming support
  async executeFlowStream(
    flowId: string,
    parameters: Record<string, any>,
    onEvent: (event: FlowEvent) => void,
    timeout = 300,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${BASE_URL}/flows/${flowId}/execute-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parameters, timeout }),
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
                const event = JSON.parse(line.slice(6));
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
      console.error("Streaming error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Streaming failed";

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

  // Get run history for a flow
  async getFlowRuns(
    flowId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedFlowRuns> {
    const response = await fetch(
      `${BASE_URL}/flows/${flowId}/runs?page=${page}&limit=${limit}`,
    );
    return this.handleResponse<PaginatedFlowRuns>(response);
  }

  // Get details of a specific run
  async getFlowRunDetails(runId: string): Promise<FlowRun> {
    const response = await fetch(`${BASE_URL}/flows/runs/${runId}`);
    return this.handleResponse<FlowRun>(response);
  }

  // Delete a specific flow
  async deleteFlow(
    flowId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BASE_URL}/flows/${flowId}`, {
      method: "DELETE",
    });
    return this.handleResponse<{ success: boolean; message: string }>(response);
  }

  // Clear all flows
  async clearAllFlows(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BASE_URL}/flows/`, {
      method: "DELETE",
    });
    return this.handleResponse<{ success: boolean; message: string }>(response);
  }

  // Get flow source code
  async getFlowCode(
    flowId: string,
  ): Promise<{ flow_name: string; source_code: string }> {
    const response = await fetch(`${BASE_URL}/flows/${flowId}/code`);
    return this.handleResponse<{ flow_name: string; source_code: string }>(
      response,
    );
  }

  // Get flow explanation
  async getFlowExplanation(flowId: string): Promise<{
    flow_name: string;
    explanation: string;
    created_at: string;
  }> {
    const response = await fetch(`${BASE_URL}/flows/${flowId}/explanation`);
    return this.handleResponse<{
      flow_name: string;
      explanation: string;
      created_at: string;
    }>(response);
  }

  // Regenerate flow explanation
  async regenerateFlowExplanation(flowId: string): Promise<{
    flow_name: string;
    explanation: string;
    created_at: string;
  }> {
    const response = await fetch(
      `${BASE_URL}/flows/${flowId}/regenerate-explanation`,
      {
        method: "POST",
      },
    );
    return this.handleResponse<{
      flow_name: string;
      explanation: string;
      created_at: string;
    }>(response);
  }
}

// Export a singleton instance
export const flowsAPI = new FlowsAPI();

// Types are already exported above with the 'export' keyword
