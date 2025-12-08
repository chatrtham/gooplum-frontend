"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ClockIcon, ArrowRightIcon, WorkflowIcon } from "lucide-react";
import Link from "next/link";
import { Flow } from "@/lib/flowsApi";

interface FlowCardProps {
  flow: Flow;
}

export function FlowCard({ flow }: FlowCardProps) {
  return (
    <Link
      href={`/flow/${flow.id}`}
      className="group block h-full cursor-pointer"
    >
      <div className="relative h-full">
        {/* Gradient Border Glow */}
        <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[var(--chart-2)] to-[var(--chart-1)] opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100" />

        <Card className="relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-xl border border-border/40 bg-card/50 backdrop-blur-md transition-all duration-200 hover:bg-card/80 dark:bg-card/40">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <WorkflowIcon className="size-5" />
              </div>
              <div className="rounded-full p-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:bg-accent group-hover:text-accent-foreground group-hover:opacity-100">
                <ArrowRightIcon className="size-4" />
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="mt-4 truncate font-mono text-base leading-tight font-medium tracking-tight transition-colors group-hover:text-primary">
                  {flow.name}
                </CardTitle>
              </TooltipTrigger>
              {flow.name.length > 40 && (
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-mono text-xs">{flow.name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <CardDescription className="line-clamp-2 text-sm leading-relaxed font-normal break-words">
              {flow.description || "No description provided."}
            </CardDescription>
          </CardContent>
          <CardFooter className="mt-auto border-t border-border/30 bg-muted/10 pt-4 pb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="size-3.5" />
              <span className="font-normal">Created {flow.createdAt}</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Link>
  );
}
