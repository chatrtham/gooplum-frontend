"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FlowCard } from "./FlowCard";
import { Flow } from "@/lib/flowsApi";
import { flowsAPI } from "@/lib/flowsApi";

export function FlowsListPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchFlows = useCallback(
    async (currentOffset: number, isRefresh = false) => {
      try {
        setLoading(true);
        setError(null);
        const paginatedFlows = await flowsAPI.getFlows(currentOffset, limit);
        const transformedFlows = paginatedFlows.flows.map((flowInfo) => ({
          id: flowInfo.id,
          name: flowInfo.name,
          description: flowInfo.description,
          createdAt: flowInfo.created_at
            ? new Date(flowInfo.created_at).toLocaleDateString()
            : "Recently",
        }));

        if (isRefresh || currentOffset === 0) {
          setFlows(transformedFlows);
        } else {
          setFlows((prev) => [...prev, ...transformedFlows]);
        }
        setTotal(paginatedFlows.total);
      } catch (err) {
        console.error("Failed to fetch flows:", err);
        setError(err instanceof Error ? err.message : "Failed to load flows");
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    fetchFlows(0);
  }, [fetchFlows]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && flows.length < total) {
          const nextOffset = flows.length;
          setOffset(nextOffset);
          fetchFlows(nextOffset);
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loading, flows.length, total, fetchFlows]);

  const handleRefresh = () => {
    setOffset(0);
    fetchFlows(0, true);
  };

  return (
    <div className="h-full space-y-8 overflow-auto p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            My Flows
          </h2>
          <p className="mt-1 text-muted-foreground">
            Manage and run your flows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading && flows.length === 0}
            className="h-9 gap-2"
          >
            <RefreshCwIcon
              className={`size-3.5 ${loading && flows.length === 0 ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Link href="/chat">
            <Button variant="default" size="sm" className="h-9 gap-2 shadow-sm">
              <PlusIcon className="size-3.5" />
              New Flow
            </Button>
          </Link>
        </div>
      </div>

      <main>
        {error && flows.length === 0 ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <h3 className="text-lg font-medium text-destructive">
              Failed to load flows
            </h3>
            <p className="mt-1 mb-4 text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => fetchFlows(0)}>
              Try Again
            </Button>
          </div>
        ) : null}

        <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <FlowCard key={flow.id} flow={flow} />
          ))}

          {loading && (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-[312px] animate-pulse rounded-xl border border-border/60 bg-muted/20"
                />
              ))}
            </>
          )}
        </div>

        {/* Sentinel for infinite scroll */}
        <div ref={observerTarget} className="h-4 w-full" />

        {!loading && !error && flows.length === 0 ? (
          <div className="animate-in fade-in-50 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PlusIcon className="size-8" />
            </div>
            <h3 className="text-xl font-semibold">No flows created yet</h3>
            <p className="mx-auto mt-2 mb-6 max-w-md text-muted-foreground">
              Get started by creating your first automation flow with our AI
              assistant.
            </p>
            <Link href="/chat">
              <Button size="lg" className="gap-2">
                <PlusIcon className="size-4" />
                Create First Flow
              </Button>
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
