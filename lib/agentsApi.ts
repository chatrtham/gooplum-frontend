// Agents API Service - CRUD operations for GoopLum Agents
// Uses LangGraph SDK for assistant management, custom endpoints for discovery

import { Client } from "@langchain/langgraph-sdk";
import type {
  Assistant,
  AssistantCreateRequest,
  AssistantUpdateRequest,
  AssistantConfigurable,
  ModelPreset,
  GumcpServicesResponse,
} from "@/types/agents";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:2024";

/**
 * Create a LangGraph SDK client
 */
const createClient = () => {
  return new Client({ apiUrl: BASE_URL });
};

/**
 * Helper to handle API responses consistently (for non-SDK endpoints)
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }
  return response.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD Operations (using LangGraph SDK)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all assistants (agents)
 * Filters by graph_id='custom_agent' to only get our custom agents
 */
export async function getAssistants(): Promise<Assistant[]> {
  const client = createClient();
  const assistants = await client.assistants.search({
    graphId: "custom_agent",
    limit: 100,
  });

  return assistants as unknown as Assistant[];
}

/**
 * Get a single assistant by ID
 */
export async function getAssistant(assistantId: string): Promise<Assistant> {
  const client = createClient();
  const assistant = await client.assistants.get(assistantId);
  return assistant as unknown as Assistant;
}

/**
 * Create a new assistant
 * Wraps the config in the required LangGraph structure
 */
export async function createAssistant(
  data: Omit<AssistantCreateRequest, "graph_id">,
): Promise<Assistant> {
  const client = createClient();
  const assistant = await client.assistants.create({
    graphId: "custom_agent",
    name: data.name,
    config: data.config as unknown as Record<string, unknown>,
    metadata: data.metadata,
  });
  return assistant as unknown as Assistant;
}

/**
 * Helper to create a new assistant with flat parameters
 * Builds the nested config structure automatically
 */
export async function createAssistantFromParams(params: {
  name: string;
  model_preset: string;
  instructions: string;
  flow_tool_ids?: string[];
  gumcp_services?: string[];
}): Promise<Assistant> {
  return createAssistant({
    name: params.name,
    config: {
      configurable: {
        model_preset: params.model_preset,
        instructions: params.instructions,
        flow_tool_ids: params.flow_tool_ids || [],
        gumcp_services: params.gumcp_services || [],
      },
    },
  });
}

/**
 * Update an existing assistant
 * Note: LangGraph creates a new version on each update
 */
export async function updateAssistant(
  assistantId: string,
  data: AssistantUpdateRequest,
): Promise<Assistant> {
  const client = createClient();
  const assistant = await client.assistants.update(assistantId, {
    name: data.name,
    config: data.config as Record<string, unknown> | undefined,
    metadata: data.metadata,
  });
  return assistant as unknown as Assistant;
}

/**
 * Helper to update an assistant with flat parameters
 * Builds the nested config structure automatically
 */
export async function updateAssistantFromParams(
  assistantId: string,
  params: {
    name?: string;
    model_preset?: string;
    instructions?: string;
    flow_tool_ids?: string[];
    gumcp_services?: string[];
  },
): Promise<Assistant> {
  // First get the current assistant to preserve existing config
  const current = await getAssistant(assistantId);
  const currentConfig = current.config.configurable;

  const newConfigurable: AssistantConfigurable = {
    model_preset: params.model_preset ?? currentConfig.model_preset,
    instructions: params.instructions ?? currentConfig.instructions,
    flow_tool_ids: params.flow_tool_ids ?? currentConfig.flow_tool_ids ?? [],
    gumcp_services: params.gumcp_services ?? currentConfig.gumcp_services ?? [],
  };

  return updateAssistant(assistantId, {
    name: params.name,
    config: {
      configurable: newConfigurable,
    },
  });
}

/**
 * Delete an assistant
 */
export async function deleteAssistant(assistantId: string): Promise<void> {
  const client = createClient();
  await client.assistants.delete(assistantId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Discovery Endpoints (still using custom backend endpoints)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get available model presets (e.g., claude-sonnet, gpt-4o, gemini-flash)
 */
export async function getModelPresets(): Promise<ModelPreset[]> {
  const response = await fetch(`${BASE_URL}/agents/presets`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<ModelPreset[]>(response);
}

/**
 * Get available guMCP services (e.g., gmail, gsheets)
 */
export async function getGumcpServices(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/agents/gumcp-services`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await handleResponse<GumcpServicesResponse>(response);
  return data.services;
}
