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
import { toNormalCase } from "@/lib/utils";

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
    <div className="group relative mb-4 flex w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card/50 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
          <Sparkles className="size-4" />
        </div>
        <div className="flex flex-col">
          <p className="font-sans text-base font-medium tracking-tight text-foreground">
            Flow Generated
          </p>
          <p className="text-xs text-muted-foreground">Ready to be activated</p>
        </div>
      </div>

      {/* Flow Info */}
      <div className="flex flex-col gap-5 px-6 py-4">
        <div className="grid gap-1.5">
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground/70 uppercase">
            Flow Name
          </p>
          <p className="font-sans text-sm font-medium text-foreground">
            {toNormalCase(flow_name)}
          </p>
        </div>

        <div className="grid gap-1.5">
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground/70 uppercase">
            Description
          </p>
          <p className="font-sans text-sm leading-relaxed text-foreground/90">
            {flow_description}
          </p>
        </div>
      </div>

      {/* Explanation */}
      {flow_explanation && (
        <div className="border-t border-border/40 px-2 py-2">
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
            className="group/btn flex w-full cursor-pointer items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
          >
            <span className="flex items-center gap-2">How it works</span>
            {isExplanationOpen ? (
              <ChevronDown className="size-4 transition-transform duration-200" />
            ) : (
              <ChevronRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            )}
          </button>
          {isExplanationOpen && (
            <div className="animate-in fade-in slide-in-from-top-2 mt-2 px-4 pb-4 duration-200">
              <FlowExplanation explanation={flow_explanation} />
            </div>
          )}
        </div>
      )}

      {/* Create Flow Button */}
      <div className="flex justify-end border-t border-border/40 bg-muted/20 px-6 py-4">
        <Button
          onClick={handleCreateFlow}
          disabled={isActivating || isActivated}
          className="gap-2 font-medium shadow-sm transition-all duration-200 active:scale-[0.98]"
          size="default"
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
