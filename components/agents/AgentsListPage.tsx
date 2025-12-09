"use client";

import { useState, useEffect } from "react";
import { PlusIcon, RefreshCwIcon, BotIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AgentCard } from "./AgentCard";
import { getAssistants } from "@/lib/agentsApi";
import type { Assistant } from "@/types/agents";

export function AgentsListPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch assistants from the API
  const fetchAssistants = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetched = await getAssistants();
      // Filter out default assistants that don't have an LLM model configured
      const configuredAssistants = fetched.filter(
        (a) => a.config?.configurable?.model_preset,
      );
      setAssistants(configuredAssistants);
    } catch (err) {
      console.error("Failed to fetch assistants:", err);
      setError(err instanceof Error ? err.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAssistants();
  }, []);

  return (
    <div className="h-full space-y-8 overflow-auto p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            My Agents
          </h2>
          <p className="mt-1 text-muted-foreground">
            Manage and talk to your AI Agents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAssistants}
            disabled={loading}
            className="flex h-9 items-center gap-2"
          >
            <RefreshCwIcon
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Link href="/agents/new">
            <Button variant="default" size="sm" className="h-9 gap-2 shadow-sm">
              <PlusIcon className="size-3.5" />
              New Agent
            </Button>
          </Link>
        </div>
      </div>

      <main>
        {error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
            <p className="font-semibold">Error loading agents</p>
            <p className="mt-1 text-sm opacity-90">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAssistants}
              className="mt-4 border-destructive/20 bg-background text-destructive hover:bg-destructive/10"
            >
              Try Again
            </Button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[344px] animate-pulse rounded-xl border border-border/60 bg-muted/20"
              />
            ))}
          </div>
        ) : assistants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-24 text-center">
            <div className="mb-6 rounded-full bg-primary/10 p-4">
              <BotIcon className="size-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              No agents yet
            </h3>
            <p className="mt-2 max-w-sm text-muted-foreground">
              Create your first AI agent to start automating tasks and
              workflows.
            </p>
            <Link href="/agents/new" className="mt-6">
              <Button className="gap-2 shadow-sm">
                <PlusIcon className="size-4" />
                Create Agent
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {assistants.map((assistant) => (
              <AgentCard key={assistant.assistant_id} assistant={assistant} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
