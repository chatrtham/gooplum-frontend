// Agent Chat API - LangGraph SDK functions for agent conversations
// Uses LangGraph Assistants API - assistantId identifies the agent config

import { Client, ThreadState } from "@langchain/langgraph-sdk";
import {
  LangChainMessage,
  LangGraphCommand,
} from "@assistant-ui/react-langgraph";
import type { AssistantThread } from "@/types/agents";

/**
 * Create a LangGraph SDK client
 */
const createClient = () => {
  const apiUrl = process.env["NEXT_PUBLIC_API_BASE_URL"]!;
  return new Client({ apiUrl });
};

// ─────────────────────────────────────────────────────────────────────────────
// Thread Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new thread for a specific assistant
 * The assistant_id is stored in thread metadata for filtering
 */
export async function createAssistantThread(assistantId: string) {
  const client = createClient();
  return client.threads.create({
    metadata: {
      assistant_id: assistantId,
    },
  });
}

/**
 * Get all threads for a specific assistant
 * Uses metadata filtering to find threads belonging to this assistant
 * Returns threads with preview extracted from values.messages
 */
export async function getAssistantThreads(
  assistantId: string,
): Promise<AssistantThread[]> {
  const client = createClient();

  // Search for threads with matching assistant_id in metadata
  const threads = await client.threads.search({
    metadata: {
      assistant_id: assistantId,
    },
    limit: 100,
  });

  // Transform to our AssistantThread interface with preview
  return threads.map((thread) => {
    const values = (thread as any).values as AssistantThread["values"];
    const messages = values?.messages || [];

    // Extract first user message as preview
    const firstUserMessage = messages.find((msg) => msg.type === "human");

    let preview = "New conversation";
    if (firstUserMessage) {
      const content = firstUserMessage.content;
      const text =
        typeof content === "string"
          ? content
          : Array.isArray(content)
            ? content
                .filter((c) => c.type === "text")
                .map((c) => c.text)
                .join(" ")
            : "";
      preview =
        text.length > 50
          ? text.slice(0, 50) + "..."
          : text || "New conversation";
    }

    return {
      thread_id: thread.thread_id,
      assistant_id: assistantId,
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      metadata: thread.metadata as Record<string, unknown>,
      values,
      preview,
    };
  });
}

/**
 * Get the state of a thread (for restoring conversation history)
 * Thread state stores conversation messages
 */
export async function getThreadState(
  threadId: string,
): Promise<ThreadState<{ messages: LangChainMessage[] }>> {
  const client = createClient();
  return client.threads.getState(threadId);
}

/**
 * Extract a preview from thread state (first user message)
 */
export function getThreadPreview(
  state: ThreadState<{ messages: LangChainMessage[] }>,
): string {
  const messages = state.values?.messages || [];
  const firstUserMessage = messages.find(
    (msg) => msg.type === "human" || (msg as any).role === "user",
  );

  if (!firstUserMessage) {
    return "New conversation";
  }

  // Extract text content
  const content =
    typeof firstUserMessage.content === "string"
      ? firstUserMessage.content
      : Array.isArray(firstUserMessage.content)
        ? firstUserMessage.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join(" ")
        : "";

  // Truncate to reasonable preview length
  const maxLength = 50;
  if (content.length > maxLength) {
    return content.substring(0, maxLength).trim() + "...";
  }
  return content || "New conversation";
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Streaming
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a message to an assistant and stream the response
 * Uses the assistantId directly - LangGraph will load the assistant's config
 *
 * @param configurable - Optional config override. When provided, this overrides the
 *   stored assistant config, ensuring the run uses the latest configuration even
 *   if the assistant was updated after the thread was created.
 */
export async function sendAssistantMessage(params: {
  threadId: string;
  assistantId: string;
  messages?: LangChainMessage[];
  command?: LangGraphCommand;
  configurable?: Record<string, unknown>;
}) {
  const client = createClient();

  // Pass config override if provided - this ensures existing threads use the
  // latest assistant configuration instead of the version from when the thread started
  return client.runs.stream(params.threadId, params.assistantId, {
    input: params.messages?.length
      ? {
          messages: params.messages,
        }
      : null,
    command: params.command,
    streamMode: ["messages", "updates"],
    ...(params.configurable && {
      config: { configurable: params.configurable },
    }),
  });
}
