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
import {
  BotIcon,
  ClockIcon,
  WrenchIcon,
  ZapIcon,
  ArrowRightIcon,
} from "lucide-react";
import Link from "next/link";
import type { Assistant } from "@/types/agents";

interface AgentCardProps {
  assistant: Assistant;
}

export function AgentCard({ assistant }: AgentCardProps) {
  const config = assistant.config?.configurable || {};
  const toolCount =
    (config.flow_tool_ids?.length || 0) + (config.gumcp_services?.length || 0);

  return (
    <Link
      href={`/agents/${assistant.assistant_id}`}
      className="group block h-full cursor-pointer"
    >
      <div className="relative h-full">
        {/* Gradient Border Glow */}
        <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[var(--chart-2)] to-[var(--chart-1)] opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100" />

        <Card className="relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-border/40 bg-card/50 backdrop-blur-md transition-all duration-200 hover:bg-card/80 dark:bg-card/40">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20 dark:bg-primary/10 dark:text-primary dark:group-hover:bg-primary/20">
                <BotIcon className="size-5" />
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-transparent text-muted-foreground opacity-0 transition-all duration-300 group-hover:bg-muted group-hover:opacity-100">
                <ArrowRightIcon className="size-4" />
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="mt-4 truncate font-mono text-base leading-tight font-medium tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {assistant.name}
                </CardTitle>
              </TooltipTrigger>
              {assistant.name.length > 40 && (
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-mono text-xs">{assistant.name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 pb-3">
            <CardDescription className="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed font-normal break-words">
              {config.system_prompt?.slice(0, 100) ||
                "No description provided."}
              {config.system_prompt && config.system_prompt.length > 100
                ? "..."
                : ""}
            </CardDescription>

            <div className="flex flex-wrap gap-2">
              {config.model_preset && (
                <div className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-xs font-normal text-muted-foreground backdrop-blur-sm">
                  <ZapIcon className="mr-1.5 size-3" />
                  <span className="truncate">{config.model_preset}</span>
                </div>
              )}
              <div className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-xs font-normal text-muted-foreground backdrop-blur-sm">
                <WrenchIcon className="mr-1.5 size-3" />
                <span className="tabular-nums">{toolCount} tools</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto border-t border-border/30 bg-muted/10 pt-4 pb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="size-3.5" />
              <span className="font-normal">
                Created{" "}
                {assistant.created_at
                  ? new Date(assistant.created_at).toLocaleDateString()
                  : "Recently"}
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Link>
  );
}
