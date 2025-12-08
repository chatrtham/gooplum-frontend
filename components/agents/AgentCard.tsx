"use client";

import { Card } from "@/components/ui/card";
import { BotIcon, ClockIcon, WrenchIcon, ZapIcon } from "lucide-react";
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
    <div className="group">
      <Link href={`/agents/${assistant.assistant_id}`}>
        <Card className="block h-full cursor-pointer border-border bg-card p-6 shadow-xs transition-all duration-200 group-hover:bg-accent/50 hover:shadow-sm">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <BotIcon className="size-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground transition-colors group-hover:text-primary">
                  {assistant.name}
                </h3>
              </div>
              <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                {/* Use first 100 chars of system prompt as description */}
                {config.system_prompt?.slice(0, 100) || "No description"}
                {config.system_prompt && config.system_prompt.length > 100
                  ? "..."
                  : ""}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1" title="Model Preset">
                <ZapIcon className="size-3" />
                <span className="font-medium">
                  {config.model_preset || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-1" title="Tools">
                <WrenchIcon className="size-3" />
                <span>{toolCount} tools</span>
              </div>
            </div>

            <div className="flex items-center text-xs text-muted-foreground">
              <ClockIcon className="mr-1 size-3" />
              Created{" "}
              {assistant.created_at
                ? new Date(assistant.created_at).toLocaleDateString()
                : "Recently"}
            </div>
          </div>

          {/* Hover indicator */}
          <div className="mt-4 flex items-center text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Click to chat →
          </div>
        </Card>
      </Link>
    </div>
  );
}
