// API client for interacting with GoopLum flow backend
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Define a more flexible type for flow parameters
export type FlowParameterValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | FlowParameterValue[]
  | { [key: string]: FlowParameterValue };
export type FlowParameters = Record<string, FlowParameterValue>;

// Define a type for execution response data
export type ExecutionData = unknown;

// Define a type for stream message data
export type StreamData = unknown;

// Define the structure for parameter schema
export interface ParameterSchema {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  description?: string;
  required?: boolean;
  enum?: string[];
  default?: FlowParameterValue;
}

// Flow types based on backend models
export interface FlowInfo {
  name: string;
  description: string;
  parameter_count: number;
  required_parameters: number;
  return_type: string;
}

export interface FlowSchema {
  name: string;
  description: string;
  parameters: Record<string, ParameterSchema>;
  return_type: string;
}

export interface ExecutionResponse {
  success: boolean;
  data?: ExecutionData;
  error?: string;
  execution_time?: number;
  metadata?: FlowParameters;
}

export interface StreamMessage {
  type: "start" | "stream" | "complete" | "error";
  flow_name?: string;
  parameters?: FlowParameters;
  input?: FlowParameterValue;
  status?: string;
  message?: string;
  timestamp?: string;
  success?: boolean;
  data?: StreamData;
  error?: string;
  execution_time?: number;
  total_streams?: number;
  metadata?: FlowParameters;
}

// API functions
export const flowsApi = {
  // Get all flows
  async getFlows(): Promise<FlowInfo[]> {
    const response = await fetch(`${API_BASE_URL}/flows/`);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch flows: ${error}`);
    }
    return response.json();
  },

  // Get specific flow schema
  async getFlowSchema(flowName: string): Promise<FlowSchema> {
    const response = await fetch(`${API_BASE_URL}/flows/${flowName}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Flow '${flowName}' not found`);
      }
      const error = await response.text();
      throw new Error(`Failed to fetch flow schema: ${error}`);
    }
    return response.json();
  },

  // Execute flow
  async executeFlow(
    flowName: string,
    parameters: FlowParameters,
  ): Promise<ExecutionResponse> {
    const response = await fetch(`${API_BASE_URL}/flows/${flowName}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parameters }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to execute flow: ${error}`);
    }
    return response.json();
  },

  // Stream flow execution
  async executeFlowStream(
    flowName: string,
    parameters: FlowParameters,
    onMessage: (message: StreamMessage) => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/flows/${flowName}/execute-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parameters }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to execute flow: ${error}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onMessage(data);
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      } else {
        throw error;
      }
    }
  },

  // Delete flow
  async deleteFlow(
    flowName: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/flows/${flowName}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Flow '${flowName}' not found`);
      }
      const error = await response.text();
      throw new Error(`Failed to delete flow: ${error}`);
    }
    return response.json();
  },
};
