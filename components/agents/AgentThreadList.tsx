"use client";

import { useState, useEffect } from "react";
import { PlusIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAssistantThreads } from "@/lib/agentChatApi";
import type { AssistantThread } from "@/types/agents";
import { cn } from "@/lib/utils";

interface AgentThreadListProps {
  assistantId: string;
  currentThreadId?: string;
  onSelectThread: (thread: AssistantThread) => void;
  onCreateThread: () => void;
  /** Increment this to trigger a refresh (e.g., after new thread created) */
  refreshKey?: number;
  /** New thread to add optimistically (before refresh confirms it) */
  newThread?: { threadId: string; preview: string } | null;
}

export function AgentThreadList({
  assistantId,
  currentThreadId,
  onSelectThread,
  onCreateThread,
  refreshKey = 0,
  newThread,
}: AgentThreadListProps) {
  const [threads, setThreads] = useState<AssistantThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const fetchedThreads = await getAssistantThreads(assistantId);
      // Sort by updated_at desc (most recent activity first)
      fetchedThreads.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
      setThreads(fetchedThreads);
    } catch (err) {
      console.error("Failed to fetch threads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [assistantId, refreshKey]); // Refresh on assistant change or when refreshKey increments

  // Add new thread optimistically when it's created
  useEffect(() => {
    if (newThread && !threads.find((t) => t.thread_id === newThread.threadId)) {
      const optimisticThread: AssistantThread = {
        thread_id: newThread.threadId,
        assistant_id: assistantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
        preview: newThread.preview,
      };
      setThreads((prev) => [optimisticThread, ...prev]);
    }
  }, [newThread, assistantId]);

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <Button
          onClick={onCreateThread}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <PlusIcon className="size-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {loading && threads.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No history yet
          </div>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.thread_id}
              onClick={() => onSelectThread(thread)}
              className={cn(
                "flex w-full flex-col items-start gap-1 rounded-md p-3 text-left text-sm transition-colors hover:bg-accent/50",
                currentThreadId === thread.thread_id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className="line-clamp-1 font-medium text-foreground">
                  {thread.preview || "New conversation"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs opacity-70">
                <ClockIcon className="size-3" />
                <span>{new Date(thread.updated_at).toLocaleDateString()}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
