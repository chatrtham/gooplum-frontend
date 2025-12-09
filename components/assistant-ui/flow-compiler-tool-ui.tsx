"use client";

import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import {
  CheckIcon,
  Sparkles,
  RefreshCwIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { FlowExplanation } from "@/components/flows/FlowExplanation";

// Expected artifact structure from flow_compiler tool
interface FlowCompilerArtifact {
  flow_id: string;
  flow_name: string;
  flow_description: string;
  flow_explanation: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:2024";

async function activateFlow(flowId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${BASE_URL}/flows/${flowId}/activate`, {
    method: "POST",
  });
  return response.json();
}

export const FlowCompilerToolUI: ToolCallMessagePartComponent<
  Record<string, unknown>,
  string
> = (props) => {
  // The artifact is passed as a separate prop from LangGraph ToolMessage
  const { artifact } = props as { artifact?: FlowCompilerArtifact };
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  console.log("FlowCompilerToolUI - props:", props);
  console.log("FlowCompilerToolUI - artifact:", artifact);

  // If no artifact or missing flow_id, use fallback
  if (!artifact || !artifact.flow_id) {
    return <ToolFallback {...props} />;
  }

  const { flow_id, flow_name, flow_description, flow_explanation } = artifact;

  const handleCreateFlow = async () => {
    setIsActivating(true);
    try {
      const response = await activateFlow(flow_id);
      if (response.success) {
        setIsActivated(true);
        // Navigate immediately after setting activated state
        router.push(`/flow/${flow_id}`);
      }
    } catch (error) {
      console.error("Failed to activate flow:", error);
      setIsActivating(false);
    }
  };

  return (
    <div className="mb-4 flex w-full flex-col gap-4 rounded-xl border border-border bg-card py-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </div>
        <p className="text-base font-semibold">Flow Ready</p>
      </div>

      {/* Flow Info */}
      <div className="flex flex-col gap-3 border-t border-border/50 px-5 pt-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Name
          </p>
          <p className="font-medium text-foreground">{flow_name}</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Description
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            {flow_description}
          </p>
        </div>
      </div>

      {/* Explanation */}
      {flow_explanation && (
        <div className="flex flex-col border-t border-border/50 px-5 pt-4">
          <button
            onClick={() => {
              if (!isExplanationOpen) {
                setIsExplanationOpen(true);
                // Scroll the button into view when expanding
                setTimeout(() => {
                  const button = document.activeElement as HTMLElement;
                  button?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                  });
                }, 50);
              } else {
                setIsExplanationOpen(false);
              }
            }}
            className="group flex w-full cursor-pointer items-center justify-between rounded-lg border border-border/40 bg-card px-4 py-2.5 text-sm font-medium text-foreground/70 shadow-sm transition-all duration-150 hover:border-border hover:bg-muted/30 hover:text-foreground hover:shadow"
          >
            <span>How it works</span>
            {isExplanationOpen ? (
              <ChevronDown className="size-4 transition-transform duration-150" />
            ) : (
              <ChevronRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            )}
          </button>
          {isExplanationOpen && (
            <div className="mt-3 px-1">
              <FlowExplanation explanation={flow_explanation} />
            </div>
          )}
        </div>
      )}

      {/* Create Flow Button */}
      <div className="flex justify-end border-t border-border/50 px-5 pt-4">
        <Button
          onClick={handleCreateFlow}
          disabled={isActivating || isActivated}
          className="gap-2 shadow-sm"
          size="lg"
        >
          {isActivating ? (
            <>
              <RefreshCwIcon className="size-4 animate-spin" />
              Creating...
            </>
          ) : isActivated ? (
            <>
              <CheckIcon className="size-4" />
              Created
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Create Flow
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
