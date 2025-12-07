"use client";

import { useRef, useEffect } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";

import {
  createAssistantThread,
  sendAssistantMessage,
} from "@/lib/agentChatApi";
import { AgentThread } from "@/components/agents/AgentThread";
import type { LangChainMessage } from "@assistant-ui/react-langgraph";

interface AgentChatProps {
  assistantId: string;
  threadId?: string;
  /** Initial messages to display (from thread search, avoids extra /state call) */
  initialMessages?: LangChainMessage[];
  /** Called when a new thread is created, with thread ID and first message preview */
  onThreadCreated?: (threadId: string, firstMessagePreview: string) => void;
  /** Called when streaming completes (good time to refresh thread list) */
  onStreamingComplete?: () => void;
}

export function AgentChat({
  assistantId,
  threadId: initialThreadId,
  initialMessages = [],
  onThreadCreated,
  onStreamingComplete,
}: AgentChatProps) {
  const threadIdRef = useRef<string | undefined>(initialThreadId);
  // Store initial messages in a ref so onSwitchToThread can access them
  const initialMessagesRef = useRef<LangChainMessage[]>(initialMessages);

  // Helper to extract preview text from first message
  const getPreviewFromMessages = (messages: LangChainMessage[]): string => {
    const firstMsg = messages[0];
    if (!firstMsg) return "New conversation";
    const content = firstMsg.content;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content
              .filter((c: any) => c.type === "text")
              .map((c: any) => c.text)
              .join(" ")
          : "";
    return text.length > 50
      ? text.slice(0, 50) + "..."
      : text || "New conversation";
  };

  // Wrapper to detect when streaming completes
  async function* wrapStreamWithCompletion(
    stream: AsyncGenerator<any>,
  ): AsyncGenerator<any> {
    try {
      for await (const chunk of stream) {
        yield chunk;
      }
    } finally {
      // Stream finished (either completed or errored)
      if (onStreamingComplete) {
        onStreamingComplete();
      }
    }
  }

  const runtime = useLangGraphRuntime({
    threadId: threadIdRef.current,
    stream: async (messages, { command }) => {
      if (!threadIdRef.current) {
        const { thread_id } = await createAssistantThread(assistantId);
        threadIdRef.current = thread_id;
        if (onThreadCreated) {
          // Pass the first message as preview for the sidebar
          onThreadCreated(thread_id, getPreviewFromMessages(messages));
        }
      }
      const threadId = threadIdRef.current;
      const stream = await sendAssistantMessage({
        threadId,
        assistantId,
        messages,
        command,
      });
      // Wrap to detect completion
      return wrapStreamWithCompletion(stream);
    },
    onSwitchToNewThread: async () => {
      const { thread_id } = await createAssistantThread(assistantId);
      threadIdRef.current = thread_id;
      if (onThreadCreated) {
        onThreadCreated(thread_id, "New conversation");
      }
    },
    onSwitchToThread: async (threadId) => {
      // Use messages passed from parent (already fetched via /threads/search)
      // No need to call /state API again!
      threadIdRef.current = threadId;
      return { messages: initialMessagesRef.current };
    },
  });

  // If we have an initial thread with messages, trigger the load
  useEffect(() => {
    if (initialThreadId && initialMessages.length > 0) {
      // Switch to the thread to load messages
      runtime.switchToThread(initialThreadId);
    }
  }, []); // Only on mount

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AgentThread />
    </AssistantRuntimeProvider>
  );
}
