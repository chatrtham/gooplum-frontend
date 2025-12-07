"use client";

import { useState, useEffect } from "react";
import { PlusIcon, RefreshCwIcon, BotIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AgentCard } from "./AgentCard";
import { motion } from "motion/react";
import { Navigation } from "@/components/Navigation";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex h-16 items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-semibold text-foreground">GoopLum</h1>
              <Navigation />
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAssistants}
                  disabled={loading}
                  className="flex items-center gap-2 border-border bg-card text-foreground shadow-xs hover:bg-accent"
                >
                  <RefreshCwIcon
                    className={`size-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/agents/new">
                  <Button
                    size="sm"
                    className="flex items-center gap-2 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                  >
                    <PlusIcon className="size-4" />
                    New Agent
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <p className="font-medium">Error loading agents</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAssistants}
              className="mt-2 border-destructive/30 hover:bg-destructive/20"
            >
              Try Again
            </Button>
          </div>
        ) : loading && assistants.length === 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl border border-border bg-card/50"
              />
            ))}
          </div>
        ) : assistants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <BotIcon className="size-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              No agents yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first AI agent to start automating tasks with flows
              and tools.
            </p>
            <Link href="/agents/new" className="mt-6">
              <Button>Create Agent</Button>
            </Link>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {assistants.map((assistant) => (
              <AgentCard key={assistant.assistant_id} assistant={assistant} />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
