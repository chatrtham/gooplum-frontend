"use client";

import { Card } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";
import Link from "next/link";
import { Flow } from "@/lib/flowsApi";

interface FlowCardProps {
  flow: Flow;
}

export function FlowCard({ flow }: FlowCardProps) {
  return (
    <div className="group">
      <Link href={`/flow/${flow.id}`}>
        <Card className="block cursor-pointer border-border bg-card p-6 shadow-xs transition-all duration-200 group-hover:bg-accent/50 hover:shadow-sm">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-medium text-foreground transition-colors group-hover:text-primary">
                {flow.name}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {flow.description}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <ClockIcon className="mr-1 size-3" />
              Created {flow.createdAt}
            </div>
          </div>

          {/* Hover indicator */}
          <div className="mt-4 flex items-center text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Click to view details →
          </div>
        </Card>
      </Link>
    </div>
  );
}
