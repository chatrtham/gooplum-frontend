"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RefreshCwIcon,
  ArrowLeftIcon,
  BotIcon,
  WrenchIcon,
  TrashIcon,
  AlertTriangleIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgentChat } from "@/components/agents/AgentChat";
import { AgentThreadList } from "@/components/agents/AgentThreadList";
import { AgentConfigPanel } from "@/components/agents/AgentConfigPanel";
import {
  getAssistant,
  createAssistantFromParams,
  updateAssistantFromParams,
  deleteAssistant,
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
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Instruction update notification
  const [showInstructionUpdate, setShowInstructionUpdate] = useState(false);

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

  // Handler for when streaming completes - refresh the thread list and check for instruction updates
  const handleStreamingComplete = async () => {
    setThreadListRefreshKey((k) => k + 1);

    // Check if instructions were updated (only if self-improvement is enabled)
    if (assistant?.config.configurable.can_suggest_improvements) {
      try {
        const updated = await getAssistant(assistantId);
        const oldInstructions =
          assistant?.config.configurable.instructions || "";
        const newInstructions = updated.config.configurable.instructions || "";

        if (newInstructions !== oldInstructions) {
          // Instructions changed! Show notification and update state
          setAssistant(updated);
          setShowInstructionUpdate(true);
          // Auto-dismiss after 4 seconds
          setTimeout(() => setShowInstructionUpdate(false), 4000);
        }
      } catch (err) {
        console.error("Failed to check for instruction updates:", err);
      }
    }
  };

  // Handle saving agent configuration
  const handleSaveAgent = async (data: {
    name: string;
    model_preset: string;
    instructions: string;
    flow_tool_ids: string[];
    gumcp_services: string[];
    can_suggest_improvements: boolean;
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

  const handleDelete = async () => {
    if (!assistant || isNewAgent) return;

    setIsDeleting(true);
    try {
      await deleteAssistant(assistant.assistant_id);
      router.push("/agents");
    } catch (err) {
      console.error("Failed to delete agent:", err);
      alert(
        `Failed to delete agent: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCwIcon className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isNewAgent && !assistant) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Agent not found</p>
        <Link href="/agents">
          <Button>Back to Agents</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-card/50 px-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/agents"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-all duration-150 ease-out hover:text-foreground active:scale-[0.98]"
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BotIcon className="size-3.5" />
            </div>
            <div>
              <h1 className="text-sm leading-none font-semibold tracking-tight">
                {isNewAgent ? "Create New Agent" : assistant?.name}
              </h1>
              {!isNewAgent && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {assistant?.config.configurable.model_preset}
                </p>
              )}
            </div>
          </div>
        </div>
        {!isNewAgent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-8 cursor-pointer text-xs font-medium text-muted-foreground transition-all duration-150 ease-out hover:text-destructive active:scale-[0.98]"
          >
            <TrashIcon className="mr-1.5 size-3.5" />
            Delete Agent
          </Button>
        )}
      </header>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangleIcon className="size-5 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight">
                  Delete Agent
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm font-normal">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-foreground">
                    "{assistant?.name}"
                  </span>
                  ? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="flex-1 cursor-pointer transition-all duration-150 ease-out active:scale-[0.98] sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 cursor-pointer transition-all duration-150 ease-out active:scale-[0.98] sm:flex-none"
            >
              {isDeleting ? (
                <>
                  <RefreshCwIcon className="mr-1.5 size-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Agent"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {isNewAgent ? (
          <div className="flex-1 overflow-y-auto bg-muted/20 p-6">
            <div className="mx-auto max-w-3xl">
              <AgentConfigPanel
                initialData={assistant || undefined}
                isEditing={!isNewAgent}
                onSave={handleSaveAgent}
                variant="full-page"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Left Panel: Thread List */}
            <div className="w-72 bg-muted/20 p-3">
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-sm backdrop-blur-md dark:bg-card/40">
                <div className="flex-1 overflow-hidden">
                  <AgentThreadList
                    assistantId={assistantId}
                    currentThreadId={currentThreadId}
                    onSelectThread={handleSelectThread}
                    onCreateThread={handleCreateThread}
                    refreshKey={threadListRefreshKey}
                    newThread={newThread}
                  />
                </div>
              </div>
            </div>

            {/* Center Panel: Chat Area */}
            <div className="relative flex flex-1 flex-col bg-muted/20">
              {/* Instruction Update Notification - Floating */}
              {showInstructionUpdate && (
                <div className="animate-in fade-in slide-in-from-top-2 absolute top-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-lg border border-secondary/40 bg-card px-4 py-2.5 text-sm text-secondary shadow-xl duration-300">
                  <SparklesIcon className="size-4" />
                  <span>
                    I&apos;ve updated my instructions based on our chat
                  </span>
                  <button
                    onClick={() => setShowInstructionUpdate(false)}
                    className="ml-auto cursor-pointer text-xs text-secondary/70 hover:text-secondary"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              <AgentChat
                key={chatKey}
                assistantId={assistantId}
                threadId={currentThreadId}
                initialMessages={initialMessages}
                onThreadCreated={handleThreadCreated}
                onStreamingComplete={handleStreamingComplete}
              />
            </div>

            {/* Right Panel: Configuration */}
            <div className="w-[400px] shrink-0 bg-muted/20 p-3">
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-sm backdrop-blur-md dark:bg-card/40">
                <AgentConfigPanel
                  initialData={assistant || undefined}
                  isEditing={!isNewAgent}
                  onSave={handleSaveAgent}
                  variant="sidebar"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
