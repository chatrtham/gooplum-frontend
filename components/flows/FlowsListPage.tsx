"use client";

import { useState, useEffect } from "react";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FlowCard } from "./FlowCard";
import { Flow } from "@/lib/flowsApi";
import { motion, AnimatePresence } from "motion/react";
import { flowsAPI } from "@/lib/flowsApi";

export function FlowsListPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch flows from the API
  const fetchFlows = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedFlows = await flowsAPI.getFlows();
      setFlows(fetchedFlows);
    } catch (err) {
      console.error("Failed to fetch flows:", err);
      setError(err instanceof Error ? err.message : "Failed to load flows");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    fetchFlows();

    // Set up auto-refresh
    const interval = setInterval(fetchFlows, 30000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Stagger each card by 100ms
        delayChildren: 0.2, // Start animation after 200ms
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
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
            <h1 className="text-xl font-semibold text-foreground">GoopLum</h1>

            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchFlows}
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
                <Link href="/chat">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                  >
                    <PlusIcon className="size-4" />
                    Create New Flow
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Section Title */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div>
            <h2 className="mb-2 text-2xl font-semibold text-foreground">
              My Flows
            </h2>
            <p className="text-muted-foreground">
              Manage and automate your workflows with ease
            </p>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            className="flex flex-col items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RefreshCwIcon className="mb-4 size-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading flows...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            className="rounded-lg border border-destructive/20 bg-destructive/10 p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-destructive">
                <PlusIcon className="size-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">
                  Failed to load flows
                </h3>
                <p className="mt-1 text-sm text-destructive/80">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchFlows}
                  className="mt-3 border-destructive/20 text-destructive hover:bg-destructive/10"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Flows Grid */}
        {!loading && !error && (
          <motion.div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {flows.map((flow) => (
                <motion.div
                  key={flow.id}
                  variants={itemVariants}
                  layoutId={`flow-${flow.id}`}
                >
                  <FlowCard flow={flow} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State (if no flows) */}
        {!loading && !error && flows.length === 0 && (
          <motion.div
            className="py-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <PlusIcon className="size-8 text-muted-foreground" />
              </motion.div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                No flows yet
              </h3>
              <p className="mx-auto max-w-md text-muted-foreground">
                Start by describing what you want to automate to Goopie AI, and
                it&apos;ll help you create your first automated workflow.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link href="/chat">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <PlusIcon className="mr-2 size-4" />
                  Create Your First Flow with Goopie
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
