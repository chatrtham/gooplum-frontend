"use client";

import { useRef } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";

import { createThread, getThreadState, sendMessage } from "@/lib/chatApi";
import { Thread } from "@/components/assistant-ui/thread";

async function* filterStream(stream: AsyncIterable<any>) {
  const ignoredRunIds = new Set<string>();

  for await (const chunk of stream) {
    if (!chunk || typeof chunk !== "object") {
      yield chunk;
      continue;
    }

    // Check for metadata event to identify runs to ignore
    if (chunk.event === "messages/metadata" && chunk.data) {
      const newData = { ...chunk.data };
      let modified = false;

      for (const [runId, runData] of Object.entries(chunk.data)) {
        const metadata = (runData as any)?.metadata;
        if (metadata?.tags?.includes("flow-explainer")) {
          ignoredRunIds.add(runId);
          delete newData[runId];
          modified = true;
        }
      }

      if (modified) {
        if (Object.keys(newData).length > 0) {
          yield { ...chunk, data: newData };
        }
        continue;
      }
    }

    // Filter messages based on ignored run IDs
    if (
      (chunk.event === "messages/partial" ||
        chunk.event === "messages/complete") &&
      Array.isArray(chunk.data)
    ) {
      const filteredData = chunk.data.filter(
        (msg: any) => !ignoredRunIds.has(msg.id),
      );

      if (filteredData.length > 0) {
        yield { ...chunk, data: filteredData };
      }
      continue;
    }

    yield chunk;
  }
}

export function MyAssistant() {
  const threadIdRef = useRef<string | undefined>(undefined);
  const runtime = useLangGraphRuntime({
    threadId: threadIdRef.current,
    stream: async (messages, { command }) => {
      if (!threadIdRef.current) {
        const { thread_id } = await createThread();
        threadIdRef.current = thread_id;
      }
      const threadId = threadIdRef.current;
      const stream = await sendMessage({
        threadId,
        messages,
        command,
      });
      return filterStream(stream);
    },
    onSwitchToNewThread: async () => {
      const { thread_id } = await createThread();
      threadIdRef.current = thread_id;
    },
    onSwitchToThread: async (threadId) => {
      const state = await getThreadState(threadId);
      threadIdRef.current = threadId;
      return { messages: state.values.messages };
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}
