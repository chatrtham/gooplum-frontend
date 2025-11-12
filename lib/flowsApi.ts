// Flow API Service - Connects to the Flow Execution Service backend

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:2024";

export interface FlowInfo {
  id: string;
  name: string;
  description: string;
  parameter_count: number;
  required_parameters: number;
  return_type: string;
  created_at?: string; // ISO timestamp
  last_executed?: string; // ISO timestamp
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastExecuted?: string;
}

export interface FlowSchema {
  id: string;
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<
      string,
      {
        type: "string" | "integer" | "number" | "boolean" | "array" | "object";
        description?: string;
        default?: any;
      }
    >;
    required: string[];
  };
  return_type: string;
  created_at?: string; // ISO timestamp
  last_executed?: string; // ISO timestamp
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

// Transform FlowInfo from API to our Flow interface
const transformFlowInfo = (flowInfo: FlowInfo): Flow => ({
  id: flowInfo.id,
  name: flowInfo.name,
  description: flowInfo.description,
  createdAt: flowInfo.created_at
    ? new Date(flowInfo.created_at).toLocaleDateString()
    : "Recently",
  lastExecuted: flowInfo.last_executed
    ? new Date(flowInfo.last_executed).toLocaleDateString()
    : undefined,
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

  // Get all available flows
  async getFlows(): Promise<Flow[]> {
    try {
      const response = await fetch(`${BASE_URL}/flows/`);
      const flowInfos: FlowInfo[] =
        await this.handleResponse<FlowInfo[]>(response);
      return flowInfos.map(transformFlowInfo);
    } catch (error) {
      console.error("Failed to fetch flows:", error);
      return [];
    }
  }

  // Get detailed schema for a specific flow
  async getFlowSchema(flowId: string): Promise<FlowSchema> {
    const response = await fetch(`${BASE_URL}/flows/${flowId}`);
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
  async executeFlowStreaming(
    flowId: string,
    parameters: Record<string, any>,
    onEvent: (event: any) => void,
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
      onEvent({
        type: "error",
        message: error instanceof Error ? error.message : "Streaming failed",
      });
    }
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
