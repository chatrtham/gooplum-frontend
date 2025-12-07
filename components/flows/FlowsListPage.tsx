"use client";

import { useState, useEffect } from "react";
import {
  PlusIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FlowCard } from "./FlowCard";
import { Flow } from "@/lib/flowsApi";
import { motion, AnimatePresence } from "motion/react";
import { flowsAPI } from "@/lib/flowsApi";
import { Navigation } from "@/components/Navigation";

export function FlowsListPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  // Fetch flows from the API
  const fetchFlows = async (pageNum: number = page) => {
    try {
      setLoading(true);
      setError(null);
      const paginatedFlows = await flowsAPI.getFlows(pageNum, limit);
      const transformedFlows = paginatedFlows.flows.map((flowInfo) => ({
        id: flowInfo.id,
        name: flowInfo.name,
        description: flowInfo.description,
        createdAt: flowInfo.created_at
          ? new Date(flowInfo.created_at).toLocaleDateString()
          : "Recently",
      }));
      setFlows(transformedFlows);
      setTotal(paginatedFlows.total);
      setPage(paginatedFlows.page);
    } catch (err) {
      console.error("Failed to fetch flows:", err);
      setError(err instanceof Error ? err.message : "Failed to load flows");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFlows();
  }, []);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchFlows(newPage);
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
                  onClick={() => {
                    setPage(1);
                    fetchFlows(1);
                  }}
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
              Manage and run your flows with ease
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
                  onClick={() => {
                    setPage(1);
                    fetchFlows(1);
                  }}
                  className="mt-3 border-destructive/20 text-destructive hover:bg-destructive/10"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Flows Grid */}
        {!loading && !error && flows.length > 0 && (
          <>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div
                className="mt-8 flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                  className="flex items-center gap-1"
                >
                  <ChevronLeftIcon className="size-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {/* Show page numbers with smart truncation */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      // Always show first page, last page, current page, and pages around current
                      return (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        Math.abs(pageNum - page) <= 1
                      );
                    })
                    .map((pageNum, index, array) => {
                      // Show ellipsis if there's a gap
                      const prevPageNum = array[index - 1];
                      const showEllipsis =
                        prevPageNum && pageNum - prevPageNum > 1;

                      return (
                        <div key={pageNum} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="px-2 text-sm text-muted-foreground">
                              ...
                            </span>
                          )}
                          <Button
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                            className={`min-w-[2.5rem] ${
                              page === pageNum
                                ? "bg-primary text-primary-foreground"
                                : ""
                            }`}
                          >
                            {pageNum}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages || loading}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRightIcon className="size-4" />
                </Button>
              </motion.div>
            )}

            {/* Pagination Info */}
            <motion.div
              className="mt-4 text-center text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Showing {flows.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
              {Math.min(page * limit, total)} of {total} flows
            </motion.div>
          </>
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
                Start by describing what you want to do to Goopie AI, and
                it&apos;ll help you create your first flow.
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
