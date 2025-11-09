"use client";

import { useState } from "react";
import { useFlows, useSearchFlows } from "@/hooks/useFlows";
import { FlowCard } from "./FlowCard";
import { FlowSearch } from "./FlowSearch";
import { CreateFlowButton } from "./CreateFlowButton";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function FlowList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: flows, isLoading, error } = useFlows();
  const { data: filteredFlows } = useSearchFlows(flows, searchTerm);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load flows: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GoopLum</h1>
          <p className="text-muted-foreground">
            Automate everything with GoopLum
          </p>
        </div>
        <div className="flex gap-2">
          <CreateFlowButton />
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <FlowSearch value={searchTerm} onChange={setSearchTerm} />
      </div>

      {/* Flow Count */}
      {!isLoading && flows && (
        <div className="text-sm text-muted-foreground">
          {filteredFlows?.length} of {flows.length} flows
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
                <Skeleton className="h-9 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && flows && flows.length === 0 && (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl">📦</div>
          <h3 className="mb-2 text-lg font-medium">No flows yet</h3>
          <p className="mb-4 text-muted-foreground">
            Create your first flow to get started with automation.
          </p>
          <CreateFlowButton />
        </div>
      )}

      {/* No Search Results */}
      {!isLoading &&
        flows &&
        flows.length > 0 &&
        filteredFlows &&
        filteredFlows.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="mb-2 text-lg font-medium">No flows found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or create a new flow.
            </p>
          </div>
        )}

      {/* Flow List */}
      {!isLoading && filteredFlows && filteredFlows.length > 0 && (
        <div className="space-y-4">
          {filteredFlows.map((flow) => (
            <FlowCard key={flow.name} flow={flow} />
          ))}
        </div>
      )}
    </div>
  );
}
