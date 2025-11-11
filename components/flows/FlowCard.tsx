"use client";

import { Card } from "@/components/ui/card";
import { ClockIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

export interface Flow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastExecuted?: string;
}

interface FlowCardProps {
  flow: Flow;
}

export function FlowCard({ flow }: FlowCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1], // Custom cubic bezier for smooth easing
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 },
      }}
      className="group"
    >
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

            {flow.lastExecuted && (
              <div className="flex items-center text-xs text-muted-foreground">
                <PlayIcon className="mr-1 size-3" />
                Last run {flow.lastExecuted}
              </div>
            )}
          </div>

          {/* Hover indicator */}
          <div className="mt-4 flex items-center text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Click to view details →
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
