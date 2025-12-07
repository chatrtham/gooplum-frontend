"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentChat } from "@/components/agents/AgentChat";
import { AgentThreadList } from "@/components/agents/AgentThreadList";
import { AgentConfigPanel } from "@/components/agents/AgentConfigPanel";
import {
  getAssistant,
  createAssistantFromParams,
  updateAssistantFromParams,
} from "@/lib/agentsApi";
import type { Assistant, AssistantThread } from "@/types/agents";
import type { LangChainMessage } from "@assistant-ui/react-langgraph";
import Link from "next/link";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assistantId = params.id as string;
  const isNewAgent = assistantId === "new";

  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [loading, setLoading] = useState(!isNewAgent);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    undefined,
  );
  const [initialMessages, setInitialMessages] = useState<LangChainMessage[]>(
    [],
  );

  // chatKey is used to force remount only on INTENTIONAL thread switches
  const [chatKey, setChatKey] = useState<string>("new");
  // refreshKey is used to trigger thread list refresh after new thread created
  const [threadListRefreshKey, setThreadListRefreshKey] = useState(0);
  // New thread for optimistic insertion into sidebar
  const [newThread, setNewThread] = useState<{
    threadId: string;
    preview: string;
  } | null>(null);

  // Handler for when a thread is selected from the list
  const handleSelectThread = (thread: AssistantThread) => {
    setCurrentThreadId(thread.thread_id);
    const messages = (thread.values?.messages || []) as LangChainMessage[];
    setInitialMessages(messages);
    setChatKey(thread.thread_id);
    setNewThread(null);
  };

  // Handler for creating a new thread (clicking "New Chat" button)
  const handleCreateThread = () => {
    setCurrentThreadId(undefined);
    setInitialMessages([]);
    setChatKey(`new-${Date.now()}`);
    setNewThread(null);
  };

  // Handler for when AgentChat creates a thread during streaming
  const handleThreadCreated = (
    threadId: string,
    firstMessagePreview: string,
  ) => {
    setCurrentThreadId(threadId);
    setNewThread({ threadId, preview: firstMessagePreview });
  };

  // Handler for when streaming completes - refresh the thread list
  const handleStreamingComplete = () => {
    setThreadListRefreshKey((k) => k + 1);
  };

  // Handle saving agent configuration
  const handleSaveAgent = async (data: {
    name: string;
    model_preset: string;
    system_prompt: string;
    flow_tool_ids: string[];
    gumcp_services: string[];
  }) => {
    if (isNewAgent) {
      const newAssistant = await createAssistantFromParams(data);
      router.push(`/agents/${newAssistant.assistant_id}`);
    } else {
      await updateAssistantFromParams(assistantId, data);
      // Refresh local state
      const updated = await getAssistant(assistantId);
      setAssistant(updated);
    }
  };

  useEffect(() => {
    const fetchAssistant = async () => {
      if (isNewAgent) return;

      try {
        const data = await getAssistant(assistantId);
        setAssistant(data);
      } catch (err) {
        console.error("Failed to fetch assistant:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssistant();
  }, [assistantId, isNewAgent]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isNewAgent && !assistant) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Agent not found</p>
        <Link href="/agents">
          <Button>Back to Agents</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-4">
          <Link href="/agents">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeftIcon className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">
              {isNewAgent ? "Create New Agent" : assistant?.name}
            </h1>
            {!isNewAgent && (
              <p className="text-xs text-muted-foreground">
                {assistant?.config.configurable.model_preset}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Thread List (Hidden for new agents) */}
        <div
          className={`flex w-64 flex-col border-r bg-muted/10 ${isNewAgent ? "pointer-events-none opacity-50 grayscale" : ""}`}
        >
          {!isNewAgent && (
            <AgentThreadList
              assistantId={assistantId}
              currentThreadId={currentThreadId}
              onSelectThread={handleSelectThread}
              onCreateThread={handleCreateThread}
              refreshKey={threadListRefreshKey}
              newThread={newThread}
            />
          )}
          {isNewAgent && (
            <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-muted-foreground">
              Save agent to start chatting
            </div>
          )}
        </div>

        {/* Center Panel: Chat Area (Hidden for new agents) */}
        <div
          className={`flex flex-1 flex-col ${isNewAgent ? "pointer-events-none bg-muted/5 opacity-50 grayscale" : ""}`}
        >
          {!isNewAgent ? (
            <AgentChat
              key={chatKey}
              assistantId={assistantId}
              threadId={currentThreadId}
              initialMessages={initialMessages}
              onThreadCreated={handleThreadCreated}
              onStreamingComplete={handleStreamingComplete}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-medium">Configure your agent</h3>
                <p>
                  Use the panel on the right to set up your agent's name, model,
                  and tools before you can start testing it.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Configuration (Always visible) */}
        <div className="flex w-[350px] shrink-0 flex-col border-l bg-background">
          <AgentConfigPanel
            initialData={assistant || undefined}
            isEditing={!isNewAgent}
            onSave={handleSaveAgent}
          />
        </div>
      </div>
    </div>
  );
}
